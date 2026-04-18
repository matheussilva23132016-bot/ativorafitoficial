import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureCommunityPermission, statusFromCommunityError } from "@/lib/communities/access";

const DEFAULT_SETTINGS = {
  entrada_por_solicitacao: 1,
  adm_pode_aprovar_membros: 1,
  adm_pode_criar_desafios: 1,
  adm_pode_avaliar_desafios: 1,
  adm_pode_editar_treinos: 0,
  adm_pode_editar_nutricao: 0,
  xp_treino_concluido: 10,
  xp_refeicao_dia_concluida: 0,
  ranking_fecha_dia: "domingo",
  ranking_fecha_hora: "23:59:00",
  timezone: "America/Sao_Paulo",
};

function isMissingSchema(err: any) {
  return err?.code === "ER_NO_SUCH_TABLE" || err?.errno === 1146;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const resolvedParams = await params;
  const communityId = resolvedParams.id;
  const requesterId = req.nextUrl.searchParams.get("requesterId");

  try {
    if (!requesterId) {
  return NextResponse.json({ error: "requesterId obrigatório" }, { status: 400 });
    }

    await ensureCommunityPermission(communityId, requesterId, "member:approve");

    try {
      const [settingsRows] = await db.query(
        `
          SELECT *
          FROM comunidade_configuracoes
          WHERE comunidade_id = ?
          LIMIT 1
        `,
        [communityId],
      );

      const [rulesRows] = await db.query(
        `
          SELECT id, titulo, descricao, ordem, ativo, created_at, updated_at
          FROM comunidade_regras
          WHERE comunidade_id = ?
          ORDER BY ordem ASC, created_at ASC
        `,
        [communityId],
      );

      return NextResponse.json({
        schemaReady: true,
        settings: { ...DEFAULT_SETTINGS, ...((settingsRows as any[])[0] ?? {}) },
        rules: rulesRows,
      });
    } catch (err: any) {
      if (isMissingSchema(err)) {
        return NextResponse.json({
          schemaReady: false,
          settings: DEFAULT_SETTINGS,
          rules: [],
          warning: "Aplique o SQL complementar de Comunidades para ativar regras e configurações.",
        });
      }
      throw err;
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: statusFromCommunityError(err) },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const resolvedParams = await params;
  const communityId = resolvedParams.id;

  try {
    const { requesterId, settings, rules } = await req.json();
    await ensureCommunityPermission(communityId, requesterId, "community:edit");

    const merged = { ...DEFAULT_SETTINGS, ...(settings ?? {}) };
    const normalizedRules = Array.isArray(rules) ? rules : [];

    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      await conn.query(
        `
          INSERT INTO comunidade_configuracoes (
            comunidade_id,
            entrada_por_solicitacao,
            adm_pode_aprovar_membros,
            adm_pode_criar_desafios,
            adm_pode_avaliar_desafios,
            adm_pode_editar_treinos,
            adm_pode_editar_nutricao,
            xp_treino_concluido,
            xp_refeicao_dia_concluida,
            ranking_fecha_dia,
            ranking_fecha_hora,
            timezone
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            entrada_por_solicitacao = VALUES(entrada_por_solicitacao),
            adm_pode_aprovar_membros = VALUES(adm_pode_aprovar_membros),
            adm_pode_criar_desafios = VALUES(adm_pode_criar_desafios),
            adm_pode_avaliar_desafios = VALUES(adm_pode_avaliar_desafios),
            adm_pode_editar_treinos = VALUES(adm_pode_editar_treinos),
            adm_pode_editar_nutricao = VALUES(adm_pode_editar_nutricao),
            xp_treino_concluido = VALUES(xp_treino_concluido),
            xp_refeicao_dia_concluida = VALUES(xp_refeicao_dia_concluida),
            ranking_fecha_dia = VALUES(ranking_fecha_dia),
            ranking_fecha_hora = VALUES(ranking_fecha_hora),
            timezone = VALUES(timezone)
        `,
        [
          communityId,
          merged.entrada_por_solicitacao ? 1 : 0,
          merged.adm_pode_aprovar_membros ? 1 : 0,
          merged.adm_pode_criar_desafios ? 1 : 0,
          merged.adm_pode_avaliar_desafios ? 1 : 0,
          merged.adm_pode_editar_treinos ? 1 : 0,
          merged.adm_pode_editar_nutricao ? 1 : 0,
          Number(merged.xp_treino_concluido) || 0,
          Number(merged.xp_refeicao_dia_concluida) || 0,
          merged.ranking_fecha_dia === "segunda" ? "segunda" : "domingo",
          merged.ranking_fecha_hora || "23:59:00",
          merged.timezone || "America/Sao_Paulo",
        ],
      );

      for (let i = 0; i < normalizedRules.length; i++) {
        const rule = normalizedRules[i];
        if (!rule?.titulo || !rule?.descricao) continue;
        if (!rule.id && rule.removido) continue;

        if (rule.id) {
          await conn.query(
            `
              UPDATE comunidade_regras
              SET titulo = ?, descricao = ?, ordem = ?, ativo = ?
              WHERE id = ? AND comunidade_id = ?
            `,
            [
              String(rule.titulo).slice(0, 120),
              String(rule.descricao),
              Number(rule.ordem ?? i + 1),
              rule.ativo ? 1 : 0,
              rule.id,
              communityId,
            ],
          );
        } else {
          await conn.query(
            `
              INSERT INTO comunidade_regras
                (id, comunidade_id, titulo, descricao, ordem, ativo)
              VALUES (UUID(), ?, ?, ?, ?, ?)
            `,
            [
              communityId,
              String(rule.titulo).slice(0, 120),
              String(rule.descricao),
              Number(rule.ordem ?? i + 1),
              rule.ativo === false ? 0 : 1,
            ],
          );
        }
      }

      await conn.commit();
      conn.release();
      return NextResponse.json({ success: true });
    } catch (err: any) {
      await conn.rollback();
      conn.release();

      if (isMissingSchema(err)) {
        return NextResponse.json(
      { error: "SQL complementar de Comunidades ainda não foi aplicado." },
          { status: 409 },
        );
      }

      throw err;
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: statusFromCommunityError(err) },
    );
  }
}
