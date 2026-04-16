import { NextResponse } from "next/server";
import db from "../../../../../lib/db";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const nickname = searchParams.get("nickname")?.trim().replace(/^@/, "");

    if (!id || !nickname) {
      return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
    }

    const [rows]: any = await db.execute(
      `SELECT
        c.id,
        c.nickname,
        c.post_id,
        p.nickname AS post_owner
       FROM posts_comentarios c
       INNER JOIN posts p ON p.id = c.post_id
       WHERE c.id = ?
       LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return NextResponse.json({ error: "Comentario nao encontrado" }, { status: 404 });
    }

    const comment = rows[0];
    const canDelete = comment.nickname === nickname || comment.post_owner === nickname;

    if (!canDelete) {
      return NextResponse.json({ error: "Sem permissao para apagar este comentario" }, { status: 403 });
    }

    await db.execute("DELETE FROM posts_comentarios WHERE id = ?", [id]);
    await db.execute(
      "UPDATE posts SET comentarios_count = GREATEST(COALESCE(comentarios_count, 0) - 1, 0) WHERE id = ?",
      [comment.post_id]
    );

    return NextResponse.json({ success: true, postId: comment.post_id });
  } catch (error: any) {
    console.error("ERRO AO APAGAR COMENTARIO:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
