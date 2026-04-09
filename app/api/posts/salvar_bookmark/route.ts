import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function POST(req: Request) {
  try {
    const { nickname, postId } = await req.json();

    // Verifica se já está salvo
    const [existente]: any = await db.execute(
      "SELECT id FROM posts_salvos WHERE usuario_nickname = ? AND post_id = ?",
      [nickname, postId]
    );

    if (existente.length > 0) {
      // Se já existe, remove (Unsave)
      await db.execute("DELETE FROM posts_salvos WHERE id = ?", [existente[0].id]);
      return NextResponse.json({ saved: false });
    } else {
      // Se não existe, salva
      await db.execute(
        "INSERT INTO posts_salvos (usuario_nickname, post_id) VALUES (?, ?)",
        [nickname, postId]
      );
      return NextResponse.json({ saved: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}