-- =====================================================
-- SQL para poblar tm_permiso con todos los permisos
-- Sistema Help Desk - Backend NestJS
-- Fecha: 2026-01-21
-- =====================================================

-- Limpiar permisos existentes (opcional - comentar si no deseas borrar)
-- DELETE FROM tm_permiso WHERE perm_id > 0;

-- =====================================================
-- PERMISOS: User (Usuarios)
-- =====================================================
INSERT INTO
    tm_permiso (
        perm_nom,
        perm_accion,
        perm_subject,
        perm_desc,
        est
    )
VALUES (
        'Ver Usuarios',
        'read',
        'User',
        'Permite ver la lista y detalles de usuarios',
        1
    ),
    (
        'Crear Usuarios',
        'create',
        'User',
        'Permite crear nuevos usuarios en el sistema',
        1
    ),
    (
        'Actualizar Usuarios',
        'update',
        'User',
        'Permite editar información de usuarios existentes',
        1
    ),
    (
        'Eliminar Usuarios',
        'delete',
        'User',
        'Permite eliminar usuarios (soft delete)',
        1
    ),
    (
        'Gestión Total Usuarios',
        'manage',
        'User',
        'Acceso completo a todas las operaciones de usuarios',
        1
    );

-- =====================================================
-- PERMISOS: Ticket (Tickets)
-- =====================================================
INSERT INTO
    tm_permiso (
        perm_nom,
        perm_accion,
        perm_subject,
        perm_desc,
        est
    )
VALUES (
        'Ver Tickets',
        'read',
        'Ticket',
        'Permite ver tickets y su historial',
        1
    ),
    (
        'Crear Tickets',
        'create',
        'Ticket',
        'Permite crear nuevos tickets',
        1
    ),
    (
        'Actualizar Tickets',
        'update',
        'Ticket',
        'Permite actualizar tickets existentes',
        1
    ),
    (
        'Eliminar Tickets',
        'delete',
        'Ticket',
        'Permite eliminar tickets',
        1
    ),
    (
        'Gestión Total Tickets',
        'manage',
        'Ticket',
        'Acceso completo a todas las operaciones de tickets',
        1
    ),
    (
        'Ver Tickets Asignados',
        'view:assigned',
        'Ticket',
        'Permite ver tickets asignados al usuario',
        1
    ),
    (
        'Ver Tickets Creados',
        'view:created',
        'Ticket',
        'Permite ver tickets creados por el usuario',
        1
    ),
    (
        'Ver Todos los Tickets',
        'view:all',
        'Ticket',
        'Permite ver todos los tickets del sistema',
        1
    ),
    (
        'Ver Tickets Observados',
        'view:observed',
        'Ticket',
        'Permite ver tickets que el usuario está observando',
        1
    );

-- =====================================================
-- PERMISOS: Category (Categorías)
-- =====================================================
INSERT INTO
    tm_permiso (
        perm_nom,
        perm_accion,
        perm_subject,
        perm_desc,
        est
    )
VALUES (
        'Ver Categorías',
        'read',
        'Category',
        'Permite ver categorías de tickets',
        1
    ),
    (
        'Crear Categorías',
        'create',
        'Category',
        'Permite crear nuevas categorías',
        1
    ),
    (
        'Actualizar Categorías',
        'update',
        'Category',
        'Permite editar categorías existentes',
        1
    ),
    (
        'Eliminar Categorías',
        'delete',
        'Category',
        'Permite eliminar categorías',
        1
    ),
    (
        'Gestión Total Categorías',
        'manage',
        'Category',
        'Acceso completo a todas las operaciones de categorías',
        1
    );

-- =====================================================
-- PERMISOS: Subcategoria (Subcategorías)
-- =====================================================
INSERT INTO
    tm_permiso (
        perm_nom,
        perm_accion,
        perm_subject,
        perm_desc,
        est
    )
