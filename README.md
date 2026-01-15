# Help Desk Backend NestJS

API REST para el sistema de Mesa de Ayuda - Migración desde PHP legacy.

## Quick Start

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de MySQL

# Desarrollo
pnpm run start:dev

# Producción
pnpm run build
pnpm run start:prod
```

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DB_HOST` | Host MySQL | `127.0.0.1` |
| `DB_PORT` | Puerto MySQL | `3306` |
| `DB_USERNAME` | Usuario MySQL | `root` |
| `DB_PASSWORD` | Password MySQL | `****` |
| `DB_DATABASE` | Nombre de la DB | `helpdeskdb` |
| `JWT_SECRET` | Secreto para JWT | `tu_secreto_seguro` |
| `JWT_EXPIRES_IN` | Expiración del token | `24h` |
| `PORT` | Puerto de la API | `3000` |

## Estructura del Proyecto

```
src/
├── config/              # Configuraciones
├── modules/
│   ├── auth/            # Autenticación JWT
│   └── users/           # Gestión de usuarios
├── app.module.ts        # Módulo principal
└── main.ts              # Entry point
```

## Endpoints

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/login` | Login, retorna JWT |
| GET | `/auth/profile` | Perfil del usuario (auth) |

### Users
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/users` | Lista usuarios (auth) |
| GET | `/users/:id` | Usuario por ID (auth) |
| GET | `/users/departamento/:id` | Usuarios por depto (auth) |
| POST | `/users` | Crear usuario (auth) |

## Postman

Importar `postman/help-desk-api.postman_collection.json`

## Documentación

Ver `docs/DOCUMENTATION.md` para documentación detallada.

## Licencia

Privado - Electrocreditos del Cauca
