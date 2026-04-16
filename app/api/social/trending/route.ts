import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { isGenericSocialNickname, isGenericSocialTag } from "@/lib/socialFilters";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Busca os conteúdos de posts recentes (últimas 2 semanas)
    const [rows]: any = await db.execute(
      "SELECT nickname, content FROM posts WHERE criado_em > DATE_SUB(NOW(), INTERVAL 14 DAY)"
    );

    const hashtagMap: Record<string, number> = {};

    rows.forEach((row: any) => {
      if (isGenericSocialNickname(row.nickname)) return;
      if (!row.content) return;
      // Regex para capturar hashtags brasileiros/comuns (sem pontuação)
      const matches = row.content.match(/#[a-z0-9à-ú\-_]+/gi);
      if (matches) {
        matches.forEach((tag: string) => {
          const cleanTag = tag.substring(1).toLowerCase();
          if (cleanTag.length > 2 && !isGenericSocialTag(cleanTag)) {
            hashtagMap[cleanTag] = (hashtagMap[cleanTag] || 0) + 1;
          }
        });
      }
    });

    const trending = Object.entries(hashtagMap)
      .map(([tag, count]) => ({
        tag,
        posts: count,
        trend: "up" // Por enquanto estático, futuro pode comparar com semana anterior
      }))
      .sort((a, b) => b.posts - a.posts)
      .slice(0, 10);

    return NextResponse.json(trending);
  } catch (error: any) {
    console.error("ERRO AO GERAR TRENDS:", error.message);
    return NextResponse.json([], { status: 500 });
  }
}
