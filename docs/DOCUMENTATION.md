# Help Desk API - Documentación

## 2026-01-15 - Configuración Inicial del Backend NestJS

### Contexto
Migración progresiva del sistema PHP legacy a una API REST moderna con NestJS. El objetivo es convivir con el sistema existente sin romper producción.

### Cambios Realizados

---

## 1. Instalación y Configuración Base

### Stack Tecnológico
- **Runtime:** Node.js
- **Framework:** NestJS v11
- **Lenguaje:** TypeScript (modo estricto)
- **Base de datos:** MySQL (TypeORM)
- **Autenticación:** JWT (Passport)
- **Package Manager:** pnpm

### Dependencias Instaladas
```bash
# Core
@nestjs/config          # Variables de entorno
@nestjs/typeorm         # ORM para MySQL
typeorm                 # ORM
mysql2                  # Driver MySQL

# Auth & Authorization
@nestjs/passport        # Passport integration
@nestjs/jwt             # JWT utilities
passport                # Auth framework
passport-jwt            # JWT strategy
bcrypt                  # Hash de passwords
@casl/ability           # Autorización basada en habilidades

# Validation
class-validator         # DTOs
class-transformer       # Transformación

# Documentation
@nestjs/swagger         # OpenAPI / Swagger UI
```

### Archivos de Configuración
- `.env` / `.env.example` - Variables de entorno
- `src/config/database.config.ts` - Configuración de MySQL
- `src/config/jwt.config.ts` - Configuración de JWT

---

## 2. Módulo de Autenticación (`src/modules/auth/`)

### Archivos
| Archivo | Descripción |
|---------|-------------|
| `auth.module.ts` | Módulo con Passport y JWT |
| `auth.controller.ts` | Endpoints `/auth/*` |
| `auth.service.ts` | Lógica de login y validación |
| `jwt.strategy.ts` | Estrategia Passport para JWT |
| `jwt.guard.ts` | Guard para proteger rutas |
| `decorators/user.decorator.ts` | Decorador `@User()` |
| `dto/login.dto.ts` | Validación de login |
| `interfaces/jwt-payload.interface.ts` | Tipo del payload JWT |
| `abilities/ability.factory.ts` | Factory de permisos CASL |
| `decorators/check-policies.decorator.ts` | Decorador `@CheckPolicies()` |

### Endpoints

#### `POST /auth/login`
Autentica usuario y retorna token JWT.

**Request:**
```json
{
  "email": "usuario@example.com",
  "password": "123456"
}
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### `GET /auth/profile`
Retorna datos del usuario autenticado.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "usu_id": 1,
  "usu_correo": "usuario@example.com",
  "rol_id": 2,
  "reg_id": 1,
  "car_id": 1,
  "dp_id": null,
  "es_nacional": false
}
```

### Payload del Token JWT
```typescript
interface JwtPayload {
  usu_id: number;
  usu_correo: string;
  rol_id: number | null;
  reg_id: number | null;
  car_id: number | null;
  dp_id: number | null;
  es_nacional: boolean;
}
```

### Compatibilidad con PHP Legacy
- Soporta passwords hasheados con `$2y$` (PHP) convirtiéndolos a `$2a$` (Node.js)
- Soporta MD5 para passwords legacy antiguos
- El payload del token replica las variables de sesión del sistema PHP

---

## 3. Módulo de Usuarios (`src/modules/users/`)

### Archivos
| Archivo | Descripción |
|---------|-------------|
| `users.module.ts` | Módulo de usuarios |
| `users.controller.ts` | Endpoints `/users/*` |
| `users.service.ts` | Lógica de negocio |
| `entities/user.entity.ts` | Entidad mapeada a `tm_usuario` |
| `dto/create-user.dto.ts` | Validación para crear usuario |
| `dto/update-user.dto.ts` | Validación para actualizar usuario |

### ⚡ Filtrado Inteligente (Smart Filters)

El API detecta automáticamente el tipo de filtro según el nombre del campo:
1.  **IDs y Estados** (`id`, `...Id`, `estado`, `est`):
    - Soporta valores únicos: `?filter[id]=1` -> `id = 1`
    - Soporta listas (arrays/CSV): `?filter[id]=1,2,3` -> `id IN (1,2,3)`
2.  **Texto** (otros campos):
    - Usa `LIKE %valor%`: `?filter[email]=xyz` -> `email LIKE '%xyz%'`

Todo esto es manejado centralizadamente por `ApiQueryHelper` y utilizado tanto en `list()` como en `show()`.

