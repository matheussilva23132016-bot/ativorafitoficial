import { NextResponse } from "next/server";
import db from "../../../../lib/db";
import { isGenericSocialUser } from "@/lib/socialFilters";

export const dynamic = "force-dynamic";

const normalizeNickname = (value: unknown) =>
  String(value || "").trim().replace(/^@/, "");

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user = normalizeNickname(searchParams.get("user"));
    const target = normalizeNickname(searchParams.get("target"));
    const query = normalizeNickname(searchParams.get("q"));

    if (!user) {
      return NextResponse.json({ error: "Usuário ausente" }, { status: 400 });
    }

    if (query.length >= 2) {
      const searchTerm = `${query}%`;
      const [rows]: any = await db.execute(
        `SELECT
          nickname AS username,
          full_name,
          avatar_url AS avatar,
          role,
          is_verified
        FROM ativora_users
        WHERE nickname <> ?
          AND (nickname LIKE ? OR full_name LIKE ?)
        ORDER BY
          CASE
            WHEN nickname = ? THEN 0
            WHEN nickname LIKE ? THEN 1
            ELSE 2
          END,
          nickname ASC
        LIMIT 15`,
        [user, searchTerm, searchTerm, query, searchTerm]
      );

      return NextResponse.json((rows || []).filter((row: any) => !isGenericSocialUser(row)));
    }

    if (target) {
      const [rows]: any = await db.execute(
        `SELECT *
        FROM (
          SELECT *
          FROM (
            SELECT
              id,
              remetente_nickname,
              destinatario_nickname,
              conteudo,
              lida,
              created_at
            FROM mensagens
            WHERE remetente_nickname = ? AND destinatario_nickname = ?

            UNION ALL

            SELECT
              id,
              remetente_nickname,
              destinatario_nickname,
              conteudo,
              lida,
              created_at
            FROM mensagens
            WHERE remetente_nickname = ? AND destinatario_nickname = ?
          ) conversa
          ORDER BY created_at DESC, id DESC
          LIMIT 200
        ) ultimas
        ORDER BY created_at ASC, id ASC`,
        [user, target, target, user]
      );

      await db.execute(
        "UPDATE mensagens SET lida = 1 WHERE remetente_nickname = ? AND destinatario_nickname = ? AND lida = 0",
        [target, user]
      );

      return NextResponse.json(rows || []);
    }

    const [inbox]: any = await db.execute(
      `SELECT
        COALESCE(contato.username, contato_base.username) AS username,
        contato.full_name,
        contato.avatar,
        contato.role,
        contato.is_verified,
        contato_base.last_message,
        contato_base.last_message_at,
        contato_base.unread_count
      FROM (
        SELECT
          CASE
            WHEN m.remetente_nickname = ? THEN m.destinatario_nickname
            ELSE m.remetente_nickname
          END AS username,
          MAX(m.created_at) AS last_message_at,
          SUBSTRING_INDEX(
            GROUP_CONCAT(m.conteudo ORDER BY m.created_at DESC, m.id DESC SEPARATOR '|||'),
            '|||',
            1
          ) AS last_message,
          SUM(CASE WHEN m.destinatario_nickname = ? AND m.lida = 0 THEN 1 ELSE 0 END) AS unread_count
        FROM mensagens m
        WHERE m.remetente_nickname = ? OR m.destinatario_nickname = ?
        GROUP BY username
      ) contato_base
      LEFT JOIN (
        SELECT
          nickname AS username,
          full_name,
          avatar_url AS avatar,
          role,
          is_verified
        FROM ativora_users
      ) contato ON contato.username = contato_base.username
      ORDER BY contato_base.last_message_at DESC`,
      [user, user, user, user]
    );

    return NextResponse.json(
      (inbox || []).filter((item: any) => !isGenericSocialUser(item)).map((item: any) => ({
        ...item,
        username: item.username || item.contato,
        last_message: item.last_message || "",
        unread_count: Number(item.unread_count || 0),
      }))
    );
  } catch (error: any) {
    console.error("ERRO AO CARREGAR DIRECT:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const remetente = normalizeNickname(body.remetente);
    const destinatario = normalizeNickname(body.destinatario);
    const conteudo = String(body.conteudo || "").trim();

    if (!remetente || !destinatario || !conteudo) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    if (remetente === destinatario) {
      return NextResponse.json({ error: "Escolha outro atleta para conversar" }, { status: 400 });
    }

    const [result]: any = await db.execute(
      "INSERT INTO mensagens (remetente_nickname, destinatario_nickname, conteudo) VALUES (?, ?, ?)",
      [remetente, destinatario, conteudo.slice(0, 2000)]
    );

    await db.execute(
      "INSERT INTO notificacoes (destinatario_nickname, remetente_nickname, tipo, referencia_id) VALUES (?, ?, 'message', ?)",
      [destinatario, remetente, result.insertId]
    ).catch(() => null);

    return NextResponse.json({
      success: true,
      message: {
        id: result.insertId,
        remetente_nickname: remetente,
        destinatario_nickname: destinatario,
        conteudo,
        lida: 0,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("ERRO AO ENVIAR DIRECT:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
