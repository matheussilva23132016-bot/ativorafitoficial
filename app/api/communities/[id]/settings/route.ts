import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureCommunityPermission, statusFromCommunityError } from "@/lib/communities/access";
import { COMMUNITY_PERMISSION_MAP, COMMUNITY_ROLE_HIERARCHY } from "@/lib/communities/permissions";

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

const MANAGED_PERMISSIONS = [
  "member:approve",
  "member:remove",
  "tag:assign",
  "treino:create",
  "treino:manage",
  "nutri:create",
  "nutri:manage",
  "desafio:create",
  "desafio:evaluate",
  "aviso:create",
  "document:import",
  "post:pin",
  "post:delete",
] as const;

const ROLE_DEFAULTS: Record<string, { cor: string; nivel_poder: number }> = {
  Dono: { cor: "amber", nivel_poder: 5 },
  ADM: { cor: "purple", nivel_poder: 4 },
  Personal: { cor: "emerald", nivel_poder: 2 },
  Nutri: { cor: "green", nivel_poder: 3 },
  Nutricionista: { cor: "green", nivel_poder: 3 },
  Instrutor: { cor: "emerald", nivel_poder: 2 },
  Participante: { cor: "sky", nivel_poder: 1 },
};

function isMissingSchema(err: any) {
  return (
    err?.code === "ER_NO_SUCH_TABLE" ||
    err?.errno === 1146 ||
    err?.code === "ER_BAD_FIELD_ERROR"
  );
}

function buildDefaultPermissionMatrix() {
  const matrix: Record<string, Record<string, boolean>> = {};

  for (const role of COMMUNITY_ROLE_HIERARCHY) {
    matrix[role] = {};
    for (const permission of MANAGED_PERMISSIONS) {
      const byDefault = COMMUNITY_PERMISSION_MAP[permission]?.includes(role) ?? false;
      matrix[role][permission] = role === "Dono" ? true : byDefault;
    }
  }

  return matrix;
}

function normalizePermissionMatrix(input: any) {
  const base = buildDefaultPermissionMatrix();
  if (!input || typeof input !== "object") return base;

  for (const role of COMMUNITY_ROLE_HIERARCHY) {
    const roleData = input?.[role];
    if (!roleData || typeof roleData !== "object") continue;

    for (const permission of MANAGED_PERMISSIONS) {
      if (permission in roleData) {
        base[role][permission] = role === "Dono" ? true : Boolean(roleData[permission]);
      }
    }
  }

  return base;
}

function applyPermissionRows(
  matrix: Record<string, Record<string, boolean>>,
  rows: any[],
) {
  for (const row of rows) {
    const role = String(row?.cargo || "").trim();
    const permission = String(row?.permissao || "").trim();
    if (!matrix[role] || !(permission in matrix[role])) continue;
    matrix[role][permission] = Number(row?.permitido) === 1;
  }

  if (matrix.Dono) {
    for (const permission of MANAGED_PERMISSIONS) {
      matrix.Dono[permission] = true;
    }
  }
}

async function ensureRoleTags(conn: any, communityId: string) {
  const [tagRows] = await conn.query(
    `
      SELECT id, nome
      FROM comunidade_tags
      WHERE comunidade_id = ?
    `,
    [communityId],
  );

  const currentMap: Record<string, string> = {};
  for (const row of tagRows as any[]) {
    const name = String(row?.nome || "").trim();
    const id = String(row?.id || "").trim();
    if (!name || !id) continue;
    currentMap[name] = id;
  }

  for (const role of COMMUNITY_ROLE_HIERARCHY) {
    if (currentMap[role]) continue;
    const defaults = ROLE_DEFAULTS[role] ?? ROLE_DEFAULTS.Participante;
    await conn.query(
      `
        INSERT INTO comunidade_tags (id, comunidade_id, nome, cor, nivel_poder)
        VALUES (UUID(), ?, ?, ?, ?)
      `,
      [communityId, role, defaults.cor, defaults.nivel_poder],
    );
  }

  const [freshRows] = await conn.query(
    `
      SELECT id, nome
      FROM comunidade_tags
      WHERE comunidade_id = ?
    `,
    [communityId],
  );

  const freshMap: Record<string, string> = {};
  for (const row of freshRows as any[]) {
    const name = String(row?.nome || "").trim();
    const id = String(row?.id || "").trim();
    if (!name || !id) continue;
    freshMap[name] = id;
  }

  return freshMap;
}

