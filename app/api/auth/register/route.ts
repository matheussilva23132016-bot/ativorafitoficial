import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      nomeCompleto, email, senha, nickname, role,
      genero, dataNascimento, cidadeEstado, interesses,
      nivel, freq, peso, altura, registro, exp, modalidade, 
      especialidade, seguidores, nicho, rede 
    } = body;

    // 1. Verifica duplicidade
    const [existing]: any = await db.execute(
      'SELECT id FROM ativora_users WHERE email = ? OR nickname = ?',
      [email, nickname]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Identidade já registrada na base.' }, { status: 400 });
    }

    // 2. Criptografia Alpha
    const hashedPassword = await bcrypt.hash(senha, 10);
    const userId = `user_${Date.now()}`;

    // 3. Inserção Completa no SQL
    await db.execute(
      `INSERT INTO ativora_users (
        id, email, password_hash, full_name, nickname, role, genero, 
        data_nascimento, cidade_estado, interesses, nivel, freq, 
        peso, altura, registro, exp, modalidade, especialidade, 
        seguidores, nicho, rede
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, email, hashedPassword, nomeCompleto, nickname, role, genero,
        dataNascimento, cidadeEstado, JSON.stringify(interesses), nivel, freq,
        peso, altura, registro, exp, modalidade, especialidade,
        seguidores, nicho, rede
      ]
    );

    const token = jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    return NextResponse.json({ 
      success: true, 
      token, 
      user: { id: userId, full_name: nomeCompleto, nickname, role } 
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Falha na sincronização: ' + error.message }, { status: 500 });
  }
}