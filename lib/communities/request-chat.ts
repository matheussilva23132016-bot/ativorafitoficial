import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { criarNotificacao } from "./notifications";
import { ensureCommunityPermission, getCommunityUserTags } from "./access";
import { getHighestTag } from "./permissions";

export type RequestChatKind = "treino" | "nutricao";

interface LoadRequestChatParams {
  kind: RequestChatKind;
  communityId: string;
  requestId: string;
  userId: string;
}

interface PostRequestChatParams extends LoadRequestChatParams {
  userName?: string;
  message: string;
}

type RequestRow = {
  id: string;
  user_id: string;
  aluno_nome: string | null;
  status: string | null;
  respondido_por: string | null;
};

const KIND_CONFIG: Record<
  RequestChatKind,
  {
    requestTable: string;
    managePermission: "treino:manage" | "nutri:manage";
    managerTags: string[];
    notifType: string;
    notifTitle: string;
    notifTargetTab: string;
  }
> = {
  treino: {
    requestTable: "solicitacoes_treino",
    managePermission: "treino:manage",
    managerTags: ["Dono", "ADM", "Instrutor", "Personal"],
    notifType: "chat_treino",
    notifTitle: "Nova mensagem no mini chat de treino",
    notifTargetTab: "treinos",
  },
  nutricao: {
    requestTable: "solicitacoes_nutricionais",
    managePermission: "nutri:manage",
    managerTags: ["Dono", "ADM", "Nutri", "Nutricionista"],
    notifType: "chat_nutricao",
    notifTitle: "Nova mensagem no mini chat de nutrição",
    notifTargetTab: "nutricao",
  },
};

export class RequestChatError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "RequestChatError";
    this.status = status;
  }
}

