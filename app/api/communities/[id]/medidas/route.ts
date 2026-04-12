import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — Histórico de medidas do usuário
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });

  try {
    const [rows] = await db.query(`
      SELECT * FROM medidas_corporais
      WHERE user_id = ? AND comunidade_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `, [userId, params.id]);

    return NextResponse.json({ medidas: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — Novo registro
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const {
      userId, peso_kg, altura_cm, cintura_cm,
      quadril_cm, biceps_cm, bf_estimado,
      sexo, objetivo, obs,
    } = body;

    if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });

    const id = `med-${Date.now()}`;
    await db.query(`
      INSERT INTO medidas_corporais
        (id, user_id, comunidade_id, peso_kg, altura_cm, cintura_cm,
         quadril_cm, biceps_cm, bf_estimado, sexo, objetivo, obs)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, userId, params.id,
      peso_kg    ?? null,
      altura_cm  ?? null,
      cintura_cm ?? null,
      quadril_cm ?? null,
      biceps_cm  ?? null,
      bf_estimado ?? null,
      sexo       ?? null,
      objetivo   ?? null,
      obs        ?? null,
    ]);

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
