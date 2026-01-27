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
import { TicketParalelo } from './ticket-paralelo.entity';
import { TicketError } from './ticket-error.entity';
import { TicketNovedad } from './ticket-novedad.entity';
import { TicketAsignacionHistorico } from './ticket-asignacion-historico.entity';
import { TicketEtiqueta } from './ticket-etiqueta.entity';
import { TicketCampoValor } from './ticket-campo-valor.entity';
import { Documento } from '../../documents/entities/documento.entity';
import { DocumentoCierre } from '../../documents/entities/documento-cierre.entity';
import { DocumentoFlujo } from '../../documents/entities/documento-flujo.entity';
import { TicketAsignado } from './ticket-asignado.entity';

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

    @Column({
        name: 'usu_asig',
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: 'IDs de usuarios asignados (legacy). Se almacena como string "1,2,3"',
        /**
         * Transformer para manejar compatibilidad con sistema Legacy (PHP).
         * - En DB: String de IDs separados por coma ("1,2,3")
         * - En App: Array de n\u00fameros ([1, 2, 3])
         * 
         * Maneja la asignaci\u00f3n m\u00faltiple sin alterar el esquema de base de datos actual.
         */
        transformer: {
            to: (value: number[] | null) => value?.join(',') || null,
            from: (value: string | null) => value?.split(',').map(Number).filter((n) => !isNaN(n)) || [],
        },
    })
    usuarioAsignadoIds: number[];

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

    @ManyToOne(() => Categoria, (c) => c.tickets)
    @JoinColumn({ name: 'cat_id' })
    categoria: Categoria;

    @ManyToOne(() => Subcategoria, (s) => s.tickets)
    @JoinColumn({ name: 'cats_id' })
    subcategoria: Subcategoria;

    @ManyToOne(() => Prioridad, (p) => p.tickets)
    @JoinColumn({ name: 'pd_id' })
    prioridad: Prioridad;

    @ManyToOne(() => Empresa, (e) => e.tickets)
    @JoinColumn({ name: 'emp_id' })
    empresa: Empresa;

    @ManyToOne(() => Departamento, (d) => d.tickets)
    @JoinColumn({ name: 'dp_id' })
    departamento: Departamento;

    @ManyToOne(() => Regional, (r) => r.tickets)
    @JoinColumn({ name: 'reg_id' })
    regional: Regional;

    @OneToMany(() => TicketDetalle, (td) => td.ticket)
    detalles: TicketDetalle[];

    @OneToMany(() => Notificacion, (n) => n.ticket)
    notificacion: Notificacion[];

    @OneToMany(() => TicketParalelo, (tp) => tp.ticket)
    ticketParalelos: TicketParalelo[];

    @OneToMany(() => TicketError, (te) => te.ticket)
    ticketErrors: TicketError[];

    @OneToMany(() => TicketNovedad, (tn) => tn.ticket)
    ticketNovedades: TicketNovedad[];

    @OneToMany(() => TicketAsignacionHistorico, (th) => th.ticket)
    historiales: TicketAsignacionHistorico[];

    @OneToMany(() => TicketEtiqueta, (te) => te.ticket)
    ticketEtiquetas: TicketEtiqueta[];

    @OneToMany(() => TicketCampoValor, (cv) => cv.ticket)
    campoValores: TicketCampoValor[];

    @OneToMany(() => Documento, (d) => d.ticket)
    documentos: Documento[];

    @OneToMany(() => DocumentoCierre, (dc) => dc.ticket)
    documentosCierre: DocumentoCierre[];

    @OneToMany(() => DocumentoFlujo, (df) => df.ticket)
    documentosFlujo: DocumentoFlujo[];

    @OneToMany(() => TicketAsignado, (ta) => ta.ticket)
    asignados: TicketAsignado[];

    @ManyToOne('PasoFlujo', { nullable: true })
    @JoinColumn({ name: 'paso_actual_id' })
    pasoActual: any;
}
