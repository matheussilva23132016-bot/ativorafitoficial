import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export const BOSS_OWNER_NICKNAME = "teteuziin555";
export const BOSS_OWNER_EMAIL = "matheussilva23132016@gmail.com";

export type BossPermission =
  | "can_create_users"
  | "can_ban_users"
  | "can_grant_access"
  | "can_run_sql"
  | "can_manage_app"
  | "can_moderate_content"
  | "can_send_broadcast"
  | "can_view_audit";

export type BossAccess = {
  id: string;
  userId: string;
  nickname: string;
  level: "owner" | "admin" | "moderador";
  canCreateUsers: boolean;
  canBanUsers: boolean;
  canGrantAccess: boolean;
  canRunSql: boolean;
  canManageApp: boolean;
  canModerateContent: boolean;
  canSendBroadcast: boolean;
  canViewAudit: boolean;
};

export class BossAccessError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = "BossAccessError";
    this.status = status;
  }
}

const normalizeNickname = (value: unknown) =>
  String(value || "").trim().replace(/^@/, "").toLowerCase();

async function resolveSessionIdentity(user: any) {
  let userId = String(user?.id || "").trim();
  let nickname = normalizeNickname(user?.nickname);
  let email = String(user?.email || "").trim().toLowerCase();
  const nameFallback = normalizeNickname(user?.name);

  const conditions: string[] = [];
  const params: string[] = [];

  if (userId) {
    conditions.push("id = ?");
    params.push(userId);
  }

  if (email) {
    conditions.push("LOWER(email) = LOWER(?)");
    params.push(email);
  }

  if (nickname) {
    conditions.push("LOWER(nickname) = LOWER(?)");
    params.push(nickname);
  }

  if (conditions.length) {
    const [rows]: any = await db.execute(
      `SELECT id, nickname, email
       FROM ativora_users
       WHERE ${conditions.join(" OR ")}
       LIMIT 1`,
      params,
    );

    const row = rows?.[0];
    if (row) {
      userId = String(row.id || userId);
      nickname = normalizeNickname(row.nickname || nickname);
      email = String(row.email || email).trim().toLowerCase();
    }
  }

  return {
    userId,
    nickname: nickname || nameFallback,
    email,
  };
}

