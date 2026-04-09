import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function PUT(req: Request) {
  try {
    const { nickname, isPrivate } = await req.json();

    await db.execute(
      "UPDATE usuarios SET is_private = ? WHERE nickname = ?",
      [isPrivate ? 1 : 0, nickname]
    );

    return NextResponse.json({ success: true, message: "PRIVACIDADE ATUALIZADA: Status da matriz alterado." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}