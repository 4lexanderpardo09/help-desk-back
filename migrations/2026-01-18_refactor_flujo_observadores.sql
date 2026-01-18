-- ============================================
-- Migración: Refactor Observadores de Flujo
-- Fecha: 2026-01-18
-- Descripción: Normalización de usu_id_observador a tabla pivote
-- ============================================

-- 1. Crear tabla pivote tm_flujo_observador
CREATE TABLE IF NOT EXISTS `flujo_usuario` (
    `fu_id` INT AUTO_INCREMENT PRIMARY KEY,
    `flujo_id` INT NOT NULL COMMENT 'FK a tm_flujo',
    `usu_id` INT NOT NULL COMMENT 'FK a tm_usuario',
    `fech_cre` DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_flujo_usuario` (`flujo_id`, `usu_id`),
    FOREIGN KEY (`flujo_id`) REFERENCES `tm_flujo` (`flujo_id`) ON DELETE CASCADE,
    FOREIGN KEY (`usu_id`) REFERENCES `tm_usuario` (`usu_id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 2. Migración de datos (Procedimiento Almacenado Temporal)
-- Separa los IDs por coma "1,2,3" e inserta en la nueva tabla
DROP PROCEDURE IF EXISTS `MigrateFlujoObservadores`;

DELIMITER / /

CREATE PROCEDURE `MigrateFlujoObservadores`()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_flujo_id INT;
    DECLARE v_observadores TEXT;
    DECLARE v_usu_id VARCHAR(50);
    DECLARE v_pos INT;
    
    -- Cursor para recorrer flujos con observadores
    DECLARE cur CURSOR FOR 
        SELECT flujo_id, usu_id_observador 
        FROM tm_flujo 
        WHERE usu_id_observador IS NOT NULL AND usu_id_observador != '';
        
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO v_flujo_id, v_observadores;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Loop para separar por comas
        simple_loop: LOOP
            SET v_pos = INSTR(v_observadores, ',');
            
            IF v_pos = 0 THEN
                SET v_usu_id = v_observadores;
            ELSE
                SET v_usu_id = LEFT(v_observadores, v_pos - 1);
            END IF;

            -- Insertar si es un número válido y existe el usuario
            IF v_usu_id REGEXP '^[0-9]+$' THEN
                 -- Insertar ignorando duplicados
                INSERT IGNORE INTO tm_flujo_observador (flujo_id, usu_id)
                SELECT v_flujo_id, v_usu_id
                FROM tm_usuario 
                WHERE tm_usuario.usu_id = v_usu_id;
            END IF;

            IF v_pos = 0 THEN
                LEAVE simple_loop;
            END IF;

            SET v_observadores = SUBSTRING(v_observadores, v_pos + 1);
        END LOOP simple_loop;

    END LOOP;

    CLOSE cur;
END //

DELIMITER;

-- 3. Ejecutar migración
CALL `MigrateFlujoObservadores` ();

-- 4. Limpiar procedimiento
DROP PROCEDURE IF EXISTS `MigrateFlujoObservadores`;

-- 5. (Opcional) Eliminar columna antigua (Descomentar para ejecutar)
-- ALTER TABLE `tm_flujo` DROP COLUMN `usu_id_observador`;