async function ensureRequestChatTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS solicitacoes_chat_mensagens (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      comunidade_id VARCHAR(36) NOT NULL,
      tipo VARCHAR(20) NOT NULL,
      solicitacao_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      user_nome VARCHAR(200) NOT NULL,
      role_label VARCHAR(50) NULL,
      mensagem TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_chat_request (tipo, solicitacao_id, created_at),
      INDEX idx_chat_user (user_id),
      INDEX idx_chat_community (comunidade_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function loadRequest(params: LoadRequestChatParams): Promise<RequestRow> {
  const config = KIND_CONFIG[params.kind];
  const [rows] = await db.query(
    `
      SELECT id, user_id, aluno_nome, status, respondido_por
      FROM ${config.requestTable}
      WHERE id = ? AND comunidade_id = ?
      LIMIT 1
    `,
    [params.requestId, params.communityId],
  );
  const requestRow = (rows as RequestRow[])[0];
  if (!requestRow) {
    throw new RequestChatError("Solicitação não encontrada.", 404);
  }
  return requestRow;
}

async function ensureChatAccess(params: LoadRequestChatParams, requestRow: RequestRow) {
  if (String(requestRow.user_id) === String(params.userId)) {
    await ensureCommunityPermission(params.communityId, params.userId, "desafio:submit");
    return;
  }
  await ensureCommunityPermission(
    params.communityId,
    params.userId,
    KIND_CONFIG[params.kind].managePermission,
  );
}

function mapMessage(row: any) {
  return {
    id: String(row.id),
    requestId: String(row.solicitacao_id),
    kind: String(row.tipo),
    userId: String(row.user_id),
    userName: String(row.user_nome || "Membro"),
    roleLabel: row.role_label ? String(row.role_label) : undefined,
    message: String(row.mensagem || ""),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };
}

async function loadManagerRecipients(kind: RequestChatKind, communityId: string, senderId: string) {
  const config = KIND_CONFIG[kind];
  const [rows] = await db.query(
    `
      SELECT DISTINCT cm.user_id
      FROM comunidade_membros cm
      INNER JOIN comunidade_membro_tags cmt ON cmt.membro_id = cm.id
      INNER JOIN comunidade_tags ct ON ct.id = cmt.tag_id
      WHERE cm.comunidade_id = ?
        AND cm.status = 'aprovado'
        AND ct.nome IN (${config.managerTags.map(() => "?").join(",")})
        AND cm.user_id <> ?
    `,
    [communityId, ...config.managerTags, senderId],
  );
  return Array.from(
    new Set((rows as any[]).map(item => String(item.user_id || "")).filter(Boolean)),
  );
}

function buildNotificationMessage(senderName: string, message: string) {
  const clean = String(message).replace(/\s+/g, " ").trim();
  const preview = clean.length > 75 ? `${clean.slice(0, 72)}...` : clean;
  return `${senderName}: ${preview}`;
}

export async function listRequestChat(params: LoadRequestChatParams) {
  await ensureRequestChatTable();
  const requestRow = await loadRequest(params);
  await ensureChatAccess(params, requestRow);

  const status = String(requestRow.status || "pendente");
  const enabled = status === "concluida";

  const [rows] = await db.query(
    `
      SELECT id, solicitacao_id, tipo, user_id, user_nome, role_label, mensagem, created_at
      FROM solicitacoes_chat_mensagens
      WHERE comunidade_id = ? AND tipo = ? AND solicitacao_id = ?
      ORDER BY created_at ASC
      LIMIT 200
    `,
    [params.communityId, params.kind, params.requestId],
  );

  return {
    enabled,
    status,
    requestOwnerId: requestRow.user_id,
    assignedManagerId: requestRow.respondido_por ?? undefined,
    messages: enabled ? (rows as any[]).map(mapMessage) : [],
  };
}

export async function postRequestChatMessage(params: PostRequestChatParams) {
  const text = String(params.message || "").trim();
  if (!text) throw new RequestChatError("Digite uma mensagem para enviar.");
  if (text.length > 1200) throw new RequestChatError("A mensagem deve ter no máximo 1200 caracteres.");

  await ensureRequestChatTable();
  const requestRow = await loadRequest(params);
  await ensureChatAccess(params, requestRow);

  const status = String(requestRow.status || "pendente");
  if (status !== "concluida") {
    throw new RequestChatError(
      "Mini chat liberado quando o treino/cardápio estiver concluído.",
      409,
    );
  }

  const tags = await getCommunityUserTags(params.communityId, params.userId);
  const roleLabel = tags.length > 0 ? getHighestTag(tags) : undefined;
  const senderName = String(params.userName || "").trim() || String(requestRow.aluno_nome || "Membro");
  const messageId = randomUUID();

  await db.query(
    `
      INSERT INTO solicitacoes_chat_mensagens
        (id, comunidade_id, tipo, solicitacao_id, user_id, user_nome, role_label, mensagem)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      messageId,
      params.communityId,
      params.kind,
      params.requestId,
      params.userId,
      senderName,
      roleLabel ?? null,
      text,
    ],
  );

  const recipients = new Set<string>();
  const senderIsOwner = String(requestRow.user_id) === String(params.userId);

  if (senderIsOwner) {
    if (requestRow.respondido_por && String(requestRow.respondido_por) !== String(params.userId)) {
      recipients.add(String(requestRow.respondido_por));
    } else {
      const managers = await loadManagerRecipients(params.kind, params.communityId, params.userId);
      managers.forEach(id => recipients.add(id));
    }
  } else if (String(requestRow.user_id) !== String(params.userId)) {
    recipients.add(String(requestRow.user_id));
  }

  const notifConfig = KIND_CONFIG[params.kind];
  const notifMessage = buildNotificationMessage(senderName, text);
  for (const targetUserId of recipients) {
    await criarNotificacao({
      userId: targetUserId,
      comunidadeId: params.communityId,
      tipo: notifConfig.notifType,
      titulo: notifConfig.notifTitle,
      mensagem: notifMessage,
      payload: {
        requestId: params.requestId,
        tab: notifConfig.notifTargetTab,
      },
    });
  }

  return {
    id: messageId,
    requestId: params.requestId,
    kind: params.kind,
    userId: params.userId,
    userName: senderName,
    roleLabel,
    message: text,
    createdAt: new Date().toISOString(),
  };
}
