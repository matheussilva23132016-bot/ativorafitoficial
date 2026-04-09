import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json({ error: "PostId não fornecido" }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

    // Buscamos o comentário e o avatar de quem comentou
    const [rows]: any = await connection.execute(
      `SELECT c.*, u.avatar_url 
       FROM posts_comentarios c
       LEFT JOIN usuarios u ON c.nickname = u.nickname
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [postId]
    );

    await connection.end();

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("Erro ao listar comentários:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}