### Entidad User (mapeada a `tm_usuario`)
```typescript
@Entity('tm_usuario')
export class User {
  id: number;           // usu_id
  cedula: string;       // usu_cedula
  nombre: string;       // usu_nom
  apellido: string;     // usu_ape
  email: string;        // usu_correo
  password: string;     // usu_pass (select: false)
  rolId: number;        // rol_id
  regionalId: number;   // reg_id
  cargoId: number;      // car_id
  departamentoId: number; // dp_id
  esNacional: boolean;  // es_nacional
  estado: number;       // est
  // ... más campos
}
```

### 🔍 Guía de Uso del Master Endpoint (`GET /users`)

Este endpoint unificado reemplaza múltiples rutas legacy. Se recomienda usar siempre `/users` con los query parameters adecuados para filtrar.

#### Parámetros soportados:
- **`limit`**: Limitar la cantidad de resultados (útil para buscar uno solo con limit=1).
- **`included`**: **Scope de Relaciones**. Lista separada por comas (ej: `regional,cargo`).
- **`filter`**: **Scope de Filtros**. Objeto de filtros dinámicos (ej: `filter[email]=x`).

⚠️ **Nota:** Los parámetros antiguos (`email`, `rolId`, `cargoId`, `regionalId`, `includeDepartamento`) han sido **ELIMINADOS** de la firma del controlador en favor de `filter[...]` y `included`.

#### Ejemplos comunes:
- **Obtener todos los usuarios:** `GET /users`
- **Obtener agentes:** `GET /users?filter[rolId]=2`
- **Obtener usuarios de un cargo en una regional (incluyendo relaciones):**
  `GET /users?filter[cargoId]=1&included=regional,cargo`
- **Obtener usuarios de un cargo en una zona (vía Included):**
  `GET /users?filter[cargoId]=1&included=regional,regional.zona&filter[regional.zona.nombre]=Norte`
- **Obtener usuario por email:** `GET /users?filter[email]=juan.perez@example.com`

### Endpoints (todos requieren autenticación + autorización CASL)

| Método | Ruta | Descripción | Permiso CASL | Body (Ejemplo) |
|--------|------|-------------|--------------|---------------|
| `GET` | `/users` | Listar usuarios | `read User` | - |
| `GET` | `/users/:id` | Ver usuario | `read User` | - |
| `POST` | `/users` | Crear usuario | `create User` | `{"nombre": "John", "apellido": "Doe", "email": "john@example.com", "password": "123", "empresasIds": [1, 2]}` |
| `PUT` | `/users/:id` | Editar usuario | `update User` | `{"nombre": "John Updated", "empresasIds": [3]}` |
| `DELETE` | `/users/:id` | Eliminar (soft) | `delete User` | - |
| PUT | `/users/:id/firma` | Actualizar firma | `update User` | - |
| `GET` | `/users/:id/perfiles` | [DEPRECATED] Ver perfiles | `read User` | - |
| `PUT` | `/users/:id/perfiles` | [DEPRECATED] Sync perfiles | `update User` | - |

> **Nota:** Para gestión de perfiles de usuario, usar `POST /users` o `PUT /users/:id` con el campo `perfilIds`.

---

## 2. Autenticación y Seguridad (`src/modules/auth/`)

El sistema utiliza **JWT Stateless** para la autenticación y **CASL** para la autorización.

### Endpoints (`AuthController`)

| Método | Ruta | Descripción | Body / Respuesta |
|--------|------|-------------|------------------|
| `POST` | `/auth/login` | Iniciar sesión | Body: `LoginDto`<br>Resp: `AuthResponseDto` |
| `GET` | `/auth/profile` | Perfil del usuario actual | Resp: `ProfileResponseDto` |

### DTOs Clave

#### `LoginDto`
```json
{
  "email": "usuario@example.com",
  "password": "securePassword123"
}
```

---

## 3. Módulo de Permisos (`src/modules/permissions/`)

Gestión de permisos dinámica (RBAC almacenado en BD y cacheado en memoria).

### Endpoints (`PermissionsController`)

| Método | Ruta | Descripción | Permiso Requ |
|--------|------|-------------|--------------|
| `GET`  | `/permissions` | Catálogo completo | `read Permission` |
| `GET`  | `/permissions/role/:rolId` | Permisos de un rol | `read Permission` |
| `PUT`  | `/permissions/role/:rolId` | Sincronizar permisos | `update Permission` |

#### `SyncRolePermissionsDto` (para PUT)
```json
{
  "permisoIds": [1, 2, 3]  // IDs de los permisos a asignar
}
```

---

## 4. Módulo de Roles (`src/modules/roles/`)

Gestión de los roles del sistema (Admin, Agente, etc.).

