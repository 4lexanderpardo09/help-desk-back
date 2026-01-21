-- =====================================================
-- Migración: Permisos Granulares para Vistas de Tickets
-- Fecha: 2026-01-21
-- Descripción: Añade permisos específicos para controlar
--              el acceso a diferentes vistas de tickets
-- =====================================================

-- =====================================================
-- 1. CREAR NUEVOS PERMISOS
-- =====================================================

INSERT INTO
    tm_permiso (
        perm_nom,
        perm_accion,
        perm_subject,
        perm_desc,
        est,
        fech_cre
    )
VALUES (
        'Ver Tickets Asignados',
        'view:assigned',
        'Ticket',
        'Permite ver tickets asignados al usuario',
        1,
        NOW()
    ),
    (
        'Ver Tickets Creados',
        'view:created',
        'Ticket',
        'Permite ver tickets creados por el usuario',
        1,
        NOW()
    ),
    (
        'Ver Todos los Tickets',
        'view:all',
        'Ticket',
        'Permite ver todos los tickets del sistema',
        1,
        NOW()
    ),
    (
        'Ver Tickets Observados',
        'view:observed',
        'Ticket',
        'Permite ver tickets que el usuario está observando',
        1,
        NOW()
    );

-- =====================================================
-- 2. ASIGNAR PERMISOS A ROLES
-- =====================================================

-- Admin (rol_id = 1): Todos los permisos de vista
INSERT INTO
    tm_rol_permiso (
        rol_id,
        perm_id,
        est,
        fech_cre
    )
SELECT 1, perm_id, 1, NOW()
FROM tm_permiso
WHERE
    perm_accion IN (
        'view:assigned',
        'view:created',
        'view:all',
        'view:observed'
    )
    AND perm_subject = 'Ticket'
    AND est = 1;

-- Agente (rol_id = 2): view:assigned, view:created, view:observed
INSERT INTO
    tm_rol_permiso (
        rol_id,
        perm_id,
        est,
        fech_cre
    )
SELECT 2, perm_id, 1, NOW()
FROM tm_permiso
WHERE
    perm_accion IN (
        'view:assigned',
        'view:created',
        'view:observed'
    )
    AND perm_subject = 'Ticket'
    AND est = 1;

-- Usuario (rol_id = 3): view:created
INSERT INTO
    tm_rol_permiso (
        rol_id,
        perm_id,
        est,
        fech_cre
    )
SELECT 3, perm_id, 1, NOW()
FROM tm_permiso
WHERE
    perm_accion = 'view:created'
    AND perm_subject = 'Ticket'
    AND est = 1;

-- =====================================================
-- 3. VERIFICACIÓN
-- =====================================================

-- Verificar que los permisos se crearon correctamente
SELECT
    perm_id AS 'ID',
    perm_nom AS 'Nombre',
    perm_accion AS 'Acción',
    perm_subject AS 'Recurso',
    perm_desc AS 'Descripción'
FROM tm_permiso
WHERE
    perm_accion LIKE 'view:%'
    AND perm_subject = 'Ticket'
    AND est = 1
ORDER BY perm_accion;

-- Verificar asignaciones por rol
SELECT r.rol_nom AS 'Rol', p.perm_nom AS 'Permiso', p.perm_accion AS 'Acción'
FROM
    tm_rol_permiso rp
    INNER JOIN tm_rol r ON r.rol_id = rp.rol_id
    INNER JOIN tm_permiso p ON p.perm_id = rp.perm_id
WHERE
    p.perm_accion LIKE 'view:%'
    AND p.perm_subject = 'Ticket'
    AND rp.est = 1
    AND r.est = 1
ORDER BY r.rol_id, p.perm_accion;

-- Contar permisos por rol
SELECT r.rol_nom AS 'Rol', COUNT(*) AS 'Permisos de Vista'
FROM
    tm_rol_permiso rp
    INNER JOIN tm_rol r ON r.rol_id = rp.rol_id
    INNER JOIN tm_permiso p ON p.perm_id = rp.perm_id
WHERE
    p.perm_accion LIKE 'view:%'
    AND p.perm_subject = 'Ticket'
    AND rp.est = 1
    AND r.est = 1
GROUP BY
    r.rol_id,
    r.rol_nom
ORDER BY r.rol_id;

-- =====================================================
-- 4. ROLLBACK (Si es necesario)
-- =====================================================
-- IMPORTANTE: Solo ejecutar si necesitas revertir los cambios

/*
-- Eliminar asignaciones de permisos
DELETE FROM tm_rol_permiso 
WHERE perm_id IN (
SELECT perm_id FROM tm_permiso 
WHERE perm_accion LIKE 'view:%'
AND perm_subject = 'Ticket'
);

-- Eliminar permisos
DELETE FROM tm_permiso 
WHERE perm_accion LIKE 'view:%'
AND perm_subject = 'Ticket';
*/