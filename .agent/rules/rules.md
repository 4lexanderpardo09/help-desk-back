---
trigger: always_on
---

MCP Backend — Arquitectura y Convenciones
1. Objetivo del backend

Este backend es una API REST + WebSockets diseñada para:

Migrar progresivamente un sistema PHP legacy monolítico

Reemplazar controladores que devuelven HTML

Exponer datos de forma limpia a un frontend moderno (React)

Convivir con el sistema legacy hasta que sea reemplazado por completo

Mantener producción estable durante toda la migración

La migración es incremental, por módulos, sin romper la aplicación existente.

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

No se introducen dependencias hasta que sean necesarias.

3. Arquitectura general

El backend sigue un MVC claro, sin sobre-ingeniería ni abstracciones prematuras.

Capas permitidas
Controller  → Service  → Model

Responsabilidades
Controller

Recibe requests HTTP / WS

Valida datos de entrada (DTOs)

Aplica guards

Devuelve respuestas JSON

No contiene lógica de negocio

No accede a la base de datos

No devuelve HTML

Service

Contiene la lógica de negocio

Orquesta reglas y validaciones

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

La base de datos existente NO se modifica inicialmente

La API se adapta al esquema legacy

Migraciones estructurales se hacen solo cuando un módulo esté 100% migrado

El backend puede iniciar en modo read-only

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

El backend nunca maneja sesiones

7. WebSockets

Se usan para eventos en tiempo real

Autenticación mediante JWT

No se duplica lógica con REST

Los eventos solo notifican, no reemplazan flujos críticos

8. Convivencia con el sistema legacy

El sistema PHP sigue siendo el source of truth inicial

El backend nuevo:

Empieza con endpoints de lectura

Migra escrituras progresivamente

No se reescriben modelos legacy

Cada módulo se migra de forma independiente

9. Reglas estrictas de TypeScript

strict: true

Prohibido any

Prohibido unknown

Se confía en inferencia siempre que sea posible

DTOs explícitos para entrada de datos

Tipos claros en servicios y models

Si un tipo no está claro, se detiene el desarrollo hasta definirlo.

10. Testing y calidad

No se acepta código sin:

Tipos correctos

Lint limpio

Tests relevantes

Los tests se escriben en:

Services (lógica)

Guards (auth)

No se testea infraestructura innecesaria

11. Qué NO se permite

HTML en controllers

Lógica de negocio en controllers

SQL fuera de models

jQuery

Endpoints que devuelvan vistas

Abstracciones innecesarias

Refactors masivos sin pruebas

12. Evolución futura (cuando el legacy muera)

Models → Repositories

Services → Use cases

Introducción progresiva de arquitectura hexagonal

Posible monorepo

Posible refresh tokens

Nada de esto se implementa sin una necesidad real.

13. Principios clave del proyecto

Producción primero

Migración progresiva

Código entendible > código “perfecto”

Medir antes de optimizar

Una responsabilidad por archivo

Cada decisión debe poder explicarse

14. Rol del asistente (este MCP)

Este documento define cómo el asistente debe ayudar:

Generar código alineado a este MCP

No introducir nuevas capas sin justificar

No sugerir cambios de arquitectura sin medir

Priorizar compatibilidad con legacy

Mantener consistencia entre módulos

Corregir desviaciones de estas reglas

15. Cierre

Este backend es una plataforma de transición:

De monolito a API

De jQuery a React

De código acoplado a arquitectura limpia

La meta no es rehacer todo rápido, sino hacerlo bien sin romper nada.

16. Documentación y testing automatizado (regla obligatoria)

Cada vez que el asistente:

- Cree código

- Modifique lógica

- Añada endpoints

- Cambie comportamiento existente

DEBE:

1. Crear o actualizar `docs/DOCUMENTATION.md`

   - No sobrescribir

   - Usar formato por fecha

   - Explicar contexto, cambios y decisiones

2. Crear o actualizar la colección Postman

   - Archivo: `postman/help-desk-api.postman_collection.json`

   - Usar variables `base_url` y `token`

   - Añadir tests básicos por request

   - Mantener compatibilidad con JWT

Si no es posible documentar o testear algo, debe explicarse el motivo.

18. Documentación de código (regla obligatoria)

El código debe documentarse de forma clara y consistente.

Reglas:

- Se usan comentarios JSDoc / TSDoc

- Se documenta el "por qué", no lo obvio

- Se documentan decisiones relacionadas con legacy

- Se documentan limitaciones temporales

- Se documentan puntos de migración futura

Dónde documentar:

- Services: lógica de negocio y reglas

- Models: particularidades del esquema legacy

- Guards / Auth: decisiones de seguridad

- Controllers: solo si hay comportamiento no trivial

No se permiten:

- Comentarios redundantes

- Comentarios que repitan el nombre de la función

- Código sin explicación cuando rompe reglas ideales por compatibilidad legacy
