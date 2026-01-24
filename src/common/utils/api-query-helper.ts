import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';

export interface FindOptions {
    filter?: Record<string, any>;
    include?: string;
    sort?: string;
    page?: number;
    limit?: number;
}

export class ApiQueryDto {
    @ApiPropertyOptional({ description: 'Objecto de filtros (ej: ?filter[nombre]=Juan)' })
    filter?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Relaciones a incluir (ej: zona,regional)' })
    include?: string;

    @ApiPropertyOptional({ description: 'Ordenamiento (ej: id,-nombre)' })
    sort?: string;

    @ApiPropertyOptional({ description: 'Número de página', default: 1 })
    page?: number;

    @ApiPropertyOptional({ description: 'Registros por página', default: 20 })
    limit?: number;

    // Add optional key access signature
    [key: string]: any;
}

export class ApiQueryHelper {
    /**
     * Aplica relaciones dinámicas (eager loading) al QueryBuilder basado en el parámetro 'included'.
     * Similar a scopeIncluded de Laravel.
     * 
     * @param qb Instancia de SelectQueryBuilder
     * @param included String de relaciones separadas por coma (ej: 'departamento,regional')
     * @param allowed Lista de relaciones permitidas
     * @param mainAlias Alias de la entidad principal (default: 'q')
     */
    static applyIncludes(
        qb: SelectQueryBuilder<any>,
        included: string | undefined,
        allowed: string[],
        mainAlias: string
    ) {
        if (!included || !allowed.length) {
            return;
        }

        const relations = included.split(',');

        relations.forEach((relation) => {
            const trimmedRel = relation.trim();
            if (allowed.includes(trimmedRel)) {
                // Manejar tanto relaciones directas como anidadas (dot notation)
                const parts = trimmedRel.split('.');
                let currentParentAlias = mainAlias;

                parts.forEach((part) => {
                    try {
                        // 1. Verificar si la relación ya ha sido unida previamente en el QueryBuilder
                        const existingJoin = qb.expressionMap.joinAttributes.find(
                            ja => ja.parentAlias === currentParentAlias && ja.relation?.propertyName === part
                        );

                        if (existingJoin) {
                            currentParentAlias = existingJoin.alias.name;
                            return;
                        }

                        // 2. Si no existe, debemos crear el JOIN.
                        let targetAlias = part;
                        const isAliasTaken = (name: string) => qb.expressionMap.aliases.some(a => a.name === name);

                        // 3. Resolución de Colisiones de Alias
                        if (isAliasTaken(targetAlias)) {
                            targetAlias = `${currentParentAlias}_${part}`;
                            if (isAliasTaken(targetAlias)) {
                                targetAlias = `${targetAlias}_${Math.floor(Math.random() * 1000)}`;
                            }
                        }

                        // 4. Ejecutar el Join
                        const propertyPath = `${currentParentAlias}.${part}`;
                        qb.leftJoinAndSelect(propertyPath, targetAlias);
                        currentParentAlias = targetAlias;
                    } catch (error) {
                        throw new BadRequestException(
                            `Error al incluir la relación '${part}' en la ruta '${trimmedRel}'. Verifique que la relación exista y sea válida. Detalle: ${error instanceof Error ? error.message : error}`
                        );
                    }
                });
            }
        });
    }

    /**
     * Aplica filtros dinámicos (WHERE LIKE) basados en un objeto de filtros.
     * Similar a scopeFilter de Laravel.
     * 
     * @param qb Instancia de SelectQueryBuilder
     * @param filters Objeto de filtros (key: value)
     * @param allowed Lista de campos permitidos para filtrar
     * @param mainAlias Alias de la entidad principal
     */
    static applyFilters(
        qb: SelectQueryBuilder<any>,
        filters: Record<string, any> | undefined,
        allowed: string[],
        mainAlias: string
    ) {
        if (!filters || !allowed.length) {
            return;
        }

        try {
            Object.keys(filters).forEach((key) => {
                const value = filters[key];

                if (!value || value === '') return;

                if (allowed.includes(key)) {
                    // Generamos un nombre de parámetro único para evitar colisiones
                    const paramName = `filter_${key.replace('.', '_')}`;
                    let alias = mainAlias;
                    let field = key;

                    // Support for relation filtering (e.g. 'departamentos.id')
                    if (key.includes('.')) {
                        const parts = key.split('.');
                        const relationName = parts[0];
                        field = parts[1];
                        alias = relationName;

                        // Check if alias exists, if not, innerJoin
                        const aliasExists = qb.expressionMap.aliases.some(a => a.name === alias);
                        if (!aliasExists) {
                            qb.innerJoin(`${mainAlias}.${relationName}`, alias);
                        }
                    }

                    // Lógica inteligente: ID y Estado o claves que terminan en Id usan IGUALDAD estricta o IN
                    // Texto usa LIKE
                    if (field === 'id' || field.endsWith('Id') || field === 'estado' || field === 'est' || key.endsWith('.id')) {
                        if (Array.isArray(value)) {
                            // Caso: filter[id][]=1&filter[id][]=2
                            qb.andWhere(`${alias}.${field} IN (:...${paramName})`, { [paramName]: value });
                        } else if (typeof value === 'string' && value.includes(',')) {
                            // Caso: filter[id]=1,2
                            const values = value.split(',').map(v => v.trim());
                            qb.andWhere(`${alias}.${field} IN (:...${paramName})`, { [paramName]: values });
                        } else {
                            qb.andWhere(`${alias}.${field} = :${paramName}`, { [paramName]: value });
                        }
                    } else {
                        qb.andWhere(`${alias}.${field} LIKE :${paramName}`, { [paramName]: `%${value}%` });
                    }
                }
            });
        } catch (error) {
            throw new BadRequestException(
                `Error al aplicar filtros dinámicos. Detalle: ${error instanceof Error ? error.message : error}`
            );
        }
    }

    /**
     * Aplica paginación standard (take/skip)
     * 
     * @param qb Instancia de SelectQueryBuilder
     * @param options Objeto { limit?, page? }
     */
    static applyPagination(
        qb: SelectQueryBuilder<any>,
        options: { limit?: number; page?: number } | undefined
    ) {
        if (!options) return;

        if (options.limit) {
            qb.take(options.limit);
        }

        if (options.page && options.limit) {
            qb.skip((options.page - 1) * options.limit);
        }
    }

    static parse(query: ApiQueryDto): FindOptions {
        return {
            filter: query.filter,
            include: query.include,
            sort: query.sort,
            page: query.page,
            limit: query.limit
        };
    }

    /**
     * Ejecuta la consulta paginada y devuelve el resultado con metadatos (incluyendo total)
     * 
     * @param qb Instancia de SelectQueryBuilder
     * @param options Opciones de paginación (page, limit)
     */
    static async paginate<T extends ObjectLiteral>(
        qb: SelectQueryBuilder<T>,
        options: { limit?: number; page?: number } | undefined
    ): Promise<PaginatedResult<T>> {
        const page = Number(options?.page) > 0 ? Number(options?.page) : 1;
        const limit = Number(options?.limit) > 0 ? Number(options?.limit) : 20;

        qb.take(limit).skip((page - 1) * limit);

        const [data, total] = await qb.getManyAndCount();

        return {
            data,
            meta: {
                total,
                page,
                limit,
                lastPage: Math.ceil(total / limit)
            }
        };
    }
}

export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        lastPage: number;
    };
}
