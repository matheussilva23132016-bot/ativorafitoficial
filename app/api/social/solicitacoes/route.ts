import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) return NextResponse.json({ error: "Nickname ausente." }, { status: 400 });

    const [rows]: any = await db.execute(
      `SELECT
        s.id,
        u.nickname as username,
        u.avatar_url
      FROM seguidores s
      LEFT JOIN ativora_users u ON s.seguidor_nickname = u.nickname
      WHERE s.seguido_nickname = ? AND s.status = 'pendente'`,
      [username]
    );

    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
