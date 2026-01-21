# Help Desk API - Documentación

## 2026-01-20: Workflow Engine Enhancements (Completed)

### Summary
Implemented critical legacy functionalities for the Workflow Engine to support manual assignment and approval flows.

### Technical Detail
1. **Manual Assignment (`checkStartFlow`)**:
   - Implemented `checkStartFlow` in `WorkflowEngineService`.
   - Checks if the initial step has explicit users (`step.usuarios`) or a specific role (`step.cargoAsignadoId`).
   - Returns a list of candidates (`UserCandidateDto[]`) for the frontend to present a selection UI.
   - Endpoint: `GET /workflows/check-start-flow/:subcategoriaId`

2. **Approval Flow (`approveFlow`)**:
   - Implemented `approveFlow` to handle Boss Approvals.
   - Validates `usuarioJefeAprobadorId` matches the requester.
   - Transitions ticket using 'aprobado' key.
   - Fallback logic: If 'aprobado' transition fails, searches for the next non-approval step.
   - Endpoint: `POST /workflows/approve-flow/:ticketId`

3. **Entity Improvements**:
   - Corrected property name `usuarioIdJefeAprobador` -> `usuarioJefeAprobadorId` in `Ticket` entity to match column usage.
   - Used `step.usuarios` relation instead of legacy `pasoFlujoUsuarios`.

### Testing
- Unit tests added for logic in `workflow-engine.service.spec.ts`.
- Controller tests added in `workflow.controller.spec.ts`.

---

## 2026-01-20: Ticket Listing & History (Completed)

### Summary
Backfilled missing functionality in `TicketListingService` and `TicketHistoryService` to match legacy capabilities, including precise filtering, assignee name resolution, and signed document tracking.

### Technical Detail
1. **Ticket Listing (`TicketListingService`)**:
   - Implemented view-based scopes (`CREATED`, `ASSIGNED`, `ALL`, `ERRORS_REPORTED`, `ERRORS_RECEIVED`).
   - Added automatic assignee name resolution: Legacy stores IDs as "1,2,3", service maps these to "Real Name (+N)".
   - Optimized eager loading with `TicketEtiqueta` (Tags).

2. **Ticket History (`TicketHistoryService`)**:
   - Merged timeline from three sources: 
     - `TicketDetalle` (Comments/Logs)
     - `TicketAsignacionHistorico` (Events)
     - `DocumentoFlujo` (Signed Documents) - **New Implementation**
   - Implemented `getLastSignedDocument(ticketId)` helper for UI usage.

### Testing
- **Filters**: Verified correct query building for different user roles and views.
- **Timeline**: Verified correct chronological merging of heterogeneous events (Signed Docs, Assignments, Comments).
- **Unit Tests**: `ticket-listing.service.spec.ts` and `ticket-history.service.spec.ts` added and passed.

---

## 2026-01-20: KPI & Statistics System (Completed)

### Summary
Implemented robust statistical analysis and hierarchical scoping for the Dashboard.

### Technical Detail
1. **Hierarchical Scope (`getScope`)**:
   - **Recursive Logic**: If user has Subordinates (checked via `Organigrama` entity), recursively fetches all cargo IDs in the subtree.
   - **Boss View**: Managers see tickets from all users in their hierarchy tree.
   - **Agent/Client View**: Fallback to self-only (Agent sees assigned, Client sees created).

2. **Median Response Time (`getMedianResponseTime`)**:
   - Implemented Median calculation (not Average) to exclude outliers.
   - Computes time difference (Minutes) between `Creation` and `Closure` for closed tickets.
   - Sorts values and picks the middle element (or average of two middle elements).

3. **Dynamic Grouping (`getGroupedStats`)**:
   - Added `cargo` grouping to existing `department`, `category`, and `user`.
   - Supports aggregation for charts.

4. **API Endpoints**:
   - `GET /statistics/dashboard`: Main endpoint for charts and counters.
   - `GET /statistics/median-response-time`: Specific endpoint for the median metric.
   - `GET /statistics/ticket/:id/performance`: Granular step-by-step metrics.

### Testing
- **Unit Logic**: `ticket-statistics.service.spec.ts` verifies:
  - Recursive ID fetching (simulated 3-level depth).
  - Median calculation algorithm with odd/even datasets.
  - Basic role scope.

