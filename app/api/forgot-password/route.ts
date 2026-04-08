import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
// Se o db.ts estiver dentro de app/lib, mantenha ../../
// Se o db.ts também estiver na raiz junto com o mailer, mude para ../../../
import db from "../../lib/db"; 
import { transporter } from "../../../lib/mailer"; // Subindo 3 níveis para a raiz

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });
    }

    // Gerando o código de 6 dígitos
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expira em 15 min

    // --- EXECUÇÃO NO BANCO ---
    // Certifique-se de que a tabela 'password_resets' existe no banco da Hostinger
    await db.execute(
      "INSERT INTO password_resets (email, code_hash, expires_at, used) VALUES (?, ?, ?, 0)",
      [email, codeHash, expiresAt]
    );

    // --- ENVIO DO E-MAIL TÁTICO ---
    await transporter.sendMail({
      from: '"AtivoraFit Support" <suporte@ativorafit.online>', 
      to: email,
      subject: "Seu código de redefinição de senha",
      text: `Seu código de redefinição de senha é: ${code}. Ele expira em 15 minutos.`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #F8FAFC; max-width: 500px; margin: 0 auto; background-color: #010307; border: 1px solid #1E293B; padding: 40px; border-radius: 24px; text-align: center;">
          <h2 style="color: #0EA5E9; text-transform: uppercase; font-style: italic; letter-spacing: -0.05em; font-size: 32px; margin-bottom: 10px;">Ativora<span style="color: #F8FAFC;">Fit</span></h2>
          <p style="color: #94A3B8; font-size: 14px; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 30px;">Sincronização de Matriz</p>
          
          <p style="color: #F8FAFC; font-size: 16px; margin-bottom: 20px;">Você solicitou a recuperação de acesso. Seu código de verificação de elite é:</p>
          
          <div style="background: #0F172A; border: 1px solid #0EA5E9; padding: 30px; border-radius: 16px; margin: 20px 0; box-shadow: 0 0 20px rgba(14, 165, 233, 0.2);">
            <h1 style="letter-spacing: 12px; color: #0EA5E9; margin: 0; font-size: 48px; font-weight: 900;">${code}</h1>
          </div>
          
          <p style="font-size: 11px; color: #475569; margin-top: 30px; line-height: 1.6;">
            Este código expira em 15 minutos.<br>
            Se você não solicitou isso, ignore este e-mail.
          </p>
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