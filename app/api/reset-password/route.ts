import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

// 1. Definição do contrato de dados para a tabela password_resets
interface PasswordResetRow extends RowDataPacket {
  id: number;
  email: string;
  code_hash: string;
  expires_at: string | Date;
  used: number;
}

export async function POST(req: Request) {
  try {
    const { email, code, password } = await req.json();

    if (!email || !code || !password) {
      return NextResponse.json({ error: "Dados obrigatórios" }, { status: 400 });
    }

    // 2. Aplicando a tipagem correta na consulta (Removendo o 'any')
    const [rows] = await pool.query<PasswordResetRow[]>(
      "SELECT * FROM password_resets WHERE email = ? AND used = 0 ORDER BY id DESC LIMIT 1",
      [email]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    const reset = rows[0];

    // Validação de expiração
    if (new Date(reset.expires_at) < new Date()) {
      return NextResponse.json({ error: "Código expirado" }, { status: 400 });
    }

    // Validação do código (hash)
    const valid = await bcrypt.compare(code, reset.code_hash);
    if (!valid) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    // 3. Processo de atualização de senha
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query("UPDATE users SET password = ? WHERE email = ?", [
      passwordHash,
      email,
    ]);

    // Marca o código como usado para neutralizar reuso
    await pool.query("UPDATE password_resets SET used = 1 WHERE id = ?", [
      reset.id,
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json(
      { error: "Erro interno ao redefinir senha" },
      { status: 500 }
    );
  }
}