### Entidad Role (mapeada a `tm_rol`)
```typescript
@Entity('tm_rol')
export class Role {
  id: number;           // rol_id
  nombre: string;       // rol_nom
  descripcion: string;  // rol_desc
  estado: number;       // est (1=Activo, 0=Inactivo)
  // ...
}
```

### Endpoints (`RolesController`)

| Método | Ruta | Descripción | Permiso Requ | Body (Ejemplo) |
|--------|------|-------------|--------------|----------------|
| `GET` | `/roles` | Listar roles | `read Role` | - |
| `GET` | `/roles/:id` | Obtener rol (soporta `?included=usuarios`) | `read Role` | - |
| `POST` | `/roles` | Crear rol | `create Role` | `{"nombre": "Analista", "descripcion": "Soporte N1"}` |
| `PUT` | `/roles/:id` | Actualizar rol | `update Role` | `{"nombre": "Analista Senior"}` |
| `DELETE` | `/roles/:id` | Soft delete | `delete Role` | - |

#### Filtros y Ordenamiento (`GET /roles`)
Implementa `ApiQueryDto` con soporte para:
- `limit`: Paginación
- `page`: Número de página
- `filter[nombre]`: Filtro por nombre
- `included`: `usuarios` (para ver quién tiene el rol)

---

## 5. Módulo de Subcategorías (`src/modules/subcategories/`)

Gestión de subcategorías de tickets, asociadas a una categoría padre.

### Entidad Subcategoria (mapeada a `tm_subcategoria`)
```typescript
@Entity('tm_subcategoria')
export class Subcategoria {
  id: number;           // cats_id
  nombre: string;       // cats_nom
  descripcion: string;  // cats_descrip
  categoriaId: number;  // cat_id (FK)
  prioridadId: number;  // pd_id (FK - prioridad por defecto)
  estado: number;       // est (1=Activo, 0=Inactivo)
}
```

### Endpoints (`SubcategoriasController`)

| Método | Ruta | Descripción | Permiso Requ | Body (Ejemplo) |
|--------|------|-------------|--------------|----------------|
| `GET` | `/subcategorias` | Listar subcategorías | `read Subcategoria` | - |
| `GET` | `/subcategorias/:id` | Obtener subcategoría (soporta `?included=categoria,prioridad`) | `read Subcategoria` | - |
| `POST` | `/subcategorias` | Crear subcategoría | `create Subcategoria` | `{"nombre": "Software", "categoriaId": 1}` |
| `PUT` | `/subcategorias/:id` | Actualizar subcategoría | `update Subcategoria` | `{"nombre": "Hardware"}` |
| `DELETE` | `/subcategorias/:id` | Soft delete | `delete Subcategoria` | - |

#### Filtros y Paginación (`GET /subcategorias`)
Implementa `ApiQueryDto` con soporte para:
- `limit`: Paginación
- `page`: Número de página
- `filter[nombre]`: Filtro por nombre
- `filter[categoriaId]`: Filtro por categoría padre
- `included`: `categoria`, `prioridad`

---

## 6. Módulo de Reglas de Mapeo (`src/modules/rules/`)

Gestión de reglas de asignación automática de tickets basadas en subcategoría.

### Entidad ReglaMapeo (mapeada a `tm_regla_mapeo`)
```typescript
@Entity('tm_regla_mapeo')
export class ReglaMapeo {
  id: number;              // regla_id
  subcategoriaId: number;  // cats_id (FK)
  estado: number;          // est
  // Relaciones: creadores, asignados, creadoresPerfil
}
```

### Tablas Pivot
- `regla_creadores`: regla ↔ cargo creador
- `regla_asignados`: regla ↔ cargo asignado
- `regla_creadores_perfil`: regla ↔ perfil creador

### Endpoints (`ReglasMapeoController`)

| Método | Ruta | Descripción | Permiso Requ |
|--------|------|-------------|--------------|
| `GET` | `/reglas-mapeo` | Listar reglas | `read Rule` |
| `GET` | `/reglas-mapeo/:id` | Obtener regla | `read Rule` |
| `GET` | `/reglas-mapeo/subcategoria/:subcategoriaId` | Buscar por subcategoría | `read Rule` |
| `POST` | `/reglas-mapeo` | Crear regla | `create Rule` |
| `PUT` | `/reglas-mapeo/:id` | Actualizar regla | `update Rule` |
| `DELETE` | `/reglas-mapeo/:id` | Soft delete | `delete Rule` |

#### Body de Ejemplo (POST/PUT)
```json
{
  "subcategoriaId": 1,
  "creadorCargoIds": [1, 2],
  "creadorPerfilIds": [1],
  "asignadoCargoIds": [3, 4]
}
```