---

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

#### Respuesta Exitosa (200 OK)
```json
{
  "usu_id": 1,
  "usu_correo": "admin@helpdesk.com",
  "rol_id": 1,
  "reg_id": 1,
  "car_id": 1,
  "dp_id": 1,
  "es_nacional": true,
  "nombre": "Alexander",
  "apellido": "Pardo",
  "permissions": [
    {
      "action": "manage",
      "subject": "all"
    }
  ],
  "role": {
    "id": 1,
    "nombre": "Admin"
  },
  "cargo": {
    "id": 1,
    "nombre": "Desarrollador"
  },
  "regional": {
    "id": 1,
    "nombre": "Bogotá"
  },
  "departamento": {
    "id": 1,
    "nombre": "Sistemas"
  }
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
| `POST` | `/permissions` | Crear definición permiso | `create Permission` |
| `PUT` | `/permissions/:id` | Editar definición permiso | `update Permission` |
| `DELETE` | `/permissions/:id` | Eliminar definición permiso | `delete Permission` |

#### `SyncRolePermissionsDto` (para Sincronizar Rol)
```json
{
  "permisoIds": [1, 2, 3]  // IDs de los permisos a asignar
}
```

#### `CreatePermissionDto` (para Crear Permiso)
```json
{
  "nombre": "Crear Reportes",
  "action": "create",
  "subject": "Reports",
  "descripcion": "Puede crear reportes"
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


## 7. Módulo de Reportes SQL (`src/modules/reports/`)

Gestión de consultas SQL personalizadas para generación de informes.

### Entidad Consulta (mapeada a `tm_consulta`)
```typescript
@Entity('tm_consulta')
export class Consulta {
  id: number;          // cons_id
  nombre: string;      // cons_nom
  sql: string;         // cons_sql
  estado: number;      // est (1: Activo, 0: Eliminado)
}
```

### Endpoints (`ReportsController`)

| Método | Ruta | Descripción | Permiso Requ |
|--------|------|-------------|--------------|
| `GET` | `/reports` | Listar reportes | `read Report` |
| `GET` | `/reports/:id` | Ver reporte | `read Report` |
| `POST` | `/reports` | Guardar SQL | `create Report` |
| `PUT` | `/reports/:id` | Modificar SQL | `update Report` |
| `DELETE` | `/reports/:id` | Soft delete | `delete Report` |

#### Body de Ejemplo (POST/PUT)
```json
{
  "nombre": "Conteo de Tickets",
  "sql": "SELECT COUNT(*) FROM tm_ticket WHERE est = 1"
}
```

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

## 9. Módulo de Estadísticas (`src/modules/reports/`)

### Objetivos
Reemplazar la lógica legacy de `Kpi.php` por un servicio limpio basado en QueryBuilder y DTOs, capaz de calcular KPIs dinámicos y métricas de desempeño.

### 9.1 Endpoints (`StatisticsController`)

Prefix: `/statistics` (requiere permiso `Report`)

| Método | Ruta | Descripción | Params |
|--------|------|-------------|--------|
| `GET` | `/statistics/dashboard` | Dashboard de KPIs | `?dateFrom=...&groupBy=department` |
| `GET` | `/statistics/ticket/:id/performance` | Métricas de Tiempos | `id` (Ticket ID) |

### 9.2 Request: Dashboard Filters (`DashboardFiltersDto`)
```json
{
  "dateFrom": "2026-01-01",
  "dateTo": "2026-01-31",
  "groupBy": "department" // 'category', 'user', 'priority'
}
```

### 9.3 Response: Dashboard Stats (`DashboardStatsDto`)
```json
{
  "openCount": 150,
  "closedCount": 50,
  "totalCount": 200,
  "dataset": [
    { "label": "Sistemas", "value": 120, "id": 1 },
    { "label": "Recursos Humanos", "value": 80, "id": 2 }
  ]
}
```

### 9.4 Response: Performance Metrics (`StepMetricDto[]`)
```json
[
  {
    "stepName": "Paso 1",
    "durationMinutes": 45,
    "startDate": "2026-01-20T10:00:00.000Z",
    "endDate": "2026-01-20T10:45:00.000Z",
    "assignedUser": "Juan Perez"
  }
]
```

### 9.5 Estructura del Servicio (`TicketStatisticsService`)

- **`getScope(user)`**: Determina si el usuario ve 'all' o solo sus tickets, basado en reglas de rol.
- **`getDashboardStats(user, filters)`**: Aplica el scope + filtros y ejecuta agregaciones (COUNT, GROUP BY).
- **`getPerformanceMetrics(ticketId)`**: Analiza `th_ticket_asignacion` para calcular la duración entre reasignaciones.

---

## Decisiones Técnicas

1. **`synchronize: false`** - No se modifica el esquema de la DB legacy
2. **Passwords con bcrypt** - Compatibles con `password_hash()` de PHP
3. **JWT stateless** - Sin refresh token por ahora (fase 1)
4. **Payload JWT legacy-compatible** - Replica variables de sesión PHP
5. **CASL para autorización** - Permisos declarativos y centralizados
6. **Permisos dinámicos** - Almacenados en BD con caché en memoria

---

## 12. Módulo de Asignaciones (AssignmentModule)

Este módulo encapsula la lógica para determinar "quién debe atender un ticket". Se utiliza principalmente durante la creación del ticket y transiciones de flujo.

### 12.1 AssignmentService

Servicio encargado de resolver usuarios destino basados en reglas de negocio.

#### Métodos Clave

- `resolveJefeInmediato(userId: number): Promise<number | null>`
  - Determina el jefe del usuario basado en el `tm_organigrama`.
  - Prioriza asignar un jefe que esté en la misma `regional` del usuario.
  - Si no encuentra en la misma regional, busca cualquiera activo con el cargo superior.
  
- `resolveRegionalAgent(cargoId: number, regionalId: number): Promise<number | null>`
  - Busca un usuario con un cargo específico en una regional específica.
  - Útil para flujos distribuidos (ej. "Coordinador de Soporte - Norte").

### 12.2 Integración
*   **TicketService**: Al crear un ticket (`create`), si no se especifica `usuarioAsignadoId`, el sistema llama automáticamente a `resolveJefeInmediato`.

---

## Fase 8: Módulo de Empresas (CRUD)
`src/modules/companies/`)

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


