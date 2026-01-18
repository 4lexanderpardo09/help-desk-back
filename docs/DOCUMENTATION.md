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

| Método | Ruta | Descripción | Service Method | Permiso CASL |
|--------|------|-------------|----------------|---------------|
| GET | `/users` | Listar usuarios con filtros | `list()` | `read User` |
| GET | `/users/:id` | Mostrar usuario por ID | `show()` | `read User` |
| POST | `/users` | Crear usuario | `create()` | `create User` |
| PUT | `/users/:id` | Actualizar usuario | `update()` | `update User` |
| DELETE | `/users/:id` | Soft delete | `delete()` | `delete User` |
| PUT | `/users/:id/firma` | Actualizar firma | `updateFirma()` | `update User` |
| PUT | `/users/:id/perfiles` | Sincronizar perfiles | `syncPerfiles()` | `update User` |
| GET | `/users/:id/perfiles` | Obtener perfiles | `getPerfiles()` | `read User` |

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

## Decisiones Técnicas

1. **`synchronize: false`** - No se modifica el esquema de la DB legacy
2. **Passwords con bcrypt** - Compatibles con `password_hash()` de PHP
3. **JWT stateless** - Sin refresh token por ahora (fase 1)
4. **Payload JWT legacy-compatible** - Replica variables de sesión PHP
5. **CASL para autorización** - Permisos declarativos y centralizados
