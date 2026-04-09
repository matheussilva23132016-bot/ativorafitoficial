import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function GET() {
  try {
    // Busca os 20 atletas com maior XP
    const [rows]: any = await db.execute(
      `SELECT username, avatar_url, role, nivel, xp 
       FROM usuarios 
       ORDER BY xp DESC 
       LIMIT 20`
    );

    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: "Falha ao consultar ranking" }, { status: 500 });
  }
}