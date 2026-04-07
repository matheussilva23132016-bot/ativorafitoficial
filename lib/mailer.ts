import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST as string,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, // true para porta 465, false para 587
  auth: {
    user: process.env.SMTP_USER as string,
    pass: process.env.SMTP_PASS as string,
  },
  // Adicione isso se o erro persistir (ajuda com certificados SSL)
  tls: {
    rejectUnauthorized: false 
  }
});