---

## 2026-01-19 - Análisis de Migración Legacy Models

### Contexto
Se ha iniciado el proceso de análisis exhaustivo de los modelos PHP Legacy (`legacy_models/*.php`) para garantizar una migración 1:1 de la lógica de negocio y estructura de datos.

### Acciones Realizadas
1.  **Branch Created**: `migrate/legacy-models-2026-01-19`
2.  **Legacy Entities**: Creación de carpeta `src/modules/_legacy_entities/` para almacenar definiciones puras de la estructura original.
3.  **Análisis Ticket.php**: 
    - Se documentó la lógica de 32KB del modelo original.
    - Se identificaron métodos críticos (`update_asignacion`, `cerrar_ticket`).
    - Se creó `LegacyTicketModel` interface para documentar contratos.
    - Se mapeó `TicketLegacy` entity con JSDoc detallado de comportamientos antiguos (ej: `usu_asig` string CSV).
4.  **Flows**: Se definieron los endpoints y tests necesarios para replicar la funcionalidad.

### Próximos Pasos de Migración
- Validar `Flujo.php` (Legacy) vs `Workflow` modules.
- Implementar los repositorios/servicios basados en las interfaces `Legacy*Model`.

### Avance Usuario.php
- **Análisis**: Completado en `migrations/Usuario/Usuario.analysis.md`.
- **Entity**: `UsuarioLegacy` creada.
- **Model**: `LegacyUsuarioModel` interface creada.

### Avance Workflows (Flujo, Paso, Transición, Ruta)
- **Análisis**: Detallado en `migrations/Workflow/Workflow.analysis.md`.
- **Entities**: Grupo unificado en `workflow.entities.ts`.
- **Model**: Interface `LegacyWorkflowModel` que soporta lógica de navegación y resolución de asignación.

### Avance Documents & KPI
- **Documents**: Análisis de 3 tipos de adjuntos y lógica de firma. `Document.analysis.md` y `LegacyDocumentModel`.
- **KPI**: Análisis del motor de BI, scope jerárquico y estadísticas dinámicas. `Kpi.analysis.md` y `LegacyKpiModel`.

