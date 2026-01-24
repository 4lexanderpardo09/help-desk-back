import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DataSource } from 'typeorm';
import { UsuarioPerfil } from '../profiles/entities/usuario-perfil.entity';
import { ApiQueryHelper, PaginatedResult } from 'src/common/utils/api-query-helper';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Busca un usuario por email incluyendo el password (para auth)
     */
    async findByEmailWithPassword(email: string): Promise<User | null> {
        return this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .leftJoinAndSelect('user.usuarioPerfiles', 'usuarioPerfiles')
            .where('user.email = :email', { email })
            .andWhere('user.estado = :estado', { estado: 1 })
            .getOne();
    }

    /**
     * Crea un nuevo usuario
     */
    async create(createUserDto: CreateUserDto): Promise<User> {
        const emailExists = await this.userRepository.exists({ where: { email: createUserDto.email, estado: 1 } });
        if (emailExists) {
            throw new ConflictException('El correo electrónico ya está registrado');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
            fechaCreacion: new Date(),
            estado: 1,
        });

        if (createUserDto.empresasIds?.length) {
            user.empresas = createUserDto.empresasIds.map(id => ({ id } as any));
        }

        const savedUser = await this.userRepository.save(user);

        // Sincronizar perfiles si se envían
        if (createUserDto.perfilIds?.length) {
            await this.syncUserProfiles(savedUser.id, createUserDto.perfilIds);
        }

        return savedUser;
    }

    /**
     * Actualiza un usuario existente
     */
    async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.show(id);

        if (!user) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }

        // Optimizado: Verificar email duplicado excluyendo al usuario actual
        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const emailExists = await this.userRepository.exists({
                where: { email: updateUserDto.email, estado: 1, id: Not(id) }
            });
            if (emailExists) {
                throw new ConflictException('El correo electrónico ya está en uso');
            }
        }

        // Preparar datos: separar password para hashear y spread del resto
        const { password, ...restData } = updateUserDto;

        // Actualizar datos básicos (merge)
        this.userRepository.merge(user, {
            ...restData,
            fechaModificacion: new Date(),
        });

        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }

        // Actualizar relaciones ManyToMany (si se envían)
        if (updateUserDto.empresasIds) {
            user.empresas = updateUserDto.empresasIds.map(id => ({ id } as any));
        }

        const savedUser = await this.userRepository.save(user);

        // Sincronizar perfiles si se envían
        if (updateUserDto.perfilIds) {
            await this.syncUserProfiles(savedUser.id, updateUserDto.perfilIds);
        }

        return savedUser;
    }

    // Listas permitidas para "Scopes" dinámicos (estilo Laravel)
    private readonly allowedIncludes = ['regional', 'regional.zona', 'cargo', 'departamento', 'empresaUsuarios', 'empresas', 'usuarioPerfiles', 'etiquetasPropias', 'etiquetasAsignadas', 'role'];
    private readonly allowedFilters = ['id', 'nombre', 'apellido', 'email', 'cedula', 'estado', 'rolId', 'cargoId', 'regionalId', 'departamentoId'];

    /**
     * Busca un usuario por ID
     * Permite incluir relaciones dinámicamente.
     */
    async show(id: number, options?: {
        included?: string;
    }): Promise<User | null> {
        const qb = this.userRepository.createQueryBuilder('user');

        qb.where('user.id = :id', { id });
        qb.andWhere('user.estado = :estado', { estado: 1 });

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'user');

        return qb.getOne();
    }

    /**
     * **Búsqueda Maestra Unificada**
     * 
     * Método único para listar usuarios.
     * Soporta filtros y paginación.
     */
    async list(options?: {
        limit?: number;
        page?: number;
        included?: string;
        filter?: Record<string, any>;
    }): Promise<PaginatedResult<User>> {
        const qb = this.userRepository.createQueryBuilder('user');

        // Filtros base (Primero, para que applyFilters use andWhere sobre esto)
        qb.where('user.estado = :estado', { estado: 1 });

        // 1. Scopes Dinámicos (Estilo Laravel)
        // Aplica relaciones (joins) automáticamente si están permitidas
        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'user');
        // Aplica filtros (where like) automáticamente si están permitidos
        ApiQueryHelper.applyFilters(qb, options?.filter, this.allowedFilters, 'user');

        // Ordenamiento default
        qb.orderBy('user.nombre', 'ASC');

        // Paginación Standard con Total
        return ApiQueryHelper.paginate(qb, { limit: options?.limit, page: options?.page });
    }

    /**
     * Elimina un usuario (soft delete)
     * Basado en: delete_usuario del modelo legacy PHP
     * No elimina físicamente, solo marca est=0 y fech_elim=NOW()
     */
    async delete(id: number): Promise<{ deleted: boolean; id: number }> {
        const user = await this.show(id);

        if (!user) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }

        await this.userRepository.update(id, {
            estado: 0,
            fechaEliminacion: new Date(),
        });

        return { deleted: true, id };
    }

    /**
     * Actualiza la firma de un usuario
     * Basado en: update_firma del modelo legacy PHP
     */
    async updateFirma(id: number, firma: string): Promise<{ updated: boolean; id: number }> {
        const user = await this.show(id);

        if (!user) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }

        await this.userRepository.update(id, { firma });

        return { updated: true, id };
    }

    /**
     * Sincroniza (reemplaza) los perfiles de un usuario.
     * Operación transaccional: elimina existentes e inserta nuevos.
     */
    private async syncUserProfiles(userId: number, perfilIds: number[]): Promise<void> {
        await this.dataSource.transaction(async (manager) => {
            // 1. Eliminar perfiles existentes
            await manager.delete(UsuarioPerfil, { usuarioId: userId });

            // 2. Insertar nuevos perfiles
            if (perfilIds && perfilIds.length > 0) {
                const nuevosPerfiles = perfilIds
                    .filter(pid => pid)
                    .map(perfilId => manager.create(UsuarioPerfil, {
                        usuarioId: userId,
                        perfilId: perfilId,
                        estado: 1,
                        fechaCreacion: new Date()
                    }));

                if (nuevosPerfiles.length > 0) {
                    await manager.save(UsuarioPerfil, nuevosPerfiles);
                }
            }
        });
    }
}