async function addBossColumnIfMissing(column: string, definition: string) {
  const [rows]: any = await db.execute(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'boss_access'
       AND COLUMN_NAME = ?`,
    [column],
  );

  if (Number(rows?.[0]?.total || 0) === 0) {
    await db.execute(`ALTER TABLE boss_access ADD COLUMN ${definition}`);
  }
}

export async function ensureBossTables() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS boss_access (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      user_id VARCHAR(191) NULL,
      nickname VARCHAR(120) NOT NULL,
      nivel ENUM('owner','admin','moderador') NOT NULL DEFAULT 'admin',
      can_create_users TINYINT(1) NOT NULL DEFAULT 0,
      can_ban_users TINYINT(1) NOT NULL DEFAULT 0,
      can_grant_access TINYINT(1) NOT NULL DEFAULT 0,
      can_run_sql TINYINT(1) NOT NULL DEFAULT 0,
      can_manage_app TINYINT(1) NOT NULL DEFAULT 0,
      can_moderate_content TINYINT(1) NOT NULL DEFAULT 0,
      can_send_broadcast TINYINT(1) NOT NULL DEFAULT 0,
      can_view_audit TINYINT(1) NOT NULL DEFAULT 0,
      granted_by VARCHAR(191) NULL,
      active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_boss_access_user (user_id),
      UNIQUE KEY uq_boss_access_nickname (nickname),
      INDEX idx_boss_access_active (active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await addBossColumnIfMissing("can_run_sql", "can_run_sql TINYINT(1) NOT NULL DEFAULT 0 AFTER can_grant_access");
  await addBossColumnIfMissing("can_manage_app", "can_manage_app TINYINT(1) NOT NULL DEFAULT 0 AFTER can_run_sql");
  await addBossColumnIfMissing("can_moderate_content", "can_moderate_content TINYINT(1) NOT NULL DEFAULT 0 AFTER can_manage_app");
  await addBossColumnIfMissing("can_send_broadcast", "can_send_broadcast TINYINT(1) NOT NULL DEFAULT 0 AFTER can_moderate_content");
  await addBossColumnIfMissing("can_view_audit", "can_view_audit TINYINT(1) NOT NULL DEFAULT 0 AFTER can_send_broadcast");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS boss_bans (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      target_user_id VARCHAR(191) NULL,
      target_nickname VARCHAR(120) NULL,
      scope ENUM('app','social','comunidades','treinos','nutricao') NOT NULL DEFAULT 'app',
      reason VARCHAR(500) NULL,
      status ENUM('active','revoked') NOT NULL DEFAULT 'active',
      banned_by VARCHAR(191) NOT NULL,
      revoked_by VARCHAR(191) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      revoked_at DATETIME NULL,
      INDEX idx_boss_bans_target (target_user_id),
      INDEX idx_boss_bans_scope_status (scope, status),
      INDEX idx_boss_bans_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS boss_audit_log (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      actor_user_id VARCHAR(191) NOT NULL,
      actor_nickname VARCHAR(120) NULL,
      action VARCHAR(80) NOT NULL,
      target_user_id VARCHAR(191) NULL,
      target_nickname VARCHAR(120) NULL,
      details_json LONGTEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_boss_audit_actor (actor_user_id),
      INDEX idx_boss_audit_target (target_user_id),
      INDEX idx_boss_audit_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS boss_app_settings (
      setting_key VARCHAR(100) NOT NULL PRIMARY KEY,
      setting_value LONGTEXT NULL,
      setting_type ENUM('text','boolean','json','number') NOT NULL DEFAULT 'text',
      label VARCHAR(160) NOT NULL,
      description VARCHAR(500) NULL,
      updated_by VARCHAR(191) NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

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

  await db.execute(`
    INSERT INTO boss_app_settings
      (setting_key, setting_value, setting_type, label, description)
    VALUES
      ('beta_mode', 'true', 'boolean', 'Modo beta', 'Controla se o app deve se comunicar como uma versão beta.'),
      ('maintenance_mode', 'false', 'boolean', 'Modo manutenção', 'Reservado para bloquear funcionalidades durante manutenção planejada.'),
      ('boss_panel_enabled', 'true', 'boolean', 'Painel Boss', 'Permite manter o painel administrativo ativo.'),
      ('support_whatsapp', '', 'text', 'WhatsApp de suporte', 'Contato oficial exibido em áreas de ajuda futuramente.'),
      ('release_notes', 'Beta interna AtivoraFit.', 'text', 'Notas da versão', 'Resumo editável da versão atual do app.')
    ON DUPLICATE KEY UPDATE setting_key = VALUES(setting_key)
  `);
}

async function bootstrapOwner(userId: string, nickname: string, email?: string) {
  const isOwner =
    normalizeNickname(nickname) === BOSS_OWNER_NICKNAME ||
    String(email || "").trim().toLowerCase() === BOSS_OWNER_EMAIL;

  if (!isOwner) return;

  const ownerNickname = normalizeNickname(nickname) || BOSS_OWNER_NICKNAME;

  await db.execute(
    `INSERT INTO boss_access
      (id, user_id, nickname, nivel, can_create_users, can_ban_users, can_grant_access, can_run_sql, can_manage_app, can_moderate_content, can_send_broadcast, can_view_audit, granted_by, active)
     VALUES (UUID(), ?, ?, 'owner', 1, 1, 1, 1, 1, 1, 1, 1, 'system', 1)
     ON DUPLICATE KEY UPDATE
      user_id = VALUES(user_id),
      nickname = VALUES(nickname),
      nivel = 'owner',
      can_create_users = 1,
      can_ban_users = 1,
      can_grant_access = 1,
      can_run_sql = 1,
      can_manage_app = 1,
      can_moderate_content = 1,
      can_send_broadcast = 1,
      can_view_audit = 1,
      active = 1`,
    [userId, ownerNickname],
  );
}

export async function getBossAccess(): Promise<BossAccess | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.id && !user?.nickname && !user?.email && !user?.name) return null;

  await ensureBossTables();

  const { userId, nickname, email } = await resolveSessionIdentity(user);

  if (userId && (nickname || email)) {
    await bootstrapOwner(userId, nickname, email);
  }

  const [rows]: any = await db.execute(
    `SELECT
      id,
      user_id,
      nickname,
      nivel,
      can_create_users,
      can_ban_users,
      can_grant_access,
      can_run_sql,
      can_manage_app,
      can_moderate_content,
      can_send_broadcast,
      can_view_audit
     FROM boss_access
     WHERE active = 1
       AND (
        user_id = ?
        OR LOWER(nickname) = LOWER(?)
       )
     LIMIT 1`,
    [userId, nickname],
  );

  const row = rows?.[0];
  if (!row) return null;

  return {
    id: String(row.id),
    userId,
    nickname: String(row.nickname || nickname),
    level: row.nivel || "admin",
    canCreateUsers: row.can_create_users === 1 || row.can_create_users === true,
    canBanUsers: row.can_ban_users === 1 || row.can_ban_users === true,
    canGrantAccess: row.can_grant_access === 1 || row.can_grant_access === true,
    canRunSql: row.can_run_sql === 1 || row.can_run_sql === true,
    canManageApp: row.can_manage_app === 1 || row.can_manage_app === true,
    canModerateContent: row.can_moderate_content === 1 || row.can_moderate_content === true,
    canSendBroadcast: row.can_send_broadcast === 1 || row.can_send_broadcast === true,
    canViewAudit: row.can_view_audit === 1 || row.can_view_audit === true,
  };
}

export async function requireBossAccess(permission?: BossPermission) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const access = await getBossAccess();

  if (!user?.id && !access?.userId) {
    throw new BossAccessError("Sessão obrigatória.", 401);
  }

  if (!access) {
    throw new BossAccessError("Você não tem acesso ao Painel Boss.", 403);
  }

  const allowed =
    !permission ||
    access.level === "owner" ||
    (permission === "can_create_users" && access.canCreateUsers) ||
    (permission === "can_ban_users" && access.canBanUsers) ||
    (permission === "can_grant_access" && access.canGrantAccess) ||
    (permission === "can_run_sql" && access.canRunSql) ||
    (permission === "can_manage_app" && access.canManageApp) ||
    (permission === "can_moderate_content" && access.canModerateContent) ||
    (permission === "can_send_broadcast" && access.canSendBroadcast) ||
    (permission === "can_view_audit" && access.canViewAudit);

  if (!allowed) {
    throw new BossAccessError("Seu acesso Boss não permite esta ação.", 403);
  }

  return {
    session,
    user: {
      ...user,
      id: user?.id || access.userId,
      nickname: user?.nickname || access.nickname,
    },
    access,
  };
}

export async function writeBossAudit(input: {
  actorUserId: string;
  actorNickname?: string | null;
  action: string;
  targetUserId?: string | null;
  targetNickname?: string | null;
  details?: unknown;
}) {
  await db.execute(
    `INSERT INTO boss_audit_log
      (id, actor_user_id, actor_nickname, action, target_user_id, target_nickname, details_json)
     VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
    [
      input.actorUserId,
      input.actorNickname || null,
      input.action,
      input.targetUserId || null,
      input.targetNickname || null,
      input.details ? JSON.stringify(input.details) : null,
    ],
  );
}
