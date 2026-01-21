import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketHistoryService } from './ticket-history.service';
import { TicketDetalle } from '../entities/ticket-detalle.entity';
import { TicketAsignacionHistorico } from '../entities/ticket-asignacion-historico.entity';
import { Documento } from '../../documents/entities/documento.entity';
import { DocumentoFlujo } from '../../documents/entities/documento-flujo.entity';
import { TimelineItemType } from '../dto/ticket-timeline.dto';

describe('TicketHistoryService', () => {
    let service: TicketHistoryService;
    let ticketDetalleRepo: Repository<TicketDetalle>;
    let ticketAsigRepo: Repository<TicketAsignacionHistorico>;
    let docFlujoRepo: Repository<DocumentoFlujo>;

    const mockDateRecent = new Date('2024-01-02T10:00:00Z');
    const mockDateOld = new Date('2024-01-01T10:00:00Z');
    const mockDateVeryRecent = new Date('2024-01-03T10:00:00Z');

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TicketHistoryService,
                {
                    provide: getRepositoryToken(TicketDetalle),
                    useValue: {
                        find: jest.fn().mockResolvedValue([
                            {
                                ticketId: 1,
                                usuarioId: 10,
                                descripcion: 'Comentario de prueba',
                                fechaCreacion: mockDateOld, // Older
                                usuario: { nombre: 'Juan', apellido: 'Perez' }
                            }
                        ]),
                    },
                },
                {
                    provide: getRepositoryToken(TicketAsignacionHistorico),
                    useValue: {
                        find: jest.fn().mockResolvedValue([
                            {
                                ticketId: 1,
                                fechaAsignacion: mockDateRecent, // Newer
                                usuarioAsignadorId: 10,
                                usuarioAsignadoId: 20,
                                comentario: 'Asignando a experto',
                                usuarioAsignador: { nombre: 'Juan', apellido: 'Perez' },
                                usuarioAsignado: { nombre: 'Maria', apellido: 'Lopez' }
                            }
                        ]),
                    },
                },
                {
                    provide: getRepositoryToken(Documento),
                    useValue: {
                        find: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(DocumentoFlujo),
                    useValue: {
                        find: jest.fn().mockResolvedValue([
                            {
                                id: 99,
                                ticketId: 1,
                                nombre: 'acta_firmada.pdf',
                                fechaCreacion: mockDateVeryRecent, // Newest
                                usuarioId: 10,
                                usuario: { nombre: 'Juan', apellido: 'Perez' }
                            }
                        ]),
                        findOne: jest.fn().mockResolvedValue({
                            id: 99,
                            ticketId: 1,
                            nombre: 'acta_firmada.pdf',
                            fechaCreacion: mockDateVeryRecent
                        })
                    },
                },
            ],
        }).compile();

        service = module.get<TicketHistoryService>(TicketHistoryService);
        ticketDetalleRepo = module.get<Repository<TicketDetalle>>(getRepositoryToken(TicketDetalle));
        ticketAsigRepo = module.get<Repository<TicketAsignacionHistorico>>(getRepositoryToken(TicketAsignacionHistorico));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getTicketTimeline', () => {
        it('should return combined and sorted timeline items including signed documents', async () => {
            const result = await service.getTicketTimeline(1);

            expect(result).toHaveLength(3); // Comment + Assignment + SignedDoc

            // Should be sorted DESC (Newest first)

            // 1. Signed Document (Very Recent)
            expect(result[0].type).toBe(TimelineItemType.SIGNED_DOCUMENT);
            expect(result[0].fecha).toEqual(mockDateVeryRecent);
            expect(result[0].descripcion).toContain('acta_firmada.pdf');

            // 2. Assignment (Recent)
            expect(result[1].type).toBe(TimelineItemType.ASSIGNMENT);
            expect(result[1].fecha).toEqual(mockDateRecent);
            expect(result[1].actor.nombre).toBe('Juan Perez');
            expect(result[1].asignadoA?.nombre).toBe('Maria Lopez');

            // 3. Comment (Old)
            expect(result[2].type).toBe(TimelineItemType.COMMENT);
            expect(result[2].fecha).toEqual(mockDateOld);
            expect(result[2].descripcion).toBe('Comentario de prueba');
        });

        it('should return last signed document', async () => {
            const result = await service.getLastSignedDocument(1);
            expect(result).toBeDefined();
            expect(result?.nombre).toBe('acta_firmada.pdf');
        });
    });
});
