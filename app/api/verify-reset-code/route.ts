import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedCode = String(code || "").trim();

    if (!validateEmail(normalizedEmail) || normalizedCode.length !== 6) {
      return NextResponse.json({ error: "Informe e-mail e código de 6 dígitos." }, { status: 400 });
    }

    const [rows]: any = await db.execute(
      "SELECT id, code_hash, expires_at FROM password_resets WHERE email = ? AND used = 0 ORDER BY id DESC LIMIT 1",
      [normalizedEmail]
    );

    const reset = rows?.[0];
    if (!reset) {
      return NextResponse.json({ error: "Nenhum código ativo encontrado para este e-mail." }, { status: 400 });
    }

    if (new Date() > new Date(reset.expires_at)) {
      return NextResponse.json({ error: "Código expirado. Solicite um novo." }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(normalizedCode, reset.code_hash);
    if (!isMatch) {
      return NextResponse.json({ error: "Código incorreto." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Código confirmado. Agora crie uma nova senha.",
    });
  } catch (error) {
    console.error("Erro ao validar código:", error);
    return NextResponse.json({ error: "Não foi possível validar o código agora." }, { status: 500 });
  }
}
