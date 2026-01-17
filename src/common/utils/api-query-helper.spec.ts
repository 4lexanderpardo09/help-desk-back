import { ApiQueryHelper } from './api-query-helper';
import { SelectQueryBuilder } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

describe('ApiQueryHelper', () => {
    let qb: Partial<SelectQueryBuilder<any>>;
    let mockJoinAttributes: any[];
    let mockAliases: any[];

    beforeEach(() => {
        mockJoinAttributes = [];
        mockAliases = [];

        qb = {
            expressionMap: {
                joinAttributes: mockJoinAttributes,
                aliases: mockAliases,
            } as any,
            connection: {
                getMetadata: jest.fn().mockImplementation((target) => ({ target })),
            } as any,
            leftJoinAndSelect: jest.fn().mockImplementation((relation, alias) => {
                // Simular que el join se agrega al expressionMap
                mockJoinAttributes.push({
                    alias: { name: alias },
                    parentAlias: relation.split('.')[0],
                    relation: { propertyName: relation.split('.')[1] }
                });
                mockAliases.push({ name: alias, target: 'MockEntity' });
                return qb;
            }),
            andWhere: jest.fn().mockReturnThis(),
        };
    });

    describe('applyIncludes', () => {
        it('should do nothing if included is empty', () => {
            ApiQueryHelper.applyIncludes(qb as SelectQueryBuilder<any>, undefined, ['rel'], 'main');
            expect(qb.leftJoinAndSelect).not.toHaveBeenCalled();
        });

        it('should include allowed direct relations', () => {
            ApiQueryHelper.applyIncludes(qb as SelectQueryBuilder<any>, 'regional', ['regional'], 'user');
            expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('user.regional', 'regional');
        });

        it('should ignore disallowed relations', () => {
            ApiQueryHelper.applyIncludes(qb as SelectQueryBuilder<any>, 'admin', ['regional'], 'user');
            expect(qb.leftJoinAndSelect).not.toHaveBeenCalled();
        });

        it('should handle nested relations (regional.zona)', () => {
            ApiQueryHelper.applyIncludes(qb as SelectQueryBuilder<any>, 'regional.zona', ['regional.zona'], 'user');

            // Debería hacer join de regional primero, luego zona
            expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('user.regional', 'regional');
            expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('regional.zona', 'zona');
        });

        it('should reuse existing joins (alias collision prevention)', () => {
            // Simular un join preexistente
            mockJoinAttributes.push({
                alias: { name: 'regional' },
                parentAlias: 'user',
                relation: { propertyName: 'regional' }
            });
            mockAliases.push({ name: 'regional' });

            ApiQueryHelper.applyIncludes(qb as SelectQueryBuilder<any>, 'regional.zona', ['regional.zona'], 'user');

            // NO debería llamar unirse a regional de nuevo
            expect(qb.leftJoinAndSelect).not.toHaveBeenCalledWith('user.regional', 'regional');
            // SÍ debería unirse a zona usando el alias del padre existente
            expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('regional.zona', 'zona');
        });

        it('should generate unique alias if target alias is taken by unrelated join', () => {
            // Simular que 'zona' ya está tomado por otra cosa (ej: 'user.zona')
            mockAliases.push({ name: 'zona' });

            ApiQueryHelper.applyIncludes(qb as SelectQueryBuilder<any>, 'regional.zona', ['regional.zona'], 'user');

            expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('user.regional', 'regional');
            // Debería usar 'regional_zona' en lugar de 'zona'
            expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('regional.zona', 'regional_zona');
        });

        it('should throw BadRequestException on error', () => {
            qb.leftJoinAndSelect = jest.fn().mockImplementation(() => {
                throw new Error('TypeORM Error');
            });

            expect(() => {
                ApiQueryHelper.applyIncludes(qb as SelectQueryBuilder<any>, 'regional', ['regional'], 'user');
            }).toThrow(BadRequestException);
        });
    });

    describe('applyFilters', () => {
        it('should apply allowed filters', () => {
            ApiQueryHelper.applyFilters(qb as SelectQueryBuilder<any>, { nombre: 'Alex' }, ['nombre'], 'user');
            expect(qb.andWhere).toHaveBeenCalledWith(
                'user.nombre LIKE :filter_nombre',
                { filter_nombre: '%Alex%' }
            );
        });

        it('should ignore disallowed filters', () => {
            ApiQueryHelper.applyFilters(qb as SelectQueryBuilder<any>, { admin: 'true' }, ['nombre'], 'user');
            expect(qb.andWhere).not.toHaveBeenCalled();
        });

        it('should ignore empty values', () => {
            ApiQueryHelper.applyFilters(qb as SelectQueryBuilder<any>, { nombre: '' }, ['nombre'], 'user');
            expect(qb.andWhere).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException on error', () => {
            qb.andWhere = jest.fn().mockImplementation(() => {
                throw new Error('TypeORM Error');
            });

            expect(() => {
                ApiQueryHelper.applyFilters(qb as SelectQueryBuilder<any>, { nombre: 'Alex' }, ['nombre'], 'user');
            }).toThrow(BadRequestException);
        });
    });
});