### Avance TicketService (Orquestador Principal)
- **Archivo**: `TicketService.php` (2633 líneas, 132KB).
- **Análisis**: Detallado en `migrations/TicketService/TicketService.analysis.md`.
- **Funciones Críticas**: `createTicket()`, `handleDynamicFields()`, `actualizar_estado_ticket()`.
- **Entidades Relacionadas**: `CampoPlantillaLegacy`, `TicketCampoValorLegacy`, `NotificacionLegacy`, `TicketParaleloLegacy`.

### Avance Legacy Services (Soporte)
- **TicketListing**: `TicketLister.php` y `TicketDetailLister.php`. Análisis de queries complejas y formateo HTML/Datatables. `TicketListingService.analysis.md`.
- **TicketWorkflow**: `TicketWorkflowService.php`. Motor de avance de pasos, SLA y lógica de asignación regional/nacional. `TicketWorkflowService.analysis.md`.
- **PdfService**: `PdfService.php`. Estampado de firmas y campos dinámicos. `PdfService.analysis.md`.
- **DocumentoFlujo**: Nueva entidad `DocumentoFlujoLegacy` para PDFs firmados en pasos del flujo.

### Avance Modelos Pequeños
- **Organigrama**: Jerarquía de cargos para "Jefe Inmediato".
- **Etiqueta**: Tags personalizados por usuario.
- **TicketError**: Reporte de errores (Proceso vs Info).
- **Consolidado**: `migrations/SmallModels/SmallModels.analysis.md`.

> [!NOTE]
> Todas las interfaces legacy (`*.legacy.model.ts`) se han centralizado en `src/modules/_legacy_interfaces/` para evitar confusión con los modelos definitivos de NestJS.
> Las entidades legacy (`*.entity.ts`) residen en `src/modules/_legacy_entities/`.

### Resumen de Cobertura (32 archivos legacy_models)
| Estado | Cantidad | Descripción |
|--------|----------|-------------|
| ✅ Analizados | 20+ | Con análisis MD y entidades legacy |
| ✅ Ya NestJS | 11 | Implementados previamente (Cargo, Categoria, etc.) |
| 🟠 Pendientes | ~4 | Utilities (DateHelper, Email) |

## Módulo de Tickets (Implementación Fase 20)

### 1. Ticket Listing Service
Reemplaza a `TicketLister.php`. Provee endpoints optimizados para bandejas.

#### Endpoints
- **GET** `/tickets/list` (**NUEVO - Maestro**): Listado unificado con soporte de vistas dinámicas.
    - Param `view`: `all` | `created` | `assigned` | `observed` | `errors_reported` | `errors_received`
    - Param `search`, `status`, `dateFrom`, `dateTo`, etc.
    - **Seguridad**: Si un usuario pide `view=all` pero no tiene permisos, el sistema automáticamente le muestra `created` o `assigned` (Fallback seguro).

#### DTOs Clave
- `TicketFilterDto`: Soporta filtros por `status`, `search` (multi-campo), `dateFrom`, `dateTo`, `categoryId`, etc.
- `TicketListItemDto`: Estructura plana para listados. Incluye etiquetas (`TicketTagDto`).

### 2. Ticket History Service
Reemplaza a `TicketDetailLister.php`. Construye la línea de tiempo unificada.

#### Endpoints
- **GET** `/tickets/:id/timeline`: Retorna eventos cronológicos (Comentarios + Asignaciones).

#### DTOs Clave
- `TicketTimelineItemDto`: Objeto polimórfico (`type`: comment | assignment).

---

### 3. Workflow Engine Service
Reemplaza a `TicketWorkflowService.php`. Motor de transiciones de estado.
### 13.5 Historial de Ticket (Timeline)
`TicketHistoryService` consolida eventos de múltiples fuentes en una sola línea de tiempo ordenada cronológicamente:
1.  **Comentarios y Logs (`tm_ticketdetalle`)**: Mensajes de texto ingresados por usuarios o el sistema.
    - **Adjuntos**: Ahora se recuperan mediante la relación `documentos` (entidad `DocumentoDetalle`), eliminando la lógica legacy de parseo de texto con pipes (`|`).
    - Se exponen como un array de objetos `{id, nombre, url}`.
