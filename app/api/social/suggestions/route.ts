import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isGenericSocialUser } from "@/lib/socialFilters";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const currentUser = searchParams.get('currentUser') || '';

    // Busca usuários reais (exceto o próprio e com avatar disponível)
    // Usamos o Prisma aqui para facilitar o filtro e a seleção
    const users = await prisma.ativora_users.findMany({
      where: {
        AND: [
          { nickname: { not: currentUser } },
          { nickname: { not: null } },
          { avatar_url: { not: null } }
        ]
      },
      select: {
        id: true,
        nickname: true,
        full_name: true,
        avatar_url: true,
        role: true,
        is_verified: true,
        xp: true
      },
      take: 20 // Pegamos uma amostra maior para aleatorizar
    });

    // Aleatoriza o resultado do banco
    const shuffled = users.filter((user) => !isGenericSocialUser(user)).sort(() => 0.5 - Math.random());
    const suggestions = shuffled.slice(0, 5).map((u: any) => ({
      username: u.nickname,
      full_name: u.full_name,
      avatar: u.avatar_url,
      role: u.role,
      is_verified: u.is_verified,
      xp: u.xp
    }));

    return NextResponse.json(suggestions);
  } catch (error: any) {
    console.error("ERRO AO GERAR SUGESTÕES:", error.message);
    return NextResponse.json([]);
  }
}
