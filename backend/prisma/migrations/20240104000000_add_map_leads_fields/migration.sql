-- ================================================================
-- Migration: Campos Google Maps + funil completo nos leads
-- Segura: apenas ADD COLUMN (nullable) e MODIFY para enums
-- Dados existentes são preservados integralmente
-- ================================================================

-- 1. Novos status no enum StatusLead (preserva valores existentes)
ALTER TABLE `leads`
  MODIFY COLUMN `status` ENUM('novo','contato','qualificado','proposta','agendado','convertido','perdido')
  NOT NULL DEFAULT 'novo';

-- 2. Novos campos de dados do lead
ALTER TABLE `leads`
  ADD COLUMN `telefone2`      VARCHAR(20)   NULL          AFTER `telefone`,
  ADD COLUMN `website`        VARCHAR(500)  NULL          AFTER `email`,
  ADD COLUMN `priority`       ENUM('baixa','normal','alta','urgente') NOT NULL DEFAULT 'normal' AFTER `status`,
  ADD COLUMN `fonte`          ENUM('google_maps','manual','csv_import','api') NOT NULL DEFAULT 'manual' AFTER `priority`;

-- 3. Campo municipio (separado de cidade para Google Maps)
ALTER TABLE `leads`
  ADD COLUMN `municipio`      VARCHAR(100)  NULL          AFTER `cidade`;

-- 4. Campos Google Maps
ALTER TABLE `leads`
  ADD COLUMN `nicho`          VARCHAR(100)  NULL,
  ADD COLUMN `categoria`      VARCHAR(100)  NULL,
  ADD COLUMN `subcategoria`   VARCHAR(100)  NULL,
  ADD COLUMN `google_maps_url` VARCHAR(1000) NULL,
  ADD COLUMN `place_id`       VARCHAR(255)  NULL,
  ADD COLUMN `rating`         FLOAT         NULL,
  ADD COLUMN `reviews_count`  INT           NULL DEFAULT 0;

-- 5. Campos de funil
ALTER TABLE `leads`
  ADD COLUMN `ultimo_contato`  DATETIME     NULL,
  ADD COLUMN `proximo_contato` DATETIME     NULL;

-- 6. Índices para filtros de busca geográfica e nicho
CREATE INDEX `leads_nicho_idx`     ON `leads`(`nicho`);
CREATE INDEX `leads_estado_idx`    ON `leads`(`estado`);
CREATE INDEX `leads_municipio_idx` ON `leads`(`municipio`);
CREATE INDEX `leads_fonte_idx`     ON `leads`(`fonte`);
CREATE INDEX `leads_status_idx`    ON `leads`(`status`);

-- 7. Unique por place_id + tenant (evita duplicatas do Maps)
ALTER TABLE `leads`
  ADD CONSTRAINT `leads_place_id_tenant_unique`
  UNIQUE (`place_id`, `tenant_id`);
