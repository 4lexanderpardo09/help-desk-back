-- ============================================
-- Migración: Asignación de Permisos a Roles Estándar
-- Fecha: 2026-01-18
-- Roles: Usuario (1), Agente (2), Supervisor (4)
-- ============================================

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

-- Usuario/Cliente (rol_id = 1): Lectura de Tickets/Categories + crear Tickets
INSERT INTO
    `tm_rol_permiso` (`rol_id`, `per_id`)
SELECT 1, per_id
FROM `tm_permiso`
WHERE
    per_action = 'read'
    AND per_subject IN ('Ticket', 'Category');

INSERT INTO
    `tm_rol_permiso` (`rol_id`, `per_id`)
SELECT 1, per_id
FROM `tm_permiso`
WHERE
    per_action = 'create'
    AND per_subject = 'Ticket';