VALUES (
        'Ver Subcategorías',
        'read',
        'Subcategoria',
        'Permite ver subcategorías de tickets',
        1
    ),
    (
        'Crear Subcategorías',
        'create',
        'Subcategoria',
        'Permite crear nuevas subcategorías',
        1
    ),
    (
        'Actualizar Subcategorías',
        'update',
        'Subcategoria',
        'Permite editar subcategorías existentes',
        1
    ),
    (
        'Eliminar Subcategorías',
        'delete',
        'Subcategoria',
        'Permite eliminar subcategorías',
        1
    ),
    (
        'Gestión Total Subcategorías',
        'manage',
        'Subcategoria',
        'Acceso completo a todas las operaciones de subcategorías',
        1
    );

-- =====================================================
-- PERMISOS: Department (Departamentos)
-- =====================================================
INSERT INTO
    tm_permiso (
        perm_nom,
        perm_accion,
        perm_subject,
        perm_desc,
        est
    )
VALUES (
        'Ver Departamentos',
        'read',
        'Department',
        'Permite ver departamentos',
        1
    ),
    (
        'Crear Departamentos',
        'create',
        'Department',
        'Permite crear nuevos departamentos',
        1
    ),
    (
        'Actualizar Departamentos',
        'update',
        'Department',
        'Permite editar departamentos existentes',
        1
    ),
    (
        'Eliminar Departamentos',
        'delete',
        'Department',
        'Permite eliminar departamentos',
        1
    ),
    (
        'Gestión Total Departamentos',
        'manage',
        'Department',
        'Acceso completo a todas las operaciones de departamentos',
        1
    );

-- =====================================================
-- PERMISOS: Role (Roles)
-- =====================================================
INSERT INTO
    tm_permiso (
        perm_nom,
        perm_accion,
        perm_subject,
        perm_desc,
        est
    )
VALUES (
        'Ver Roles',
        'read',
        'Role',
        'Permite ver roles del sistema',
        1
    ),
    (
        'Crear Roles',
        'create',
        'Role',
        'Permite crear nuevos roles',
        1
    ),
    (
        'Actualizar Roles',
        'update',
        'Role',
        'Permite editar roles existentes',
        1
    ),
    (
        'Eliminar Roles',
        'delete',
        'Role',
        'Permite eliminar roles',
        1
    ),
    (
        'Gestión Total Roles',
        'manage',
        'Role',
        'Acceso completo a todas las operaciones de roles',
        1
    );

-- =====================================================
-- PERMISOS: Profile (Perfiles)
-- =====================================================
INSERT INTO
    tm_permiso (
        perm_nom,
        perm_accion,
        perm_subject,
        perm_desc,
        est
    )
VALUES (
        'Ver Perfiles',
        'read',
        'Profile',
        'Permite ver perfiles de usuario',
        1
    ),
    (
        'Crear Perfiles',
        'create',
        'Profile',
        'Permite crear nuevos perfiles',
        1
    ),
    (
        'Actualizar Perfiles',
        'update',
        'Profile',
        'Permite editar perfiles existentes',
        1
    ),
    (
        'Eliminar Perfiles',
        'delete',
        'Profile',
        'Permite eliminar perfiles',
        1
    ),
    (
        'Gestión Total Perfiles',
        'manage',
        'Profile',
        'Acceso completo a todas las operaciones de perfiles',
        1
    );

-- =====================================================
-- PERMISOS: Regional (Regionales)
-- =====================================================
INSERT INTO
    tm_permiso (
        perm_nom,
        perm_accion,
        perm_subject,
        perm_desc,
        est
    )
VALUES (
        'Ver Regionales',
        'read',
        'Regional',
        'Permite ver regionales',
        1
    ),
    (
        'Crear Regionales',
        'create',
        'Regional',
        'Permite crear nuevas regionales',
        1
    ),
    (
        'Actualizar Regionales',
        'update',
        'Regional',
        'Permite editar regionales existentes',
        1
    ),
    (
        'Eliminar Regionales',
        'delete',
        'Regional',
        'Permite eliminar regionales',
        1
    ),
    (
        'Gestión Total Regionales',
        'manage',
        'Regional',
        'Acceso completo a todas las operaciones de regionales',
        1
    );

-- =====================================================
-- PERMISOS: Company (Empresas)
-- =====================================================
INSERT INTO
    tm_permiso (
        perm_nom,
        perm_accion,
        perm_subject,
        perm_desc,
        est
    )
