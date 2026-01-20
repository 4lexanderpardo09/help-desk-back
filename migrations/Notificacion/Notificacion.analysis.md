# Análisis del Modelo Legacy: Notificacion.php

## 1. Descripción General
Gestión de notificaciones in-app. Las notificaciones tienen 3 estados:
- `est = 2`: Nueva (No enviada via WebSocket).
- `est = 1`: Enviada pero no leída.
- `est = 0`: Leída.

## 2. Tabla
- **`tm_notificacion`**: `not_id`, `usu_id`, `not_contenido`, `tick_id`, `fech_not`, `est`.

## 3. Métodos
- `get_notificacion_x_usu_todas()`: Listado para campana de notificaciones.
- `contar_notificaciones_x_usu()`: Badge counter.
- `update_notificacion_estado_leido()`: Marcar como leída.
- `get_nuevas_notificaciones_para_enviar()`: Para cron de WebSockets.

## 4. Estrategia de Migración
- **Entity**: Ya existente o crear `Notificacion.entity.ts`.
- **Service**: `NotificationsService` con soporte WebSocket (Gateway).
- **Gateway**: `NotificationsGateway` para push en tiempo real.

## 5. Métodos Públicos
```typescript
interface LegacyNotificacionModel {
  list_by_user(userId: number): Promise<Notificacion[]>;
  count_unread(userId: number): Promise<number>;
  mark_as_read(notificationId: number): Promise<void>;
  mark_all_as_read(userId: number): Promise<void>;
  get_pending_for_push(): Promise<Notificacion[]>;
}
```
