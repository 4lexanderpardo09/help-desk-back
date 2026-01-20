import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import 'multer';

/**
 * Service generic for handling file storage.
 * Currently uses Local Filesystem. Can be extended for S3.
 */
@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private readonly baseDir = path.resolve(process.cwd(), 'public');

    constructor() {
        this.ensureBaseDir();
    }

    private async ensureBaseDir() {
        try {
            await fs.mkdir(this.baseDir, { recursive: true });
        } catch (error) {
            this.logger.error(`Failed to ensure base directory ${this.baseDir}`, error);
        }
    }

    /**
     * Saves a file (buffer) to the specified subdirectory
     */
    async saveBuffer(buffer: Buffer, subDir: string, filename: string): Promise<string> {
        const fullDir = path.join(this.baseDir, subDir);
        await fs.mkdir(fullDir, { recursive: true });

        const fullPath = path.join(fullDir, filename);
        await fs.writeFile(fullPath, buffer);

        this.logger.log(`File saved at ${fullPath}`);
        return path.join(subDir, filename).split(path.sep).join('/');
    }

    /**
     * Saves a file to the specified subdirectory
     * @param file The file object from Multer
     * @param subDir Subdirectory path (e.g. 'documentos/1050')
     * @returns The relative path to the saved file
     */
    async save(file: Express.Multer.File, subDir: string, customFilename?: string): Promise<string> {
        return this.saveBuffer(file.buffer, subDir, customFilename || this.sanitizeFilename(file.originalname));
    }

    /**
     * Retrieves a file as a StreamableFile for download
     */
    async getStream(relativePath: string): Promise<StreamableFile> {
        const fullPath = path.join(this.baseDir, relativePath);

        if (!fsSync.existsSync(fullPath)) {
            throw new Error(`File not found at ${fullPath}`);
        }

        const fileStream = fsSync.createReadStream(fullPath);
        return new StreamableFile(fileStream);
    }

    /**
     * Checks if file exists
     */
    async exists(relativePath: string): Promise<boolean> {
        const fullPath = path.join(this.baseDir, relativePath);
        try {
            await fs.access(fullPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Sanitize filename to prevent directory traversal or weird chars
     */
    private sanitizeFilename(filename: string): string {
        return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    }
}
