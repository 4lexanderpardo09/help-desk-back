# Análisis Consolidado: Modelos Pequeños Restantes

## 1. Organigrama.php (Jerarquía Organizacional)
### Tabla: `tm_organigrama`
- `org_id`, `car_id`, `jefe_car_id`, `est`.
- Define relaciones Subordinado->Jefe entre Cargos.

### Métodos Clave
- `get_jefe_cargo_id(carId)`: Retorna el cargo del jefe inmediato.
- `es_jefe(carId)`: Boolean, si alguien reporta a este cargo.

### Migración
Entity `Organigrama`, Service `OrganigramaService`. Usado por WorkflowEngine para resolver "Jefe Inmediato".

---

## 2. Etiqueta.php (Tags Personales)
### Tablas
- `tm_etiqueta`: Definición ($etiId, $usuId, $eti_nom, $eti_color$).
- `td_ticket_etiqueta`: Relación Ticket-Etiqueta.

### Métodos Clave
- `listar_etiquetas(usuId)`: Tags del usuario.
- `asignar_etiqueta_ticket()`: Join Many-to-Many.
- `listar_etiquetas_x_ticket(tickId, usuId)`: Solo muestra las etiquetas propias del usuario.

### Migración
Entity `Etiqueta`, Service `TagsService`. Las etiquetas son **personales** (cada usuario solo ve las suyas).

---

## 3. TicketError.php (Reporte de Errores)
### Tabla: `tm_ticket_error`
- `error_id`, `tick_id`, `usu_id_reporta`, `usu_id_responsable`, `answer_id`, `error_descrip`, `es_error_proceso`.

### Métodos Clave
- `insert_error()`: Crea un reporte de error.
- `listar_errores_recibidos(usuId)`: Errores que me reportaron.
- `listar_errores_enviados(usuId)`: Errores que yo reporté.
- `count_errors_by_type()`: Conteo por tipo (Proceso vs Info).

### Migración
Entity `TicketError`, Service `TicketErrorService`. Usa `tm_fast_answer` para clasificar tipos de error.

---

## 4. Modelos ya cubiertos por NestJS (No requieren migración profunda)
| Modelo PHP | Entidad NestJS | Estado |
|------------|----------------|--------|
| Cargo.php | `Cargo.entity.ts` | ✅ Implementado |
| Categoria.php | `Categoria.entity.ts` | ✅ Implementado |
| Subcategoria.php | `Subcategoria.entity.ts` | ✅ Implementado |
| Departamento.php | `Departamento.entity.ts` | ✅ Implementado |
| Empresa.php | `Empresa.entity.ts` | ✅ Implementado |
| Prioridad.php | `Prioridad.entity.ts` | ✅ Implementado |
| Regional.php | `Regional.entity.ts` | ✅ Implementado |
| Zona.php | `Zona.entity.ts` | ✅ Implementado |
| Perfil.php | `Perfil.entity.ts` | ✅ Implementado |
| Consulta.php (Reports) | `Consulta.entity.ts` | ✅ Implementado |
| FlujoMapeo.php | `ReglasMapeo` module | ✅ Implementado |

---

## 5. Utilidades (Helpers)
| Archivo | Descripción | Acción |
|---------|-------------|--------|
| `DateHelper.php` | Cálculo de días hábiles | Migrar a `DateUtilService` |
| `Email.php` | Envío de correos | Migrar a `MailerService` (NestJS Mailer) |
| `ExcelData.php` | Storage de datos Excel | Migrar a `ExcelDataService` |
| `RespuestaRapida.php` | Respuestas rápidas | Entity + Service simple |

---

## 6. Services Legacy
| Archivo | Líneas | Descripción | Prioridad Migración |
|---------|--------|-------------|---------------------|
| `TicketService.php` | 2633 | Orquestador principal | 🔴 CRÍTICO (Analizado) |
| `TicketLister.php` | 1200+ | Listados complejos | 🟠 Alta |
| `TicketDetailLister.php` | 400+ | Historial/Comentarios | 🟠 Alta |
| `TicketWorkflowService.php` | 300 | Avance de flujos | 🔴 CRÍTICO |
| `PdfService.php` | 150 | Estampado PDFs | 🟡 Media |
