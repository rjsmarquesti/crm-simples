-- Campos de endereço nos leads
ALTER TABLE `leads`
  ADD COLUMN `cep`         VARCHAR(9)   NULL,
  ADD COLUMN `logradouro`  VARCHAR(200) NULL,
  ADD COLUMN `numero`      VARCHAR(20)  NULL,
  ADD COLUMN `complemento` VARCHAR(100) NULL,
  ADD COLUMN `bairro`      VARCHAR(100) NULL,
  ADD COLUMN `cidade`      VARCHAR(100) NULL,
  ADD COLUMN `estado`      VARCHAR(2)   NULL;

-- Campos de integração n8n e API token nos tenants
ALTER TABLE `tenants`
  ADD COLUMN `n8n_webhook_url` VARCHAR(500) NULL,
  ADD COLUMN `n8n_api_key`     VARCHAR(255) NULL,
  ADD COLUMN `api_token`       VARCHAR(255) NULL;

CREATE UNIQUE INDEX `tenants_api_token_key` ON `tenants`(`api_token`);
