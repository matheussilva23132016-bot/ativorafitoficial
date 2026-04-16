import { NextResponse } from "next/server";
import db from "../../../../../lib/db";
import { isGenericSocialNickname } from "@/lib/socialFilters";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Protocolo de Filtragem: Apenas stories cuja validade (expira_em) é maior que o tempo real (NOW())
    // O JOIN garante que o avatar e o cargo do atleta venham direto da matriz de usuários
    const [rows]: any = await db.execute(
      `SELECT 
        s.id, 
        s.username as username, 
        s.media_url, 
        s.media_type, 
        s.created_at,
        u.avatar_url,
        u.role
       FROM stories s
       LEFT JOIN ativora_users u ON s.username = u.nickname
       WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       ORDER BY s.created_at DESC
       LIMIT 50`
    );

    return NextResponse.json((rows || []).filter((story: any) => !isGenericSocialNickname(story.username)));
  } catch (error: any) {
    console.error("ERRO NA SINCRONIZAÇÃO DE STORIES:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
