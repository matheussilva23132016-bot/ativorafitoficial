import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST  ?? "smtp.hostinger.com",
  port:   Number(process.env.SMTP_PORT ?? 465),
  secure: true, // porta 465 = SSL
  auth: {
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
  },
});

interface MailOptions {
  to:       string | string[];
  subject:  string;
  html:     string;
  text?:    string;
}

export async function sendMail(opts: MailOptions): Promise<void> {
  await transporter.sendMail({
    from:    `"Ativora Fit" <${process.env.SMTP_USER}>`,
    to:      Array.isArray(opts.to) ? opts.to.join(", ") : opts.to,
    subject: opts.subject,
    html:    opts.html,
    text:    opts.text ?? opts.html.replace(/<[^>]+>/g, ""),
  });
}

// ── Templates prontos ──────────────────────────────────────────
export const emailTemplates = {

  boasVindas: (nome: string) => ({
    subject: "Bem-vindo à Ativora Fit! 🏆",
    html: `
      <div style="background:#010307;color:#fff;font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto;border-radius:24px;">
        <h1 style="font-size:32px;font-weight:900;font-style:italic;text-transform:uppercase;color:#0ea5e9;margin-bottom:8px;">
          BEM-VINDO, ${nome.toUpperCase()}
        </h1>
        <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;">
          Sua conta foi criada com sucesso. Acesse a plataforma e comece sua jornada de performance.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}" 
           style="display:inline-block;margin-top:24px;padding:16px 32px;background:#0ea5e9;color:#000;font-weight:900;text-transform:uppercase;text-decoration:none;border-radius:16px;font-size:12px;letter-spacing:0.1em;">
          ACESSAR PLATAFORMA
        </a>
        <p style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:32px;">
          Ativora Fit — Performance de Elite
        </p>
      </div>
    `,
  }),

  entradaComunidadeAprovada: (nome: string, comunidade: string) => ({
    subject: `Acesso liberado: ${comunidade} ✅`,
    html: `
      <div style="background:#010307;color:#fff;font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto;border-radius:24px;">
        <h1 style="font-size:28px;font-weight:900;font-style:italic;text-transform:uppercase;color:#22c55e;margin-bottom:8px;">
          ACESSO LIBERADO!
        </h1>
        <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;">
          Olá, <strong style="color:#fff;">${nome}</strong>! Sua solicitação para entrar em 
          <strong style="color:#0ea5e9;">${comunidade}</strong> foi aprovada.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/comunidades" 
           style="display:inline-block;margin-top:24px;padding:16px 32px;background:#22c55e;color:#000;font-weight:900;text-transform:uppercase;text-decoration:none;border-radius:16px;font-size:12px;letter-spacing:0.1em;">
          ENTRAR NA COMUNIDADE
        </a>
      </div>
    `,
  }),

  desafioAprovado: (nome: string, desafio: string, xp: number) => ({
    subject: `Desafio aprovado: +${xp} XP! 🎯`,
    html: `
      <div style="background:#010307;color:#fff;font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto;border-radius:24px;">
        <h1 style="font-size:28px;font-weight:900;font-style:italic;text-transform:uppercase;color:#f59e0b;margin-bottom:8px;">
          MISSÃO CUMPRIDA!
        </h1>
        <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;">
          Parabéns, <strong style="color:#fff;">${nome}</strong>! Seu desafio 
          <strong style="color:#0ea5e9;">"${desafio}"</strong> foi aprovado.
        </p>
        <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:16px;padding:20px;margin:20px 0;text-align:center;">
          <span style="font-size:48px;font-weight:900;font-style:italic;color:#f59e0b;">+${xp} XP</span>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/comunidades" 
           style="display:inline-block;padding:16px 32px;background:#f59e0b;color:#000;font-weight:900;text-transform:uppercase;text-decoration:none;border-radius:16px;font-size:12px;letter-spacing:0.1em;">
          VER RANKING
        </a>
      </div>
    `,
  }),

  campeaoSemana: (nome: string, comunidade: string, xp: number) => ({
    subject: `🏆 Você é o Campeão da Semana em ${comunidade}!`,
    html: `
      <div style="background:#010307;color:#fff;font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto;border-radius:24px;">
        <h1 style="font-size:32px;font-weight:900;font-style:italic;text-transform:uppercase;color:#f59e0b;margin-bottom:8px;">
          CAMPEÃO DA SEMANA! 🏆
        </h1>
        <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;">
          <strong style="color:#fff;">${nome}</strong>, você dominou o ranking de 
          <strong style="color:#0ea5e9;">${comunidade}</strong> esta semana com 
          <strong style="color:#f59e0b;">${xp} XP</strong>!
        </p>
        <p style="color:rgba(255,255,255,0.3);font-size:12px;margin-top:16px;">
          Seu selo de Campeão da Semana foi adicionado ao seu perfil permanentemente.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/comunidades" 
           style="display:inline-block;margin-top:24px;padding:16px 32px;background:#f59e0b;color:#000;font-weight:900;text-transform:uppercase;text-decoration:none;border-radius:16px;font-size:12px;letter-spacing:0.1em;">
          VER MEU PERFIL
        </a>
      </div>
    `,
  }),
};