#### Relaciones disponibles (`?included=`)
- `subcategoria`
- `creadores.cargo`
- `asignados.cargo`
- `creadoresPerfil.perfil`

---

#### Ejemplos de Scopes Dinámicos (`GET /users`)
El nuevo endpoint maestro soporta una API fluida para filtrar y cargar relaciones:

- **Incluir relaciones:** `?included=regional.zona,cargo,departamento`
- **Filtrar por campos:** `?filter[email]=juan@test.com&filter[nombre]=Juan`
- **Combinado:** `?included=regional&filter[rolId]=2`

**Nota de Migración:**
Los parámetros antiguos fueron eliminados. Ahora debes usar `filter[rolId]=X` en lugar de `rolId=X`.

#### `POST /users` - Crear Usuario
**Request:**
```json
{
  "nombre": "Nuevo",
  "apellido": "Usuario",
  "email": "nuevo@example.com",
  "password": "123456",
  "rolId": 2,
  "esNacional": false,
  "regionalId": 1,
  "cargoId": 1,
  "departamentoId": null,
  "cedula": "1234567890"
}
```

#### `PUT /users/:id` - Actualizar Usuario
Solo se actualizan los campos enviados. Si se envía `password`, se hashea automáticamente.

#### `PUT /users/:id/firma` - Actualizar Firma
```json
{
  "firma": "path/to/firma.png"
}
```

#### `DELETE /users/:id` - Soft Delete
No elimina físicamente. Marca `est=0` y `fech_elim=NOW()`.


---

## 3.1 Módulo de Zonas (`src/modules/zones/`)

### Archivos
| Archivo | Descripción |
|---------|-------------|
| `zones.module.ts` | Módulo de zonas |
| `zones.controller.ts` | Endpoints `/zones/*` |
| `zones.service.ts` | Lógica de negocio (CRUD) |
| `entities/zona.entity.ts` | Entidad `tm_zona` |
| `dto/create-zone.dto.ts` | DTO creación |
| `dto/update-zone.dto.ts` | DTO actualización |

### Endpoints (requieren permiso `Zone`)

| Método | Ruta | Descripción | Service Method | Permiso CASL |
|--------|------|-------------|----------------|---------------|
| GET | `/zones` | Listar zonas con filtros | `list()` | `read Zone` |
| GET | `/zones/:id` | Mostrar zona por ID | `show()` | `read Zone` |
| POST | `/zones` | Crear zona | `create()` | `create Zone` |
| PUT | `/zones/:id` | Actualizar zona | `update()` | `update Zone` |
| DELETE | `/zones/:id` | Soft delete | `delete()` | `delete Zone` |


---

## 3.2 Módulo de Categorías (`src/modules/categories/`)

### Archivos
| Archivo | Descripción |
|---------|-------------|
| `categories.module.ts` | Módulo de categorías |
| `categories.controller.ts` | Endpoints `/categories/*` |
| `categories.service.ts` | Lógica de negocio (CRUD) |
| `entities/categoria.entity.ts` | Entidad `tm_categoria` |
| `dto/create-category.dto.ts` | DTO creación |
| `dto/update-category.dto.ts` | DTO actualización |

### Endpoints

| Método | Ruta | Descripción | Params | Body (Ejemplo) |
|--------|------|-------------|--------|----------------|
| GET | `/categories` | Listar categorías | `?page=1&limit=10` | - |
| GET | `/categories/:id` | Ver categoría | - | - |
| POST | `/categories` | Crear categoría | - | `{"nombre": "Hardware", "estado": 1, "departamentoIds": [1, 2], "empresaIds": [1]}` |
| PUT | `/categories/:id` | Actualizar categoría | - | `{"nombre": "Hardware Updated", "departamentoIds": [1]}` |
| DELETE | `/categories/:id` | Soft Delete | - | - |

#### Filtros y Paginación (`GET /categories`)
- **`page`**: Número de página (ej: `?page=1`).
- **`limit`**: Resultados por página (ej: `?limit=10`).
- **`included`**: Relaciones: `subcategorias`, `departamentos`, `empresas`.
- **`filter[nombre]`**: Filtrar por nombre (LIKE).
- **`filter[estado]`**: Filtrar por estado (1=Activo, 0=Inactivo).

## 4. Testing con Postman

### Colección
Archivo: `postman/help-desk-api.postman_collection.json`

### Variables
| Variable | Valor Default |
|----------|---------------|
| `base_url` | `http://localhost:3000` |
| `token` | (se llena automáticamente al login) |

