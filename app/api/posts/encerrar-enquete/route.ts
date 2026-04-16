import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function POST(req: Request) {
  try {
    const { postId, ownerNickname } = await req.json();

    if (!postId || !ownerNickname) {
      return NextResponse.json({ error: "Parâmetros insuficientes" }, { status: 400 });
    }

    // 1. Verificar se quem está pedindo é o dono do post
    const [post]: any = await db.execute(
      "SELECT nickname FROM posts WHERE id = ? LIMIT 1",
      [postId]
    );

    if (!post || post.length === 0) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    if (post[0].nickname !== ownerNickname) {
      return NextResponse.json({ error: "Acesso negado. Apenas o autor pode encerrar a enquete." }, { status: 403 });
    }

    // 2. Encerrar a enquete
    await db.execute(
      "UPDATE posts SET is_closed = 1 WHERE id = ?",
      [postId]
    );

    return NextResponse.json({ success: true, message: "Enquete encerrada com sucesso" });

  } catch (error: any) {
    console.error("ERRO AO ENCERRAR ENQUETE:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
