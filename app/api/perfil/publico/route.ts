import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetNickname = searchParams.get("nickname") || searchParams.get("username");
  const myNickname = searchParams.get("viewer") || "";

  if (!targetNickname) {
    return NextResponse.json({ error: "Nickname ausente." }, { status: 400 });
  }

  try {
    const [userRows]: any = await db.execute(
      `SELECT
        nickname AS username,
        full_name,
        bio,
        descricao AS description,
        avatar_url AS avatar,
        avatar_url,
        role,
        is_verified,
        xp,
        xp_score,
        nivel_int AS nivel,
        current_streak AS streak,
        is_private
       FROM ativora_users
       WHERE nickname = ?
       LIMIT 1`,
      [targetNickname]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ error: "Atleta nao localizado" }, { status: 404 });
    }

    const profile = userRows[0];

    const [[followersRows], [followingRows], [followRows]]: any = await Promise.all([
      db.execute(
        "SELECT COUNT(*) AS total FROM seguidores WHERE seguido_nickname = ? AND status = 'aceito'",
        [targetNickname]
      ),
      db.execute(
        "SELECT COUNT(*) AS total FROM seguidores WHERE seguidor_nickname = ? AND status = 'aceito'",
        [targetNickname]
      ),
      myNickname
        ? db.execute(
            "SELECT status FROM seguidores WHERE seguidor_nickname = ? AND seguido_nickname = ? LIMIT 1",
            [myNickname, targetNickname]
          )
        : Promise.resolve([[]]),
    ]);

    const followStatus = followRows.length > 0 ? followRows[0].status : "nenhum";

    return NextResponse.json({
      ...profile,
      xp: Number(profile.xp ?? profile.xp_score ?? 0),
      is_private: profile.is_private === 1 || profile.is_private === true,
      is_verified: profile.is_verified === 1 || profile.is_verified === true,
      followers: Number(followersRows?.[0]?.total || 0),
      following: Number(followingRows?.[0]?.total || 0),
      follow_status: followStatus,
      followingStatus: followStatus,
      is_following: followStatus === "aceito",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
