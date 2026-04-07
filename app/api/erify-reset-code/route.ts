import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2"; // Importante para tipar o banco

// 1. DEFINIMOS O "CONTRATO" DOS DADOS (Interface)
interface PasswordResetRow extends RowDataPacket {
  id: number;
  email: string;
  code_hash: string;
  expires_at: string | Date;
  used: number;
}

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Dados obrigatórios" }, { status: 400 });
    }

    // 2. APLICAMOS A TIPAGEM NO QUERY (Removemos o 'any')
    const [rows] = await pool.query<PasswordResetRow[]>(
      "SELECT * FROM password_resets WHERE email = ? AND used = 0 ORDER BY id DESC LIMIT 1",
      [email]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    const reset = rows[0];

    // O TypeScript agora sabe que reset tem 'expires_at' e 'code_hash'
    if (new Date(reset.expires_at) < new Date()) {
      return NextResponse.json({ error: "Código expirado" }, { status: 400 });
    }

    const valid = await bcrypt.compare(code, reset.code_hash);

    if (!valid) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao validar código:", error);
    return NextResponse.json(
      { error: "Erro interno ao validar código" },
      { status: 500 }
    );
  }
}