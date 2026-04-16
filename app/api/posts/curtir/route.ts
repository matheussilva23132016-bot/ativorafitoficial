import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function POST(req: Request) {
  try {
    const { postId, username } = await req.json();

    if (!postId || !username) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const [postOwner]: any = await db.execute(
      "SELECT nickname FROM posts WHERE id = ? LIMIT 1",
      [postId]
    );

    if (!postOwner.length) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    const donoDoPost = postOwner[0].nickname;

    const [existing]: any = await db.execute(
      "SELECT id FROM curtidas WHERE post_id = ? AND usuario_nickname = ?",
      [postId, username]
    );

    if (existing.length > 0) {
      await db.execute("DELETE FROM curtidas WHERE id = ?", [existing[0].id]);
      return NextResponse.json({ success: true, liked: false });
    }

    await db.execute(
      "INSERT INTO curtidas (post_id, usuario_nickname) VALUES (?, ?)",
      [postId, username]
    );

    if (donoDoPost !== username) {
      await db.execute(
        "INSERT INTO notificacoes (destinatario_nickname, remetente_nickname, tipo, referencia_id) VALUES (?, ?, 'like', ?)",
        [donoDoPost, username, postId]
      );

      await db.execute(
        "UPDATE ativora_users SET xp = COALESCE(xp, 0) + 2, xp_score = COALESCE(xp_score, 0) + 2 WHERE nickname = ?",
        [donoDoPost]
      );
    }

    return NextResponse.json({ success: true, liked: true });
  } catch (error: any) {
    console.error("ERRO NO MOTOR DE CURTIDAS:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
