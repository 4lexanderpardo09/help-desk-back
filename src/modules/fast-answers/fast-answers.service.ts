import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FastAnswer } from './entities/fast-answer.entity';
import { FindOptions } from '../../common/utils/api-query-helper';
import { ApiQueryHelper } from '../../common/utils/api-query-helper';

@Injectable()
export class FastAnswersService {
    private readonly allowedFilters = ['titulo', 'tipo', 'estado'];
    private readonly allowedIncludes = [];

    constructor(
        @InjectRepository(FastAnswer)
        private readonly repo: Repository<FastAnswer>,
    ) { }

    async findAll(options: FindOptions) {
        const qb = this.repo.createQueryBuilder('fa');
        ApiQueryHelper.applyFilters(qb, options.filter, this.allowedFilters, 'fa');

        if (options.sort) {
            ApiQueryHelper.applySort(qb, options.sort, 'fa');
        }

        return ApiQueryHelper.paginate(qb, { page: options.page, limit: options.limit });
    }

    async findOne(id: number) {
        return this.repo.findOneBy({ id });
    }

    async create(data: Partial<FastAnswer>) {
        const entity = this.repo.create({ ...data, estado: 1 });
        return this.repo.save(entity);
    }

    async update(id: number, data: Partial<FastAnswer>) {
        await this.repo.update(id, data);
        return this.findOne(id);
    }

    async delete(id: number) {
        await this.repo.update(id, { estado: 0 });
        return { message: 'Fast Answer deleted successfully' };
    }
}
