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
    async resolveRegionalAgent(cargoId: number, regionalId: number): Promise<number | null> {
        const agent = await this.userRepo.findOne({
            where: {
                cargoId: cargoId,
                regionalId: regionalId,
                estado: 1
            }
        });

        if (agent) return agent.id;

        // Fallback: Buscar en Sede Central (asumiendo ID 1 es Nacional/Central si no encuentra local)
        // O simplemente devolver null y dejar que el Workflow decida (ej. asignar pool general).
        return null;
    }
}
