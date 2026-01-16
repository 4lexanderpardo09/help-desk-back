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

# Auth
@nestjs/passport        # Passport integration
@nestjs/jwt             # JWT utilities
passport                # Auth framework
passport-jwt            # JWT strategy
bcrypt                  # Hash de passwords

# Validation
class-validator         # DTOs
class-transformer       # Transformación
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

### Endpoints (todos requieren autenticación)

| Método | Ruta | Descripción | Función PHP Legacy |
|--------|------|-------------|-------------------|
| GET | `/users` | Lista usuarios activos | `findAll()` |
| GET | `/users/with-departamento` | Usuarios con JOIN departamento | `get_usuario()` → `sp_l_usuario_01` |
| GET | `/users/departamento/:id` | Por departamento | `get_usuario_x_departamento()` |
| GET | `/users/sin-departamento` | Sin departamento asignado | `get_usuario_x_departamento(null)` |
| GET | `/users/email/:email` | Por correo electrónico | `get_usuario_por_correo()` |
| GET | `/users/cargo/:cargoId/search` | **UNIFICADO** - Buscar por cargo con filtros | Reemplaza 6 endpoints legacy |
| GET | `/users/cargo/:id` | *(deprecated)* Por cargo | `get_usuarios_por_cargo()` |
| GET | `/users/cargo/:cargoId/regional/:regionalId` | *(deprecated)* Por cargo y regional | `get_usuario_por_cargo_y_regional()` |
| GET | `/users/cargo/:cargoId/regional/:regionalId/all` | *(deprecated)* TODOS por cargo y regional | `get_usuarios_por_cargo_y_regional_all()` |
| GET | `/users/cargo/:id/one` | *(deprecated)* UN usuario por cargo | `get_usuario_por_cargo()` |
| GET | `/users/cargo/:cargoId/regional-or-nacional/:regionalId` | *(deprecated)* Por cargo (regional O nacional) | `get_usuarios_por_cargo_regional_o_nacional()` |
| GET | `/users/cargo/:cargoId/zona/:zona` | *(deprecated)* Por cargo y zona | `get_usuario_por_cargo_y_zona()` |
| GET | `/users/rol/:id` | Por rol | `get_usuario_x_rol()` (dinámico) |
| GET | `/users/agentes` | Solo agentes (rol_id=2) | `get_usuario_x_rol()` |
| GET | `/users/:id` | *(legacy)* Por ID | `findById()` |
| GET | `/users/:id/search` | **UNIFICADO** - Por ID con opciones | Reemplaza findById + withEmpresas |
| GET | `/users/:id/with-empresas` | *(deprecated)* Por ID con empresas | `get_usuario_x_id()` |
| POST | `/users` | Crear usuario | `insert_usuario()` |
| POST | `/users/by-ids` | Por lista de IDs | `get_usuarios_por_ids()` |
| PUT | `/users/:id` | Actualizar usuario | `update_usuario()` |
| PUT | `/users/:id/firma` | Actualizar firma | `update_firma()` |
| PUT | `/users/:id/perfiles` | Sincronizar perfiles | `insert_usuario_perfil()` |
| GET | `/users/:id/perfiles` | Obtener perfiles | `get_perfiles_por_usuario()` |
| DELETE | `/users/:id` | Soft delete | `delete_usuario()` |

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

## 5. Comandos Útiles

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

## Decisiones Técnicas

1. **`synchronize: false`** - No se modifica el esquema de la DB legacy
2. **Passwords con bcrypt** - Compatibles con `password_hash()` de PHP
3. **JWT stateless** - Sin refresh token por ahora (fase 1)
4. **Payload JWT legacy-compatible** - Replica variables de sesión PHP
