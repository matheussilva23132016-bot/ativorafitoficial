import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "../../../lib/db"; // CAMINHO RELATIVO BLINDADO

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    const [rows]: any = await db.execute(
      "SELECT * FROM password_resets WHERE email = ? AND used = 0 ORDER BY criado_em DESC LIMIT 1",
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Código expirado ou inválido" }, { status: 400 });
    }

    const reset = rows[0];
    const isMatch = await bcrypt.compare(code, reset.code_hash);

    if (!isMatch || new Date() > new Date(reset.expires_at)) {
      return NextResponse.json({ error: "Código inválido ou expirado" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao verificar código" }, { status: 500 });
  }
}