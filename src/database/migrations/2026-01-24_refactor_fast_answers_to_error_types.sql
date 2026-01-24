-- Rename table
ALTER TABLE `tm_fast_answer` RENAME TO `tm_error_type`;

-- Rename and Modify Columns
ALTER TABLE `tm_error_type`
CHANGE `answer_id` `error_type_id` INT(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `tm_error_type`
CHANGE `answer_nom` `title` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `tm_error_type`
CHANGE `answer_descrip` `description` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL;

ALTER TABLE `tm_error_type`
CHANGE `es_error_proceso` `is_process_error` TINYINT(1) DEFAULT 0;

ALTER TABLE `tm_error_type`
CHANGE `est` `is_active` TINYINT(1) DEFAULT 1;

-- Add Parent Column for Hierarchy
ALTER TABLE `tm_error_type`
ADD COLUMN `parent_id` INT(11) NULL DEFAULT NULL AFTER `error_type_id`;

-- Add Foreign Key for Hierarchy (Self-Referencing)
ALTER TABLE `tm_error_type`
ADD CONSTRAINT `fk_error_type_parent` FOREIGN KEY (`parent_id`) REFERENCES `tm_error_type` (`error_type_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Update TicketError column name if desired (Optional, but ensures consistency)
-- ALTER TABLE `tm_ticket_error` CHANGE `answer_id` `error_type_id` INT(11) NULL DEFAULT NULL;