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
    async stampSignaturesForStep(pdfPath: string, pasoId: number, ticketId?: number): Promise<Uint8Array> {
        this.logger.log(`Preparing signatures for Step ${pasoId} on PDF: ${pdfPath}`);

        // 1. Get Signature Configurations for this Step
        const firmasConfig = await this.firmaRepo.find({
            where: { pasoId, estado: 1 },
            relations: ['usuario', 'cargo'],
        });

        if (firmasConfig.length === 0) {
            this.logger.log(`No signature configurations found for Step ${pasoId}. Returning original PDF.`);
            // Return original file content if no stamps needed
            const fs = require('fs/promises');
            return fs.readFile(pdfPath);
        }

        const imagesToStamp: ImageStampConfig[] = [];

        // 2. Resolve Images for each config
        for (const config of firmasConfig) {
            let userToSign: User | null = null;

            if (config.usuarioId) {
                // Direct User Assignment
                userToSign = config.usuario;
            } else if (config.cargoId) {
                // Role-based Assignment
                // Logic: Find a user with this role. 
                // CRITICAL: Which user? The one assigned to the ticket? Or any user with the role?
                // Legacy system often stamped the 'Boss' or specific static roles.
                // For now, if ticketId is provided, we could try to resolve context, but let's look for *any* active user with that role 
                // OR (better) relying on the specific user link if available.
                // If it's pure role based, we might default to the first found or skip if ambiguous.
                // Let's defer strict role resolution logic, prioritizing direct user link or checking if `usuario` relation is populated.

                if (!userToSign) {
                    // Try to find a user if not directly loaded (though relation should handle it)
                    // If config.usuario is null, it means it's a generic role slot.
                    // TODO: Resolve dynamic agent based on Ticket context (e.g. Current Assignee or Supervisor)
                    this.logger.warn(`Signature config #${config.id} is Role-based (Cargo ${config.cargoId}) but dynamic resolution is pending. Skipping.`);
                    continue;
                }
            }

            if (!userToSign) {
                this.logger.warn(`No user resolved for Signature Config #${config.id}. Skipping.`);
                continue;
            }

            if (!userToSign.firma) {
                this.logger.warn(`User #${userToSign.id} (${userToSign.email}) has no signature image configured. Skipping.`);
                continue;
            }

            // 3. Prepare Stamp Config
            // user.firma typically stores relative path or filename. Need absolute path.
            // Assumption: 'firma' stores distinct path, e.g., 'uploads/signatures/sign.png'
            // We need to resolve this relative to the project root or upload dir.
            // Adjust base path as per environment.
            const signatureAbsolutePath = path.resolve(process.cwd(), userToSign.firma);

            imagesToStamp.push({
                imagePath: signatureAbsolutePath,
                x: config.coordX,
                y: config.coordY,
                page: config.pagina || 1,
                width: 100, // Default width, can be adjusted or added to entity later
                height: 50, // Default height
            });
        }

        // 3. Stamp Images
        if (imagesToStamp.length > 0) {
            return this.pdfStampingService.stampImages(pdfPath, imagesToStamp);
        } else {
            const fs = require('fs/promises');
            return fs.readFile(pdfPath);
        }
    }
}
