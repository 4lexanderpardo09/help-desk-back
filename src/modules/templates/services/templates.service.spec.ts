import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesService } from './templates.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CampoPlantilla } from '../entities/campo-plantilla.entity';
import { FlujoPlantilla } from '../../workflows/entities/flujo-plantilla.entity';
import { Consulta } from '../../reports/entities/consulta.entity';
import { TicketCampoValor } from '../../tickets/entities/ticket-campo-valor.entity';
import { DataSource } from 'typeorm';

describe('TemplatesService', () => {
    let service: TemplatesService;
    let dataSourceMock: any;
    let campoRepoMock: any;
    let consultaRepoMock: any;

    beforeEach(async () => {
        dataSourceMock = {
            query: jest.fn(),
        };

        campoRepoMock = {
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            })),
        };

        consultaRepoMock = {
            findOne: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TemplatesService,
                {
                    provide: getRepositoryToken(CampoPlantilla),
                    useValue: campoRepoMock,
                },
                {
                    provide: getRepositoryToken(FlujoPlantilla),
                    useValue: { findOne: jest.fn() },
                },
                {
                    provide: getRepositoryToken(Consulta),
                    useValue: consultaRepoMock,
                },
                {
                    provide: getRepositoryToken(TicketCampoValor),
                    useValue: { find: jest.fn() },
                },
                {
                    provide: DataSource,
                    useValue: dataSourceMock,
                },
            ],
        }).compile();

        service = module.get<TemplatesService>(TemplatesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('executeFieldQuery', () => {
        it('should execute PRESET_REGIONAL query', async () => {
            const campo = { id: 1, campoQuery: 'PRESET_REGIONAL' };
            campoRepoMock.findOne.mockResolvedValue(campo);
            dataSourceMock.query.mockResolvedValue([{ id: 1, label: 'BOGOTA' }]);

            const result = await service.executeFieldQuery(1, 'bog');

            expect(dataSourceMock.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT reg_id as id'),
                ['%bog%']
            );
            expect(result).toHaveLength(1);
        });

        it('should execute Numeric ID stored query', async () => {
            const campo = { id: 2, campoQuery: '10' }; // ID 10
            const consulta = { id: 10, sql: 'SELECT id, name FROM custom_table' };

            campoRepoMock.findOne.mockResolvedValue(campo);
            consultaRepoMock.findOne.mockResolvedValue(consulta);
            dataSourceMock.query.mockResolvedValue([{ id: 1, name: 'Custom' }]);

            const result = await service.executeFieldQuery(2);

            expect(consultaRepoMock.findOne).toHaveBeenCalledWith({ where: { id: 10 } });
            expect(dataSourceMock.query).toHaveBeenCalledWith('SELECT id, name FROM custom_table', []);
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Custom');
        });
    });
});
