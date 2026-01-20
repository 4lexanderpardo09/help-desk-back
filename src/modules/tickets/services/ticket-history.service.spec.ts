import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketHistoryService } from './ticket-history.service';
import { TicketDetalle } from '../entities/ticket-detalle.entity';
import { TicketAsignacionHistorico } from '../entities/ticket-asignacion-historico.entity';
import { Documento } from '../../documents/entities/documento.entity';
import { TimelineItemType } from '../dto/ticket-timeline.dto';

describe('TicketHistoryService', () => {
    let service: TicketHistoryService;
    let ticketDetalleRepo: Repository<TicketDetalle>;
    let ticketAsigRepo: Repository<TicketAsignacionHistorico>;

    const mockDateRecent = new Date('2024-01-02T10:00:00Z');
    const mockDateOld = new Date('2024-01-01T10:00:00Z');

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
        it('should return combined and sorted timeline items', async () => {
            const result = await service.getTicketTimeline(1);

            expect(result).toHaveLength(2);

            // Should be sorted DESC (Recent first)
            expect(result[0].type).toBe(TimelineItemType.ASSIGNMENT);
            expect(result[0].fecha).toEqual(mockDateRecent);
            expect(result[0].actor.nombre).toBe('Juan Perez');
            expect(result[0].asignadoA?.nombre).toBe('Maria Lopez');

            // Second item
            expect(result[1].type).toBe(TimelineItemType.COMMENT);
            expect(result[1].fecha).toEqual(mockDateOld);
            expect(result[1].descripcion).toBe('Comentario de prueba');
        });
    });
});
