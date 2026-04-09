import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

export async function POST(request: Request) {
  let connection;
  try {
    const body = await request.json();
    console.log("📥 Recebido na API:", body); // DEBUG 1

    const { postId, nickname, conteudo } = body;

    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Conexão com o banco OK"); // DEBUG 2

    // 1. Tenta inserir o comentário
    await connection.execute(
      "INSERT INTO posts_comentarios (post_id, nickname, conteudo) VALUES (?, ?, ?)",
      [postId, nickname, conteudo]
    );
    console.log("💾 Comentário inserido com sucesso"); // DEBUG 3

    // 2. Tenta atualizar o contador (Aqui é onde costuma dar erro)
    await connection.execute(
      "UPDATE posts SET comentarios_count = comentarios_count + 1 WHERE id = ?",
      [postId]
    );
    console.log("📈 Contador atualizado"); // DEBUG 4

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ ERRO NA MATRIZ (API COMENTÁRIOS):", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}