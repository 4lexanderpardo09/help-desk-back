# Documentación de Arquitectura de Software (Modelo C4)

## 1. Contexto del Negocio
El sistema **Help Desk (Mesa de Ayuda)** es una plataforma empresarial diseñada para centralizar, gestionar y resolver incidentes y solicitudes de servicio. Su objetivo principal es optimizar los tiempos de respuesta (SLA), garantizar la trazabilidad de los procesos y permitir una comunicación fluida entre los empleados (solicitantes) y el equipo de soporte (agentes).

### Objetivos Clave
*   **Centralización**: Un único punto de entrada para todos los requerimientos.
*   **Automatización**: Flujos de trabajo configurables que asignan tickets automáticamente según reglas de negocio.
*   **Seguridad**: Control de acceso granular basado en Roles y Habilidades (CASL).
*   **Visibilidad**: Dashboards en tiempo real y reportes de cumplimiento de SLA.

---

## 2. Nivel 1: Diagrama de Contexto del Sistema
Este nivel representa el "Big Picture". Muestra el sistema en el centro y su relación con usuarios y sistemas externos.

```mermaid
graph TD
    %% Estilos de Nodos
    classDef person fill:#08427b,stroke:#052e56,color:white,rx:10,ry:10;
    classDef system fill:#1168bd,stroke:#0b4884,color:white,rx:10,ry:10;
    classDef external fill:#999999,stroke:#666666,color:white,rx:10,ry:10;

    %% Actores Principales
    Solicitante[("👤 Solicitante<br><small>Empleado/Cliente</small>")]:::person
    Agente[("🎧 Agente de Soporte<br><small>Staff Técnico</small>")]:::person
    Supervisor[("📊 Supervisor<br><small>Gestor de Calidad</small>")]:::person

    %% Sistema Central
    HelpDesk[("🖥️ Sistema Mesa de Ayuda<br><small>Gestión de Tickets, SLAs y Flujos</small>")]:::system

    %% Sistemas Externos
    EmailSys[("📧 Servidor de Correo<br><small>SMTP / Exchange</small>")]:::external
    AD[("🪪 Directorio Activo (Futuro)<br><small>SSO / Autenticación</small>")]:::external

    %% Interacciones
    Solicitante -- "1. Crea tickets, consulta estado, califica servicio" --> HelpDesk
    Agente -- "2. Recibe asignaciones, resuelve incidentes" --> HelpDesk
    Supervisor -- "3. Monitorea SLAs, reasigna cargas" --> HelpDesk
    
    HelpDesk -- "4. Envía notificaciones de estado" --> EmailSys
    HelpDesk -. "5. Valida credenciales (Proyección)" .-> AD
```

---

## 3. Nivel 2: Diagrama de Contenedores (Arquitectura Técnica)
Este nivel detalla la arquitectura de software, mostrando los contenedores desplegables y sus responsabilidades.

```mermaid
graph TD
    %% Estilos
    classDef spa fill:#61dafb,stroke:#20232a,color:black,rx:5,ry:5;
    classDef api fill:#e0234e,stroke:#20232a,color:white,rx:5,ry:5;
    classDef db fill:#336791,stroke:#20232a,color:white,rx:5,ry:5;
    classDef fs fill:#f39c12,stroke:#20232a,color:white,rx:5,ry:5;

    subgraph "Cliente (Navegador)"
        SPA("⚛️ Frontend App<br><small>React + Vite + Tailwind</small>"):::spa
    end

    subgraph "Backend (Servidor Linux/Node)"
        API("🛡️ API Gateway / Core<br><small>NestJS (Node.js)</small>"):::api
    end

    subgraph "Capa de Persistencia"
        DB[("� MySQL<br><small>Datos Relacionales, Usuarios, Tickets</small>")]:::db
        Files[("📂 File System<br><small>Archivos Adjuntos, PDFs Generados</small>")]:::fs
    end

    %% Relaciones
    SPA -- "HTTPS / JSON (REST)" --> API
    SPA -- "WSS (Socket.io)" --> API

    API -- "TypeORM (SQL Pool)" --> DB
    API -- "IO Streams" --> Files

    %% Notas de Implementación
    note1[/"⚠️ Autenticación Stateless (JWT)"/] 
    note2[/"⚡ Eventos en tiempo real"/]
    
    note1 -.-> API
    note2 -.-> SPA
```

---

## 4. Stack Tecnológico y Decisiones
Justificación de las tecnologías elegidas para garantizar escalabilidad y mantenibilidad.

### 4.1 Frontend (La Cara del Usuario)
*   **Tecnología**: **React** con **Vite**.
*   **Lenguaje**: TypeScript (Strict Mode).
*   **Estilos**: **Tailwind CSS**. No usamos CSS puro ni preprocesadores complejos para mantener la consistencia y velocidad de desarrollo.
*   **Estado**: React Context + Hooks. Gestión ligera sin la complejidad de Redux.
*   **Rol**: Renderizado de UI, validación de formularios y experiencia de usuario interactiva (SPA).

### 4.2 Backend (El Cerebro)
*   **Tecnología**: **NestJS**. Framework progresivo que impone una arquitectura modular y ordenada.
*   **Lenguaje**: TypeScript. Comparte tipos e interfaces con el frontend.
*   **Seguridad**: **Passport + JWT**. Autenticación sin estado (Stateless).
*   **Autorización**: **CASL**. Control de permisos granular basado en habilidades (Attribute Based Access Control - ABAC).
*   **WebSockets**: **Socket.io**. Comunicación bidireccional para notificar "Nuevo Ticket" o "Ticket Asignado" sin que el usuario recargue la página.

### 4.3 Datos (La Memoria)
*   **Base de Datos**: **MySQL**. Robusta, relacional y consistente.
*   **ORM**: **TypeORM**. Abstracción de base de datos que facilita migraciones y manejo de entidades.
*   **Almacenamiento**: Sistema de archivos local para PDFs y adjuntos (escalable a S3 en el futuro).

---

## 5. Flujo Crítico: Ciclo de Vida de un Ticket
Para entender cómo conectan las piezas, describimos el viaje de un dato a través de la arquitectura:

1.  **Frontend**: El usuario llena el formulario "Crear Ticket". React valida los campos requeridos.
2.  **Request**: Se envía un `POST /tickets` con el token JWT en la cabecera `Authorization`.
3.  **Backend (Guard)**: `JwtAuthGuard` verifica el token. `PoliciesGuard` verifica si el usuario tiene permiso `create` sobre `Ticket`.
4.  **Backend (Service)**: `TicketService` recibe los datos, calcula asignaciones automáticas (Motor de Reglas) e inicia el flujo.
5.  **Base de Datos**: Se inserta el registro en MySQL dentro de una transacción.
6.  **Backend (Event)**: Se emite un evento WebSocket `ticket.created` a la sala de coordinadores.
7.  **Frontend (Coordinador)**: La interfaz del coordinador recibe el evento y muestra una notificación "Toast" instantánea y actualiza la tabla de tickets.
