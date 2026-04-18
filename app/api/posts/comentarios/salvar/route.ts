import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const postId = Number(body.postId);
    const nickname = String(body.nickname || "").trim().replace(/^@/, "");
    const conteudo = String(body.conteudo || "").trim();

    if (!postId || !nickname || !conteudo) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const [posts]: any = await db.execute(
      "SELECT nickname FROM posts WHERE id = ? LIMIT 1",
      [postId]
    );

    if (!posts.length) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    const [result]: any = await db.execute(
      "INSERT INTO posts_comentarios (post_id, nickname, conteudo) VALUES (?, ?, ?)",
      [postId, nickname, conteudo.slice(0, 2000)]
    );

    await db.execute(
      "UPDATE posts SET comentarios_count = COALESCE(comentarios_count, 0) + 1 WHERE id = ?",
      [postId]
    );

    const postOwner = posts[0].nickname;
    if (postOwner !== nickname) {
      await db.execute(
        "INSERT INTO notificacoes (destinatario_nickname, remetente_nickname, tipo, referencia_id) VALUES (?, ?, 'comment', ?)",
        [postOwner, nickname, postId]
      ).catch(() => null);
    }

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    console.error("ERRO AO SALVAR COMENTÁRIO:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
