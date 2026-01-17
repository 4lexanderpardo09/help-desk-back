import { Categoria } from 'src/modules/categories/entities/categoria.entity';
import { Empresa } from 'src/modules/companies/entities/empresa.entity';
import { Departamento } from 'src/modules/departments/entities/departamento.entity';
import { Prioridad } from 'src/modules/priorities/entities/prioridad.entity';
import { Regional } from 'src/modules/regions/entities/regional.entity';
import { Subcategoria } from 'src/modules/subcategories/entities/subcategoria.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TicketDetalle } from './ticket-detalle.entity';
import { Notificacion } from 'src/modules/notifications/entities/notificacion.entity';

@Entity('tm_ticket')
export class Ticket {
    @PrimaryGeneratedColumn({ name: 'tick_id' })
    id: number;

    @Column({ name: 'usu_id', type: 'int' })
    usuarioId: number;

    @Column({ name: 'cat_id', type: 'int' })
    categoriaId: number;

    @Column({ name: 'cats_id', type: 'int', nullable: true })
    subcategoriaId: number | null;

    @Column({ name: 'pd_id', type: 'int', nullable: true })
    prioridadId: number | null;

    @Column({ name: 'emp_id', type: 'int' })
    empresaId: number;

    @Column({ name: 'dp_id', type: 'int' })
    departamentoId: number;

    @Column({ name: 'reg_id', type: 'int', nullable: true })
    regionalId: number | null;

    @Column({ name: 'paso_actual_id', type: 'int', nullable: true })
    pasoActualId: number | null;

    @Column({ name: 'tick_titulo', type: 'varchar', length: 250 })
    titulo: string;

    @Column({ name: 'tick_descrip', type: 'mediumtext' })
    descripcion: string;

    @Column({ name: 'tick_estado', type: 'enum', enum: ['Abierto', 'Cerrado', 'Pausado'], default: 'Abierto', nullable: true })
    ticketEstado: 'Abierto' | 'Cerrado' | 'Pausado' | null;

    @Column({ name: 'error_proceso', type: 'int', nullable: true })
    errorProceso: number | null;

    @Column({ name: 'fech_crea', type: 'datetime', nullable: true })
    fechaCreacion: Date | null;

    @Column({ name: 'usu_asig', type: 'varchar', length: 255, nullable: true })
    usuarioAsignadoDeprecated: string | null;

    @Column({ name: 'how_asig', type: 'int', nullable: true })
    usuarioAsignadorId: number | null;

    @Column({ name: 'ruta_paso_orden', type: 'int', default: 0, nullable: true })
    rutaPasoOrden: number | null;

    @Column({ name: 'ruta_id', type: 'int', default: 0, nullable: true })
    rutaId: number | null;

    @Column({ name: 'fech_cierre', type: 'datetime', nullable: true })
    fechaCierre: Date | null;

    @Column({ name: 'est', type: 'int' })
    estado: number;

    @Column({ name: 'usu_id_jefe_aprobador', type: 'int', nullable: true })
    usuarioJefeAprobadorId: number | null;

    @ManyToOne(() => User, (u) => u.ticket)
    @JoinColumn({ name: 'usu_id' })
    usuario: User;

    @ManyToOne(() => Categoria)
    @JoinColumn({ name: 'cat_id' })
    categoria: Categoria;

    @ManyToOne(() => Subcategoria)
    @JoinColumn({ name: 'cats_id' })
    subcategoria: Subcategoria;

    @ManyToOne(() => Prioridad)
    @JoinColumn({ name: 'pd_id' })
    prioridad: Prioridad;

    @ManyToOne(() => Empresa)
    @JoinColumn({ name: 'emp_id' })
    empresa: Empresa;

    @ManyToOne(() => Departamento)
    @JoinColumn({ name: 'dp_id' })
    departamento: Departamento;

    @ManyToOne(() => Regional)
    @JoinColumn({ name: 'reg_id' })
    regional: Regional;

    @OneToMany(() => TicketDetalle, (td) => td.ticket)
    detalles: TicketDetalle[];

    @OneToMany(() => Notificacion, (n) => n.ticket)
    notificacion: Notificacion[];
}