2.  **Asignaciones (`th_ticket_asignacion`)**: Cambios de responsable y reasignaciones automáticas.
3.  **Cambios de Estado**: (Pendiente de refactorizar desde log de texto a eventos estructurados).

El endpoint `GET /tickets/:id/history` retorna esta lista unificada tipada como `TicketTimelineItemDto[]`.

#### Endpoints
- **POST** `/workflows/transition`: Ejecuta una transición de paso.

#### DTOs Clave
- `TransitionTicketDto`:
  - `ticketId`: ID del ticket.
  - `transitionKeyOrStepId`: ID del siguiente paso o palabra clave.
  - `comentario`: Justificación (opcional).
- `WorkflowEngineService`:
  - `transitionStep()`: Valida paso actual, calcula siguiente paso, resuelve asignación automática y actualiza ticket.

### 4. Ticket Orchestrator Service
Reemplaza a `TicketService.php`. CRUD y coordinación principal.

#### Endpoints
- **POST** `/tickets`: Crea un nuevo ticket (Estado: Abierto, Paso Inicial).
- **PUT** `/tickets/:id`: Actualiza campos del ticket.
- **GET** `/tickets/:id`: Obtiene detalle completo (incluyendo paso actual).

#### DTOs Clave
- `CreateTicketDto`:
  - `usuarioId`, `categoriaId`, `titulo`, `descripcion`: Obligatorios.
  - `subcategoriaId`, `prioridadId`: Opcionales.
- `UpdateTicketDto`: Partial de creación.

---

## 14. Orquestación de Creación de Tickets

La creación de un ticket (`TicketService.create`) ya no es una simple inserción en base de datos. Es un proceso orquestado que asegura que el ticket nazca "vivo" y en el estado correcto.

### 14.1 Flujo de Creación
1. **Recuperación de Contexto**: Se obtienen los datos del usuario creador (Empresa, Departamento, Regional).
2. **Pre-guardado**: Se crea la entidad `Ticket` con estado `Abierto` (1) pero sin paso ni asignado definitivo.
3. **Inicio de Workflow**: Se invoca `WorkflowEngineService.startTicketFlow(ticket)`.
    - Determina el paso inicial de la subcategoría.
    - Resuelve quién debe atenderlo (Jefe, Agente, etc.).
    - Actualiza el ticket con `pasoActualId` y `usuarioAsignadoIds`.
    - Genera el primer registro en el historial.
4. **Generación Documental (Opcional)**: Si el flujo tiene una plantilla PDF configurada (`FlujoPlantilla`), se invoca `PdfStampingService` para crear el documento inicial con los datos básicos y campos configurados en el paso 1.

### 14.2 Beneficios
- **Tickets nunca huérfanos**: Todos los tickets nacen asignados y en un paso válido.
- **Reglas Centralizadas**: Si cambia la regla de "Jefe Inmediato", aplica automáticamente a nuevos tickets.
- **Trazabilidad Total**: Desde el milisegundo 0, existe un registro en `tm_ticket_asignacion`.

---

### Legacy Services Migrados (Estado Actual)
| Legacy File | Nuevo Servicio NestJS | Estado |
|-------------|-----------------------|--------|
| `TicketLister.php` | `TicketListingService` | ✅ Completado |
| `TicketDetailLister.php` | `TicketHistoryService` | ✅ Completado |
| `TicketWorkflowService.php` | `WorkflowEngineService` | ✅ Completado |
| `TicketService.php` | `TicketService` | ✅ Completado |

---

## 9. Guía de Integración Frontend 🚀

Si estás integrando el frontend (React/Angular/Vue), sigue estos flujos recomendados:

### 1. Autenticación
1.  Llama a `POST /auth/login` con email/password.
2.  Guarda el `accessToken` en LocalStorage.
3.  Incluye el header `Authorization: Bearer <token>` en TODAS las peticiones subsiguientes.
4.  Llama a `GET /auth/profile` para obtener datos del usuario (Rol, Regional, etc.) y guardarlos en el estado global (Context/Redux/Pinia).

