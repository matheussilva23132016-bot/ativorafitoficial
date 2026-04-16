import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions) as any;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const user = await prisma.ativora_users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        nickname: true,
        full_name: true,
        bio: true,
        avatar_url: true,
        xp: true,
        nivel_int: true,
        current_streak: true,
        is_verified: true,
        role: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Atleta não encontrado." }, { status: 404 });
    }

    // Busca contagem real de seguidores e seguindo
    const [followerCount, followingCount] = await Promise.all([
      prisma.seguidores.count({
        where: { seguido_nickname: user.nickname || "" }
      }),
      prisma.seguidores.count({
        where: { seguidor_nickname: user.nickname || "", status: 'aceito' }
      })
    ]);

    return NextResponse.json({
      ...user,
      followers: followerCount,
      following: followingCount
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions) as any;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { bio, avatar_url, nickname } = body;

    const updatedUser = await prisma.ativora_users.update({
      where: { id: session.user.id },
      data: {
        bio: bio ?? undefined,
        avatar_url: avatar_url ?? undefined,
        nickname: nickname?.toLowerCase() ?? undefined,
      }
    });

    return NextResponse.json({ 
      success: true, 
      user: {
        nickname: updatedUser.nickname,
        bio: updatedUser.bio,
        avatar_url: updatedUser.avatar_url
      }
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Este nickname já está em uso." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