VALUES (
        'Ver Empresas',
        'read',
        'Company',
        'Permite ver empresas',
        1
    ),
    (
        'Crear Empresas',
        'create',
        'Company',
        'Permite crear nuevas empresas',
        1
    ),
    (
        'Actualizar Empresas',
        'update',
        'Company',
        'Permite editar empresas existentes',
        1
    ),
    (
        'Eliminar Empresas',
        'delete',
        'Company',
        'Permite eliminar empresas',
        1
    ),
    (
        'Gestión Total Empresas',
        'manage',
        'Company',
        'Acceso completo a todas las operaciones de empresas',
        1
    );

-- =====================================================
-- PERMISOS: Permission (Permisos)
-- =====================================================
INSERT INTO
    tm_permiso (
        perm_nom,
        perm_accion,
        perm_subject,
        perm_desc,
        est
    )
VALUES (
        'Ver Permisos',
        'read',
        'Permission',
        'Permite ver permisos del sistema',
        1
    ),
    (
        'Crear Permisos',
        'create',
        'Permission',
        'Permite crear nuevos permisos',
        1
    ),
    (
        'Actualizar Permisos',
        'update',
        'Permission',
        'Permite editar permisos existentes',
        1
    ),
    (
        'Eliminar Permisos',
        'delete',
        'Permission',
        'Permite eliminar permisos',
        1
    ),
    (
        'Gestión Total Permisos',
        'manage',
        'Permission',
        'Acceso completo a todas las operaciones de permisos',
        1
    );

-- =====================================================
-- PERMISOS: Zone (Zonas)
-- =====================================================
INSERT INTO
    tm_permiso (
        perm_nom,
        perm_accion,
        perm_subject,
        perm_desc,
        est
    )
VALUES (
        'Ver Zonas',
        'read',
        'Zone',
        'Permite ver zonas geográficas',
        1
    ),
    (
        'Crear Zonas',
        'create',
        'Zone',
        'Permite crear nuevas zonas',
        1
    ),
    (
        'Actualizar Zonas',
        'update',
        'Zone',
        'Permite editar zonas existentes',
        1
    ),
    (
        'Eliminar Zonas',
        'delete',
        'Zone',
        'Permite eliminar zonas',
        1
    ),
    (
        'Gestión Total Zonas',
        'manage',
        'Zone',
        'Acceso completo a todas las operaciones de zonas',
        1
    );

-- =====================================================
-- PERMISOS: Priority (Prioridades)
-- =====================================================
INSERT INTO
    tm_permiso (
        perm_nom,
        perm_accion,
        perm_subject,
        perm_desc,
        est
    )
VALUES (
        'Ver Prioridades',
        'read',
        'Priority',
        'Permite ver prioridades de tickets',
        1
    ),
    (
        'Crear Prioridades',
        'create',
        'Priority',
        'Permite crear nuevas prioridades',
        1
    ),
    (
        'Actualizar Prioridades',
        'update',
        'Priority',
        'Permite editar prioridades existentes',
        1
    ),
    (
        'Eliminar Prioridades',
        'delete',
        'Priority',
        'Permite eliminar prioridades',
        1
    ),
    (
        'Gestión Total Prioridades',
        'manage',
        'Priority',
        'Acceso completo a todas las operaciones de prioridades',
        1
    );

-- =====================================================
-- PERMISOS: Position (Cargos)
-- =====================================================
INSERT INTO
    tm_permiso (
        perm_nom,
        perm_accion,
        perm_subject,
        perm_desc,
        est
    )
VALUES (
        'Ver Cargos',
        'read',
        'Position',
        'Permite ver cargos y organigrama',
        1
    ),
    (
        'Crear Cargos',
        'create',
        'Position',
        'Permite crear nuevos cargos',
        1
    ),
    (
        'Actualizar Cargos',
        'update',
        'Position',
        'Permite editar cargos existentes',
        1
    ),
    (
        'Eliminar Cargos',
        'delete',
        'Position',
        'Permite eliminar cargos',
        1
    ),
    (
        'Gestión Total Cargos',
        'manage',
        'Position',
        'Acceso completo a todas las operaciones de cargos',
        1
    );

