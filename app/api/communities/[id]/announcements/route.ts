import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  CommunityAccessError,
  ensureCommunityPermission,
  statusFromCommunityError,
} from "@/lib/communities/access";
import { criarNotificacao } from "@/lib/communities/notifications";

export const dynamic = "force-dynamic";

type Audience = "todos" | "aluno";

const AUDIENCES: Audience[] = ["todos", "aluno"];
const PRIORIDADES = ["normal", "alta", "urgente"];

const normalizeAudience = (value: unknown): Audience => {
  const audience = String(value || "todos").trim().toLowerCase();
  return AUDIENCES.includes(audience as Audience) ? (audience as Audience) : "todos";
};

const cleanText = (value: unknown, max = 500) =>
  String(value || "").trim().replace(/\s+/g, " ").slice(0, max);

async function ensureAvisosTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS comunidade_avisos (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      comunidade_id VARCHAR(36) NOT NULL,
      autor_id VARCHAR(36) NOT NULL,
      titulo VARCHAR(160) NOT NULL,
      mensagem TEXT NOT NULL,
      categoria VARCHAR(40) NOT NULL DEFAULT 'geral',
      prioridade ENUM('normal','alta','urgente') NOT NULL DEFAULT 'normal',
      audience ENUM('todos','aluno') NOT NULL DEFAULT 'todos',
      target_user_id VARCHAR(36) NULL,
      acao_recomendada VARCHAR(500) NULL,
      related_area VARCHAR(40) NULL,
      fixado TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_comunidade_created (comunidade_id, created_at),
      INDEX idx_target (comunidade_id, target_user_id),
      INDEX idx_audience (audience, prioridade)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS comunidade_aviso_leituras (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      aviso_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      lida TINYINT(1) NOT NULL DEFAULT 0,
      read_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_aviso_user (aviso_id, user_id),
      INDEX idx_user_lida (user_id, lida),
      INDEX idx_aviso (aviso_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function getApprovedRecipients(
  comunidadeId: string,
  audience: Audience,
  targetUserId?: string,
  authorId?: string,
) {
  const params: any[] = [comunidadeId];
  let targetFilter = "";

  if (audience === "aluno") {
    targetFilter = "AND cm.user_id = ?";
    params.push(targetUserId || "");
  }

  const [rows] = await db.query(
    `
      SELECT
        cm.user_id,
        COALESCE(u.nickname, 'aluno') AS nickname,
        u.full_name
      FROM comunidade_membros cm
      LEFT JOIN ativora_users u ON u.id = cm.user_id
      WHERE cm.comunidade_id = ?
        AND cm.status = 'aprovado'
        ${targetFilter}
      ORDER BY cm.joined_at ASC, cm.created_at ASC
    `,
    params,
  );

  return (rows as any[])
    .filter(row => String(row.user_id) !== String(authorId || ""))
    .map(row => ({
      userId: String(row.user_id),
      nickname: String(row.nickname || "aluno"),
      fullName: row.full_name ? String(row.full_name) : "",
    }));
}

function jsonError(err: any) {
  const status = statusFromCommunityError(err);
  const message =
    err instanceof CommunityAccessError
      ? err.message
      : err?.message || "Não foi possível concluir a ação.";
  return NextResponse.json({ error: message }, { status });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const resolvedParams = await params;
  const comunidadeId = resolvedParams.id;
  const userId = String(req.nextUrl.searchParams.get("userId") || "").trim();

  try {
    await ensureAvisosTables();

    const [rows] = await db.query(
      `
        SELECT
          a.id,
          a.comunidade_id,
          a.autor_id,
          a.titulo,
          a.mensagem,
          a.categoria,
          a.prioridade,
          a.audience,
          a.target_user_id,
          a.acao_recomendada,
          a.related_area,
          a.fixado,
          a.created_at,
          COALESCE(autor.nickname, 'profissional') AS autor_nickname,
          autor.full_name AS autor_nome,
          alvo.nickname AS target_nickname,
          COALESCE(l.lida, 0) AS lida,
          l.read_at
        FROM comunidade_avisos a
        LEFT JOIN ativora_users autor ON autor.id = a.autor_id
        LEFT JOIN ativora_users alvo ON alvo.id = a.target_user_id
        LEFT JOIN comunidade_aviso_leituras l
          ON l.aviso_id = a.id AND l.user_id = ?
        WHERE a.comunidade_id = ?
          AND (
            ? = ''
            OR a.audience = 'todos'
            OR a.target_user_id = ?
            OR a.autor_id = ?
          )
        ORDER BY a.fixado DESC, FIELD(a.prioridade, 'urgente', 'alta', 'normal'), a.created_at DESC
        LIMIT 80
      `,
      [userId, comunidadeId, userId, userId, userId],
    );

    return NextResponse.json({ announcements: rows });
  } catch (err: any) {
    return jsonError(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const resolvedParams = await params;
  const comunidadeId = resolvedParams.id;

  try {
    await ensureAvisosTables();

    const body = await req.json();
    const autorId = String(body.autorId || body.authorId || "").trim();
    const titulo = cleanText(body.titulo || body.title, 160);
    const mensagem = cleanText(body.mensagem || body.conteudo || body.message, 1400);
    const audience = normalizeAudience(body.audience);
    const targetUserId = String(body.targetUserId || body.alunoId || "").trim();
    const categoria = cleanText(body.categoria || "geral", 40).toLowerCase();
    const relatedArea = cleanText(body.relatedArea || body.area || categoria, 40).toLowerCase();
    const prioridadeInput = cleanText(body.prioridade || "normal", 20).toLowerCase();
    const prioridade = PRIORIDADES.includes(prioridadeInput) ? prioridadeInput : "normal";
    const acaoRecomendada = cleanText(body.acaoRecomendada || body.acao || "", 500);
    const fixado = body.fixado ? 1 : 0;

    if (!autorId) {
      return NextResponse.json({ error: "Autor obrigatório." }, { status: 400 });
    }

    if (titulo.length < 3 || mensagem.length < 8) {
      return NextResponse.json(
        { error: "Informe um título claro e uma mensagem com contexto." },
        { status: 400 },
      );
    }

    if (audience === "aluno" && !targetUserId) {
      return NextResponse.json({ error: "Selecione o aluno que receberá o aviso." }, { status: 400 });
    }

    await ensureCommunityPermission(comunidadeId, autorId, "aviso:create");

    const recipients = await getApprovedRecipients(
      comunidadeId,
      audience,
      audience === "aluno" ? targetUserId : undefined,
      autorId,
    );

    if (audience === "aluno" && recipients.length === 0) {
      return NextResponse.json({ error: "Aluno não encontrado entre os membros aprovados." }, { status: 404 });
    }

    const avisoId = crypto.randomUUID();

    await db.query(
      `
        INSERT INTO comunidade_avisos
          (id, comunidade_id, autor_id, titulo, mensagem, categoria, prioridade, audience, target_user_id, acao_recomendada, related_area, fixado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        avisoId,
        comunidadeId,
        autorId,
        titulo,
        mensagem,
        categoria || "geral",
        prioridade,
        audience,
        audience === "aluno" ? targetUserId : null,
        acaoRecomendada || null,
        relatedArea || null,
        fixado,
      ],
    );

    for (const recipient of recipients) {
      await db.query(
        `
          INSERT INTO comunidade_aviso_leituras (id, aviso_id, user_id, lida)
          VALUES (?, ?, ?, 0)
          ON DUPLICATE KEY UPDATE lida = 0, read_at = NULL
        `,
        [crypto.randomUUID(), avisoId, recipient.userId],
      );

      await criarNotificacao({
        userId: recipient.userId,
        comunidadeId,
        tipo: "aviso_comunidade",
        titulo: prioridade === "urgente" ? `Aviso urgente: ${titulo}` : `Novo aviso: ${titulo}`,
        mensagem: acaoRecomendada
          ? `${mensagem.slice(0, 100)} - O que fazer: ${acaoRecomendada.slice(0, 80)}`
          : mensagem.slice(0, 160),
        payload: {
          avisoId,
          tab: "avisos",
          categoria,
          prioridade,
          relatedArea,
        },
      });
    }

    return NextResponse.json({
      success: true,
      id: avisoId,
      deliveredCount: recipients.length,
      message: `Aviso enviado para ${recipients.length} aluno(s).`,
    });
  } catch (err: any) {
    return jsonError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const resolvedParams = await params;
  const comunidadeId = resolvedParams.id;

  try {
    await ensureAvisosTables();
    const body = await req.json();
    const avisoId = String(body.avisoId || body.id || "").trim();
    const userId = String(body.userId || "").trim();

    if (!avisoId || !userId) {
      return NextResponse.json({ error: "Aviso e usuário são obrigatórios." }, { status: 400 });
    }

    await db.query(
      `
        INSERT INTO comunidade_aviso_leituras (id, aviso_id, user_id, lida, read_at)
        VALUES (?, ?, ?, 1, NOW())
        ON DUPLICATE KEY UPDATE lida = 1, read_at = NOW()
      `,
      [crypto.randomUUID(), avisoId, userId],
    );

    await db.query(
      `
        UPDATE notificacoes_comunidade
        SET lida = 1
        WHERE comunidade_id = ?
          AND user_id = ?
          AND tipo = 'aviso_comunidade'
          AND payload LIKE ?
      `,
      [comunidadeId, userId, `%${avisoId}%`],
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return jsonError(err);
  }
}
