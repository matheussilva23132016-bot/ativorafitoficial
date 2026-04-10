import { NextResponse } from "next/server";
import db from "../../../lib/db"; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      nickname, content, media_url, media_url_before, 
      media_type, role, enquete_pergunta, enquete_op1, enquete_op2 
    } = body;

    // Se não tem URL de mídia, o tipo é obrigatoriamente 'text'
    const finalType = media_url ? media_type : 'text';

    const [result]: any = await db.execute(
      `INSERT INTO posts 
      (nickname, content, media_url, media_url_before, media_type, role, enquete_pergunta, enquete_op1, enquete_op2, comentarios_count) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        nickname, 
        content || "", 
        media_url || null, 
        media_url_before || null, 
        finalType, 
        role || 'atleta',
        enquete_pergunta || null,
        enquete_op1 || null,
        enquete_op2 || null
      ]
    );

    // Bônus de XP
    await db.execute("UPDATE usuarios SET xp = xp + 10 WHERE nickname = ?", [nickname]);

    return NextResponse.json({ success: true, id: result.insertId });

  } catch (error: any) {
    console.error("❌ ERRO AO SALVAR POST:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}