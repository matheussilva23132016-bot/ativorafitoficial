import { NextResponse } from "next/server";
import db from "../../../../../lib/db";

const getPollCounts = async (postId: number) => {
  const [rows]: any = await db.execute(
    `SELECT
      SUM(CASE WHEN opcao = 1 THEN 1 ELSE 0 END) as op1,
      SUM(CASE WHEN opcao = 2 THEN 1 ELSE 0 END) as op2,
      COUNT(*) as total
     FROM enquetes_votos
     WHERE post_id = ?`,
    [postId]
  );

  return {
    1: Number(rows?.[0]?.op1 || 0),
    2: Number(rows?.[0]?.op2 || 0),
    total: Number(rows?.[0]?.total || 0),
  };
};

export async function POST(req: Request) {
  let numericPostId = 0;

  try {
    const { postId, nickname, opcao } = await req.json();
    numericPostId = Number(postId);
    const numericOption = Number(opcao);

    if (!numericPostId || !nickname || ![1, 2].includes(numericOption)) {
      return NextResponse.json({ error: "Voto inválido" }, { status: 400 });
    }

    const [posts]: any = await db.execute(
      `SELECT id, enquete_pergunta, enquete_op1, enquete_op2, is_closed
       FROM posts
       WHERE id = ?
       LIMIT 1`,
      [numericPostId]
    );

    const post = posts?.[0];
    if (!post?.enquete_pergunta || !post.enquete_op1 || !post.enquete_op2) {
      return NextResponse.json({ error: "Enquete não encontrada" }, { status: 404 });
    }

    if (post.is_closed) {
      return NextResponse.json({ error: "Enquete encerrada" }, { status: 400 });
    }

    await db.execute(
      "INSERT INTO enquetes_votos (post_id, usuario_nickname, opcao) VALUES (?, ?, ?)",
      [numericPostId, nickname, numericOption]
    );

    await db.execute(
      "UPDATE ativora_users SET xp = COALESCE(xp, 0) + 5, xp_score = COALESCE(xp_score, 0) + 5 WHERE nickname = ?",
      [nickname]
    );

    const counts = await getPollCounts(numericPostId);

    return NextResponse.json({
      success: true,
      userVote: numericOption,
      votes: counts,
    });
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      const counts = numericPostId ? await getPollCounts(numericPostId) : { 1: 0, 2: 0, total: 0 };

      return NextResponse.json(
        { error: "Voto já registrado", votes: counts },
        { status: 409 }
      );
    }

    console.error("ERRO AO VOTAR NA ENQUETE:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
