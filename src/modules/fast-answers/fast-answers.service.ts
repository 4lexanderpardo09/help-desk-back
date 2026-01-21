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
        return qb.getMany();
    }

    async findOne(id: number) {
        return this.repo.findOneBy({ id });
    }

    async create(data: Partial<FastAnswer>) {
        const entity = this.repo.create({ ...data, estado: 1 });
        return this.repo.save(entity);
    }
}