-- =====================================================
-- PERMISOS: Rule (Reglas de Mapeo)
-- =====================================================
INSERT INTO
    tm_permiso (
        perm_nom,
        perm_accion,
        perm_subject,
        perm_desc,
        est
    )
VALUES (
        'Ver Reglas',
        'read',
        'Rule',
        'Permite ver reglas de asignación automática',
        1
    ),
    (
        'Crear Reglas',
        'create',
        'Rule',
        'Permite crear nuevas reglas de mapeo',
        1
    ),
    (
        'Actualizar Reglas',
        'update',
        'Rule',
        'Permite editar reglas existentes',
        1
    ),
    (
        'Eliminar Reglas',
        'delete',
        'Rule',
        'Permite eliminar reglas',
        1
    ),
    (
        'Gestión Total Reglas',
        'manage',
        'Rule',
        'Acceso completo a todas las operaciones de reglas',
        1
    );

-- =====================================================
-- PERMISOS: Report (Reportes)
-- =====================================================
INSERT INTO
    tm_permiso (
        perm_nom,
        perm_accion,
        perm_subject,
        perm_desc,
        est
    )
VALUES (
        'Ver Reportes',
        'read',
        'Report',
        'Permite ver y ejecutar reportes',
        1
    ),
    (
        'Crear Reportes',
        'create',
        'Report',
        'Permite crear nuevos reportes SQL',
        1
    ),
    (
        'Actualizar Reportes',
        'update',
        'Report',
        'Permite editar reportes existentes',
        1
    ),
    (
        'Eliminar Reportes',
        'delete',
        'Report',
        'Permite eliminar reportes',
        1
    ),
    (
        'Gestión Total Reportes',
        'manage',
        'Report',
        'Acceso completo a todas las operaciones de reportes',
        1
    );

-- =====================================================
-- PERMISOS: Workflow (Flujos de Trabajo)
-- =====================================================
INSERT INTO
    tm_permiso (
        perm_nom,
        perm_accion,
        perm_subject,
        perm_desc,
        est
    )
VALUES (
        'Ver Flujos',
        'read',
        'Workflow',
        'Permite ver flujos de trabajo',
        1
    ),
    (
        'Crear Flujos',
        'create',
        'Workflow',
        'Permite crear nuevos flujos',
        1
    ),
    (
        'Actualizar Flujos',
        'update',
        'Workflow',
        'Permite editar flujos existentes',
        1
    ),
    (
        'Eliminar Flujos',
        'delete',
        'Workflow',
        'Permite eliminar flujos',
        1
    ),
    (
        'Gestión Total Flujos',
        'manage',
        'Workflow',
        'Acceso completo a todas las operaciones de flujos',
        1
    );

-- =====================================================
-- PERMISOS: Template (Plantillas)
-- =====================================================
INSERT INTO
    tm_permiso (
        perm_nom,
        perm_accion,
        perm_subject,
        perm_desc,
        est
    )
VALUES (
        'Ver Plantillas',
        'read',
        'Template',
        'Permite ver plantillas y campos dinámicos',
        1
    ),
    (
        'Crear Plantillas',
        'create',
        'Template',
        'Permite crear nuevas plantillas',
        1
    ),
    (
        'Actualizar Plantillas',
        'update',
        'Template',
        'Permite editar plantillas existentes',
        1
    ),
    (
        'Eliminar Plantillas',
        'delete',
        'Template',
        'Permite eliminar plantillas',
        1
    ),
    (
        'Gestión Total Plantillas',
        'manage',
        'Template',
        'Acceso completo a todas las operaciones de plantillas',
        1
    );

-- =====================================================
-- PERMISOS: Document (Documentos)
-- =====================================================
INSERT INTO
    tm_permiso (
        perm_nom,
        perm_accion,
        perm_subject,
        perm_desc,
        est
    )
