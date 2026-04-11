-- Criar tabela de tenants
CREATE TABLE `tenants` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(50) NOT NULL,
  `logo` VARCHAR(500) NULL,
  `cor_primaria` VARCHAR(7) NOT NULL DEFAULT '#2563eb',
  `plano` ENUM('basico', 'pro', 'premium') NOT NULL DEFAULT 'basico',
  `modulos` JSON NOT NULL,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `tenants_slug_key`(`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Adicionar tenant_id e role em users (nullable primeiro)
ALTER TABLE `users`
  ADD COLUMN `tenant_id` INTEGER NULL,
  ADD COLUMN `role` ENUM('super_admin', 'admin', 'atendente') NOT NULL DEFAULT 'atendente',
  ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true;

-- Remover unique de email (vai virar unique por email+tenant)
ALTER TABLE `users` DROP INDEX `users_email_key`;

-- Adicionar tenant_id em leads e agendamentos (nullable primeiro)
ALTER TABLE `leads` ADD COLUMN `tenant_id` INTEGER NULL;
ALTER TABLE `agendamentos` ADD COLUMN `tenant_id` INTEGER NULL;

-- Inserir tenant padrão para dados existentes
INSERT INTO `tenants` (`nome`, `slug`, `cor_primaria`, `plano`, `modulos`)
VALUES ('Demo', 'demo', '#2563eb', 'pro', '["leads","agendamentos"]');

-- Associar dados existentes ao tenant padrão
UPDATE `users` SET `tenant_id` = 1, `role` = 'admin' WHERE `tenant_id` IS NULL;
UPDATE `leads` SET `tenant_id` = 1 WHERE `tenant_id` IS NULL;
UPDATE `agendamentos` SET `tenant_id` = 1 WHERE `tenant_id` IS NULL;

-- Tornar tenant_id NOT NULL em leads e agendamentos
ALTER TABLE `leads` MODIFY `tenant_id` INTEGER NOT NULL;
ALTER TABLE `agendamentos` MODIFY `tenant_id` INTEGER NOT NULL;

-- Adicionar índice único email+tenant em users
CREATE UNIQUE INDEX `users_email_tenant_key` ON `users`(`email`, `tenant_id`);

-- Foreign keys
ALTER TABLE `users` ADD CONSTRAINT `users_tenant_id_fkey`
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `leads` ADD CONSTRAINT `leads_tenant_id_fkey`
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `agendamentos` ADD CONSTRAINT `agendamentos_tenant_id_fkey`
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
