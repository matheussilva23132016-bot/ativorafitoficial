import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { identificador, senha } = await req.json();

    // 🔍 Busca inteligente: Procura por E-mail OU Nickname
    const [users]: any = await db.execute(
      'SELECT * FROM ativora_users WHERE email = ? OR nickname = ?',
      [identificador, identificador]
    );

    const user = users[0];

    if (!user) {
      return NextResponse.json({ error: 'Atleta não identificado na base.' }, { status: 401 });
    }

    // 🔐 Validação da Criptografia
    const isMatch = await bcrypt.compare(senha, user.password_hash);

    if (!isMatch) {
      return NextResponse.json({ error: 'Credenciais inválidas. Tente novamente.' }, { status: 401 });
    }

    // 🎟️ Geração do Passe de Acesso (JWT)
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        nickname: user.nickname,
        role: user.role,
        avatar_url: user.avatar_url
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Falha crítica na matriz: ' + error.message }, { status: 500 });
  }
}