### 2. Listado de Tickets (Dashboard)
*   **Mis Tickets (Usuario):** `GET /tickets/list/user`
*   **Inbox (Agente):** `GET /tickets/list/agent`
*   **Gestión (Admin/Super):** `GET /tickets/list/all`
    *   Usa params para navegar: `page=1&limit=10`
    *   Filtra dinámicamente: `status=Abierto&search=impresora`

### 3. Ver Detalle de Ticket
Para renderizar la vista completa de un ticket, necesitas llamar a dos endpoints en paralelo:
1.  **Datos Principales:** `GET /tickets/:id` (Título, Descripción, Paso Actual, SLA).
2.  **Línea de Tiempo:** `GET /tickets/:id/timeline` (Comentarios, Cambios de estado, Historial).

### 4. Crear Ticket
1.  Carga catálogos necesarios (Categorías, Prioridades).
2.  Llama a `POST /tickets`.
    *   No envíes `empresaId`, `departamentoId` ni `regionalId` a menos que sea un caso especial; el backend lo resuelve por el usuario creador.

### 5. Flujo de Workflow (Aprobar/Rechazar/Avanzar)
1.  El campo `pasoActual` del ticket indica dónde está.
2.  Si el usuario tiene permiso (es Agente asignado o Supervisor), muestra botones de acción.
3.  Al hacer clic (ej. "Aprobar"), llama a `POST /workflows/transition`:
    ```json
    {
      "ticketId": 123,
      "transitionKeyOrStepId": "Aprobar", // O el ID del siguiente paso si lo conoces
      "comentario": "Todo en orden"
    }
    ```

---

## 15. Módulo de Plantillas (Motor PDF)

El módulo `TemplatesModule` provee la infraestructura para generar documentos PDF dinámicos, una funcionalidad crítica heredada de la versión legacy (FPDF).

### 15.1 Arquitectura `pdf-lib`
Se eligió `pdf-lib` sobre librerías como `pdfkit` o `puppeteer` por:
- **Manipulación de PDFs existentes**: Capacidad nativa de "estampar" sobre plantillas (`.pdf` base).
- **Rendimiento**: Opera sobre `Uint8Array` sin leaks de memoria.
- **Portabilidad**: 100% JavaScript/TypeScript, sin dependencias binarias (ej: ImageMagick).

### 15.2 Servicios Core

#### `PdfStampingService`
Servicio de bajo nivel para manipulación vectorial.
- **Método**: `stampPdf(inputPath, texts, outputPath?)`
- **Lógica**: Carga un PDF, inserta texto usando coordenadas Cartesianas (Y=0 es abajo, con autoconversión desde sistema legacy Top-Left).
- **Entrada**: Array de coordenadas `{x, y, text, page}`.

#### `TemplatesService`
Servicio de dominio que conecta la base de datos con el motor PDF.
- **Recuperación de Configuración**: `getPdfFieldsForStep(pasoId)` consulta `tm_campo_plantilla` buscando campos con coordenadas válidas.
- **Resolución de Plantilla**: `getTemplateForFlow` determina qué archivo base usar según la Empresa y el Flujo.

### 15.3 Integración Futura
Este módulo será consumido por el `WorkflowEngineService` en transiciones clave (ej: "Firmar Documento" o "Finalizar Ticket") para generar los PDFs anexos al ticket automáticamente.

## 16. Módulo de Notificaciones

El sistema cuenta con una arquitectura de notificaciones centralizada que soporta múltiples canales (Email y DB/In-App).

### 16.1 Arquitectura
- **NotificationsService (Facade)**: Único punto de entrada para emitir notificaciones. Orquesta a los sub-servicios.
- **InAppNotificationsService**: Persiste mensajes en la tabla `tm_notificacion` para mostrarse en el frontend (campana, historial).
- **EmailService**: Maneja el transporte SMTP mediante `@nestjs-modules/mailer` y `nodemailer`.

### 16.2 Canales
1. **Email Transaccional**:
    - Asignación de Ticket.
    - Cambio de Estado (pendiente).
    - Cierre (pendiente).
    - Requiere configuración SMTP en `.env`.
2. **In-App (Base de Datos)**:
    - Registro histórico de alertas.
    - Estados: `2` (Nueva/Pendiente Push), `1` (Enviada/No leída), `0` (Leída).