### Tests Incluidos
- Validación de status codes
- Verificación de estructura de respuesta
- Guardado automático del token después del login

---

## 4.1 Swagger UI (OpenAPI)

### Acceso
**URL:** `http://localhost:3000/api/docs`

### Configuración
Archivo: `src/main.ts`

```typescript
const config = new DocumentBuilder()
    .setTitle('Help Desk API')
    .setDescription('API REST del sistema Help Desk - Backend NestJS')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

### Decoradores Usados en Controllers
| Decorador | Propósito |
|-----------|-----------|
| `@ApiTags('Users')` | Agrupa endpoints por módulo |
| `@ApiBearerAuth()` | Indica autenticación JWT requerida |
| `@ApiOperation()` | Descripción de cada endpoint |
| `@ApiResponse()` | Códigos de respuesta esperados |
| `@ApiParam()` | Documentación de parámetros de ruta |
| `@ApiQuery()` | Documentación de query params |

---

## 5. ApiQueryHelper (Scopes Dinámicos estilo Laravel)

Se ha implementado una utilidad para estandarizar el filtrado y la carga de relaciones en todos los servicios, similar a cómo funcionan los scopes y el eager loading en Laravel.

### Ubicación
`src/common/utils/api-query-helper.ts`

### Uso en Servicios

```typescript
// 1. Definir listas blancas (seguridad)
private readonly allowedIncludes = ['regional', 'regional.zona', 'cargo'];
private readonly allowedFilters = ['nombre', 'email', 'cedula'];

// 2. Aplicar en el método findAll
async findAll(options: FindOptions) {
    const qb = this.repo.createQueryBuilder('entity');
    
    // Aplica JOINs automáticamente si están en la lista permitida
    // included: string separado por comas (ej: 'regional,cargo')
    ApiQueryHelper.applyIncludes(qb, options.included, this.allowedIncludes, 'entity');

    // Aplica WHERE LIKE automáticamente si están en la lista permitida
    // filter: objeto (ej: { nombre: 'Juan' })
    ApiQueryHelper.applyFilters(qb, options.filter, this.allowedFilters, 'entity');

    return qb.getMany();
}
```

### Uso en API (Frontend)

- **Incluir Relaciones:** `GET /resource?included=regional,regional.zona`
  - Carga el recurso, su regional y la zona de esa regional.
  - Maneja automáticamente alias únicos (`regional_zona`) para evitar colisiones.
  
- **Filtrar:** `GET /resource?filter[nombre]=Juan&filter[cedula]=123`
  - Aplica `AND (nombre LIKE '%Juan%') AND (cedula LIKE '%123%')`.

### Ventajas
- **DRY:** Elimina bloques `if` repetitivos en los servicios.
- **Seguro:** Solo permite filtrar/incluir lo definido en las listas blancas.
- **Robusto:** Maneja colisiones de nombres y errores de relaciones inexistentes (Code 400).

---

## 6. Comandos Útiles

```bash
# Desarrollo
pnpm run start:dev

# Build
pnpm run build

# Producción
pnpm run start:prod

# Tests
pnpm run test
```

---

## 7. Autorización con CASL (Punto 17 MCP)

### Concepto

CASL implementa **autorización basada en habilidades** (Capability-based). A diferencia de un simple check de rol, CASL responde:

> **¿Puede este usuario hacer *esta acción* sobre *este recurso*?**

### Arquitectura

```
Request → JwtAuthGuard (¿Quién eres?) → PoliciesGuard (¿Qué puedes hacer?) → Controller
```

### Archivos

| Archivo | Descripción |
|---------|-------------|
| `src/modules/auth/abilities/ability.factory.ts` | Define Actions, Subjects y reglas por rol |
| `src/modules/auth/decorators/check-policies.decorator.ts` | Decorador `@CheckPolicies()` |
| `src/common/guards/policies.guard.ts` | Guard que evalúa policies |

### Actions y Subjects

```typescript
// Acciones disponibles
type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete';

// Recursos del sistema
type Subjects = 'User' | 'Ticket' | 'Category' | 'Department' | 'Role' | 'Profile' | 'Regional' | 'Company' | 'all';
```

### Permisos por Rol

| Rol | rol_id | Permisos |
|-----|--------|----------|
| **Admin** | 1 | `manage all` (acceso total) |
| **Supervisor** | 4 | `read all`, `update User`, `update Ticket` |
| **Agente** | 2 | `read User/Ticket/Category/Department`, `update Ticket` |
| **Cliente** | 3 | `read Ticket/Category`, `create Ticket` |

### Uso en Controllers

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, PoliciesGuard)  // Ambos guards
export class UsersController {

    @Get()
    @CheckPolicies((ability) => ability.can('read', 'User'))
    async list() { ... }

    @Delete(':id')
    @CheckPolicies((ability) => ability.can('delete', 'User'))
    async delete() { ... }
}
```

