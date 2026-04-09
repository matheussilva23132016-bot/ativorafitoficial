import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function POST(req: Request) {
  try {
    const { postId, username } = await req.json();

    // 1. Verifica se já curtiu
    const [existing]: any = await db.execute(
      "SELECT id FROM curtidas WHERE post_id = ? AND usuario_nickname = ?",
      [postId, username]
    );

    if (existing.length > 0) {
      // UNLIKE: Remove a curtida
      await db.execute("DELETE FROM curtidas WHERE id = ?", [existing[0].id]);
      return NextResponse.json({ success: true, liked: false });
    } else {
      // LIKE: Registra a curtida
      await db.execute(
        "INSERT INTO curtidas (post_id, usuario_nickname) VALUES (?, ?)",
        [postId, username]
      );

      // 2. Busca o dono do post para enviar o Alerta e Recompensa
      const [postOwner]: any = await db.execute(
        "SELECT nickname FROM posts WHERE id = ? LIMIT 1",
        [postId]
      );

      if (postOwner.length > 0) {
        const donoDoPost = postOwner[0].nickname;

        // Só processa se não for o próprio dono curtindo seu post
        if (donoDoPost !== username) {
          // --- PROTOCOLO DE NOTIFICAÇÃO ---
          // Ajustado para o padrão 'usuario_target' e 'mensagem' da sua Central
          await db.execute(
            "INSERT INTO notificacoes (usuario_target, remetente_nickname, tipo, mensagem) VALUES (?, ?, 'curtida', ?)",
            [donoDoPost, username, "deu fogo no seu post! 🔥"]
          );

          // --- RECOMPENSA DE PERFORMANCE (XP) ---
          // Ganha 2 XP por ser reconhecido pela comunidade
          await db.execute(
            "UPDATE usuarios SET xp = xp + 2 WHERE nickname = ?",
            [donoDoPost]
          );
        }
      }

      return NextResponse.json({ success: true, liked: true });
    }
  } catch (error: any) {
    console.error("ERRO NO MOTOR DE CURTIDAS:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}