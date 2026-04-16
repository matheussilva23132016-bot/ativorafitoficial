import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export const dynamic = "force-dynamic";

const normalizeNickname = (value: unknown) =>
  String(value || "").trim().replace(/^@/, "");

const buildNotification = (row: any) => {
  const sender = row.remetente_nickname ? `@${row.remetente_nickname}` : "Ativora";
  const tipo = String(row.tipo || "social");
  const type =
    tipo.includes("treino") ? "treino" :
    tipo.includes("comunidade") ? "comunidade" :
    "social";

  const titles: Record<string, string> = {
    like: "Nova curtida",
    comment: "Novo comentario",
    follow: "Nova conexao",
    message: "Nova mensagem",
  };

  const messages: Record<string, string> = {
    like: `${sender} curtiu seu post.`,
    comment: `${sender} comentou no seu post.`,
    follow: `${sender} quer se conectar com voce.`,
    message: `${sender} enviou uma mensagem no Direct.`,
  };

  return {
    id: String(row.id),
    title: titles[tipo] || "Novo sinal",
    message: messages[tipo] || `${sender} gerou uma nova atividade.`,
    type,
    targetId: row.referencia_id ? String(row.referencia_id) : undefined,
    isRead: row.lida === 1 || row.lida === true,
    timestamp: row.created_at,
    sender: row.remetente_nickname,
    senderName: row.sender_name,
    senderAvatar: row.sender_avatar,
    rawType: tipo,
  };
};

const buildCommunityNotification = (row: any) => ({
  id: `com:${row.id}`,
  title: row.titulo || "Novo sinal",
  message: row.mensagem || "Nova atividade na comunidade.",
  type: String(row.tipo || "").includes("treino") ? "treino" : "comunidade",
  targetId: row.comunidade_id ? String(row.comunidade_id) : undefined,
  targetTab:
    row.tipo === "aviso_comunidade" || row.tipo === "novo_anuncio"
      ? "avisos"
      : row.tipo,
  isRead: row.lida === 1 || row.lida === true,
  timestamp: row.created_at,
  rawType: row.tipo,
  source: "community",
});

const buildBossBroadcastNotification = (row: any) => ({
  id: `boss:${row.id}`,
  title: row.titulo || "Aviso AtivoraFit",
  message: row.mensagem || "A equipe AtivoraFit enviou um aviso.",
  type: "social",
  targetId: row.broadcast_id ? String(row.broadcast_id) : undefined,
  isRead: row.lida === 1 || row.lida === true,
  timestamp: row.created_at,
  rawType: "boss_broadcast",
  source: "boss",
});

