import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Organigrama } from '../positions/entities/organigrama.entity';
import { Cargo } from '../positions/entities/cargo.entity';

@Injectable()
export class AssignmentService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Organigrama)
        private readonly organigramaRepo: Repository<Organigrama>,
        @InjectRepository(Cargo)
        private readonly cargoRepo: Repository<Cargo>,
    ) { }

    /**
     * Resuelve el Jefe Inmediato de un usuario basado en el Organigrama.
     * 
     * Lógica Legacy (migrada):
     * 1. Busca el cargo del usuario.
     * 2. Busca en `tm_organigrama` quién es el padre (`id_cargo_padre`) de ese cargo (`id_cargo_hijo`).
     * 3. Busca usuarios que tengan ese cargo padre activo.
     * 4. Prioriza usuarios en la misma Regional/Empresa si es posible (Opcional, legacy no siempre lo hace estricto).
     * 
     * @param userId ID del usuario que solicita (o creador del ticket)
     * @returns ID del usuario jefe o null si no se encuentra
     */
    async resolveJefeInmediato(userId: number): Promise<number | null> {
        // 1. Obtener usuario y su cargo
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['cargo']
        });

        if (!user || !user.cargoId) {
            // Usuario sin cargo no tiene jefe en organigrama
            return null;
        }

        // 2. Buscar relación en Organigrama
        const relacion = await this.organigramaRepo.findOne({
            where: { cargoId: user.cargoId }
        });

        if (!relacion || !relacion.jefeCargoId) {
            // No existe jefe definido para este cargo
            return null;
        }

        // 3. Buscar usuario(s) con el cargo padre
        // Estrategia: Buscar "Jefe" en la misma empresa/regional preferiblemente?
        // Legacy: Simplemente busca algun usuario con ese cargo.
        // Mejora: Filtrar por estado activo.

        // Intento 1: Mismo Regional (Ideal)
        if (user.regionalId) {
            const jefeRegional = await this.userRepo.findOne({
                where: {
                    cargoId: relacion.jefeCargoId,
                    regionalId: user.regionalId,
                    estado: 1 // Activo
                }
            });
            if (jefeRegional) return jefeRegional.id;
        }

        // Intento 2: Cualquier Regional (Fallback - ej. Jefe Nacional)
        const jefeGeneral = await this.userRepo.findOne({
            where: {
                cargoId: relacion.jefeCargoId,
                estado: 1
            }
        });

        return jefeGeneral ? jefeGeneral.id : null;
    }

    /**
     * Resuelve un agente para un paso específico basado en Cargo y Regional.
     * Útil para flujos donde el ticket debe ser atendido por el "Coordinador de Soporte" de la región del creador.
     * 
     * @param cargoId ID del cargo requerido (ej. Coordinador TI)
     * @param regionalId ID de la regional preferente
     * @returns ID del agente encontrado o null
     */
    /**
     * Resuelve los candidatos posibles para un paso de flujo.
     * Centraliza la lógica de "Quién debería tener este ticket".
     * 
     * @param step Configuración del paso (PasoFlujo)
     * @param ticket Contexto del ticket (para saber creador, regional, etc.)
     * @returns User[] - Lista de posibles asignados. Si es vacío, puede ir a un Pool.
     */
    async getCandidatesForStep(step: any, ticket: any): Promise<User[]> {
        // 1. Asignar al Creador
        if (step.asignarCreador) {
            const creator = await this.userRepo.findOne({ where: { id: ticket.usuarioId } });
            return creator ? [creator] : [];
        }

        // 2. Requiere Aprobación de Jefe (o Jefe Inmediato)
        if (step.necesitaAprobacionJefe || step.campoReferenciaJefeId === -1) {
            const jefeId = await this.resolveJefeInmediato(ticket.usuarioId);
            if (jefeId) {
                const jefe = await this.userRepo.findOne({ where: { id: jefeId } });
                return jefe ? [jefe] : [];
            }
            return [];
        }

        // 3. Asignación por Rol (Cargo) + Regional del Ticket
        if (step.cargoAsignadoId) {
            // Determinar Regional para búsqueda
            let regionalIdToFilter: number | null = null;

            if (!step.esTareaNacional) {
                // Si no es nacional, buscamos la regional del contexto
                if (ticket.usuario?.regionalId) {
                    regionalIdToFilter = ticket.usuario.regionalId;
                } else if (ticket.regionalId) {
                    regionalIdToFilter = ticket.regionalId;
                } else {
                    const creator = await this.userRepo.findOne({ where: { id: ticket.usuarioId } });
                    regionalIdToFilter = creator?.regionalId || 1;
                }
            }

            // Buscar usuarios con ese cargo
            const where: any = {
                cargoId: step.cargoAsignadoId,
                estado: 1
            };

            if (regionalIdToFilter) {
                where.regionalId = regionalIdToFilter;
            }

            return this.userRepo.find({
                where,
                relations: ['cargo']
            });
        }

        // 4. Asignación Explícita (Usuarios específicos en PasoFlujoUsuario)
        // La entidad paso debe venir con relations ['usuarios', 'usuarios.usuario']
        if (step.usuarios && step.usuarios.length > 0) {
            return step.usuarios
                .map((pfu: any) => pfu.usuario)
                .filter((u: User) => u && u.estado === 1);
        }

        return [];
    }

    /**
     * Helper to get users by role and regional (optional)
     */
    async getUsersByRole(cargoId: number, empresaId?: number, regionalId?: number): Promise<User[]> {
        const where: any = { cargoId, estado: 1 };
        if (regionalId && regionalId !== 1) { // Assuming 1 is Central/All
            where.regionalId = regionalId;
        }
        if (empresaId) {
            // User entity has M2M relation 'empresas'
            where.empresas = {
                id: empresaId
            };
        }

        const users = await this.userRepo.find({
            where,
            relations: ['cargo', 'empresas'] // Need to load relation to filter? standard find handles it but let's be safe or just 'cargo' if we don't need company details returned
        });
        if (users.length > 0) return users;

        // Fallback: If filtered by regional and none found, try just by role?
        // Depends on business rule. For now return empty or strict.
        return [];
    }
}
