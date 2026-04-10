import { NextResponse } from "next/server";
import db from "../../../../lib/db"; 

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json({ error: "PostId não fornecido" }, { status: 400 });
    }

    // AJUSTE CRÍTICO: u.foto_url as avatar_url
    const query = `
      SELECT 
        c.*, 
        u.foto_url as avatar_url 
      FROM posts_comentarios c
      LEFT JOIN usuarios u ON c.nickname = u.nickname
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `;

    const [rows]: any = await db.execute(query, [postId]);

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("❌ ERRO AO LISTAR COMENTÁRIOS:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}