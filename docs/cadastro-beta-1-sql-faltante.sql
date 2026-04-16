-- AtivoraFit Beta 1.0 - SQL complementar do cadastro inicial
-- Banco: MySQL/phpMyAdmin
--
-- Use este arquivo apenas se a tela inicial, selecao de perfil ou cadastro falhar
-- por coluna ausente na tabela ativora_users.
--
-- Importante:
-- 1. A tela atual cadastra usuarios na tabela ativora_users.
-- 2. O perfil "Personal Trainer" grava role = 'personal'.
-- 3. O perfil "Instrutor" grava role = 'instrutor'.
-- 4. O perfil "Nutricionista" grava role = 'nutri'.
-- 4. Se sua tabela ja segue o prisma/schema.prisma, nao ha SQL obrigatorio novo.

CREATE TABLE IF NOT EXISTS ativora_users (
  id VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  nickname VARCHAR(50) NULL,
  genero VARCHAR(20) NULL,
  data_nascimento DATE NULL,
  cidade_estado VARCHAR(100) NULL,
  interesses TEXT NULL,
  nivel VARCHAR(50) NULL,
  freq VARCHAR(50) NULL,
  peso VARCHAR(20) NULL,
  altura VARCHAR(20) NULL,
  registro VARCHAR(50) NULL,
  exp VARCHAR(50) NULL,
  modalidade VARCHAR(50) NULL,
  especialidade VARCHAR(100) NULL,
  seguidores VARCHAR(50) NULL,
  nicho VARCHAR(100) NULL,
  rede VARCHAR(50) NULL,
  role ENUM('aluno','personal','instrutor','nutri','influencer','adm') DEFAULT 'aluno',
  xp_score INT DEFAULT 0,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  account_status VARCHAR(20) DEFAULT 'active',
  avatar_url TEXT NULL,
  bio TEXT NULL,
  current_streak INT DEFAULT 0,
  descricao TEXT NULL,
  email_verified TINYINT(1) DEFAULT 0,
  external_link VARCHAR(255) NULL,
  failed_login_attempts INT DEFAULT 0,
  is_private TINYINT(1) DEFAULT 0,
  is_verified TINYINT(1) DEFAULT 0,
  last_post_date DATE NULL,
  nivel_int INT DEFAULT 1,
  xp INT DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY email (email),
  UNIQUE KEY nickname (nickname)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Helper seguro para hospedagens que nao aceitam ADD COLUMN IF NOT EXISTS.
DROP PROCEDURE IF EXISTS ativora_add_column_if_missing;

DELIMITER $$
CREATE PROCEDURE ativora_add_column_if_missing(
  IN p_table_name VARCHAR(64),
  IN p_column_name VARCHAR(64),
  IN p_column_definition TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND COLUMN_NAME = p_column_name
  ) THEN
    SET @ativora_sql = CONCAT('ALTER TABLE `', p_table_name, '` ADD COLUMN ', p_column_definition);
    PREPARE ativora_stmt FROM @ativora_sql;
    EXECUTE ativora_stmt;
    DEALLOCATE PREPARE ativora_stmt;
  END IF;
END$$
DELIMITER ;

-- Em tabelas ja existentes com usuarios, colunas novas entram como NULL para evitar erro.
-- Os novos cadastros feitos pelo app sempre gravam password_hash e full_name preenchidos.
CALL ativora_add_column_if_missing('ativora_users', 'password_hash', '`password_hash` VARCHAR(255) NULL');
CALL ativora_add_column_if_missing('ativora_users', 'full_name', '`full_name` VARCHAR(255) NULL');
CALL ativora_add_column_if_missing('ativora_users', 'nickname', '`nickname` VARCHAR(50) NULL');
CALL ativora_add_column_if_missing('ativora_users', 'genero', '`genero` VARCHAR(20) NULL');
CALL ativora_add_column_if_missing('ativora_users', 'data_nascimento', '`data_nascimento` DATE NULL');
CALL ativora_add_column_if_missing('ativora_users', 'cidade_estado', '`cidade_estado` VARCHAR(100) NULL');
CALL ativora_add_column_if_missing('ativora_users', 'interesses', '`interesses` TEXT NULL');
CALL ativora_add_column_if_missing('ativora_users', 'nivel', '`nivel` VARCHAR(50) NULL');
CALL ativora_add_column_if_missing('ativora_users', 'freq', '`freq` VARCHAR(50) NULL');
CALL ativora_add_column_if_missing('ativora_users', 'peso', '`peso` VARCHAR(20) NULL');
CALL ativora_add_column_if_missing('ativora_users', 'altura', '`altura` VARCHAR(20) NULL');
CALL ativora_add_column_if_missing('ativora_users', 'registro', '`registro` VARCHAR(50) NULL');
CALL ativora_add_column_if_missing('ativora_users', 'exp', '`exp` VARCHAR(50) NULL');
CALL ativora_add_column_if_missing('ativora_users', 'modalidade', '`modalidade` VARCHAR(50) NULL');
CALL ativora_add_column_if_missing('ativora_users', 'especialidade', '`especialidade` VARCHAR(100) NULL');
CALL ativora_add_column_if_missing('ativora_users', 'seguidores', '`seguidores` VARCHAR(50) NULL');
CALL ativora_add_column_if_missing('ativora_users', 'nicho', '`nicho` VARCHAR(100) NULL');
CALL ativora_add_column_if_missing('ativora_users', 'rede', '`rede` VARCHAR(50) NULL');
CALL ativora_add_column_if_missing('ativora_users', 'role', '`role` ENUM(''aluno'',''personal'',''instrutor'',''nutri'',''influencer'',''adm'') DEFAULT ''aluno''');
CALL ativora_add_column_if_missing('ativora_users', 'xp_score', '`xp_score` INT DEFAULT 0');
CALL ativora_add_column_if_missing('ativora_users', 'created_at', '`created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP');
CALL ativora_add_column_if_missing('ativora_users', 'account_status', '`account_status` VARCHAR(20) DEFAULT ''active''');
CALL ativora_add_column_if_missing('ativora_users', 'avatar_url', '`avatar_url` TEXT NULL');
CALL ativora_add_column_if_missing('ativora_users', 'bio', '`bio` TEXT NULL');
CALL ativora_add_column_if_missing('ativora_users', 'current_streak', '`current_streak` INT DEFAULT 0');
CALL ativora_add_column_if_missing('ativora_users', 'descricao', '`descricao` TEXT NULL');
CALL ativora_add_column_if_missing('ativora_users', 'email_verified', '`email_verified` TINYINT(1) DEFAULT 0');
CALL ativora_add_column_if_missing('ativora_users', 'external_link', '`external_link` VARCHAR(255) NULL');
CALL ativora_add_column_if_missing('ativora_users', 'failed_login_attempts', '`failed_login_attempts` INT DEFAULT 0');
CALL ativora_add_column_if_missing('ativora_users', 'is_private', '`is_private` TINYINT(1) DEFAULT 0');
CALL ativora_add_column_if_missing('ativora_users', 'is_verified', '`is_verified` TINYINT(1) DEFAULT 0');
CALL ativora_add_column_if_missing('ativora_users', 'last_post_date', '`last_post_date` DATE NULL');
CALL ativora_add_column_if_missing('ativora_users', 'nivel_int', '`nivel_int` INT DEFAULT 1');
CALL ativora_add_column_if_missing('ativora_users', 'xp', '`xp` INT DEFAULT 0');

DROP PROCEDURE IF EXISTS ativora_add_column_if_missing;

-- Ajuste do enum de perfil usado pela tela de cadastro.
ALTER TABLE ativora_users
  MODIFY role ENUM('aluno','personal','instrutor','nutri','influencer','adm') DEFAULT 'aluno';

-- Rode estes indices somente se ainda nao existirem.
-- Se o phpMyAdmin acusar "Duplicate key name", ignore: significa que ja existe.
-- CREATE UNIQUE INDEX email ON ativora_users(email);
-- CREATE UNIQUE INDEX nickname ON ativora_users(nickname);