### 16.3 Integración
El módulo se inyecta en:
- `TicketsModule`: Notifica al creador tras la generación exitosa (`TicketService.create`).
- `WorkflowsModule`: Notifica al agente/responsable cada vez que el ticket transiciona o se asigna (`WorkflowEngineService.transitionStep` y `startTicketFlow`).

---

## 17. Módulo de Gestión Documental (`src/modules/documents/`)

### Objetivo
Proporcionar un mecanismo centralizado y seguro para el almacenamiento y recuperación de archivos adjuntos asociados a Tickets, Comentarios y Cierres. Se elimina la dispersión de lógica de archivos del sistema legacy.

### Arquitectura
- **StorageService**: Abstracción de bajo nivel que maneja el sistema de archivos físico (`fs`). Actualmente usa almacenamiento local en `public/documentos/{ticketId}/`, pero está diseñado para facilitar la migración a S3/Cloud Storage.
- **DocumentsService**: Lógica de negocio. Registra los metadatos del archivo en la base de datos (`tm_documento`, `td_documento_detalle`, `td_documento_cierre`) y coordina con `StorageService`.
- **DocumentsController**: Exposición API. Maneja subidas (via `Multer`) y descargas seguras (streaming).

### Integración con Tickets
El módulo se integra directamente con `TicketService` para:
- Registrar automáticamente los PDFs de tickets generados por el sistema.
- Permitir adjuntar archivos durante el ciclo de vida del ticket.

### Endpoints (`DocumentsController`)

| Método | Ruta | Descripción | Permiso Requ | Body (Multipart) |
|--------|------|-------------|--------------|------------------|
| `POST` | `/documents/ticket/:ticketId` | Subir adjunto principal al ticket | `update Ticket` | `file`: (binary) |
| `POST` | `/documents/comment/:detailId` | Subir adjunto a un comentario | `update Ticket` | `file`: (binary) |
| `POST` | `/documents/closing/:ticketId` | Subir adjunto de cierre | `update Ticket` | `file`: (binary) |
| `GET` | `/documents/:type/:id/download` | Descargar archivo | `read Ticket` | - |

**Tipos para descarga (`:type`):**
- `ticket`: Documentos principales (`tm_documento`)
- `detail`: Adjuntos de comentarios (`td_documento_detalle`)
- `closing`: Adjuntos de cierre (`td_documento_cierre`)

### Seguridad (CASL)
- **Subidas**: Requieren permiso `update` sobre el recurso `Ticket`.
- **Descargas**: Requieren permiso `read` sobre el recurso `Ticket` asociado.
- **Validación de Archivos**: Se utiliza `Interceptor` de NestJS para manejar `multipart/form-data`.

### Almacenamiento Físico
Los archivos se organizan por ID de ticket para evitar directorios con millones de archivos:
`public/documentos/{ticketId}/{filename}`

---

## 18. Notificaciones en Tiempo Real (WebSockets)

### Objetivo
Permitir a los clientes (Frontend) recibir actualizaciones inmediatas sobre eventos críticos (Asignaciones, Cierre de Tickets) sin necesidad de polling.

### Tecnología
- **Protocolo:** Socket.IO
- **Librería Backend:** `@nestjs/websockets` + `socket.io`
- **Autenticación:** JWT (Reutiliza el mismo token del login REST)

### 18.1 Conexión

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  query: {
    token: 'JWT_ACCESS_TOKEN'
  }
});
// Nota: Se puede usar query param 'token' o header Authorization

