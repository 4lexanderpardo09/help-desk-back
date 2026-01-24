-- Revert hierarchy in Error Type
ALTER TABLE `tm_error_type` DROP FOREIGN KEY `fk_error_type_parent`;

ALTER TABLE `tm_error_type` DROP COLUMN `parent_id`;

-- Create Error Subtype table
CREATE TABLE `tm_error_subtype` (
    `subtype_id` INT(11) NOT NULL AUTO_INCREMENT,
    `error_type_id` INT(11) NOT NULL,
    `title` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `description` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `est` TINYINT(1) DEFAULT 1,
    PRIMARY KEY (`subtype_id`),
    KEY `fk_subtype_error_type_idx` (`error_type_id`),
    CONSTRAINT `fk_subtype_error_type` FOREIGN KEY (`error_type_id`) REFERENCES `tm_error_type` (`error_type_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;