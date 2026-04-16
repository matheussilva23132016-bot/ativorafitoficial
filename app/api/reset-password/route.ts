import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
const validatePassword = (password: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);

export async function POST(req: Request) {
  try {
    const { email, code, password } = await req.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedCode = String(code || "").trim();

    if (!validateEmail(normalizedEmail) || normalizedCode.length !== 6 || !validatePassword(String(password || ""))) {
      return NextResponse.json(
        { error: "Informe e-mail, código de 6 dígitos e uma senha forte." },
        { status: 400 }
      );
    }

    const [rows]: any = await db.execute(
      "SELECT id, code_hash, expires_at FROM password_resets WHERE email = ? AND used = 0 ORDER BY id DESC LIMIT 1",
      [normalizedEmail]
    );

    const reset = rows?.[0];
    if (!reset) {
      return NextResponse.json({ error: "Código não encontrado ou já utilizado." }, { status: 400 });
    }

    if (new Date() > new Date(reset.expires_at)) {
      return NextResponse.json({ error: "Código expirado. Solicite um novo." }, { status: 400 });
    }

    const isCodeValid = await bcrypt.compare(normalizedCode, reset.code_hash);
    if (!isCodeValid) {
      return NextResponse.json({ error: "Código inválido." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [updateResult]: any = await db.execute(
      "UPDATE ativora_users SET password_hash = ?, failed_login_attempts = 0 WHERE email = ?",
      [hashedPassword, normalizedEmail]
    );

    if (!updateResult?.affectedRows) {
      return NextResponse.json({ error: "Conta não encontrada para este e-mail." }, { status: 404 });
    }

    await db.execute("UPDATE password_resets SET used = 1 WHERE id = ?", [reset.id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json({ error: "Não foi possível redefinir a senha agora." }, { status: 500 });
  }
}
