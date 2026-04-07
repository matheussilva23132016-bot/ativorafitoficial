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

    // 1. Gerar ID Único e Criptografar Senha
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(senha, 10);

    // 2. Inserir na tabela Mestre (users)
    // ATENÇÃO: Verifique se os nomes das colunas no seu phpMyAdmin são EXATAMENTE esses
    await pool.query(
      `INSERT INTO users (id, email, password_hash, full_name, username, role, birth_date, location) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, email, passwordHash, nomeCompleto, nickname, role, dataNascimento, cidadeEstado]
    );

    // 3. Inserir na tabela de perfil (Exemplo: Aluno)
    if (role === 'aluno') {
      await pool.query(
        `INSERT INTO student_profiles (user_id, weight, height, limitations) VALUES (?, ?, ?, ?)`,
        [userId, data.peso || 0, data.altura || 0, data.limitacoes || '']
      );
    }

    // 4. Inserir Interesses
    if (interesses && Array.isArray(interesses)) {
      for (const tag of interesses) {
        await pool.query(
          `INSERT INTO user_interests (user_id, interest_name) VALUES (?, ?)`,
          [userId, tag]
        );
      }
    }

    return NextResponse.json({ message: "Sincronização concluída!" }, { status: 201 });

  } catch (error: unknown) {
    // AQUI ESTAVA O ERRO DO ESLINT: Trocamos 'any' por 'unknown' + Type Guard
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido na matriz";
    
    console.error("FALHA CRÍTICA DE SINCRONIZAÇÃO:", errorMessage);
    
    return NextResponse.json(
      { error: "Falha ao gravar na matriz de dados. Verifique a conexão." }, 
      { status: 500 }
    );
  }
}