### Respuestas de Error

| Código | Causa |
|--------|-------|
| 401 | Token JWT inválido o ausente |
| 403 | Usuario autenticado pero sin permisos |

### Modificar Permisos

Para cambiar los permisos de un rol, editar **solo** `ability.factory.ts`:

```typescript
case 2: // Agente
    can('read', 'Ticket');
    can('update', 'Ticket');
    can('read', 'User');
    // Agregar nuevos permisos aquí
    can('create', 'User');  // ← Nuevo permiso
    break;
```

### Principios Clave

1. **JWT solo identifica**, no define permisos
2. **Permisos centralizados** en `AbilityFactory`
3. **Controllers no tienen lógica de permisos** (usan decoradores)
4. **Services asumen autorización previa** (no verifican permisos)

---

## 8. Permisos Dinámicos (Admin API)

### Concepto

Los permisos ya no están hardcodeados en el código. Se almacenan en base de datos y se cargan en caché al iniciar la aplicación.

### Caché

- Se carga automáticamente al iniciar la app
- Se invalida automáticamente al modificar permisos de un rol
- Puede refrescarse manualmente via API

### Endpoints (requieren permiso `Permission`)

| Método | Ruta | Descripción | Permiso |
|--------|------|-------------|---------|
| GET | `/permissions` | Listar todos los permisos | `read Permission` |
| GET | `/permissions/role/:rolId` | Permisos de un rol | `read Permission` |
| PUT | `/permissions/role/:rolId` | Sincronizar permisos de rol | `update Permission` |
| POST | `/permissions/role/:rolId/:permisoId` | Agregar permiso a rol | `update Permission` |
| DELETE | `/permissions/role/:rolId/:permisoId` | Remover permiso de rol | `update Permission` |
| GET | `/permissions/cache/status` | Estado del caché | `manage Permission` |
| POST | `/permissions/cache/refresh` | Refrescar caché | `manage Permission` |

### Ejemplo: Sincronizar permisos de un rol

```http
PUT /permissions/role/2
Content-Type: application/json
Authorization: Bearer <token>

{
  "permisoIds": [1, 2, 5, 8, 12]
}
```

**Response:**
```json
{
  "synced": true,
  "rolId": 2,
  "count": 5
}
```

### Migración SQL

Archivo: `migrations/2026-01-18_dynamic_permissions.sql`

```bash
mysql -u root -p mesa_de_ayuda < migrations/2026-01-18_dynamic_permissions.sql
```

---

## Decisiones Técnicas

1. **`synchronize: false`** - No se modifica el esquema de la DB legacy
2. **Passwords con bcrypt** - Compatibles con `password_hash()` de PHP
3. **JWT stateless** - Sin refresh token por ahora (fase 1)
4. **Payload JWT legacy-compatible** - Replica variables de sesión PHP
5. **CASL para autorización** - Permisos declarativos y centralizados
6. **Permisos dinámicos** - Almacenados en BD con caché en memoria

---

## 3.3 Módulo de Empresas (`src/modules/companies/`)

### Archivos
| Archivo | Descripción |
|---------|-------------|
| `companies.module.ts` | Módulo de empresas |
| `companies.controller.ts` | Endpoints `/companies/*` |
| `companies.service.ts` | Lógica de negocio (CRUD) |
| `entities/empresa.entity.ts` | Entidad `td_empresa` |
| `dto/create-company.dto.ts` | DTO creación |
| `dto/update-company.dto.ts` | DTO actualización |

### Endpoints (requieren permiso `Company`)

| Método | Ruta | Descripción | Service Method | Body (Ejemplo) |
|--------|------|-------------|----------------|---------------|
| GET | `/companies` | Listar empresas | `list()` | - |
| GET | `/companies/:id` | Mostrar empresa | `show()` | - |
| POST | `/companies` | Crear empresa | `create()` | `{"nombre": "Tech", "usuariosIds": [1,2], "categoriasIds": [3]}` |
| PUT | `/companies/:id` | Actualizar empresa | `update()` | `{"nombre": "Tech Corp", "usuariosIds": [1]}` |
| DELETE | `/companies/:id` | Soft delete | `delete()` | - |

