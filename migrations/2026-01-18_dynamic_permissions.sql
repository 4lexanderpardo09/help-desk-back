-- 0. PRE-REQUISITO: Asegurar que tm_rol sea compatible con Foreign Keys (InnoDB + UTF8mb4)
ALTER TABLE `tm_rol` ENGINE = InnoDB;

ALTER TABLE `tm_rol` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 1. DROP Tables to ensure clean state (force structure update)
DROP TABLE IF EXISTS `tm_rol_permiso`;

DROP TABLE IF EXISTS `tm_permiso`;

-- 2. Create tm_permiso
CREATE TABLE `tm_permiso` (
    `perm_id` int(11) NOT NULL AUTO_INCREMENT,
    `perm_nom` varchar(100) NOT NULL,
    `perm_accion` varchar(50) NOT NULL,
    `perm_subject` varchar(50) NOT NULL,
    `perm_desc` text DEFAULT NULL,
    `est` int(11) NOT NULL DEFAULT 1,
    `fech_cre` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`perm_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- 3. Create tm_rol_permiso
CREATE TABLE `tm_rol_permiso` (
    `rp_id` int(11) NOT NULL AUTO_INCREMENT,
    `rol_id` int(11) NOT NULL,
    `perm_id` int(11) NOT NULL,
    `est` int(11) NOT NULL DEFAULT 1,
    `fech_cre` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`rp_id`),
    UNIQUE KEY `uk_rol_permiso` (`rol_id`, `perm_id`),
    CONSTRAINT `fk_rp_rol` FOREIGN KEY (`rol_id`) REFERENCES `tm_rol` (`rol_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_rp_perm` FOREIGN KEY (`perm_id`) REFERENCES `tm_permiso` (`perm_id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- 2. Limpiar permisos existentes para evitar duplicados en seed inicial
TRUNCATE TABLE `tm_permiso`;

INSERT INTO
    `tm_permiso` (
        `perm_nom`,
        `perm_accion`,
        `perm_subject`,
        `perm_desc`,
        `est`
    )
VALUES (
        'Ver Usuarios',
        'read',
        'User',
        'Puede ver lista y detalles de usuarios',
        1
    ),
    (
        'Crear Usuarios',
        'create',
        'User',
        'Puede crear nuevos usuarios',
        1
    ),
    (
        'Editar Usuarios',
        'update',
        'User',
        'Puede editar usuarios existentes',
        1
    ),
    (
        'Eliminar Usuarios',
        'delete',
        'User',
        'Puede eliminar (soft delete) usuarios',
        1
    );

INSERT INTO
    `tm_permiso` (
        `perm_nom`,
        `perm_accion`,
        `perm_subject`,
        `perm_desc`,
        `est`
    )
VALUES (
        'Ver Tickets',
        'read',
        'Ticket',
        'Puede ver tickets',
        1
    ),
    (
        'Crear Tickets',
        'create',
        'Ticket',
        'Puede crear nuevos tickets',
        1
    ),
    (
        'Editar Tickets',
        'update',
        'Ticket',
        'Puede editar tickets existentes',
        1
    ),
    (
        'Administrar Tickets',
        'manage',
        'Ticket',
        'Control total sobre tickets',
        1
    );

INSERT INTO
    `tm_permiso` (
        `perm_nom`,
        `perm_accion`,
        `perm_subject`,
        `perm_desc`,
        `est`
    )
VALUES (
        'Ver Roles',
        'read',
        'Role',
        'Puede ver lista de roles',
        1
    ),
    (
        'Crear Roles',
        'create',
        'Role',
        'Puede crear nuevos roles',
        1
    ),
    (
        'Editar Roles',
        'update',
        'Role',
        'Puede editar roles',
        1
    ),
    (
        'Eliminar Roles',
        'delete',
        'Role',
        'Puede eliminar roles',
        1
    ),
    (
        'Administrar roles',
        'manage',
        'Role',
        'Control total sobre sistema de roles',
        1
    );

-- PERMISSIONS (Meta-permisos)
INSERT INTO
    `tm_permiso` (
        `perm_nom`,
        `perm_accion`,
        `perm_subject`,
        `perm_desc`,
        `est`
    )
VALUES (
        'Ver Permisos',
        'read',
        'Permission',
        'Puede ver catálogo de permisos',
        1
    ),
    (
        'Asignar Permisos',
        'update',
        'Permission',
        'Puede asignar/revocar permisos a roles',
        1
    ),
    (
        'Administrar Permisos',
        'manage',
        'Permission',
        'Control total sobre sistema de permisos',
        1
    ),
    (
        'Crear Permisos',
        'create',
        'Permission',
        'Puede crear nuevas definiciones de permisos',
        1
    ),
    (
        'Eliminar Permisos',
        'delete',
        'Permission',
        'Puede eliminar definiciones de permisos',
        1
    );

-- CATEGORIES
INSERT INTO
    `tm_permiso` (
        `perm_nom`,
        `perm_accion`,
        `perm_subject`,
        `perm_desc`,
        `est`
    )
VALUES (
        'Ver Categorías',
        'read',
        'Category',
        'Puede ver categorías',
        1
    ),
    (
        'Administrar Categorías',
        'manage',
        'Category',
        'Puede crear, editar y borrar categorías',
        1
    );

-- REPORTS
INSERT INTO
    `tm_permiso` (
        `perm_nom`,
        `perm_accion`,
        `perm_subject`,
        `perm_desc`,
        `est`
    )
VALUES (
        'Ver Reportes',
        'read',
        'Report',
        'Puede ejecutar reportes',
        1
    ),
    (
        'Administrar Reportes',
        'manage',
        'Report',
        'Puede crear/editar consultas SQL',
        1
    );

-- 4. Asignar Permisos Iniciales al Rol Admin (ID: 1)
-- Asumimos que existe la tabla pivote tm_rol_permiso. Si no, la creamos.

-- Dar TODOS los permisos al Rol 1 (Admin)
INSERT INTO
    `tm_rol_permiso` (rol_id, perm_id)
SELECT 3, perm_id
FROM `tm_permiso`;