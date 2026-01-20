import { DocumentoLegacy, DocumentoDetalleLegacy, DocumentoCierreLegacy } from '../../_legacy_entities/document.entities';

export interface LegacyDocumentModel {
    // Basic CRUD
    insert_documento(tickId: number, filename: string): Promise<void>;
    get_documento_x_ticket(tickId: number): Promise<DocumentoLegacy[]>;

    insert_documento_detalle(tickdId: number, filename: string): Promise<void>;
    get_documento_detalle_x_ticket(tickdId: number): Promise<DocumentoDetalleLegacy[]>;

    insert_documento_cierre(tickId: number, filename: string): Promise<number>;
    get_documentos_cierre_x_ticket(tickId: number): Promise<DocumentoCierreLegacy[]>;

    /**
     * Lógica de Negocio: Buscar último documento firmado.
     * Query: LIKE 'signed_%' ORDER BY fech_crea DESC LIMIT 1
     */
    get_ultimo_documento_detalle(tickId: number): Promise<DocumentoDetalleLegacy | null>;
}
