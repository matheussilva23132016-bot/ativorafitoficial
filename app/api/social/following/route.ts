import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { isGenericSocialNickname } from "@/lib/socialFilters";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const nickname = searchParams.get('nickname');

    if (!nickname) {
      return NextResponse.json({ error: "Nickname não fornecido" }, { status: 400 });
    }

    const [rows]: any = await db.execute(
      "SELECT seguido_nickname FROM seguidores WHERE seguidor_nickname = ? AND status = 'aceito'",
      [nickname]
    );

    const following = rows
      .map((r: any) => r.seguido_nickname)
      .filter((nickname: string) => !isGenericSocialNickname(nickname));

    return NextResponse.json(following);
  } catch (error: any) {
    console.error("ERRO AO BUSCAR SEGUINDO:", error.message);
    return NextResponse.json([]);
  }
}
