import { NextResponse } from 'next/server';
import db from "../../../lib/db";

export async function PUT(req: Request) {
  try {
    const { postId, content, username } = await req.json();

    // Segurança: Só o dono edita
    const [result]: any = await db.execute(
      "UPDATE posts SET content = ? WHERE id = ? AND nickname = ?",
      [content, postId, username]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Não autorizado ou post inexistente." }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}