VALUES (
        'Ver Documentos',
        'read',
        'Document',
        'Permite ver documentos adjuntos',
        1
    ),
    (
        'Crear Documentos',
        'create',
        'Document',
        'Permite subir nuevos documentos',
        1
    ),
    (
        'Actualizar Documentos',
        'update',
        'Document',
        'Permite editar metadatos de documentos',
        1
    ),
    (
        'Eliminar Documentos',
        'delete',
        'Document',
        'Permite eliminar documentos',
        1
    ),
    (
        'Gestión Total Documentos',
        'manage',
        'Document',
        'Acceso completo a todas las operaciones de documentos',
        1
    );

-- =====================================================
-- PERMISOS: Notification (Notificaciones)
-- =====================================================
INSERT INTO
    tm_permiso (
        perm_nom,
        perm_accion,
        perm_subject,
        perm_desc,
        est
    )
VALUES (
        'Ver Notificaciones',
        'read',
        'Notification',
        'Permite ver notificaciones',
        1
    ),
    (
        'Crear Notificaciones',
        'create',
        'Notification',
        'Permite crear notificaciones',
        1
    ),
    (
        'Actualizar Notificaciones',
        'update',
        'Notification',
        'Permite marcar notificaciones como leídas',
        1
    ),
    (
        'Eliminar Notificaciones',
        'delete',
        'Notification',
        'Permite eliminar notificaciones',
        1
    ),
    (
        'Gestión Total Notificaciones',
        'manage',
        'Notification',
        'Acceso completo a todas las operaciones de notificaciones',
        1
    );

-- =====================================================
-- PERMISOS: Tag (Etiquetas)
-- =====================================================
INSERT INTO
    tm_permiso (
        perm_nom,
        perm_accion,
        perm_subject,
        perm_desc,
        est
    )
VALUES (
        'Ver Etiquetas',
        'read',
        'Tag',
        'Permite ver etiquetas personales',
        1
    ),
    (
        'Crear Etiquetas',
        'create',
        'Tag',
        'Permite crear nuevas etiquetas',
        1
    ),
    (
        'Actualizar Etiquetas',
        'update',
        'Tag',
        'Permite editar etiquetas existentes',
        1
    ),
    (
        'Eliminar Etiquetas',
        'delete',
        'Tag',
        'Permite eliminar etiquetas',
        1
    ),
    (
        'Gestión Total Etiquetas',
        'manage',
        'Tag',
        'Acceso completo a todas las operaciones de etiquetas',
        1
    );

-- =====================================================
-- PERMISOS: Statistics (Estadísticas)
-- =====================================================
INSERT INTO
    tm_permiso (
        perm_nom,
        perm_accion,
        perm_subject,
        perm_desc,
        est
    )
VALUES (
        'Ver Estadísticas',
        'read',
        'Statistics',
        'Permite ver dashboard y KPIs',
        1
    ),
    (
        'Crear Estadísticas',
        'create',
        'Statistics',
        'Permite generar reportes estadísticos',
        1
    ),
    (
        'Actualizar Estadísticas',
        'update',
        'Statistics',
        'Permite modificar configuración de estadísticas',
        1
    ),
    (
        'Eliminar Estadísticas',
        'delete',
        'Statistics',
        'Permite eliminar reportes estadísticos',
        1
    ),
    (
        'Gestión Total Estadísticas',
        'manage',
        'Statistics',
        'Acceso completo a todas las operaciones de estadísticas',
        1
    );

-- =====================================================
-- PERMISO ESPECIAL: Gestión Total del Sistema
-- =====================================================
INSERT INTO
    tm_permiso (
        perm_nom,
        perm_accion,
        perm_subject,
        perm_desc,
        est
    )
VALUES (
        'Administrador Total',
        'manage',
        'all',
        'Acceso completo a todas las funcionalidades del sistema',
        1
    );

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Contar permisos creados
SELECT perm_subject AS 'Recurso', COUNT(*) AS 'Total Permisos'
FROM tm_permiso
WHERE
    est = 1
GROUP BY
    perm_subject
ORDER BY perm_subject;

-- Ver todos los permisos
SELECT
    perm_id AS 'ID',
    perm_nom AS 'Nombre',
    perm_accion AS 'Acción',
    perm_subject AS 'Recurso',
    perm_desc AS 'Descripción'
FROM tm_permiso
WHERE
    est = 1
ORDER BY perm_subject, perm_accion;