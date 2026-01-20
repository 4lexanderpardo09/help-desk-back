# Análisis del Modelo Legacy: Usuario.php

## 1. Descripción General
El archivo `Usuario.php` es el núcleo de la gestión de identidad en el sistema legacy. Maneja autenticación, gestión de sesiones, CRUD de usuarios y una lógica compleja de búsqueda de usuarios por jerarquía organizacional (Cargo, Regional, Zona, Nacionalidad).

## 2. Responsabilidades Identificadas
1.  **Autenticación**: `login()` verifica credenciales, roles y establece variables de sesión (`$_SESSION`).
2.  **CRUD**: Inserción, actualización y borrado lógico. Hasheo de contraseñas con `bcrypt`.
3.  **Recuperación de Contraseña**: Generación y validación de tokens temporales.
4.  **Gestión de Perfiles**: `insert_usuario_perfil` implementa lógica de sincronización (Borrar todo + Insertar nuevos).
5.  **Búsqueda Jerárquica**: Múltiples métodos para encontrar usuarios según reglas de negocio:
    - Por Cargo + Regional.
    - Por Cargo + Zona.
    - Por Cargo + Nacionalidad (si `es_nacional` = 1).

## 3. Estructura de Datos (Entradas/Salidas)
### Campos Clave (Inferidos)
- `usu_id` (PK)
- `usu_correo`, `usu_pass`
- `rol_id`
- `car_id` (Cargo)
- `reg_id` (Regional - opcional)
- `dp_id` (Departamento - opcional)
- `es_nacional` (Boolean 1/0)
- `usu_token_recuperacion`, `usu_token_expiracion`
- `usu_firma` (Path a archivo)

### Side Effects
- **Login**: Escribe 10+ variables en `$_SESSION`.
- **Insert/Update**: Hashea el password si viene en el request.
- **Sync Perfiles**: Borra físicamente filas en `tm_usuario_perfiles` antes de insertar nuevas.

## 4. Estrategia de Migración
- **Entidad**: `User` en `src/modules/users/entities/user.entity.ts` ya cubre todos los campos.
- **Auth**: `AuthService` ya maneja login y JWT.
- **Búsqueda Unificada**: La Fase 1 del plan de migración ya unificó `get_usuarios_por_cargo*` en un "Master Endpoint" con scopes dinámicos.
- **Perfiles**: `ProfilesService` debe manejar la lógica de sincronización.

## 5. Métodos Públicos a Migrar (Signatures)
```typescript
interface LegacyUsuarioModel {
  login(correo: string, pass: string, rolId: number): Promise<SessionData>;
  insert_usuario(data: CreateUserParams): Promise<number>;
  update_usuario(id: number, data: UpdateUserParams): Promise<void>;
  delete_usuario(id: number): Promise<void>;
  
  // Búsquedas complejas (Ya migradas a Scopes en UsersService)
  get_usuario_nacional_por_cargo(carId: number): Promise<User>;
  get_usuarios_por_cargo_regional_o_nacional(carId: number, regId: number): Promise<User[]>;
  get_usuario_por_cargo_y_zona(carId: number, zona: string): Promise<User>;

  // Recuperación
  generar_token_recuperacion(correo: string): Promise<string>;
  validar_token_recuperacion(token: string): Promise<User>;
  restablecer_contrasena(token: string, newPass: string): Promise<boolean>;

  // Perfiles
  insert_usuario_perfil(usuId: number, perIds: number[]): Promise<void>;
}
```