async function ensureBroadcastTables() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS boss_broadcasts (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        titulo VARCHAR(160) NOT NULL,
        mensagem TEXT NOT NULL,
        audience ENUM('all','role','user') NOT NULL DEFAULT 'all',
        role_target VARCHAR(40) NULL,
        user_target VARCHAR(191) NULL,
        sent_by VARCHAR(191) NOT NULL,
        delivered_count INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_boss_broadcasts_created (created_at),
        INDEX idx_boss_broadcasts_audience (audience)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS boss_broadcast_recipients (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        broadcast_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(191) NULL,
        nickname VARCHAR(120) NOT NULL,
        lida TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        read_at DATETIME NULL,
        UNIQUE KEY uq_boss_broadcast_recipient (broadcast_id, nickname),
        INDEX idx_boss_broadcast_recipients_user (user_id),
        INDEX idx_boss_broadcast_recipients_nickname (nickname, lida, created_at),
        INDEX idx_boss_broadcast_recipients_broadcast (broadcast_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    return true;
  } catch (error: any) {
    console.warn("[notificacoes] Avisos Boss indisponiveis:", error.message);
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = normalizeNickname(searchParams.get("username"));
    const userId = String(searchParams.get("userId") || "").trim();

    if (!username && !userId) {
      return NextResponse.json({ error: "Nickname ausente" }, { status: 400 });
    }

    let socialNotifications: any[] = [];
    let communityNotifications: any[] = [];
    let bossNotifications: any[] = [];

    if (username) {
      const [rows]: any = await db.execute(
        `SELECT
          n.id,
          n.destinatario_nickname,
          n.remetente_nickname,
          n.tipo,
          n.referencia_id,
          n.lida,
          n.created_at,
          u.full_name AS sender_name,
          u.avatar_url AS sender_avatar
         FROM notificacoes n
         LEFT JOIN ativora_users u ON u.nickname = n.remetente_nickname
         WHERE n.destinatario_nickname = ?
         ORDER BY n.lida ASC, n.created_at DESC
         LIMIT 50`,
        [username]
      );
      socialNotifications = (rows || []).map(buildNotification);

      if (await ensureBroadcastTables()) {
        const [bossRows]: any = await db.execute(
          `SELECT
            r.id,
            r.broadcast_id,
            r.nickname,
            r.lida,
            r.created_at,
            b.titulo,
            b.mensagem
           FROM boss_broadcast_recipients r
           JOIN boss_broadcasts b ON b.id = r.broadcast_id
           WHERE r.nickname = ?
           ORDER BY r.lida ASC, r.created_at DESC
           LIMIT 50`,
          [username]
        );
        bossNotifications = (bossRows || []).map(buildBossBroadcastNotification);
      }
    }

    if (userId) {
      const [rows]: any = await db.execute(
        `SELECT
          id,
          comunidade_id,
          user_id,
          tipo,
          titulo,
          mensagem,
          lida,
          created_at
         FROM notificacoes_comunidade
         WHERE user_id = ?
         ORDER BY lida ASC, created_at DESC
         LIMIT 50`,
        [userId]
      );
      communityNotifications = (rows || []).map(buildCommunityNotification);
    }

    return NextResponse.json(
      [...socialNotifications, ...communityNotifications, ...bossNotifications].sort((a, b) => {
        if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
        return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
      }).slice(0, 80)
    );
  } catch (error: any) {
    console.error("ERRO AO LISTAR NOTIFICACOES:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const username = normalizeNickname(body.username);
    const userId = String(body.userId || "").trim();
    const id = body.id ? String(body.id) : "";

    if (!username && !userId) {
      return NextResponse.json({ error: "Nickname ausente" }, { status: 400 });
    }

    if (id) {
      if (id.startsWith("com:")) {
        await db.execute(
          "UPDATE notificacoes_comunidade SET lida = 1 WHERE id = ? AND user_id = ?",
          [id.replace(/^com:/, ""), userId]
        );
      } else if (id.startsWith("boss:") && username && await ensureBroadcastTables()) {
        await db.execute(
          "UPDATE boss_broadcast_recipients SET lida = 1, read_at = NOW() WHERE id = ? AND nickname = ?",
          [id.replace(/^boss:/, ""), username]
        );
      } else if (username) {
        await db.execute(
          "UPDATE notificacoes SET lida = 1 WHERE id = ? AND destinatario_nickname = ?",
          [id, username]
        );
      }
    } else {
      const hasBossBroadcastTables = username ? await ensureBroadcastTables() : false;

      if (username) {
        await db.execute(
          "UPDATE notificacoes SET lida = 1 WHERE destinatario_nickname = ?",
          [username]
        );
      }
      if (userId) {
        await db.execute(
          "UPDATE notificacoes_comunidade SET lida = 1 WHERE user_id = ?",
          [userId]
        );
      }
      if (username && hasBossBroadcastTables) {
        await db.execute(
          "UPDATE boss_broadcast_recipients SET lida = 1, read_at = NOW() WHERE nickname = ?",
          [username]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = normalizeNickname(body.username);
    const userId = String(body.userId || "").trim();
    const id = body.id ? String(body.id) : "";

    if (!username && !userId) {
      return NextResponse.json({ error: "Nickname ausente" }, { status: 400 });
    }

    if (id) {
      if (id.startsWith("com:")) {
        await db.execute(
          "DELETE FROM notificacoes_comunidade WHERE id = ? AND user_id = ?",
          [id.replace(/^com:/, ""), userId]
        );
      } else if (id.startsWith("boss:") && username && await ensureBroadcastTables()) {
        await db.execute(
          "DELETE FROM boss_broadcast_recipients WHERE id = ? AND nickname = ?",
          [id.replace(/^boss:/, ""), username]
        );
      } else if (username) {
        await db.execute(
          "DELETE FROM notificacoes WHERE id = ? AND destinatario_nickname = ?",
          [id, username]
        );
      }
    } else {
      const hasBossBroadcastTables = username ? await ensureBroadcastTables() : false;

      if (username) {
        await db.execute("DELETE FROM notificacoes WHERE destinatario_nickname = ?", [username]);
      }
      if (userId) {
        await db.execute("DELETE FROM notificacoes_comunidade WHERE user_id = ?", [userId]);
      }
      if (username && hasBossBroadcastTables) {
        await db.execute("DELETE FROM boss_broadcast_recipients WHERE nickname = ?", [username]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
