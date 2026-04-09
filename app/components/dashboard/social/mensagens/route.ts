import { NextResponse } from "next/server";
import db from "../../../../lib/db";

// LISTAR CONVERSAS OU MENSAGENS DE UM CHAT ESPECÍFICO
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user = searchParams.get("user"); // Nickname do usuário logado
    const target = searchParams.get("target"); // Nickname do contato (opcional)

    if (target) {
      // Busca a conversa específica entre dois atletas
      const [rows]: any = await db.execute(
        `SELECT * FROM mensagens 
         WHERE (remetente_nickname = ? AND destinatario_nickname = ?) 
            OR (remetente_nickname = ? AND destinatario_nickname = ?)
         ORDER BY created_at ASC`,
        [user, target, target, user]
      );
      return NextResponse.json(rows);
    }

    // Busca a lista de pessoas com quem o usuário tem conversas (Inbox)
    const [inbox]: any = await db.execute(
      `SELECT DISTINCT 
        CASE WHEN remetente_nickname = ? THEN destinatario_nickname ELSE remetente_nickname END AS contato
       FROM mensagens WHERE remetente_nickname = ? OR destinatario_nickname = ?`,
      [user, user, user]
    );
    return NextResponse.json(inbox);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ENVIAR MENSAGEM
export async function POST(req: Request) {
  try {
    const { remetente, destinatario, conteudo } = await req.json();
    await db.execute(
      "INSERT INTO mensagens (remetente_nickname, destinatario_nickname, conteudo) VALUES (?, ?, ?)",
      [remetente, destinatario, conteudo]
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}