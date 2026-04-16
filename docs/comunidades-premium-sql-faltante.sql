-- Ativora Comunidades Premium - SQL complementar
-- Banco: MySQL/phpMyAdmin
-- Observacao: antes de executar ALTER TABLE, confira se a coluna ja existe.
-- Algumas hospedagens nao aceitam ADD COLUMN IF NOT EXISTS.

-- 1) Comunidade: regras, configuracoes e permissoes granulares
CREATE TABLE IF NOT EXISTS comunidade_regras (
  id VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT uuid(),
  comunidade_id VARCHAR(36) NOT NULL,
  titulo VARCHAR(120) NOT NULL,
  descricao TEXT NOT NULL,
  ordem TINYINT NOT NULL DEFAULT 1,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_comunidade (comunidade_id),
  CONSTRAINT fk_comunidade_regras_comunidade
    FOREIGN KEY (comunidade_id) REFERENCES comunidades(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS comunidade_configuracoes (
  comunidade_id VARCHAR(36) NOT NULL PRIMARY KEY,
  entrada_por_solicitacao TINYINT(1) NOT NULL DEFAULT 1,
  adm_pode_aprovar_membros TINYINT(1) NOT NULL DEFAULT 1,
  adm_pode_criar_desafios TINYINT(1) NOT NULL DEFAULT 1,
  adm_pode_avaliar_desafios TINYINT(1) NOT NULL DEFAULT 1,
  adm_pode_editar_treinos TINYINT(1) NOT NULL DEFAULT 0,
  adm_pode_editar_nutricao TINYINT(1) NOT NULL DEFAULT 0,
  xp_treino_concluido INT NOT NULL DEFAULT 10,
  xp_refeicao_dia_concluida INT NOT NULL DEFAULT 0,
  ranking_fecha_dia ENUM('domingo','segunda') NOT NULL DEFAULT 'domingo',
  ranking_fecha_hora TIME NOT NULL DEFAULT '23:59:00',
  timezone VARCHAR(60) NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_comunidade_config_comunidade
    FOREIGN KEY (comunidade_id) REFERENCES comunidades(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS comunidade_permissoes_tag (
  id VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT uuid(),
  comunidade_id VARCHAR(36) NOT NULL,
  tag_id VARCHAR(36) NOT NULL,
  permissao VARCHAR(80) NOT NULL,
  permitido TINYINT(1) NOT NULL DEFAULT 1,
  definido_por VARCHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tag_permissao (tag_id, permissao),
  INDEX idx_comunidade (comunidade_id),
  CONSTRAINT fk_perm_tag_comunidade
    FOREIGN KEY (comunidade_id) REFERENCES comunidades(id) ON DELETE CASCADE,
  CONSTRAINT fk_perm_tag_tag
    FOREIGN KEY (tag_id) REFERENCES comunidade_tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- 2) Tags: flexibilidade real e historico
ALTER TABLE comunidade_tags
  ADD UNIQUE KEY uq_comunidade_tag_nome (comunidade_id, nome);

CREATE TABLE IF NOT EXISTS comunidade_tag_historico (
  id VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT uuid(),
  comunidade_id VARCHAR(36) NOT NULL,
  membro_id VARCHAR(36) NOT NULL,
  tag_id VARCHAR(36) NOT NULL,
  acao ENUM('add','remove') NOT NULL,
  realizado_por VARCHAR(36) NOT NULL,
  motivo VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_membro (membro_id),
  INDEX idx_comunidade (comunidade_id),
  CONSTRAINT fk_tag_hist_comunidade
    FOREIGN KEY (comunidade_id) REFERENCES comunidades(id) ON DELETE CASCADE,
  CONSTRAINT fk_tag_hist_membro
    FOREIGN KEY (membro_id) REFERENCES comunidade_membros(id) ON DELETE CASCADE,
  CONSTRAINT fk_tag_hist_tag
    FOREIGN KEY (tag_id) REFERENCES comunidade_tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- 3) Treinos: preservar documento real, grupos e links externos
ALTER TABLE treinos
  ADD COLUMN dia_rotulo VARCHAR(60) NULL AFTER dia_semana,
  ADD COLUMN grupo_alvo_id VARCHAR(36) NULL AFTER alvo_user_id,
  ADD COLUMN publicado_em DATETIME NULL AFTER ia_revisado,
  ADD COLUMN removido_em DATETIME NULL AFTER publicado_em;

ALTER TABLE exercicios_treino
  ADD COLUMN grupo_nome VARCHAR(100) NULL AFTER treino_id,
  ADD COLUMN ordem_grupo TINYINT NOT NULL DEFAULT 1 AFTER grupo_nome,
  ADD COLUMN link_externo VARCHAR(500) NULL AFTER video_url,
  ADD COLUMN video_asset_id VARCHAR(36) NULL AFTER link_externo;

-- 4) Nutricao: preservar dia importado e dados de publicacao
ALTER TABLE cardapios
  ADD COLUMN publicado_em DATETIME NULL AFTER ia_revisado,
  ADD COLUMN removido_em DATETIME NULL AFTER publicado_em;

ALTER TABLE refeicoes_cardapio
  ADD COLUMN dia_rotulo VARCHAR(60) NULL AFTER dia_semana,
  ADD COLUMN alimentos_json LONGTEXT NULL AFTER alimentos;

-- 5) Solicitacoes: mais contexto para IA e atendimento online
ALTER TABLE solicitacoes_nutricionais
  ADD COLUMN preferencias LONGTEXT NULL AFTER restricoes,
  ADD COLUMN sexo VARCHAR(20) NULL AFTER medida_id,
  ADD COLUMN nivel_atividade VARCHAR(50) NULL AFTER sexo,
  ADD COLUMN dados_ia LONGTEXT NULL AFTER obs;

ALTER TABLE solicitacoes_treino
  ADD COLUMN preferencias LONGTEXT NULL AFTER restricoes,
  ADD COLUMN lesoes LONGTEXT NULL AFTER preferencias,
  ADD COLUMN dados_ia LONGTEXT NULL AFTER obs;

-- 6) Medidas corporais: responsabilidade e revisao profissional
ALTER TABLE medidas_corporais
  ADD COLUMN fonte ENUM('aluno','profissional','importado') NOT NULL DEFAULT 'aluno' AFTER metodo_calculo,
  ADD COLUMN disclaimer_aceito TINYINT(1) NOT NULL DEFAULT 0 AFTER fonte,
  ADD COLUMN revisado_por VARCHAR(36) NULL AFTER disclaimer_aceito,
  ADD COLUMN revisado_em DATETIME NULL AFTER revisado_por;

-- 7) Desafios: criterio, aprovador e historico de eventos
ALTER TABLE desafios
  ADD COLUMN criterio_avaliacao TEXT NULL AFTER instrucoes,
  ADD COLUMN aprovador_responsavel VARCHAR(36) NULL AFTER criterio_avaliacao,
  ADD COLUMN xp_bonus INT NOT NULL DEFAULT 0 AFTER xp_recompensa;

