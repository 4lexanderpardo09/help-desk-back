import { SelectQueryBuilder } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

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

        // Set para rastrear alias ya usados en esta ejecución y evitar llamadas duplicadas
        // (aunque TypeORM maneja bien leftJoin si el alias es distinto, aquí queremos proteger nombres)
        // const processedAliases = new Set<string>(); // This is no longer needed with the new logic

        // Pre-cargar alias existentes en el QB para no re-joinear lo que ya está
        // qb.expressionMap.aliases.forEach(alias => {
        //     processedAliases.add(alias.name);
        // }); // This is no longer needed with the new logic

        relations.forEach((relation) => {
            const trimmedRel = relation.trim();
            if (allowed.includes(trimmedRel)) {
                // Manejar tanto relaciones directas como anidadas (dot notation)
                const parts = trimmedRel.split('.');
                let currentParentAlias = mainAlias;

                parts.forEach((part) => {
                    try {
                        // 1. Verificar si la relación ya ha sido unida previamente en el QueryBuilder
                        // Buscamos en los atributos de join existentes para ver si este path (parentAlias + property) ya existe
                        const existingJoin = qb.expressionMap.joinAttributes.find(
                            ja => ja.parentAlias === currentParentAlias && ja.relation?.propertyName === part
                        );

                        if (existingJoin) {
                            // Si ya existe, reutilizamos el alias existente y avanzamos al siguiente nivel
                            currentParentAlias = existingJoin.alias.name;
                            return;
                        }

                        // 2. Si no existe, debemos crear el JOIN.
                        // Generamos un alias candidato. Preferimos el nombre simple 'part' (ej: 'zona').
                        let targetAlias = part;

                        // Función helper para verificar si un alias ya está en uso en todo el query
                        const isAliasTaken = (name: string) => qb.expressionMap.aliases.some(a => a.name === name);

                        // 3. Resolución de Colisiones de Alias
                        if (isAliasTaken(targetAlias)) {
                            // Si 'zona' está ocupado (ej: por otra relación), probamos 'parent_child' (ej: 'regional_zona')
                            targetAlias = `${currentParentAlias}_${part}`;

                            // Si aún así hay colisión (caso raro), agregamos un sufijo aleatorio
                            if (isAliasTaken(targetAlias)) {
                                targetAlias = `${targetAlias}_${Math.floor(Math.random() * 1000)}`;
                            }
                        }

                        // 4. Ejecutar el Join
                        const propertyPath = `${currentParentAlias}.${part}`;
                        qb.leftJoinAndSelect(propertyPath, targetAlias);

                        // Actualizar el padre para la siguiente iteración del loop
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
                    const paramName = `filter_${key}`;

                    // Lógica inteligente: ID y Estado o claves que terminan en Id usan IGUALDAD estricta o IN
                    // Texto usa LIKE
                    if (key === 'id' || key.endsWith('Id') || key === 'estado' || key === 'est') {
                        if (Array.isArray(value)) {
                            // Caso: filter[id][]=1&filter[id][]=2
                            qb.andWhere(`${mainAlias}.${key} IN (:...${paramName})`, { [paramName]: value });
                        } else if (typeof value === 'string' && value.includes(',')) {
                            // Caso: filter[id]=1,2
                            const values = value.split(',').map(v => v.trim());
                            qb.andWhere(`${mainAlias}.${key} IN (:...${paramName})`, { [paramName]: values });
                        } else {
                            qb.andWhere(`${mainAlias}.${key} = :${paramName}`, { [paramName]: value });
                        }
                    } else {
                        qb.andWhere(`${mainAlias}.${key} LIKE :${paramName}`, { [paramName]: `%${value}%` });
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
}

export interface FindOptions {
    filter?: Record<string, any>;
    include?: string;
    sort?: string;
    page?: number;
    limit?: number;
}

import { ApiPropertyOptional } from '@nestjs/swagger';

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
