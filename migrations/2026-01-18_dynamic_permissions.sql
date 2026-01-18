-- ============================================
-- Migración: Sistema de Permisos Dinámicos
-- Fecha: 2026-01-18
-- Descripción: Tablas para gestión granular de permisos
-- ============================================

-- Tabla de Permisos (catálogo de acciones disponibles)
CREATE TABLE IF NOT EXISTS `tm_permiso` (
    `per_id` INT AUTO_INCREMENT PRIMARY KEY,
    `per_action` VARCHAR(50) NOT NULL COMMENT 'Acción: read, create, update, delete, manage',
    `per_subject` VARCHAR(50) NOT NULL COMMENT 'Recurso: User, Ticket, Category, etc.',
    `per_descripcion` VARCHAR(255) NULL COMMENT 'Descripción legible del permiso',
    `est` TINYINT(1) DEFAULT 1 COMMENT 'Estado: 1=activo, 0=inactivo',
    `fech_cre` DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_action_subject` (`per_action`, `per_subject`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Tabla pivote: Rol-Permiso (asignación de permisos a roles)
CREATE TABLE IF NOT EXISTS `tm_rol_permiso` (
    `rp_id` INT AUTO_INCREMENT PRIMARY KEY,
    `rol_id` INT NOT NULL COMMENT 'FK a tm_rol',
    `per_id` INT NOT NULL COMMENT 'FK a tm_permiso',
    `est` TINYINT(1) DEFAULT 1 COMMENT 'Estado: 1=activo, 0=inactivo',
    `fech_cre` DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_rol_permiso` (`rol_id`, `per_id`),
    FOREIGN KEY (`rol_id`) REFERENCES `tm_rol` (`rol_id`) ON DELETE CASCADE,
    FOREIGN KEY (`per_id`) REFERENCES `tm_permiso` (`per_id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================
-- Datos iniciales: Permisos granulares
-- ============================================

INSERT INTO
    `tm_permiso` (
        `per_action`,
        `per_subject`,
        `per_descripcion`
    )
VALUES
    -- User
    (
        'read',
        'User',
        'Ver usuarios'
    ),
    (
        'create',
        'User',
        'Crear usuarios'
    ),
    (
        'update',
        'User',
        'Actualizar usuarios'
    ),
    (
        'delete',
        'User',
        'Eliminar usuarios'
    ),
    (
        'manage',
        'User',
        'Gestión completa de usuarios'
    ),

-- Ticket
(
    'read',
    'Ticket',
    'Ver tickets'
),
(
    'create',
    'Ticket',
    'Crear tickets'
),
(
    'update',
    'Ticket',
    'Actualizar tickets'
),
(
    'delete',
    'Ticket',
    'Eliminar tickets'
),
(
    'manage',
    'Ticket',
    'Gestión completa de tickets'
),

-- Category
(
    'read',
    'Category',
    'Ver categorías'
),
(
    'create',
    'Category',
    'Crear categorías'
),
(
    'update',
    'Category',
    'Actualizar categorías'
),
(
    'delete',
    'Category',
    'Eliminar categorías'
),
(
    'manage',
    'Category',
    'Gestión completa de categorías'
),

-- Department
(
    'read',
    'Department',
    'Ver departamentos'
),
(
    'create',
    'Department',
    'Crear departamentos'
),
(
    'update',
    'Department',
    'Actualizar departamentos'
),
(
    'delete',
    'Department',
    'Eliminar departamentos'
),
(
    'manage',
    'Department',
    'Gestión completa de departamentos'
),

-- Role
('read', 'Role', 'Ver roles'),
(
    'create',
    'Role',
    'Crear roles'
),
(
    'update',
    'Role',
    'Actualizar roles'
),
(
    'delete',
    'Role',
    'Eliminar roles'
),
(
    'manage',
    'Role',
    'Gestión completa de roles'
),

-- Profile
(
    'read',
    'Profile',
    'Ver perfiles'
),
(
    'create',
    'Profile',
    'Crear perfiles'
),
(
    'update',
    'Profile',
    'Actualizar perfiles'
),
(
    'delete',
    'Profile',
    'Eliminar perfiles'
),
(
    'manage',
    'Profile',
    'Gestión completa de perfiles'
),

-- Regional
(
    'read',
    'Regional',
    'Ver regionales'
),
(
    'create',
    'Regional',
    'Crear regionales'
),
(
    'update',
    'Regional',
    'Actualizar regionales'
),
(
    'delete',
    'Regional',
    'Eliminar regionales'
),
(
    'manage',
    'Regional',
    'Gestión completa de regionales'
),

-- Company
(
    'read',
    'Company',
    'Ver empresas'
),
(
    'create',
    'Company',
    'Crear empresas'
),
(
    'update',
    'Company',
    'Actualizar empresas'
),
(
    'delete',
    'Company',
    'Eliminar empresas'
),
(
    'manage',
    'Company',
    'Gestión completa de empresas'
),

-- Permission (meta-permiso para gestionar permisos)
(
    'read',
    'Permission',
    'Ver permisos'
),
(
    'update',
    'Permission',
    'Asignar permisos'
),
(
    'manage',
    'Permission',
    'Gestión completa de permisos'
);

-- ============================================
-- Asignación inicial de permisos a roles
-- ============================================

-- Admin (rol_id = 1): Acceso total
INSERT INTO
    `tm_rol_permiso` (`rol_id`, `per_id`)
SELECT 1, per_id
FROM `tm_permiso`
WHERE
    per_action = 'manage';

-- Supervisor (rol_id = 4): Lectura total + actualización de Users y Tickets
INSERT INTO
    `tm_rol_permiso` (`rol_id`, `per_id`)
SELECT 4, per_id
FROM `tm_permiso`
WHERE
    per_action = 'read';

INSERT INTO
    `tm_rol_permiso` (`rol_id`, `per_id`)
SELECT 4, per_id
FROM `tm_permiso`
WHERE
    per_action = 'update'
    AND per_subject IN ('User', 'Ticket');

-- Agente (rol_id = 2): Lectura de Users/Tickets/Categories/Departments + update Tickets
INSERT INTO
    `tm_rol_permiso` (`rol_id`, `per_id`)
SELECT 2, per_id
FROM `tm_permiso`
WHERE
    per_action = 'read'
    AND per_subject IN (
        'User',
        'Ticket',
        'Category',
        'Department'
    );

INSERT INTO
    `tm_rol_permiso` (`rol_id`, `per_id`)
SELECT 2, per_id
FROM `tm_permiso`
WHERE
    per_action = 'update'
    AND per_subject = 'Ticket';

-- Cliente (rol_id = 3): Lectura de Tickets/Categories + crear Tickets
INSERT INTO
    `tm_rol_permiso` (`rol_id`, `per_id`)
SELECT 3, per_id
FROM `tm_permiso`
WHERE
    per_action = 'read'
    AND per_subject IN ('Ticket', 'Category');

INSERT INTO
    `tm_rol_permiso` (`rol_id`, `per_id`)
SELECT 3, per_id
FROM `tm_permiso`
WHERE
    per_action = 'create'
    AND per_subject = 'Ticket';