#### Filtros y Paginación (`GET /companies`)
- **`page`**: Número de página (ej: `?page=1`).
- **`limit`**: Resultados por página (ej: `?limit=10`).
- **`included`**: Relaciones: `usuarios`, `categorias`, `tickets`, `flujosPlantilla`.
- **`filter[nombre]`**: Filtrar por nombre (LIKE).
- **`filter[estado]`**: Filtrar por estado (1=Activo, 0=Inactivo).

---

## 3.4 Módulo de Departamentos (`src/modules/departments/`)

### Archivos
| Archivo | Descripción |
|---------|-------------|
| `departments.module.ts` | Módulo de departamentos |
| `departments.controller.ts` | Endpoints `/departments/*` |
| `departments.service.ts` | Lógica de negocio (CRUD) |
| `entities/departamento.entity.ts` | Entidad `tm_departamento` |
| `dto/create-department.dto.ts` | DTO creación |
| `dto/update-department.dto.ts` | DTO actualización |

### Endpoints (requieren permiso `Department`)

| Método | Ruta | Descripción | Service Method | Body (Ejemplo) |
|--------|------|-------------|----------------|---------------|
| GET | `/departments` | Listar departamentos | `list()` | - |
| GET | `/departments/:id` | Mostrar departamento | `show()` | - |
| POST | `/departments` | Crear departamento | `create()` | `{"nombre": "Soporte", "categoriaIds": [1,2]}` |
| PUT | `/departments/:id` | Actualizar departamento | `update()` | `{"nombre": "Soporte N2", "categoriaIds": [3]}` |
| DELETE | `/departments/:id` | Soft delete | `delete()` | - |

#### Filtros y Paginación (`GET /departments`)
- **`page`**: Número de página (ej: `?page=1`).
- **`limit`**: Resultados por página (ej: `?limit=10`).
- **`included`**: Relaciones: `usuarios`, `categorias`, `tickets`.
- **`filter[nombre]`**: Filtrar por nombre (LIKE).
- **`filter[estado]`**: Filtrar por estado (1=Activo, 0=Inactivo).

---

## 3.5 Módulo de Prioridades (`src/modules/priorities/`)

### Archivos
| Archivo | Descripción |
|---------|-------------|
| `priorities.module.ts` | Módulo de prioridades |
| `priorities.controller.ts` | Endpoints `/priorities/*` |
| `priorities.service.ts` | Lógica de negocio (CRUD) |
| `entities/prioridad.entity.ts` | Entidad `td_prioridad` |
| `dto/create-priority.dto.ts` | DTO creación |
| `dto/update-priority.dto.ts` | DTO actualización |

### Endpoints (requieren permiso `Priority`)

| Método | Ruta | Descripción | Service Method | Body (Ejemplo) |
|--------|------|-------------|----------------|---------------|
| GET | `/priorities` | Listar prioridades | `list()` | - |
| GET | `/priorities/:id` | Mostrar prioridad | `show()` | - |
| POST | `/priorities` | Crear prioridad | `create()` | `{"nombre": "Alta", "estado": 1}` |
| PUT | `/priorities/:id` | Actualizar prioridad | `update()` | `{"nombre": "Crítica"}` |
| DELETE | `/priorities/:id` | Soft delete | `delete()` | - |

#### Filtros y Paginación (`GET /priorities`)
Soporta parámetros unificados para filtrado y carga de relaciones:

- **`page`**: Número de página (Default: 1).
- **`limit`**: Resultados por página (Default: 10).
- **`included`**: Relaciones a cargar (separadas por comas).
    - Valores permitidos: `subcategoria`, `tickets`.
- **`filter`**: Filtros dinámicos (clave-valor).
    - `filter[id]`: ID único o lista CSV (`1,2,3`).
    - `filter[nombre]`: Nombre de la prioridad (Búsqueda parcial `LIKE`).
    - `filter[estado]`: Estado (1=Activo, 0=Inactivo).

**Ejemplos:**
- Listar todas las activas: `GET /priorities?filter[estado]=1`
- Buscar por nombre: `GET /priorities?filter[nombre]=Alta`
- Incluir tickets relacionados: `GET /priorities?included=tickets`

---

## 3.6 Módulo de Cargos (`src/modules/positions/`)

### Archivos
| Archivo | Descripción |
|---------|-------------|
| `positions.module.ts` | Módulo de cargos |
| `positions.controller.ts` | Endpoints `/positions/*` |
| `positions.service.ts` | Lógica de negocio (CRUD) |
| `entities/cargo.entity.ts` | Entidad `tm_cargo` |
| `dto/create-position.dto.ts` | DTO creación |
| `dto/update-position.dto.ts` | DTO actualización |

### Endpoints (requieren permiso `Position`)

