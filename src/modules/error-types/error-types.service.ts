import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorType } from './entities/error-type.entity';
import { CreateErrorTypeDto } from './dto/create-error-type.dto';
import { UpdateErrorTypeDto } from './dto/update-error-type.dto';
import { ApiQueryHelper, PaginatedResult } from '../../common/utils/api-query-helper';

@Injectable()
export class ErrorTypesService {
    constructor(
        @InjectRepository(ErrorType)
        private readonly errorTypeRepository: Repository<ErrorType>,
    ) { }

    async create(createDto: CreateErrorTypeDto): Promise<ErrorType> {
        const errorType = this.errorTypeRepository.create(createDto);
        return await this.errorTypeRepository.save(errorType);
    }

    async findAll(query: any): Promise<PaginatedResult<ErrorType>> {
        const qb = this.errorTypeRepository.createQueryBuilder('et');
        const { sort, ...filters } = query;

        // Parent/Child Filter Logic
        if (query.onlyRoots === 'true') {
            qb.andWhere('et.parentId IS NULL');
            delete filters.onlyRoots;
        } else if (query.parentId) {
            qb.andWhere('et.parentId = :parentId', { parentId: query.parentId });
            delete filters.parentId;
        }

        // Eager load children if specifically requested or useful? 
        // For listing, maybe not always. But let's keep it simple for now.

        ApiQueryHelper.applyFilters(qb, filters, ['title', 'category', 'isActive'], 'et');
        ApiQueryHelper.applySort(qb, sort, 'et');

        return await ApiQueryHelper.paginate(qb, query);
    }

    async findOne(id: number): Promise<ErrorType> {
        const errorType = await this.errorTypeRepository.findOne({
            where: { id },
            relations: ['children', 'parent']
        });
        if (!errorType) {
            throw new NotFoundException(`Error Type #${id} not found`);
        }
        return errorType;
    }

    async update(id: number, updateDto: UpdateErrorTypeDto): Promise<ErrorType> {
        const errorType = await this.findOne(id);
        Object.assign(errorType, updateDto);
        return await this.errorTypeRepository.save(errorType);
    }

    async remove(id: number): Promise<void> {
        const errorType = await this.findOne(id);
        errorType.isActive = false; // Soft delete by logic
        await this.errorTypeRepository.save(errorType);
    }
}
