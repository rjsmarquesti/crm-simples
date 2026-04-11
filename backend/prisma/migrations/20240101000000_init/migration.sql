-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `senha` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `telefone` VARCHAR(20) NULL,
    `email` VARCHAR(150) NULL,
    `origem` VARCHAR(50) NULL,
    `status` ENUM('novo', 'contato', 'agendado', 'convertido', 'perdido') NOT NULL DEFAULT 'novo',
    `observacoes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agendamentos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lead_id` INTEGER NOT NULL,
    `data` VARCHAR(10) NOT NULL,
    `hora` VARCHAR(5) NOT NULL,
    `tipo` VARCHAR(100) NULL DEFAULT 'reunião',
    `status` ENUM('marcado', 'confirmado', 'cancelado', 'realizado') NOT NULL DEFAULT 'marcado',
    `observacoes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `agendamentos` ADD CONSTRAINT `agendamentos_lead_id_fkey`
    FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
