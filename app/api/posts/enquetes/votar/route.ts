import { NextResponse } from "next/server";
import db from "../../../../../lib/db";

const MAX_POLL_OPTIONS = 6;

const parsePollDefinition = (post: any) => {
  const parsedOptions = (() => {
    if (typeof post?.poll_data !== "string" || !post.poll_data.trim()) return [];
    try {
      const parsed = JSON.parse(post.poll_data);
      if (!Array.isArray(parsed?.options)) return [];
      return parsed.options
        .map((item: any, index: number) => ({
          id: Number(item?.id) || index + 1,
          text: String(item?.text ?? "").trim(),
        }))
        .filter((option: any) => option.text)
        .slice(0, MAX_POLL_OPTIONS);
    } catch {
      return [];
    }
  })();

  if (parsedOptions.length >= 2) {
    return {
      question: String(post?.enquete_pergunta || "").trim(),
      options: parsedOptions,
    };
  }

  const legacyOptions = Array.from({ length: MAX_POLL_OPTIONS }, (_, index) => index + 1)
    .map((optionId) => ({
      id: optionId,
      text: String(post?.[`enquete_op${optionId}`] || "").trim(),
    }))
    .filter((option) => option.text);

  return {
    question: String(post?.enquete_pergunta || "").trim(),
    options: legacyOptions,
  };
};

const getPollCounts = async (postId: number, optionIds: number[]) => {
  const [rows]: any = await db.execute(
    `SELECT opcao, COUNT(*) as total
     FROM enquetes_votos
     WHERE post_id = ?
     GROUP BY opcao`,
    [postId],
  );

  const counts: Record<number, number> = {};
  optionIds.forEach((id) => {
    counts[id] = 0;
  });

  let totalVotes = 0;
  (rows || []).forEach((row: any) => {
    const optionId = Number(row.opcao);
    const votes = Number(row.total || 0);
    if (optionIds.includes(optionId)) {
      counts[optionId] = votes;
      totalVotes += votes;
    }
  });

  return {
    ...counts,
    total: totalVotes,
  };
};

export async function POST(req: Request) {
  let numericPostId = 0;
  let validOptionIds = [1, 2];

  try {
    const { postId, nickname, opcao } = await req.json();
    numericPostId = Number(postId);
    const numericOption = Number(opcao);

    if (!numericPostId || !nickname || !Number.isFinite(numericOption)) {
      return NextResponse.json({ error: "Voto inválido" }, { status: 400 });
    }

    const [posts]: any = await db.execute(
      `SELECT *
       FROM posts
       WHERE id = ?
       LIMIT 1`,
      [numericPostId],
    );

    const post = posts?.[0];
    const pollDefinition = parsePollDefinition(post);
    validOptionIds = pollDefinition.options.map((option: any) => Number(option.id)).filter(Boolean);

    if (!pollDefinition.question || validOptionIds.length < 2) {
      return NextResponse.json({ error: "Enquete não encontrada" }, { status: 404 });
    }

    if (!validOptionIds.includes(numericOption)) {
      return NextResponse.json({ error: "Opção inválida" }, { status: 400 });
    }

    if (post.is_closed) {
      return NextResponse.json({ error: "Enquete encerrada" }, { status: 400 });
    }

    await db.execute(
      "INSERT INTO enquetes_votos (post_id, usuario_nickname, opcao) VALUES (?, ?, ?)",
      [numericPostId, nickname, numericOption],
    );

    await db.execute(
      "UPDATE ativora_users SET xp = COALESCE(xp, 0) + 5, xp_score = COALESCE(xp_score, 0) + 5 WHERE nickname = ?",
      [nickname],
    );

    const counts = await getPollCounts(numericPostId, validOptionIds);

    return NextResponse.json({
      success: true,
      userVote: numericOption,
      votes: counts,
    });
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      const counts = numericPostId
        ? await getPollCounts(numericPostId, validOptionIds)
        : { 1: 0, 2: 0, total: 0 };

      return NextResponse.json(
        { error: "Voto já registrado", votes: counts },
        { status: 409 },
      );
    }

    console.error("ERRO AO VOTAR NA ENQUETE:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
