import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PdfStampingService, ImageStampConfig } from '../../templates/services/pdf-stamping.service';
import { PasoFlujoFirma } from '../entities/paso-flujo-firma.entity';
import { User } from '../../users/entities/user.entity';
import * as path from 'path';

/**
 * Service to handle dynamic signature stamping based on workflow configuration.
 */
@Injectable()
export class SignatureStampingService {
    private readonly logger = new Logger(SignatureStampingService.name);

    constructor(
        private readonly pdfStampingService: PdfStampingService,
        @InjectRepository(PasoFlujoFirma)
        private readonly firmaRepo: Repository<PasoFlujoFirma>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { }

    /**
     * Stamps signatures onto a PDF based on the configuration of a specific workflow step.
     * 
     * @param pdfPath Absolute path to the source PDF.
     * @param pasoId The Step ID (PasoFlujo) to retrieve signature configurations.
     * @param ticketId Optional Ticket ID context (if signatures depend on dynamic assignees in future).
     * @returns Uint8Array of the signed PDF.
     */
    async stampSignaturesForStep(pdfPath: string, pasoId: number, ticketId?: number, signatoryUserId?: number, overrideSignaturePath?: string): Promise<Uint8Array> {
        this.logger.log(`Preparing signatures for Step ${pasoId} on PDF: ${pdfPath}`);

        // 1. Get Signature Configurations for this Step
        const firmasConfig = await this.firmaRepo.find({
            where: { pasoId, estado: 1 },
            relations: ['usuario', 'cargo'],
            order: { id: 'ASC' } // Deterministic order for slot allocation
        });

        if (firmasConfig.length === 0) {
            this.logger.log(`No signature configurations found for Step ${pasoId}. Returning original PDF.`);
            const fs = await import('fs/promises');
            return fs.readFile(pdfPath);
        }

        const imagesToStamp: ImageStampConfig[] = [];

        // Strategy: 
        // If signatoryUserId is provided, we must identify WHICH specific config slot they occupy.
        // 1. Check for Explicit Assignment (highest priority)
        // 2. Check for Generic/Role Assignment (requires slot allocation by order)

        let configsToProcess = firmasConfig;

        if (signatoryUserId && ticketId) {
            // Filter configs to only those relevant for this user
            const explicitConfigs = firmasConfig.filter(c => c.usuarioId === signatoryUserId);

            if (explicitConfigs.length > 0) {
                // If explicitly defined, use those. Ignore generics to avoid double stamping.
                configsToProcess = explicitConfigs;
            } else {
                // No explicit config. Check if we match any generic/role config.
                // Logic: "First Come First Served" for generic slots.
                const genericConfigs = firmasConfig.filter(c => !c.usuarioId);

                if (genericConfigs.length > 0) {
                    // Determine my "Slot Index" among all parallel signers for generic slots
                    // We need TicketParalelo repo.
                    const parallelRepo = this.firmaRepo.manager.getRepository('TicketParalelo');

                    const completedTasks = await parallelRepo.find({
                        where: {
                            ticketId,
                            pasoId,
                            estado: 'Completado'
                        },
                        order: { fechaCierre: 'ASC', id: 'ASC' }
                    }) as any[]; // Cast as any because we are using manager.getRepository('string')

                    // Filter tasks to only those belonging to users who are GENERICALLY signing
                    // (i.e. exclude users who had explicit slots if possible, but that's hard to know here)
                    // Assumption: If I am generic, other generics are also competing for generic slots.

                    // Simple heuristic: Get index of current user in the completed list.
                    const myTaskIndex = completedTasks.findIndex(t => t.usuarioId === signatoryUserId);

                    if (myTaskIndex !== -1 && myTaskIndex < genericConfigs.length) {
                        // I occupy the Nth generic slot
                        configsToProcess = [genericConfigs[myTaskIndex]];
                        this.logger.log(`User ${signatoryUserId} allocated to Generic Signature Slot #${myTaskIndex + 1} (Config ID: ${configsToProcess[0].id})`);
                    } else {
                        if (myTaskIndex === -1) {
                            this.logger.warn(`User ${signatoryUserId} signing but task not found in Parallel records? Skipping stamp.`);
                            configsToProcess = [];
                        } else {
                            this.logger.warn(`User ${signatoryUserId} is signer #${myTaskIndex + 1} but only ${genericConfigs.length} generic slots available. Skipping stamp.`);
                            configsToProcess = [];
                        }
                    }
                } else {
                    // No explicit and no generic slots?
                    configsToProcess = [];
                }
            }
        }

        // 2. Resolve Images for each config
        for (const config of configsToProcess) {
            let userToSign: User | null = null;
            let currentSignerId: number | null = config.usuarioId ? config.usuarioId : null;

            // ... (rest of logic to resolve user/image)

            if (signatoryUserId && (currentSignerId === null || currentSignerId === signatoryUserId)) {
                // If we are overriding/stamping for a specific user, ensure we use their data
                userToSign = await this.userRepo.findOne({ where: { id: signatoryUserId } });
            } else if (config.usuarioId) {
                userToSign = config.usuario;
            }

            if (!userToSign) continue;

            // 3. Prepare Stamp Config
            let signatureAbsolutePath: string;

            // USE OVERRIDE IF AVAILABLE (for dynamic signatures of the current signer)
            if (overrideSignaturePath && signatoryUserId && userToSign.id === signatoryUserId) {
                signatureAbsolutePath = overrideSignaturePath;
            } else if (userToSign.firma) {
                signatureAbsolutePath = path.resolve(process.cwd(), userToSign.firma);
            } else {
                continue;
            }

            imagesToStamp.push({
                imagePath: signatureAbsolutePath,
                x: config.coordX,
                y: config.coordY,
                page: config.pagina || 1,
                width: 100, // Default width
                height: 50, // Default height
                tag: config.etiqueta || undefined, // Smart Tag
            });
        }

        // 3. Stamp Images
        if (imagesToStamp.length > 0) {
            return this.pdfStampingService.stampImages(pdfPath, imagesToStamp);
        } else {
            const fs = await import('fs/promises');
            return fs.readFile(pdfPath);
        }
    }
}
