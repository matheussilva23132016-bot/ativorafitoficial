import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCommunityUserTags } from "@/lib/communities/access";

function weekRange() {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(today);
  start.setDate(today.getDate() - diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function todayLabels() {
  return [
    ["Domingo", "Domingo"],
    ["Segunda", "Segunda"],
    ["Terça", "Terca"],
    ["Quarta", "Quarta"],
    ["Quinta", "Quinta"],
    ["Sexta", "Sexta"],
    ["Sábado", "Sabado"],
  ][new Date().getDay()];
}

function first<T = any>(rows: any): T | null {
  return Array.isArray(rows) && rows.length > 0 ? rows[0] as T : null;
}

function isMissingOptionalSchema(err: any) {
  return err?.code === "ER_NO_SUCH_TABLE" || err?.code === "ER_BAD_FIELD_ERROR" || err?.errno === 1146;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const resolvedParams = await params;
  const communityId = resolvedParams.id;
  const userId = req.nextUrl.searchParams.get("userId");
  const userParam = userId ?? "";
  const { start, end } = weekRange();
  const [diaHoje, diaHojeAscii] = todayLabels();

  try {
    const tags = userId ? await getCommunityUserTags(communityId, userId) : [];

    const [
      communityRows,
      memberCountRows,
      pendingEntryRows,
      activeChallengeRows,
      todayChallengeRows,
      workoutRows,
      workoutCountRows,
      mealRows,
      rankingRows,
      notifRows,
      badgeRows,
      memberRows,
      treinoReqRows,
      nutriReqRows,
    ] = await Promise.all([
      db.query(
        `
          SELECT id, nome, descricao, cover_url, owner_id, total_membros, foco, tema
          FROM comunidades
          WHERE id = ?
          LIMIT 1
        `,
        [communityId],
      ),
      db.query(
        `
          SELECT COUNT(*) AS total
          FROM comunidade_membros
          WHERE comunidade_id = ? AND status = 'aprovado'
        `,
        [communityId],
      ),
      db.query(
        `
          SELECT COUNT(*) AS total
          FROM solicitacoes_entrada
          WHERE comunidade_id = ? AND status = 'pendente'
        `,
        [communityId],
      ),
      db.query(
        `
          SELECT COUNT(*) AS total
          FROM desafios
          WHERE comunidade_id = ? AND status = 'ativo'
        `,
        [communityId],
      ),
      db.query(
        `
          SELECT id, titulo, descricao, tipo_envio, xp_recompensa, dia_semana, prazo
          FROM desafios
          WHERE comunidade_id = ?
            AND status = 'ativo'
            AND (dia_semana IN (?, ?) OR dia_semana = 'Livre' OR dia_semana IS NULL)
          ORDER BY prazo IS NULL, prazo ASC, created_at DESC
          LIMIT 4
        `,
        [communityId, diaHoje, diaHojeAscii],
      ),
      db.query(
        `
          SELECT id, titulo, descricao, dia_semana, foco, alvo, alvo_user_id, aluno_id, updated_at
          FROM treinos
          WHERE comunidade_id = ?
            AND status = 'published'
            AND (alvo = 'todos' OR alvo_user_id = ? OR aluno_id = ?)
          ORDER BY updated_at DESC
          LIMIT 1
        `,
        [communityId, userParam, userParam],
      ),
      db.query(
        `
          SELECT COUNT(*) AS total
          FROM treinos
          WHERE comunidade_id = ?
            AND status = 'published'
            AND (alvo = 'todos' OR alvo_user_id = ? OR aluno_id = ?)
        `,
        [communityId, userParam, userParam],
      ),
      db.query(
        `
          SELECT id, titulo, foco, semana, calorias_meta, proteinas_dia, alvo, alvo_user_id, aluno_id, updated_at
          FROM cardapios
          WHERE comunidade_id = ?
            AND status = 'published'
            AND (alvo = 'todos' OR alvo_user_id = ? OR aluno_id = ?)
          ORDER BY updated_at DESC
          LIMIT 1
        `,
        [communityId, userParam, userParam],
      ),
      db.query(
        `
          SELECT rs.user_id, rs.xp_total, rs.desafios_ok, rs.desafios_total,
                 u.nickname, u.foto_url
          FROM ranking_semanal rs
          LEFT JOIN usuarios u ON u.id = CAST(rs.user_id AS UNSIGNED)
          WHERE rs.comunidade_id = ? AND rs.semana_inicio = ?
          ORDER BY rs.xp_total DESC, rs.desafios_ok DESC, rs.updated_at ASC
        `,
        [communityId, start],
      ),
      db.query(
        `
          SELECT id, tipo, titulo, mensagem, lida, created_at
          FROM notificacoes_comunidade
          WHERE user_id = ? AND (comunidade_id = ? OR comunidade_id IS NULL)
          ORDER BY created_at DESC
          LIMIT 6
        `,
        [userParam, communityId],
      ),
      db.query(
        `
          SELECT us.id, us.concedido_em, s.slug, s.nome, s.icone, s.cor
          FROM usuario_selos us
          INNER JOIN selos s ON s.id = us.selo_id
          WHERE us.user_id = ? AND us.comunidade_id = ?
          ORDER BY us.concedido_em DESC
          LIMIT 5
        `,
        [userParam, communityId],
      ),
      db.query(
        `
          SELECT cm.id, cm.user_id, u.nickname, u.foto_url,
                 GROUP_CONCAT(ct.nome ORDER BY ct.nivel_poder DESC SEPARATOR ',') AS tags
          FROM comunidade_membros cm
          LEFT JOIN usuarios u ON u.id = CAST(cm.user_id AS UNSIGNED)
          LEFT JOIN comunidade_membro_tags cmt ON cmt.membro_id = cm.id
          LEFT JOIN comunidade_tags ct ON ct.id = cmt.tag_id
          WHERE cm.comunidade_id = ? AND cm.status = 'aprovado'
          GROUP BY cm.id, cm.user_id, u.nickname, u.foto_url
          ORDER BY cm.joined_at ASC
          LIMIT 6
        `,
        [communityId],
      ),
      db.query(
        `
          SELECT id, foco, status, created_at
          FROM solicitacoes_treino
          WHERE comunidade_id = ? AND user_id = ?
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [communityId, userParam],
      ),
      db.query(
        `
          SELECT id, foco, status, created_at
          FROM solicitacoes_nutricionais
          WHERE comunidade_id = ? AND user_id = ?
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [communityId, userParam],
      ),
    ]);

    const ranking = (rankingRows[0] as any[]).map((row, index) => ({
      ...row,
      posicao: index + 1,
      isMe: String(row.user_id) === userParam,
    }));

    const me = ranking.find(row => row.isMe) ?? null;
    const community = first(communityRows[0]);

    if (!community) {
      return NextResponse.json({ error: "Comunidade não encontrada" }, { status: 404 });
    }

    let regras: any[] = [];
    try {
      const [ruleRows] = await db.query(
        `
          SELECT id, titulo, descricao, ordem
          FROM comunidade_regras
          WHERE comunidade_id = ? AND ativo = 1
          ORDER BY ordem ASC, created_at ASC
          LIMIT 6
        `,
        [communityId],
      );
      regras = ruleRows as any[];
    } catch (err: any) {
      if (!isMissingOptionalSchema(err)) throw err;
    }

    return NextResponse.json({
      community,
      regras,
      userTags: tags.length > 0 ? tags : ["Participante"],
      week: { start, end },
      metrics: {
        membros: first<any>(memberCountRows[0])?.total ?? 0,
        pedidosEntrada: first<any>(pendingEntryRows[0])?.total ?? 0,
        desafiosAtivos: first<any>(activeChallengeRows[0])?.total ?? 0,
        treinosPublicados: first<any>(workoutCountRows[0])?.total ?? 0,
      },
      treinoAtual: first(workoutRows[0]),
      cardapioAtual: first(mealRows[0]),
      desafiosHoje: todayChallengeRows[0],
      ranking: {
        top: ranking.slice(0, 3),
        me,
      },
      notificacoes: notifRows[0],
      selos: badgeRows[0],
      membrosDestaque: (memberRows[0] as any[]).map(row => ({
        ...row,
        tags: row.tags ? String(row.tags).split(",") : ["Participante"],
      })),
      solicitacoes: {
        treino: first(treinoReqRows[0]),
        nutricao: first(nutriReqRows[0]),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
