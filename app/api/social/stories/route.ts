import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { isGenericSocialNickname } from "@/lib/socialFilters";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const nickname = searchParams.get('nickname') || '';

    // Busca stories das últimas 24 horas
    // E faz join com ativora_users para pegar o avatar atualizado
    const query = `
      SELECT 
        s.id,
        s.username as user,
        u.avatar_url as avatar,
        s.media_url as mediaUrl,
        s.media_type as mediaType,
        s.created_at
      FROM stories s
      LEFT JOIN ativora_users u ON s.username = u.nickname
      WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY s.created_at DESC
      LIMIT 50
    `;

    const [rows]: any = await db.execute(query);

    // Mapear para o formato que o componente espera
    const stories = rows.filter((s: any) => !isGenericSocialNickname(s.user)).map((s: any) => ({
      ...s,
      seen: false // Por enquanto simplificado, no futuro pode vir de uma tabela de visualizações
    }));

    return NextResponse.json(stories);

  } catch (error: any) {
    console.error("ERRO AO BUSCAR STORIES:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
