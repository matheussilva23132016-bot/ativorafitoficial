-- AtivoraFit - SQL complementar do dashboard principal
-- Banco: MySQL/phpMyAdmin
-- Data: 2026-04-15
--
-- Objetivo:
-- 1. Garantir a tabela usada pela aba Sugestoes do dashboard.
-- 2. Evitar depender do CREATE TABLE automatico da API em producao.
--
-- Observacao:
-- As outras tabelas usadas pelo dashboard principal ja aparecem no schema/docs atuais:
-- ativora_users, notificacoes, notificacoes_comunidade, treinos,
-- exercicios_treino e treino_execucoes.

CREATE TABLE IF NOT EXISTS beta_sugestoes (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(191) NULL,
  nickname VARCHAR(120) NULL,
  categoria VARCHAR(40) NOT NULL,
  impacto VARCHAR(30) NOT NULL,
  contexto VARCHAR(180) NULL,
  mensagem TEXT NOT NULL,
  dispositivo VARCHAR(40) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'recebida',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_beta_sugestoes_user (user_id),
  INDEX idx_beta_sugestoes_status (status),
  INDEX idx_beta_sugestoes_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
