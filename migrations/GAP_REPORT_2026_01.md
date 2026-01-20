# Migration Gap Analysis Report
**Date:** January 20, 2026
**Scope:** KPI Services, Document Management, Ticket Listing

## Executive Summary
A detailed comparison between the legacy PHP system architecture (as documented in `migrations/`) and the current NestJS implementation reveals significant gaps, particularly in the **Reporting/BI capabilities** and **Document Management** lifecycle. The **Ticket Listing** service is largely functional but lacks specific views for Error tracking and complete data resolution (assignee names).

---

## 1. KPI & Reporting Service (Priority: High)
**Status:** ~20% Complete (CRUD for Definitions only)
**Legacy Reference:** `migrations/KPI/Kpi.analysis.md`
**Current Implementation:** `src/modules/reports/reports.service.ts`

The current `ReportsService` only implements basic CRUD for the `Consulta` entity (report metadata). The entire business intelligence engine is missing.

| Feature | Legacy Functionality | Current NestJS Status | Severity |
| :--- | :--- | :--- | :--- |
| **Hierarchical Scope** | `get_hierarchy_scope`: Recursive logic to determine user visibility (Admin=All, Boss=Downstream, User=Self). | **MISSING**. No logic exists to calculate visibility trees. | 🔴 Critical |
| **Dynamic Statistics** | `get_dynamic_statistics`: On-the-fly SQL generation with dynamic `WHERE` clauses and aggregations (Open/Closed counts). | **MISSING**. | 🔴 Critical |
| **Performance Metrics** | `get_subcategory_metrics`: Calculates step durations and reconstructs ticket lifecycle. | **MISSING**. | 🟠 High |
| **Median Calculation** | `get_median_response_time`: Custom algorithm for median response time excluding outliers. | **MISSING**. | 🟠 High |
| **Data Grouping** | Grouping by Department, Role, User, Category. | **MISSING**. | 🟠 High |

**Recommendation:**
Create a dedicated `TicketStatisticsService` in `src/modules/reports` that utilizes `QueryBuilder` to implement the safe, dynamic statistics generation described in the analysis.

---

## 2. Document Management (Priority: High)
**Status:** Entities Exist, Logic Missing
**Legacy Reference:** `migrations/Document/Document.analysis.md`
**Current Implementation:** `src/modules/tickets/services/ticket.service.ts` (partial)

While the database entities (`Documento`, `DocumentoDetalle`, `DocumentoCierre`) are defined, there is no centralized service to handle file storage or association.

| Feature | Legacy Functionality | Current NestJS Status | Severity |
| :--- | :--- | :--- | :--- |
| **Storage Service** | Centralized handling of physical files (Local/S3). | **MISSING**. No service to handle `mv` or `S3 upload`. | 🔴 Critical |
| **Ticket Attachments** | Upload files during Ticket Creation (`td_documento`). | **MISSING**. `TicketService.create` generates a PDF but leaves a TODO to register it. No user upload support. | 🔴 Critical |
| **Comment Attachments** | Upload files with comments (`td_documento_detalle`). | **MISSING**. `TicketHistoryService` can read them, but cannot write them. | 🔴 Critical |
| **Closing Attachments** | Upload files at ticket closure (`td_documento_cierre`). | **MISSING**. | 🟠 High |
| **Signed Docs** | `get_ultimo_documento_detalle` logic to find signed Acts. | **MISSING**. | 🟡 Medium |

**Recommendation:**
Implement a `DocumentsModule` with a `StorageService` and a `DocumentsService`. Update `TicketService.create` to accept and save uploads.

---

## 3. Ticket Listing Service (Priority: Medium)
**Status:** ~70% Complete
**Legacy Reference:** `migrations/TicketListingService/TicketListingService.analysis.md`
**Current Implementation:** `src/modules/tickets/services/ticket-listing.service.ts`

The core listing logic is sound and secure, but specific specialized views from the legacy system are missing.

| Feature | Legacy Functionality | Current NestJS Status | Severity |
| :--- | :--- | :--- | :--- |
| **Error Views** | `listTicketsErrors`: Specific lists for "Errors I Reported" vs "Errors Assigned to Me". | **MISSING**. The `TicketView` enum does not account for Error type tickets specifically. | 🟡 Medium |
| **Assignee Names** | Displaying multiple assignee names in the list. | **PARTIAL**. Returns `usuarioAsignadoIds` (numbers) or `Unknown`. Code has a `TODO` for proper name resolution. | 🟡 Medium |
| **Complex Filters** | `tagId` filtering. | **IMPLEMENTED**. `TicketListingService` correctly handles tag joins. | ✅ Done |
| **Signed Flow Doc** | `getLastSignedDocument`: showing signed status in list. | **MISSING**. | ⚪ Low |

**Recommendation:**
Add `ERRORS_REPORTED` and `ERRORS_RECEIVED` to the `TicketView` enum and implement the corresponding filter logic in `TicketListingService`. Implement the Assignee Name resolution.

---

## Summary of Action Items

1.  **Implement `TicketStatisticsService`**: Port the recursive scope and dynamic aggregation logic.
2.  **Implement `DocumentsService`**: specific handlers for file uploads (using `Multer` or similar) and DB registration for the 3 document entities.
3.  **Update `TicketService`**: Integrate `DocumentsService` to handle uploads during creation.
4.  **Update `TicketListingService`**: Add support for Error views and fix assignee name display.
