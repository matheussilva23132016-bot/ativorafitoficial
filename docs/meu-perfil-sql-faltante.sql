-- AtivoraFit - Meu Perfil Premium
-- Banco: MySQL/phpMyAdmin
-- Objetivo: complementar o dashboard principal com dados por cargo e avaliacoes opcionais.
-- Observacao: as APIs tambem tentam criar estas tabelas automaticamente, mas execute este SQL
-- no phpMyAdmin para deixar a producao preparada e visivel.

CREATE TABLE IF NOT EXISTS perfil_complementar (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'aluno',
  objetivo_principal VARCHAR(180) NULL,
  nivel VARCHAR(60) NULL,
  frequencia VARCHAR(80) NULL,
  restricoes TEXT NULL,
  disponibilidade TEXT NULL,
  preferencias_treino TEXT NULL,
  preferencias_nutricao TEXT NULL,
  privacidade_dados VARCHAR(30) NOT NULL DEFAULT 'privado',
  dados_cargo_json JSON NULL,
  progresso TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_perfil_complementar_user (user_id),
  INDEX idx_perfil_complementar_role (role),
  INDEX idx_perfil_complementar_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS perfil_avaliacoes (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  tipo VARCHAR(40) NOT NULL DEFAULT 'rapida',
  titulo VARCHAR(160) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'rascunho',
  data_avaliacao DATE NULL,
  data_reavaliacao DATE NULL,
  objetivo TEXT NULL,
  sexo VARCHAR(20) NULL,
  data_nascimento DATE NULL,
  parq_json JSON NULL,
  protocolo VARCHAR(140) NULL,
  percentual_gordura_informado DECIMAL(6,2) NULL,
  parecer_final TEXT NULL,
  observacoes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_perfil_avaliacoes_user (user_id),
  INDEX idx_perfil_avaliacoes_tipo (tipo),
  INDEX idx_perfil_avaliacoes_status (status),
  INDEX idx_perfil_avaliacoes_data (data_avaliacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS perfil_avaliacao_medidas (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  avaliacao_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  slug VARCHAR(90) NOT NULL,
  nome VARCHAR(160) NOT NULL,
  unidade VARCHAR(20) NOT NULL,
  rodada1 DECIMAL(10,2) NULL,
  rodada2 DECIMAL(10,2) NULL,
  rodada3 DECIMAL(10,2) NULL,
  mediana DECIMAL(10,2) NULL,
  erro_percentual DECIMAL(8,2) NULL,
  consistencia VARCHAR(40) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_perfil_medidas_avaliacao (avaliacao_id),
  INDEX idx_perfil_medidas_user (user_id),
  INDEX idx_perfil_medidas_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS perfil_avaliacao_resultados (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  avaliacao_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  metodo VARCHAR(120) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  unidade VARCHAR(30) NOT NULL,
  classificacao VARCHAR(120) NULL,
  observacao TEXT NULL,
  origem VARCHAR(30) NOT NULL DEFAULT 'calculado',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_perfil_resultados_avaliacao (avaliacao_id),
  INDEX idx_perfil_resultados_user (user_id),
  INDEX idx_perfil_resultados_metodo (metodo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