async function savePermissionMatrix(
  conn: any,
  communityId: string,
  requesterId: string,
  matrix: Record<string, Record<string, boolean>>,
) {
  const tagMap = await ensureRoleTags(conn, communityId);

  for (const role of COMMUNITY_ROLE_HIERARCHY) {
    const tagId = tagMap[role];
    if (!tagId) continue;

    for (const permission of MANAGED_PERMISSIONS) {
      const permitido = matrix?.[role]?.[permission] ? 1 : 0;
      await conn.query(
        `
          INSERT INTO comunidade_permissoes_tag
            (id, comunidade_id, tag_id, permissao, permitido, definido_por)
          VALUES (UUID(), ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            permitido = VALUES(permitido),
            definido_por = VALUES(definido_por)
        `,
        [communityId, tagId, permission, permitido, requesterId],
      );
    }
  }
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
      return NextResponse.json({ error: "requesterId obrigatorio" }, { status: 400 });
    }

    await ensureCommunityPermission(communityId, requesterId, "member:approve");

    let schemaReady = true;
    let permissionsSchemaReady = true;
    let settings: any = { ...DEFAULT_SETTINGS };
    let rules: any[] = [];
    const permissions = buildDefaultPermissionMatrix();

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

      settings = { ...DEFAULT_SETTINGS, ...((settingsRows as any[])[0] ?? {}) };
      rules = rulesRows as any[];
    } catch (err: any) {
      if (isMissingSchema(err)) {
        schemaReady = false;
      } else {
        throw err;
      }
    }

    try {
      const permissionPlaceholders = MANAGED_PERMISSIONS.map(() => "?").join(",");
      const rolePlaceholders = COMMUNITY_ROLE_HIERARCHY.map(() => "?").join(",");
      const [permissionRows] = await db.query(
        `
          SELECT ct.nome AS cargo, cpt.permissao, cpt.permitido
          FROM comunidade_permissoes_tag cpt
          INNER JOIN comunidade_tags ct ON ct.id = cpt.tag_id
          WHERE cpt.comunidade_id = ?
            AND cpt.permissao IN (${permissionPlaceholders})
            AND ct.nome IN (${rolePlaceholders})
        `,
        [communityId, ...MANAGED_PERMISSIONS, ...COMMUNITY_ROLE_HIERARCHY],
      );
      applyPermissionRows(permissions, permissionRows as any[]);
    } catch (err: any) {
      if (isMissingSchema(err)) {
        permissionsSchemaReady = false;
      } else {
        throw err;
      }
    }

    return NextResponse.json({
      schemaReady,
      permissionsSchemaReady,
      settings,
      rules,
      permissions,
    });
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
    const { requesterId, settings, rules, permissions } = await req.json();
    await ensureCommunityPermission(communityId, requesterId, "community:edit");

    const merged = { ...DEFAULT_SETTINGS, ...(settings ?? {}) };
    const normalizedRules = Array.isArray(rules) ? rules : [];
    const normalizedPermissions = normalizePermissionMatrix(permissions);

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

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

      await savePermissionMatrix(
        conn,
        communityId,
        String(requesterId ?? ""),
        normalizedPermissions,
      );

      await conn.commit();
      return NextResponse.json({ success: true });
    } catch (err: any) {
      await conn.rollback();

      if (isMissingSchema(err)) {
        return NextResponse.json(
          { error: "SQL complementar de Comunidades ainda nao foi aplicado." },
          { status: 409 },
        );
      }

      throw err;
    } finally {
      conn.release();
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: statusFromCommunityError(err) },
    );
  }
}
