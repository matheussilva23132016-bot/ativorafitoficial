import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { transporter } from "@/lib/mailer";

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!validateEmail(normalizedEmail)) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }

    const [users]: any = await db.execute(
      "SELECT id, full_name FROM ativora_users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (!users?.length) {
      return NextResponse.json({
        success: true,
        message: "Se o e-mail estiver cadastrado, enviaremos um código de recuperação.",
      });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.execute(
      "INSERT INTO password_resets (email, code_hash, expires_at, used) VALUES (?, ?, ?, 0)",
      [normalizedEmail, codeHash, expiresAt]
    );

    await transporter.sendMail({
      from: `"AtivoraFit" <${process.env.SMTP_USER}>`,
      to: normalizedEmail,
      subject: "Código de recuperação AtivoraFit",
      text: `Seu código de recuperação é ${code}. Ele expira em 15 minutos.`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #F8FAFC; max-width: 520px; margin: 0 auto; background-color: #010307; border: 1px solid #1E293B; padding: 36px; border-radius: 24px;">
          <h2 style="color: #0EA5E9; font-size: 28px; margin: 0 0 12px;">AtivoraFit</h2>
          <p style="color: #CBD5E1; font-size: 15px; line-height: 1.6;">Use o código abaixo para criar uma nova senha. Ele expira em 15 minutos.</p>
          <div style="background: #0F172A; border: 1px solid #0EA5E9; padding: 24px; border-radius: 16px; margin: 22px 0; text-align: center;">
            <strong style="letter-spacing: 10px; color: #0EA5E9; font-size: 42px;">${code}</strong>
          </div>
          <p style="font-size: 12px; color: #64748B; line-height: 1.6;">Se você não pediu recuperação de senha, ignore este e-mail.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "Código enviado para o e-mail cadastrado." });
  } catch (error: any) {
    console.error("Erro na recuperação de senha:", error);
    return NextResponse.json({ error: "Não foi possível enviar o código agora." }, { status: 500 });
  }
}