socket.on('connect', () => {
  console.log('Conectado a notificaciones');
});
```

### 18.2 Eventos

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `new_notification` | `{ mensaje: string, ticketId: number, fecha: Date }` | Se envía al usuario específico cuando se le asigna un ticket o recibe una actualización directa. |

### 18.3 Seguridad
- El Gateway valida el JWT en el momento de la conexión (`handleConnection`).
- Si el token es inválido o expira, el servidor desconecta el socket automáticamente.
- Cada usuario se une a una sala privada `user_{usu_id}` para recibir solo sus mensajes.

---

## 19. Automatización de SLA (SLA Service)

### Objetivo
Monitorear el tiempo que un ticket pasa en cada paso y realizar acciones automáticas si se excede el tiempo límite (`horasSla`).

### Componentes
- **`SlaService`**: Lógica de cálculo de tiempos y ejecución de escalamientos.
- **`SlaSchedulerService`**: Cron Job que ejecuta la revisión cada 5 minutos (configurable via `SLA_CHECK_CRON`).

### 19.1 Configuración
El SLA se define en la entidad `PasoFlujo`:
- `paso_horas_sla`: Tiempo máximo en horas (decimal).
- `usuario_escalado_id`: ID del usuario a quien se reasignará el ticket si vence el SLA (Opcional).

### 19.2 Lógica de Alerta
1. El scheduler busca tickets activos donde `(NOW - fechaAsignacion) > horasSla`.
2. Si encuentra uno vencido:
   - Marca el histórico actual como `slaStatus = 'Atrasado'`.
   - Envía notificación WebSocket (`ticket_overdue`) a los usuarios asignados para alertarles.
   - **No reasigna** automáticamente (cambio de lógica para mantener responsabilidad).

---

## 20. Estampado de Firmas en PDF

### Objetivo
Incrustar dinámicamente la firma de los usuarios (imagen PNG/JPG) en los documentos generados por el flujo.

### Componentes
- **`PdfStampingService`**: Utilería de bajo nivel para manipular PDFs. Ahora soporta `stampImages` para incrustar imágenes.
- **`SignatureStampingService`**: Orquestador que:
  1. Lee la configuración de firmas del paso actual (`PasoFlujoFirma`).
  2. Resuelve la ruta física de la imagen de firma del usuario (`User.firma`).
  3. Llama a `PdfStampingService` para estampar.

### 20.1 Configuración
La entidad `PasoFlujoFirma` define:
- `coord_x`, `coord_y`: Coordenadas en la página.
- `pagina`: Número de página (1-based).
- `usu_id` o `car_id`: A quién corresponde la firma (Usuario específico o Cargo).

### 20.2 Uso
El servicio se invoca durante la transición o generación de documentos:
```typescript
const pdfBytes = await this.signatureService.stampSignaturesForStep(pdfPath, pasoId);
```
Si el usuario no tiene firma configurada en `User.firma`, la operación se omite para ese usuario con un warning.



## 10. Módulo de Workflows y SLA ('src/modules/workflows/')

### SLA (Acuerdos de Nivel de Servicio)

El sistema monitorea automáticamente el tiempo que un ticket permanece en cada paso del flujo.

#### Conceptos Clave
- **Tiempo Hábil ('paso_tiempo_habil')**: Definido en 'tm_flujo_paso'. Representa los días calendario (MVP) o hábiles que un ticket puede estar en un paso.
- **Estado de Tiempo ('estado_tiempo_paso')**: Columna en 'th_ticket_asignacion_historico'.
    - 'A Tiempo': El ticket está dentro del plazo.
    - 'Vencido': El ticket excedió el tiempo límite.

#### Funcionamiento del Motor SLA ('SlaSchedulerService')
1. **Cron Job**: Se ejecuta cada 5 minutos.
2. **Detección**: Busca tickets activos ('est=1') cuyo tiempo transcurrido desde la última asignación supere el 'tiempoHabil' del paso actual.
3. **Acción**:
    - Actualiza 'estado_tiempo_paso' a 'Vencido'.
    - Envía notificación WebSocket ('ticket_overdue') en tiempo real al usuario asignado.

#### Configuración
- **Frecuencia de Chequeo**: Define 'SLA_CHECK_CRON' en '.env' (Default: '*/5 * * * *').

### PDF Dynamic Stamping ('PdfStampingService')
Permite estampar firmas y sellos dinámicos en documentos PDF generados o subidos.

- **Servicio:** 'src/modules/templates/services/pdf-stamping.service.ts'
- **Capacidades:**
    - Insertar imágenes (PNG/JPG) en coordenadas específicas (X, Y).
    - Insertar en páginas específicas (1-based).
    - Escalar imágenes automáticamente.

#### Uso:
```typescript
const pdfBytes = await this.pdfStampingService.stampImages(
    'path/to/document.pdf',
    [
        {
            imagePath: 'path/to/signature.png',
            page: 1,
            x: 100,
            y: 200,
            width: 150,
            height: 50
        }
    ]
);
```
