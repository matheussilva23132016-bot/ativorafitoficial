-- AtivoraFit - SQL complementar para login e recuperacao de senha
-- Banco: MySQL/phpMyAdmin
--
-- Execute se o login ou "esqueci minha senha" falhar por tabela/coluna ausente.
-- A tela de login usa ativora_users.email OU ativora_users.nickname + ativora_users.password_hash.

CREATE TABLE IF NOT EXISTS password_resets (
  id INT NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_password_resets_email_used (email, used),
  INDEX idx_password_resets_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CALL ativora_add_column_if_missing('ativora_users', 'password_hash', '`password_hash` VARCHAR(255) NULL');
CALL ativora_add_column_if_missing('ativora_users', 'account_status', '`account_status` VARCHAR(20) DEFAULT ''active''');
CALL ativora_add_column_if_missing('ativora_users', 'failed_login_attempts', '`failed_login_attempts` INT DEFAULT 0');
CALL ativora_add_column_if_missing('ativora_users', 'locked_until', '`locked_until` DATETIME NULL');
CALL ativora_add_column_if_missing('ativora_users', 'last_login_at', '`last_login_at` DATETIME NULL');

DROP PROCEDURE IF EXISTS ativora_add_column_if_missing;

-- Indices recomendados. Se acusar "Duplicate key name", significa que ja existe.
-- CREATE UNIQUE INDEX email ON ativora_users(email);
-- CREATE UNIQUE INDEX nickname ON ativora_users(nickname);
-- CREATE INDEX idx_ativora_users_account_status ON ativora_users(account_status);
