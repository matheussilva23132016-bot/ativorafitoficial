import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { transporter } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await pool.query(
      "INSERT INTO password_resets (email, code_hash, expires_at, used) VALUES (?, ?, ?, 0)",
      [email, codeHash, expiresAt]
    );

    // CORREÇÃO TÁTICA: O 'from' deve ser o seu e-mail da Hostinger configurado no SMTP_USER
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER, 
      to: email,
      subject: "Seu código de redefinição de senha",
      text: `Seu código de redefinição de senha é: ${code}. Ele expira em 15 minutos.`, // Versão em texto puro para evitar SPAM
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #0EA5E9;">Redefinição de senha - AtivoraFit</h2>
          <p>Você solicitou a recuperação de acesso. Seu código de verificação é:</p>
          <div style="background: #f4f4f4; padding: 20px; border-radius: 10px; text-align: center;">
            <h1 style="letter-spacing: 8px; color: #000; margin: 0;">${code}</h1>
          </div>
          <p>Este código expira em 15 minutos. Se você não solicitou isso, ignore este e-mail.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro detalhado ao enviar código:", error);
    return NextResponse.json(
      { error: "Erro interno ao enviar código" },
      { status: 500 }
    );
  }
}