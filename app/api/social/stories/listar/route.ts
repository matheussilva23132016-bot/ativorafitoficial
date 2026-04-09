import { NextResponse } from "next/server";
import db from "../../../../../lib/db";

export async function GET() {
  try {
    // Protocolo de Filtragem: Apenas stories cuja validade (expira_em) é maior que o tempo real (NOW())
    // O JOIN garante que o avatar e o cargo do atleta venham direto da matriz de usuários
    const [rows]: any = await db.execute(
      `SELECT 
        s.id, 
        s.usuario_nickname as username, 
        s.media_url, 
        s.media_type, 
        s.created_at,
        u.avatar_url,
        u.role
       FROM stories s
       JOIN usuarios u ON s.usuario_nickname = u.nickname
       WHERE s.expira_em > NOW()
       ORDER BY s.created_at DESC`
    );

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("ERRO NA SINCRONIZAÇÃO DE STORIES:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}