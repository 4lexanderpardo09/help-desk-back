import { Test, TestingModule } from '@nestjs/testing';
import { SignatureStampingService } from './signature-stamping.service';
import { PdfStampingService } from '../../templates/services/pdf-stamping.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PasoFlujoFirma } from '../entities/paso-flujo-firma.entity';
import { User } from '../../users/entities/user.entity';
import * as path from 'path';

describe('SignatureStampingService', () => {
    let service: SignatureStampingService;
    let pdfStampingService: PdfStampingService;

    // Mocks
    const mockFirmaRepo = {
        find: jest.fn(),
    };
    const mockUserRepo = {
        findOne: jest.fn(),
    };
    const mockPdfStampingService = {
        stampImages: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SignatureStampingService,
                {
                    provide: PdfStampingService,
                    useValue: mockPdfStampingService,
                },
                {
                    provide: getRepositoryToken(PasoFlujoFirma),
                    useValue: mockFirmaRepo,
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepo,
                },
            ],
        }).compile();

        service = module.get<SignatureStampingService>(SignatureStampingService);
        pdfStampingService = module.get<PdfStampingService>(PdfStampingService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('stampSignaturesForStep', () => {
        it('should return original PDF if no signatures configured', async () => {
            mockFirmaRepo.find.mockResolvedValue([]);
            const mockFsRead = jest.spyOn(require('fs/promises'), 'readFile').mockResolvedValue(Buffer.from('PDF'));

            const result = await service.stampSignaturesForStep('test.pdf', 1);

            expect(mockFirmaRepo.find).toHaveBeenCalled();
            expect(mockPdfStampingService.stampImages).not.toHaveBeenCalled();
            expect(result).toEqual(Buffer.from('PDF'));
        });

        it('should call stampImages with correct config when signatures exist', async () => {
            const mockUser = { id: 1, firma: 'uploads/sig.png', email: 'test@test.com' };
            const mockFirma = {
                id: 1,
                pasoId: 1,
                coordX: 100,
                coordY: 200,
                pagina: 1,
                estado: 1,
                usuarioId: 1,
                usuario: mockUser,
            };

            mockFirmaRepo.find.mockResolvedValue([mockFirma]);
            mockPdfStampingService.stampImages.mockResolvedValue(new Uint8Array([1, 2, 3]));

            await service.stampSignaturesForStep('test.pdf', 1);

            expect(mockPdfStampingService.stampImages).toHaveBeenCalledWith('test.pdf', [
                expect.objectContaining({
                    imagePath: path.resolve(process.cwd(), 'uploads/sig.png'),
                    x: 100,
                    y: 200,
                    page: 1,
                })
            ]);
        });

        it('should skip signature if user has no firma path', async () => {
            const mockUser = { id: 1, firma: null, email: 'test@test.com' };
            const mockFirma = {
                id: 1,
                usuarioId: 1,
                usuario: mockUser,
            };

            mockFirmaRepo.find.mockResolvedValue([mockFirma]);

            // Should behave like no signatures
            const mockFsRead = jest.spyOn(require('fs/promises'), 'readFile').mockResolvedValue(Buffer.from('PDF'));

            await service.stampSignaturesForStep('test.pdf', 1);

            expect(mockPdfStampingService.stampImages).not.toHaveBeenCalled();
        });
    });
});
