import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body.id || crypto.randomUUID();
    const userId = body.userId || null;
    const nickname = body.nickname || null;
    const categoria = String(body.categoria || "melhoria").slice(0, 40);
    const impacto = String(body.impacto || "Médio").slice(0, 30);
    const contexto = String(body.contexto || "").slice(0, 180);
    const mensagem = String(body.mensagem || "").trim();
    const dispositivo = String(body.dispositivo || "Desktop").slice(0, 40);

    if (mensagem.length < 12) {
      return NextResponse.json(
        { success: false, stored: false, error: "Sugestão muito curta." },
        { status: 400 },
      );
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS beta_sugestoes (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        user_id VARCHAR(191) NULL,
        nickname VARCHAR(120) NULL,
        categoria VARCHAR(40) NOT NULL,
        impacto VARCHAR(30) NOT NULL,
        contexto VARCHAR(180) NULL,
        mensagem TEXT NOT NULL,
        dispositivo VARCHAR(40) NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'recebida',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_beta_sugestoes_user (user_id),
        INDEX idx_beta_sugestoes_status (status),
        INDEX idx_beta_sugestoes_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.execute(
      `INSERT INTO beta_sugestoes
        (id, user_id, nickname, categoria, impacto, contexto, mensagem, dispositivo, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'recebida')`,
      [id, userId, nickname, categoria, impacto, contexto, mensagem, dispositivo],
    );

    return NextResponse.json({ success: true, stored: true, id });
  } catch (error) {
    console.error("Erro ao registrar sugestão beta:", error);
    return NextResponse.json(
      { success: true, stored: false, warning: "Sugestão salva localmente no cliente." },
      { status: 202 },
    );
  }
}
