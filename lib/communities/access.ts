import { db } from "@/lib/db";
import { canDo } from "./permissions";

const ADM_CONFIG_PERMISSIONS: Record<string, { column: string; fallbackTags: string[] }> = {
  "member:approve": {
    column: "adm_pode_aprovar_membros",
    fallbackTags: ["Dono"],
  },
  "desafio:create": {
    column: "adm_pode_criar_desafios",
    fallbackTags: ["Dono"],
  },
  "desafio:evaluate": {
    column: "adm_pode_avaliar_desafios",
    fallbackTags: ["Dono"],
  },
  "treino:create": {
    column: "adm_pode_editar_treinos",
    fallbackTags: ["Dono", "Instrutor", "Personal"],
  },
  "treino:manage": {
    column: "adm_pode_editar_treinos",
    fallbackTags: ["Dono", "Instrutor", "Personal"],
  },
  "nutri:create": {
    column: "adm_pode_editar_nutricao",
    fallbackTags: ["Dono", "Nutri", "Nutricionista"],
  },
  "nutri:manage": {
    column: "adm_pode_editar_nutricao",
    fallbackTags: ["Dono", "Nutri", "Nutricionista"],
  },
};

export class CommunityAccessError extends Error {
  status = 403;

  constructor(message = "Sem permissão para executar esta ação.") {
    super(message);
    this.name = "CommunityAccessError";
  }
}

export async function getCommunityUserTags(
  communityId: string,
  userId: string | number | null | undefined,
): Promise<string[]> {
  if (!communityId || userId == null || userId === "") return [];

  const normalizedUserId = String(userId);

  const [tagRows] = await db.query(
    `
      SELECT ct.nome
      FROM comunidade_membros cm
      INNER JOIN comunidade_membro_tags cmt ON cmt.membro_id = cm.id
      INNER JOIN comunidade_tags ct ON ct.id = cmt.tag_id
      WHERE cm.comunidade_id = ?
        AND cm.user_id = ?
        AND cm.status = 'aprovado'
    `,
    [communityId, normalizedUserId],
  );

  const tags = (tagRows as any[])
    .map(row => String(row.nome || "").trim())
    .filter(Boolean);

  const [ownerRows] = await db.query(
    `
      SELECT id
      FROM comunidades
      WHERE id = ? AND owner_id = ?
      LIMIT 1
    `,
    [communityId, normalizedUserId],
  );

  if ((ownerRows as any[]).length > 0) tags.push("Dono");

  return Array.from(new Set(tags));
}

export async function ensureCommunityPermission(
  communityId: string,
  userId: string | number | null | undefined,
  permission: string,
): Promise<string[]> {
  const tags = await getCommunityUserTags(communityId, userId);
  if (!canDo(tags, permission)) {
    throw new CommunityAccessError();
  }

  if (tags.includes("Dono")) return tags;

  const admRule = ADM_CONFIG_PERMISSIONS[permission];
  const usesAdmPermission =
    admRule &&
    tags.includes("ADM") &&
    !admRule.fallbackTags.some(tag => tags.includes(tag));

  if (usesAdmPermission) {
    try {
      const [rows] = await db.query(
        `
          SELECT ${admRule.column} AS allowed
          FROM comunidade_configuracoes
          WHERE comunidade_id = ?
          LIMIT 1
        `,
        [communityId],
      );
      const config = (rows as any[])[0];
      if (config && Number(config.allowed) !== 1) {
        throw new CommunityAccessError("Permissão de ADM desativada pelo Dono.");
      }
    } catch (err: any) {
      if (err instanceof CommunityAccessError) throw err;
      if (err?.code !== "ER_NO_SUCH_TABLE" && err?.errno !== 1146) {
        throw err;
      }
    }
  }

  return tags;
}

export function statusFromCommunityError(err: unknown): number {
  return err instanceof CommunityAccessError ? err.status : 500;
}
