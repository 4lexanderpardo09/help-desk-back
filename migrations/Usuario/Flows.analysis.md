# Análisis de Flujos: Módulo Usuarios

## 1. Endpoints Sugeridos

### Autenticación
- `POST /auth/login`: Login (ya implementado).
- `POST /auth/recover-password`: Generar token.
- `POST /auth/reset-password`: Usar token para cambiar pass.

### Gestión de Usuarios
- `GET /users`: Master endpoint con `filter` e `included`. Reemplaza múltiples `get_usuario_por_*`.
- `POST /users`: Crear usuario + perfiles.
- `PUT /users/:id`: Actualizar usuario + perfiles.
- `PUT /users/:id/password`: Cambio de contraseña (Admin o Propio).

### Lógica de Negocio Específica
- **Búsqueda por Zona**: Integrada en `GET /users` mediante scope `included=regional.zona` + `filter[regional.zona.nombre]=X`.
- **Búsqueda Nacional**: Integrada en `GET /users` mediante `filter[esNacional]=1`.

## 2. Tests Unitarios Necesarios
1.  **AuthService > login**: Verificar hash de password y generación de JWT.
2.  **UsersService > create**: Verificar inserción de usuario y asociación de perfiles en transacción.
3.  **UsersService > update**: Cambio de contraseña (hashing).
4.  **ApiQueryHelper (Filters)**:
    - Verificar filtro complejo: `(cargoId = X AND (regionalId = Y OR esNacional = 1))`. Esto podría requerir un custom filter o `Where` condicional avanzado en el controller.

## 3. Notas de Migración
- La lógica `get_usuarios_por_cargo_regional_o_nacional` es crítica para la asignación de tickets. Actualmente, el `UsersService` debe soportar esta query específica a través de un método `findAprobadores(cargoId, regionalId)` que encapsule la lógica OR (`regional = X OR nacional = 1`).
