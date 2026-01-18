-- ============================================
-- Migración: Permisos para Módulo Zonas
-- Fecha: 2026-01-18
-- ============================================

-- 1. Insertar permisos de Zona
INSERT INTO
    `tm_permiso` (
        `per_action`,
        `per_subject`,
        `per_descripcion`
    )
VALUES ('read', 'Zone', 'Ver zonas'),
    (
        'create',
        'Zone',
        'Crear zonas'
    ),
    (
        'update',
        'Zone',
        'Actualizar zonas'
    ),
    (
        'delete',
        'Zone',
        'Eliminar zonas'
    ),
    (
        'manage',
        'Zone',
        'Gestión completa de zonas'
    );

-- 2. Asignar permisos a roles

-- Admin (3): Gestión total
INSERT INTO
    `tm_rol_permiso` (`rol_id`, `per_id`)
SELECT 3, per_id
FROM `tm_permiso`
WHERE
    per_subject = 'Zone'
    AND per_action = 'manage';

-- Supervisor (4): Solo lectura
INSERT INTO
    `tm_rol_permiso` (`rol_id`, `per_id`)
SELECT 4, per_id
FROM `tm_permiso`
WHERE
    per_subject = 'Zone'
    AND per_action = 'read';

-- Agente (2): Solo lectura
INSERT INTO
    `tm_rol_permiso` (`rol_id`, `per_id`)
SELECT 2, per_id
FROM `tm_permiso`
WHERE
    per_subject = 'Zone'
    AND per_action = 'read';