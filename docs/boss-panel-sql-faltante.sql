-- AtivoraFit - Painel Boss
-- Banco: MySQL/phpMyAdmin
-- Data: 2026-04-15
--
-- Execute este SQL para deixar o Painel Boss pronto em producao.
-- Depois de executar, faca login novamente na conta @Teteuziin555.

-- Pre-requisito do cadastro pelo Boss:
-- garante que o painel consiga criar contas separadas de Personal e Instrutor.
ALTER TABLE ativora_users
  MODIFY role ENUM('aluno','personal','instrutor','nutri','influencer','adm') DEFAULT 'aluno';

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS boss_app_settings (
  setting_key VARCHAR(100) NOT NULL PRIMARY KEY,
  setting_value LONGTEXT NULL,
  setting_type ENUM('text','boolean','json','number') NOT NULL DEFAULT 'text',
  label VARCHAR(160) NOT NULL,
  description VARCHAR(500) NULL,
  updated_by VARCHAR(191) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO boss_app_settings
  (setting_key, setting_value, setting_type, label, description)
VALUES
  ('beta_mode', 'true', 'boolean', 'Modo beta', 'Controla se o app deve se comunicar como uma versao beta.'),
  ('maintenance_mode', 'false', 'boolean', 'Modo manutencao', 'Reservado para bloquear funcionalidades durante manutencao planejada.'),
  ('boss_panel_enabled', 'true', 'boolean', 'Painel Boss', 'Permite manter o painel administrativo ativo.'),
  ('support_whatsapp', '', 'text', 'WhatsApp de suporte', 'Contato oficial exibido em areas de ajuda futuramente.'),
  ('release_notes', 'Beta interna AtivoraFit.', 'text', 'Notas da versao', 'Resumo editavel da versao atual do app.')
ON DUPLICATE KEY UPDATE setting_key = VALUES(setting_key);

-- Libera o Painel Boss para a conta @Teteuziin555 ou para o e-mail fundador.
-- Se a conta ainda nao existir, crie a conta primeiro e rode este bloco novamente.
INSERT INTO boss_access (
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
  can_view_audit,
  granted_by,
  active
)
SELECT
  UUID(),
  id,
  LOWER(nickname),
  'owner',
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  'system',
  1
FROM ativora_users
WHERE LOWER(nickname) = 'teteuziin555'
   OR LOWER(email) = 'matheussilva23132016@gmail.com'
LIMIT 1
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
  active = 1;

-- Se voce ja executou uma versao anterior deste arquivo e a coluna ainda nao existir,
-- o app tenta criar automaticamente ao abrir o Painel Boss.
-- Caso queira aplicar manualmente no phpMyAdmin, rode apenas uma vez:
-- ALTER TABLE boss_access ADD COLUMN can_run_sql TINYINT(1) NOT NULL DEFAULT 0 AFTER can_grant_access;
-- ALTER TABLE boss_access ADD COLUMN can_manage_app TINYINT(1) NOT NULL DEFAULT 0 AFTER can_run_sql;
-- ALTER TABLE boss_access ADD COLUMN can_moderate_content TINYINT(1) NOT NULL DEFAULT 0 AFTER can_manage_app;
-- ALTER TABLE boss_access ADD COLUMN can_send_broadcast TINYINT(1) NOT NULL DEFAULT 0 AFTER can_moderate_content;
-- ALTER TABLE boss_access ADD COLUMN can_view_audit TINYINT(1) NOT NULL DEFAULT 0 AFTER can_send_broadcast;
