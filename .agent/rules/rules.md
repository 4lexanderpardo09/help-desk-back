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

Este es el estándar profesional obligatorio del backend.