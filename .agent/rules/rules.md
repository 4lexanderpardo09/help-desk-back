---
trigger: always_on
---

MCP Backend — Arquitectura y Convenciones
1. Objetivo del backend

Este backend es una API REST + WebSockets diseñada para:

Exponer datos de forma limpia y consistente a un frontend moderno (React)

Servir como base escalable para futuros módulos

Mantener una arquitectura clara desde el inicio

Facilitar mantenimiento, testing y evolución

Evitar deuda técnica desde la primera versión

El sistema se construye correctamente desde el día uno, sin parches ni compromisos técnicos.

2. Stack tecnológico

Runtime: Node.js

Lenguaje: TypeScript (modo estricto obligatorio)

Framework: NestJS

Arquitectura: MVC pragmático

Auth: JWT (stateless)

DB: MySQL

Comunicación:

REST (JSON)

WebSockets

Package manager: pnpm

Estilo de módulos: feature-based

No se introducen dependencias sin una necesidad clara y justificada.

3. Arquitectura general

El backend sigue un MVC claro, sin sobre-ingeniería ni abstracciones innecesarias.

Capas permitidas

Controller → Service → Model

Responsabilidades
Controller

Recibe requests HTTP / WebSocket

Valida datos de entrada mediante DTOs

Aplica guards

Devuelve respuestas JSON

No contiene lógica de negocio

No accede a la base de datos

No devuelve HTML

Service

Contiene la lógica de negocio

Aplica reglas del dominio

Orquesta operaciones

Coordina múltiples models si es necesario

No depende de HTTP ni del framework

Model (o Repository)

Acceso a datos

Queries SQL / ORM

No contiene lógica de negocio

No conoce controllers ni servicios

4. Organización del proyecto
Estructura base
src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.model.ts
│   │   ├── jwt.strategy.ts
│   │   ├── jwt.guard.ts
│   │   └── auth.module.ts
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.model.ts
│   │   └── users.module.ts
│   └── tickets/
├── common/
│   ├── guards/
│   ├── dto/
│   ├── filters/
│   └── interceptors/
└── main.ts


Cada módulo es autosuficiente y no accede directamente a otros módulos.

5. Base de datos

Esquema bien definido desde el inicio

Cambios estructurales mediante migraciones

Separación clara entre modelo de datos y lógica de negocio

Ningún acceso directo a la base de datos fuera de los models

6. Autenticación (JWT)
Decisiones

JWT stateless

Access token único

Sin refresh token en la primera fase

Compatible con REST y WebSockets

Payload del token
{
  sub: user.id,
  email: user.email,
  role: user.role
}


No se incluyen datos sensibles.

Reglas

El token se envía por Authorization: Bearer

El mismo token se reutiliza para WebSockets

Guards protegen rutas y gateways

El backend no maneja sesiones

7. WebSockets

Usados solo para eventos en tiempo real

Autenticación mediante JWT

No se duplica lógica con REST

Los eventos notifican, no reemplazan flujos críticos

8. Reglas estrictas de TypeScript

strict: true

Prohibido any

Prohibido unknown

Se confía en inferencia cuando es correcta

DTOs explícitos para entrada de datos

Tipos claros en services y models

Si un tipo no está claro, se detiene el desarrollo hasta definirlo.

9. Testing y calidad

No se acepta código sin:

Tipos correctos

Lint limpio

Tests relevantes

Se testea principalmente:

Services (lógica de negocio)

Guards (autenticación y autorización)

No se testea infraestructura innecesaria.

10. Qué NO se permite

HTML en controllers

Lógica de negocio en controllers

SQL fuera de models

jQuery

Endpoints que devuelvan vistas

Abstracciones innecesarias

Refactors masivos sin pruebas

11. Evolución futura

Solo cuando exista una necesidad real:

Models → Repositories

Services → Use cases

Arquitectura hexagonal

Refresh tokens

Monorepo

Nada se implementa por moda.

12. Principios clave del proyecto

Producción estable desde el inicio

Código claro > código “clever”

Una responsabilidad por archivo

Medir antes de optimizar

Cada decisión debe poder explicarse

13. Rol del asistente (este MCP)

El asistente debe:

Generar código alineado a este MCP

No introducir capas nuevas sin justificar

No sugerir cambios arquitectónicos innecesarios

Mantener consistencia entre módulos

Corregir desviaciones de estas reglas

14. Documentación y testing automatizado (regla obligatoria)

Cada vez que el asistente:

Cree código

Modifique lógica

Añada endpoints

Cambie comportamiento existente

DEBE:

Crear o actualizar docs/DOCUMENTATION.md

No sobrescribir

Usar formato por fecha

Explicar contexto, cambios y decisiones

Crear o actualizar la colección Postman

Archivo: postman/help-desk-api.postman_collection.json

Usar variables base_url y token

Añadir tests básicos por request

Mantener compatibilidad con JWT

Si algo no puede documentarse o testearse, debe explicarse el motivo.

15. Documentación de código (regla obligatoria)

El código debe documentarse de forma clara y consistente.

Reglas

Uso obligatorio de JSDoc / TSDoc

Se documenta el por qué, no lo obvio

Se documentan decisiones técnicas

Se documentan limitaciones reales

Se documentan puntos de evolución futura

Dónde documentar

Services: reglas y lógica de negocio

Models: estructura y decisiones de datos

Guards / Auth: decisiones de seguridad

Controllers: solo comportamiento no trivial

No se permiten comentarios redundantes o vacíos.

16. Estándar de documentación (criterio profesional 2026)

