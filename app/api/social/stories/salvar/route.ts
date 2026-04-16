import { NextResponse } from "next/server";
import db from "../../../../../lib/db";

export async function POST(req: Request) {
  try {
    const { username, mediaUrl, mediaType, role } = await req.json();

    if (!username || !mediaUrl) {
      return NextResponse.json({ error: "Dados incompletos para salvar o story." }, { status: 400 });
    }

    await db.execute(
      "INSERT INTO stories (username, media_url, media_type, role) VALUES (?, ?, ?, ?)",
      [username, mediaUrl, mediaType === "video" ? "video" : "image", role || "aluno"]
    );

    await db.execute(
      "UPDATE ativora_users SET xp = COALESCE(xp, 0) + 5, xp_score = COALESCE(xp_score, 0) + 5 WHERE nickname = ?",
      [username]
    );

    return NextResponse.json({
      success: true,
      message: "Story publicado.",
    });
  } catch (error: any) {
    console.error("FALHA AO SALVAR STORY:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