| Método | Ruta | Descripción | Service Method | Body (Ejemplo) |
|--------|------|-------------|----------------|---------------|
| GET | `/positions` | Listar cargos | `list()` | - |
| GET | `/positions/:id` | Mostrar cargo | `show()` | - |
| POST | `/positions` | Crear cargo | `create()` | `{"nombre": "Administrador", "estado": 1}` |
| PUT | `/positions/:id` | Actualizar cargo | `update()` | `{"nombre": "Super Admin"}` |
| DELETE | `/positions/:id` | Soft delete | `delete()` | - |

#### Filtros y Paginación (`GET /positions`)
Soporta parámetros unificados:

- **`page`**: Número de página.
- **`limit`**: Resultados por página.
- **`included`**: Relaciones (`usuarios`, `organigrama`).
- **`filter[nombre]`**: Filtrar por nombre (LIKE).
- **`filter[estado]`**: Filtrar por estado (1=Activo, 0=Inactivo).

---

## 3.7 Módulo de Perfiles (`src/modules/profiles/`)

### Archivos
| Archivo | Descripción |
|---------|-------------|
| `profiles.module.ts` | Módulo de perfiles |
| `profiles.controller.ts` | Endpoints `/profiles/*` |
| `profiles.service.ts` | Lógica de negocio (CRUD + User Profiles) |
| `entities/perfil.entity.ts` | Entidad `tm_perfil` |
| `entities/usuario-perfil.entity.ts` | Entidad pivot `tm_usuario_perfiles` |
| `dto/create-profile.dto.ts` | DTO creación |
| `dto/update-profile.dto.ts` | DTO actualización |

### Endpoints (requieren permiso `Profile`)

| Método | Ruta | Descripción | Service Method | Body (Ejemplo) |
|--------|------|-------------|----------------|---------------|
| GET | `/profiles` | Listar perfiles | `list()` | - |
| GET | `/profiles/:id` | Mostrar perfil | `show()` | - |
| POST | `/profiles` | Crear perfil | `create()` | `{"nombre": "Analista", "estado": 1}` |
| PUT | `/profiles/:id` | Actualizar perfil | `update()` | `{"nombre": "Director"}` |
| DELETE | `/profiles/:id` | Soft delete | `delete()` | - |

#### Endpoint Usuario-Perfiles

| Método | Ruta | Descripción | Implementación |
|--------|------|-------------|----------------|
| GET | `/profiles/user/:userId` | Listar perfiles de un usuario | `list({ filter: { usuarioId } })` |

> **Nota:** Para sincronizar perfiles de un usuario, usar `perfilIds` en `POST /users` o `PUT /users/:id`

#### Filtros y Paginación (`GET /profiles`)
- **`page`**: Número de página.
- **`limit`**: Resultados por página.
- **`included`**: Relaciones (`usuarioPerfiles`, `usuarioPerfiles.usuario`).
- **`filter[id]`**: Filtrar por ID(s).
- **`filter[nombre]`**: Filtrar por nombre (LIKE).
- **`filter[estado]`**: Filtrar por estado.
- **`filter[usuarioId]`**: Listar perfiles asignados a un usuario específico.

---

## 3.8 Módulo de Regiones (`src/modules/regions/`)

### Archivos
| Archivo | Descripción |
|---------|-------------|
| `regions.module.ts` | Módulo de regiones |
| `regions.controller.ts` | Endpoints `/regions/*` |
| `regions.service.ts` | Lógica de negocio (CRUD) |
| `entities/regional.entity.ts` | Entidad `tm_regional` |
| `dto/create-regional.dto.ts` | DTO creación |
| `dto/update-regional.dto.ts` | DTO actualización |

### Endpoints (requieren permiso `Regional`)

| Método | Ruta | Descripción | Service Method | Body (Ejemplo) |
|--------|------|-------------|----------------|---------------|
| GET | `/regions` | Listar regionales | `list()` | - |
| GET | `/regions/:id` | Mostrar regional | `show()` | - |
| POST | `/regions` | Crear regional | `create()` | `{"nombre": "Regional Norte", "zonaId": 1}` |
| PUT | `/regions/:id` | Actualizar regional | `update()` | `{"nombre": "Regional Sur"}` |
| DELETE | `/regions/:id` | Soft delete | `delete()` | - |

#### Filtros y Paginación (`GET /regions`)
- **`page`**: Número de página.
- **`limit`**: Resultados por página.
- **`included`**: Relaciones (`zona`, `usuarios`).
- **`filter[nombre]`**: Filtrar por nombre (LIKE).
- **`filter[estado]`**: Filtrar por estado.
- **`filter[zonaId]`**: Filtrar por zona.

