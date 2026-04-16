-- Ativora Comunidades - Aba Avisos
-- Banco: MySQL/phpMyAdmin
-- Data: 2026-04-15
--
-- O app cria estas tabelas automaticamente quando a aba Avisos for usada.
-- Para producao, rode este arquivo uma vez no phpMyAdmin.
-- Sem FOREIGN KEY de proposito, para evitar erro 150 em bancos com collations legadas.

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
