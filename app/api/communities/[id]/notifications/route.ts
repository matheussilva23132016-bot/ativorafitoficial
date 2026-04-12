import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — Notificações do usuário nessa comunidade
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });

  try {
    const [rows] = await db.query(`
      SELECT * FROM notificacoes_comunidade
      WHERE user_id = ? AND (comunidade_id = ? OR comunidade_id IS NULL)
      ORDER BY created_at DESC
      LIMIT 50
    `, [userId, params.id]);

    return NextResponse.json({ notifications: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — Marcar como lida
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { notifId, userId, marcarTodas } = await req.json();

    if (marcarTodas) {
      await db.query(`
        UPDATE notificacoes_comunidade 
        SET lida = 1 
        WHERE user_id = ? AND comunidade_id = ?
      `, [userId, params.id]);
    } else {
      await db.query(`
        UPDATE notificacoes_comunidade SET lida = 1 WHERE id = ? AND user_id = ?
      `, [notifId, userId]);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
