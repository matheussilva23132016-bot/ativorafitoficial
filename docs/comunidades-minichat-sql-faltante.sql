-- SQL faltante para o mini-chat de solicitacoes (treino e nutricao)
-- Contexto: o app cria essa tabela sob demanda em runtime, mas para beta/producao
-- e recomendavel provisionar antecipadamente.

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