CREATE TABLE IF NOT EXISTS desafio_entrega_eventos (
  id VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT uuid(),
  entrega_id VARCHAR(36) NOT NULL,
  status_anterior VARCHAR(30) NULL,
  status_novo VARCHAR(30) NOT NULL,
  comentario TEXT NULL,
  realizado_por VARCHAR(36) NOT NULL,
  xp_aplicado INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entrega (entrega_id),
  CONSTRAINT fk_entrega_eventos_entrega
    FOREIGN KEY (entrega_id) REFERENCES entregas_desafios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS desafio_entrega_arquivos (
  id VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT uuid(),
  entrega_id VARCHAR(36) NOT NULL,
  arquivo_url VARCHAR(700) NOT NULL,
  mime_type VARCHAR(120) NULL,
  nome_original VARCHAR(255) NULL,
  tamanho_bytes INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entrega (entrega_id),
  CONSTRAINT fk_entrega_arquivos_entrega
    FOREIGN KEY (entrega_id) REFERENCES entregas_desafios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- 8) Ranking: snapshot, desempate e fechamento semanal
ALTER TABLE ranking_semanal
  ADD COLUMN reprovacoes INT NOT NULL DEFAULT 0 AFTER desafios_total,
  ADD COLUMN ultima_aprovacao_em DATETIME NULL AFTER reprovacoes,
  ADD COLUMN fechado TINYINT(1) NOT NULL DEFAULT 0 AFTER vencedor;

CREATE TABLE IF NOT EXISTS ranking_fechamentos_semanais (
  id VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT uuid(),
  comunidade_id VARCHAR(36) NOT NULL,
  semana_inicio DATE NOT NULL,
  semana_fim DATE NOT NULL,
  fechado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  vencedor_user_id VARCHAR(36) NULL,
  total_participantes INT NOT NULL DEFAULT 0,
  snapshot_json LONGTEXT NOT NULL,
  UNIQUE KEY uq_fechamento (comunidade_id, semana_inicio),
  INDEX idx_comunidade_semana (comunidade_id, semana_inicio),
  CONSTRAINT fk_ranking_fechamento_comunidade
    FOREIGN KEY (comunidade_id) REFERENCES comunidades(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- 9) Selos: evitar duplicidade e preparar selos por comunidade
ALTER TABLE selos
  ADD COLUMN comunidade_id VARCHAR(36) NULL AFTER id,
  ADD COLUMN escopo ENUM('global','comunidade') NOT NULL DEFAULT 'global' AFTER comunidade_id,
  ADD KEY idx_selos_comunidade (comunidade_id);

ALTER TABLE usuario_selos
  ADD UNIQUE KEY uq_usuario_selo_semana (user_id, comunidade_id, selo_id, semana_ref);

-- 10) Notificacoes: segmentacao e navegacao
ALTER TABLE notificacoes_comunidade
  ADD COLUMN target_tag VARCHAR(50) NULL AFTER user_id,
  ADD COLUMN action_url VARCHAR(500) NULL AFTER payload,
  ADD COLUMN read_at DATETIME NULL AFTER lida,
  ADD KEY idx_tipo (tipo),
  ADD KEY idx_user_lida_created (user_id, lida, created_at);

-- 11) Arquivos gerais da comunidade
CREATE TABLE IF NOT EXISTS comunidade_arquivos (
  id VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT uuid(),
  comunidade_id VARCHAR(36) NOT NULL,
  owner_user_id VARCHAR(36) NOT NULL,
  contexto ENUM('treino','nutricao','desafio','capa','anuncio','documento') NOT NULL,
  referencia_id VARCHAR(36) NULL,
  arquivo_url VARCHAR(700) NOT NULL,
  mime_type VARCHAR(120) NULL,
  nome_original VARCHAR(255) NULL,
  tamanho_bytes INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_comunidade_contexto (comunidade_id, contexto),
  INDEX idx_referencia (referencia_id),
  CONSTRAINT fk_comunidade_arquivos_comunidade
    FOREIGN KEY (comunidade_id) REFERENCES comunidades(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- 12) Logs de IA: auditoria, custo e revisao humana
CREATE TABLE IF NOT EXISTS ia_execucoes (
  id VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT uuid(),
  comunidade_id VARCHAR(36) NULL,
  user_id VARCHAR(36) NOT NULL,
  contexto ENUM('treino','nutricao','document_import','substituicao_alimentar') NOT NULL,
  referencia_id VARCHAR(36) NULL,
  model VARCHAR(80) NOT NULL,
  prompt_hash VARCHAR(100) NULL,
  input_json LONGTEXT NULL,
  output_json LONGTEXT NULL,
  status ENUM('sucesso','erro','cancelado') NOT NULL DEFAULT 'sucesso',
  erro TEXT NULL,
  tokens_input INT NULL,
  tokens_output INT NULL,
  revisado_por VARCHAR(36) NULL,
  publicado TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_comunidade_contexto (comunidade_id, contexto),
  INDEX idx_user_created (user_id, created_at),
  CONSTRAINT fk_ia_execucoes_comunidade
    FOREIGN KEY (comunidade_id) REFERENCES comunidades(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- 13) Auditoria geral
CREATE TABLE IF NOT EXISTS comunidade_audit_log (
  id VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT uuid(),
  comunidade_id VARCHAR(36) NOT NULL,
  actor_user_id VARCHAR(36) NOT NULL,
  acao VARCHAR(80) NOT NULL,
  entidade VARCHAR(80) NOT NULL,
  entidade_id VARCHAR(36) NULL,
  antes_json LONGTEXT NULL,
  depois_json LONGTEXT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_comunidade_created (comunidade_id, created_at),
  INDEX idx_actor (actor_user_id),
  CONSTRAINT fk_audit_comunidade
    FOREIGN KEY (comunidade_id) REFERENCES comunidades(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;


