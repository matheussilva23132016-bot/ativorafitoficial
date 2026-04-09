import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com", // Force o host direto para evitar erros de DNS
  port: 465,
  secure: true, // Porta 465 exige secure: true
  auth: {
    user: process.env.SMTP_USER, // Ex: suporte@ativorafit.online
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // Isso evita que o build quebre por certificados SSL não verificados no servidor
    rejectUnauthorized: false 
  }
});