La documentación se divide en cuatro niveles complementarios.
Elegir solo uno se considera una mala práctica.

Estándar obligatorio

Swagger (OpenAPI)

Endpoints

DTOs

Códigos de respuesta

Contrato con frontend y QA

JSDoc / TSDoc

Decisiones de negocio

Reglas internas

Limitaciones técnicas

Evolución futura

Compodoc

Arquitectura

Módulos

Servicios

Dependencias

Flujo del sistema

DOCUMENTATION.md

Qué se hizo

Por qué se hizo

Qué decisiones se tomaron

Qué queda pendiente

Principio clave

Swagger documenta qué expone la API
JSDoc documenta por qué el código existe
Compodoc documenta cómo está construido el sistema
DOCUMENTATION.md documenta la historia del proyecto

17. Autorización (Roles y Permisos con CASL)
17.1 Objetivo

El sistema de autorización define qué puede hacer un usuario, más allá de si está autenticado.

Se utiliza CASL como motor de permisos para:

Centralizar reglas de acceso

Soportar roles y permisos dinámicos

Autorizar tanto REST como WebSockets

Evitar lógica de permisos en controllers y services

Mantener reglas claras, testeables y escalables

17.2 Librería oficial

Se adopta CASL como estándar del proyecto.

Dependencias:

pnpm add @casl/ability @casl/nestjs


No se introducen otras librerías de permisos sin justificación técnica.

17.3 Modelo conceptual

CASL se basa en habilidades (Abilities):

usuario + contexto → ability.can(acción, recurso)

Conceptos clave
Concepto	Significado
Action	Qué se quiere hacer (read, create, update, delete, manage)
Subject	Sobre qué recurso (User, Ticket, Auth, etc.)
Ability	Conjunto de reglas evaluables
Policy	Regla que se valida antes de ejecutar una acción
17.4 Acciones estándar (convención obligatoria)

Se definen acciones comunes para todo el sistema:

export type Actions =
  | 'manage'
  | 'create'
  | 'read'
  | 'update'
  | 'delete';


Regla:

manage implica todas las acciones

No se crean acciones arbitrarias sin documentarlas

17.5 Subjects (recursos)

Los subjects corresponden a entidades del dominio, no a rutas HTTP.

Ejemplos:

export type Subjects =
  | 'User'
  | 'Ticket'
  | 'Auth'
  | 'all';


No se usan nombres de controllers ni endpoints como subjects.

17.6 Definición de Ability

Las reglas de autorización se definen en un solo lugar.

Archivo recomendado:

src/modules/auth/abilities/ability.factory.ts


Ejemplo:

import { AbilityBuilder, AbilityClass, Ability } from '@casl/ability';

export type AppAbility = Ability<[Actions, Subjects]>;

export function defineAbilityFor(user: AuthUser): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<
    Ability<[Actions, Subjects]>
  >(Ability as AbilityClass<AppAbility>);

  if (user.role === 'admin') {
    can('manage', 'all');
  }

  if (user.role === 'user') {
    can('read', 'Ticket');
    can('update', 'User');
  }

  return build({
    detectSubjectType: (item) =>
      item.constructor as unknown as Subjects,
  });
}

17.7 Integración con JWT

El JWT solo identifica al usuario, no define permisos.

El payload mínimo permitido:

{
  sub: user.id,
  email: user.email,
  role: user.role
}


Las abilities se construyen en runtime a partir del usuario autenticado.

17.8 Guards de autorización

La autorización se aplica mediante guards, nunca dentro del controller o service.

Archivo recomendado:

src/common/guards/policies.guard.ts


Responsabilidad del guard:

Obtener el usuario autenticado

Construir su ability

Evaluar las policies

Bloquear acceso si no cumple

17.9 Policies (decoradores)

Se utilizan policies declarativas, no condicionales manuales.

Ejemplo:

@UseGuards(JwtAuthGuard, PoliciesGuard)
@CheckPolicies((ability: AppAbility) =>
  ability.can('read', 'Ticket'),
)
@Get()
findAll() {
  return this.service.findAll();
}


Reglas:

Las policies se declaran en controllers

La lógica vive en CASL

No se usan if (user.role === ...) en controllers

17.10 Servicios y CASL

Los services no conocen CASL.

Regla estricta:

❌ ability.can() dentro de services
❌ Validar permisos en lógica de negocio
✅ Los services asumen que el usuario ya fue autorizado

Esto mantiene los services:

Testeables

Reutilizables

Independientes del framework

17.11 WebSockets

Las mismas abilities se reutilizan en gateways.

Flujo:

Cliente envía JWT

Gateway valida token

Se construye ability

Se valida policy antes de emitir o recibir eventos

No se duplican reglas entre REST y WS.

17.12 Testing

Se testea:

defineAbilityFor() (reglas)

PoliciesGuard

Casos positivos y negativos por rol

No se testean decorators ni infraestructura.

17.13 Qué NO se permite

❌ Autorización basada solo en roles
❌ if (user.role === 'admin') en controllers
❌ Lógica de permisos en services
❌ Permisos definidos en múltiples archivos
❌ Hardcodear permisos en rutas

17.14 Evolución futura

CASL permite escalar a:

Permisos por ownership

Permisos por estado

Permisos por relación

Integración con ABAC

Sin reescribir el sistema.

17.15 Principio clave

Autenticación dice quién eres
Autorización dice qué puedes hacer

CASL es el único punto donde se responde esa pregunta.

Este es el estándar profesional obligatorio del backend.