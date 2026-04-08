import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "../../../lib/db"; // CAMINHO RELATIVO BLINDADO

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Atualiza a senha do usuário
    await db.execute(
      "UPDATE usuarios SET senha = ? WHERE email = ?",
      [hashedPassword, email]
    );

    // Marca o código como usado
    await db.execute(
      "UPDATE password_resets SET used = 1 WHERE email = ?",
      [email]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao redefinir senha" }, { status: 500 });
  }
}