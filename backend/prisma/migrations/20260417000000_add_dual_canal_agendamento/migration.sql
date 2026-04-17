-- Adiciona campos dual-canal na tabela agendamentos
ALTER TABLE `agendamentos`
  ADD COLUMN `canal_origem` ENUM('manual', 'web', 'whatsapp') NOT NULL DEFAULT 'manual',
  ADD COLUMN `cliente_nome` VARCHAR(150) NULL,
  ADD COLUMN `cliente_telefone` VARCHAR(20) NULL,
  ADD COLUMN `lembrete_enviado` BOOLEAN NOT NULL DEFAULT false;

-- Índices para agendamentos
CREATE INDEX `agendamentos_data_status_idx` ON `agendamentos`(`data`, `status`);
CREATE INDEX `agendamentos_lembrete_enviado_status_idx` ON `agendamentos`(`lembrete_enviado`, `status`);

-- Tabela de configuração de agenda por tenant
CREATE TABLE `configuracoes_agenda` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `tenant_id` INTEGER NOT NULL,
  `horario_inicio` VARCHAR(5) NOT NULL DEFAULT '08:00',
  `horario_fim` VARCHAR(5) NOT NULL DEFAULT '18:00',
  `duracao_slot` INTEGER NOT NULL DEFAULT 60,
  `dias_uteis` VARCHAR(20) NOT NULL DEFAULT '1,2,3,4,5',
  `antecedencia_min` INTEGER NOT NULL DEFAULT 2,
  `antecedencia_max` INTEGER NOT NULL DEFAULT 30,
  `mensagem_confirmacao` TEXT NULL,
  `whatsapp_admin` VARCHAR(20) NULL,
  `ativo` BOOLEAN NOT NULL DEFAULT true,

  UNIQUE INDEX `configuracoes_agenda_tenant_id_key`(`tenant_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- FK configuracoes_agenda → tenants
ALTER TABLE `configuracoes_agenda`
  ADD CONSTRAINT `configuracoes_agenda_tenant_id_fkey`
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Tabela de conversas whatsapp (estado do bot)
CREATE TABLE `conversas_whatsapp` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `tenant_id` INTEGER NOT NULL,
  `telefone` VARCHAR(20) NOT NULL,
  `estado` ENUM('inicio','aguardando_data','aguardando_slot','aguardando_nome','aguardando_confirmacao','concluida','cancelada') NOT NULL DEFAULT 'inicio',
  `dados_json` JSON NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `conversas_whatsapp_telefone_tenant_id_key`(`telefone`, `tenant_id`),
  INDEX `conversas_whatsapp_expires_at_idx`(`expires_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- FK conversas_whatsapp → tenants
ALTER TABLE `conversas_whatsapp`
  ADD CONSTRAINT `conversas_whatsapp_tenant_id_fkey`
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
