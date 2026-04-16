import { NextResponse } from "next/server";
import db from "../../../lib/db";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const nickname = searchParams.get("nickname")?.trim().replace(/^@/, "");

    if (!id || !nickname) {
      return NextResponse.json({ error: "Faltam dados" }, { status: 400 });
    }

    const [posts]: any = await db.execute(
      "SELECT id, nickname FROM posts WHERE id = ? LIMIT 1",
      [id]
    );

    if (!posts.length) {
      return NextResponse.json({ error: "Post nao encontrado" }, { status: 404 });
    }

    if (posts[0].nickname !== nickname) {
      return NextResponse.json({ error: "Apenas o autor pode apagar este post" }, { status: 403 });
    }

    await db.execute("DELETE FROM notificacoes WHERE referencia_id = ? AND tipo IN ('like', 'comment')", [id]);
    await db.execute("DELETE FROM posts_salvos WHERE post_id = ?", [id]);
    await db.execute("DELETE FROM curtidas WHERE post_id = ?", [id]);
    await db.execute("DELETE FROM posts_comentarios WHERE post_id = ?", [id]);
    await db.execute("DELETE FROM enquetes_votos WHERE post_id = ?", [id]);
    await db.execute("DELETE FROM posts WHERE id = ? AND nickname = ?", [id, nickname]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("ERRO AO APAGAR POST:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
