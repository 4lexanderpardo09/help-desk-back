import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorType } from './entities/error-type.entity';
import { ErrorSubtype } from './entities/error-subtype.entity';
import { CreateErrorTypeDto } from './dto/create-error-type.dto';
import { CreateErrorSubtypeDto } from './dto/create-error-subtype.dto';
import { UpdateErrorTypeDto } from './dto/update-error-type.dto';
import { ApiQueryHelper, PaginatedResult } from '../../common/utils/api-query-helper';

@Injectable()
export class ErrorTypesService {
    constructor(
        @InjectRepository(ErrorType)
        private readonly errorTypeRepository: Repository<ErrorType>,
        @InjectRepository(ErrorSubtype)
        private readonly errorSubtypeRepository: Repository<ErrorSubtype>,
    ) { }

    /**
     * Create a new Error Type (Master category)
     */
    async create(createDto: CreateErrorTypeDto): Promise<ErrorType> {
        const errorType = this.errorTypeRepository.create(createDto);
        return await this.errorTypeRepository.save(errorType);
    }

    /**
     * Create a new Error Subtype (Detail option)
     */
    async createSubtype(createDto: CreateErrorSubtypeDto): Promise<ErrorSubtype> {
        const subtype = this.errorSubtypeRepository.create({
            ...createDto,
            isActive: createDto.isActive ?? true
        });
        return await this.errorSubtypeRepository.save(subtype);
    }

    /**
     * List all Error Types with pagination and filtering
     */
    async findAll(query: any): Promise<PaginatedResult<ErrorType>> {
        const qb = this.errorTypeRepository.createQueryBuilder('et');
        const { sort, ...filters } = query;

        ApiQueryHelper.applyFilters(qb, filters, ['title', 'category', 'isActive'], 'et');
        ApiQueryHelper.applyIncludes(qb, query.included, ['subtypes'], 'et');
        ApiQueryHelper.applySort(qb, sort, 'et');

        return await ApiQueryHelper.paginate(qb, query);
    }

    /**
     * List all Subtypes for a given Error Type ID
     */
    async findAllSubtypes(errorTypeId: number): Promise<ErrorSubtype[]> {
        return await this.errorSubtypeRepository.find({
            where: { errorTypeId, isActive: true },
            order: { title: 'ASC' }
        });
    }

    /**
     * Get a specific Error Type by ID, including its subtypes
     */
    async findOne(id: number): Promise<ErrorType> {
        const errorType = await this.errorTypeRepository.findOne({
            where: { id },
            relations: ['subtypes']
        });
        if (!errorType) {
            throw new NotFoundException(`Error Type #${id} not found`);
        }
        return errorType;
    }

    /**
     * Update an Error Type
     */
    async update(id: number, updateDto: UpdateErrorTypeDto): Promise<ErrorType> {
        const errorType = await this.findOne(id);
        Object.assign(errorType, updateDto);
        return await this.errorTypeRepository.save(errorType);
    }

    /**
     * Soft delete an Error Type
     */
    async remove(id: number): Promise<void> {
        const errorType = await this.findOne(id);
        errorType.isActive = false; // Soft delete by logic
        await this.errorTypeRepository.save(errorType);
    }

    /**
     * Update an Error Subtype (Added for complete CRUD)
     */
    async updateSubtype(id: number, updateDto: Partial<CreateErrorSubtypeDto>): Promise<ErrorSubtype> {
        const subtype = await this.errorSubtypeRepository.findOneBy({ id });
        if (!subtype) {
            throw new NotFoundException(`Error Subtype #${id} not found`);
        }
        Object.assign(subtype, updateDto);
        return await this.errorSubtypeRepository.save(subtype);
    }

    /**
     * Soft delete an Error Subtype (Added for complete CRUD)
     */
    async removeSubtype(id: number): Promise<void> {
        const subtype = await this.errorSubtypeRepository.findOneBy({ id });
        if (!subtype) {
            throw new NotFoundException(`Error Subtype #${id} not found`);
        }
        subtype.isActive = false;
        await this.errorSubtypeRepository.save(subtype);
    }
}
