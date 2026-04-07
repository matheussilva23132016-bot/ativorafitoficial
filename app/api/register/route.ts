import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      nomeCompleto, email, senha, nickname, role, 
      dataNascimento, cidadeEstado, interesses 
    } = data;

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(senha, 10);

    // 1. Inserir na tabela Mestre (users)
    await pool.query(
      `INSERT INTO users (id, email, password_hash, full_name, username, role, birth_date, location) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, email, passwordHash, nomeCompleto, nickname, role, dataNascimento, cidadeEstado]
    );

    // 2. Inserir na tabela específica de perfil (Ex: Aluno/Student)
    if (role === 'aluno') {
      await pool.query(
        `INSERT INTO student_profiles (user_id, weight, height, limitations) VALUES (?, ?, ?, ?)`,
        [userId, data.peso || 0, data.altura || 0, data.limitacoes || '']
      );
    } else if (role === 'personal') {
      await pool.query(
        `INSERT INTO personal_profiles (user_id, license_number, experience_years, bio) VALUES (?, ?, ?, ?)`,
        [userId, data.registro || '', data.exp || 0, data.bio || '']
      );
    }

    // 3. Vincular Interesses/Objetivos
    if (interesses && interesses.length > 0) {
      for (const tag of interesses) {
        await pool.query(
          `INSERT INTO user_interests (user_id, interest_name) VALUES (?, ?)`,
          [userId, tag]
        );
      }
    }

    return NextResponse.json({ message: "Sincronização concluída!" }, { status: 201 });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("ERRO NO BANCO:", msg);
    return NextResponse.json({ error: "Falha ao gravar na matriz." }, { status: 500 });
  }
}