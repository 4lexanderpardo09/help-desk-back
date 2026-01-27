import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn, ManyToMany } from 'typeorm';
import { Regional } from '../../regions/entities/regional.entity';
import { Role } from '../../roles/entities/role.entity';
import { Cargo } from '../../positions/entities/cargo.entity';
import { Departamento } from '../../departments/entities/departamento.entity';
import { Perfil } from '../../profiles/entities/perfil.entity';
import { UsuarioPerfil } from '../../profiles/entities/usuario-perfil.entity';
// import { EmpresaUsuario } from 'src/modules/companies/entities/empresa-usuario.entity';
import { Empresa } from 'src/modules/companies/entities/empresa.entity';
import { Notificacion } from 'src/modules/notifications/entities/notificacion.entity';
import { Ticket } from 'src/modules/tickets/entities/ticket.entity';
import { TicketParalelo } from 'src/modules/tickets/entities/ticket-paralelo.entity';
import { TicketError } from 'src/modules/tickets/entities/ticket-error.entity';
import { TicketNovedad } from 'src/modules/tickets/entities/ticket-novedad.entity';
import { TicketAsignacionHistorico } from 'src/modules/tickets/entities/ticket-asignacion-historico.entity';
import { TicketDetalle } from 'src/modules/tickets/entities/ticket-detalle.entity';
import { TicketEtiqueta } from 'src/modules/tickets/entities/ticket-etiqueta.entity';
import { Etiqueta } from 'src/modules/tags/entities/etiqueta.entity';
import { DocumentoFlujo } from 'src/modules/documents/entities/documento-flujo.entity';
import { PasoFlujoFirma } from 'src/modules/workflows/entities/paso-flujo-firma.entity';
import { PasoFlujoUsuario } from 'src/modules/workflows/entities/paso-flujo-usuario.entity';
import { Flujo } from '../../workflows/entities/flujo.entity';
import { TicketAsignado } from '../../tickets/entities/ticket-asignado.entity';

@Entity('tm_usuario')
export class User {
    @PrimaryGeneratedColumn({ name: 'usu_id' })
    id: number;

    @Column({ name: 'usu_cedula', type: 'varchar', length: 20, nullable: true })
    cedula: string | null;

    @Column({ name: 'usu_nom', type: 'varchar', length: 150, nullable: true })
    nombre: string | null;

    @Column({ name: 'usu_ape', type: 'varchar', length: 150, nullable: true })
    apellido: string | null;

    @Column({ name: 'usu_correo', type: 'varchar', length: 150 })
    email: string;

    @Column({ name: 'usu_pass', type: 'varchar', length: 150, select: false })
    password: string;

    @Column({
        name: 'usu_token_recuperacion',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    tokenRecuperacion: string | null;

    @Column({ name: 'usu_token_expiracion', type: 'datetime', nullable: true })
    tokenExpiracion: Date | null;

    @Column({ name: 'rol_id', type: 'int', nullable: true })
    rolId: number | null;

    @Column({ name: 'reg_id', type: 'int', nullable: true })
    regionalId: number | null;

    @Column({ name: 'car_id', type: 'int', nullable: true })
    cargoId: number | null;

    @Column({ name: 'dp_id', type: 'int', nullable: true })
    departamentoId: number | null;

    @Column({ name: 'es_nacional', type: 'tinyint', default: 0 })
    esNacional: boolean;

    @Column({ name: 'fech_crea', type: 'datetime', nullable: true })
    fechaCreacion: Date | null;

    @Column({ name: 'fech_modi', type: 'datetime', nullable: true })
    fechaModificacion: Date | null;

    @Column({ name: 'fech_elim', type: 'datetime', nullable: true })
    fechaEliminacion: Date | null;

    @Column({ name: 'est', type: 'int' })
    estado: number;

    @Column({ name: 'usu_firma', type: 'varchar', length: 255, nullable: true })
    firma: string | null;

    @ManyToOne(() => Regional)
    @JoinColumn({ name: 'reg_id' })
    regional: Regional;

    @ManyToOne(() => Cargo)
    @JoinColumn({ name: 'car_id' })
    cargo: Cargo;

    @ManyToOne(() => Departamento)
    @JoinColumn({ name: 'dp_id' })
    departamento: Departamento;

    @ManyToOne(() => Role, (r) => r.usuarios)
    @JoinColumn({ name: 'rol_id' })
    role: Role;

    @ManyToMany(() => Empresa, (empresa) => empresa.usuarios)
    empresas: Empresa[];

    @OneToMany(() => UsuarioPerfil, (up) => up.usuario)
    usuarioPerfiles: UsuarioPerfil[];

    @OneToMany(() => Notificacion, (n) => n.usuario)
    notificacion: Notificacion[];

    @OneToMany(() => Ticket, (t) => t.usuario)
    ticket: Ticket[];

    @OneToMany(() => TicketParalelo, (tp) => tp.usuario)
    ticketParalelos: TicketParalelo[];

    @OneToMany(() => TicketError, (te) => te.usuarioReporta)
    ticketErrorsReportados: TicketError[];

    @OneToMany(() => TicketError, (te) => te.usuarioResponsable)
    ticketErrorsResponsable: TicketError[];

    @OneToMany(() => TicketNovedad, (tn) => tn.usuarioAsignado)
    ticketNovedadesAsignadas: TicketNovedad[];

    @OneToMany(() => TicketNovedad, (tn) => tn.usuarioCreador)
    ticketNovedadesCreadas: TicketNovedad[];

    @OneToMany(() => TicketAsignacionHistorico, (th) => th.usuarioAsignado)
    historialesAsignados: TicketAsignacionHistorico[];

    @OneToMany(() => TicketAsignacionHistorico, (th) => th.usuarioAsignador)
    historialesAsignador: TicketAsignacionHistorico[];

    @OneToMany(() => TicketDetalle, (td) => td.usuario)
    detallesCreados: TicketDetalle[];

    @OneToMany(() => Etiqueta, (e) => e.usuario)
    etiquetasPropias: Etiqueta[];

    @OneToMany(() => TicketEtiqueta, (te) => te.asignadoPor)
    etiquetasAsignadas: TicketEtiqueta[];

    @OneToMany(() => DocumentoFlujo, (df) => df.usuario)
    documentosFlujo: DocumentoFlujo[];

    @OneToMany(() => PasoFlujoFirma, (pff) => pff.usuario)
    firmasFlujo: PasoFlujoFirma[];

    @OneToMany(() => PasoFlujoUsuario, (pfu) => pfu.usuario)
    pasosFlujoAsignados: PasoFlujoUsuario[];

    @OneToMany(() => TicketAsignado, (ta) => ta.usuario)
    asignaciones: TicketAsignado[];

    @ManyToMany(() => Flujo, (flujo) => flujo.usuariosObservadores)
    flujosObservados: Flujo[];

    /**
     * Nombre completo del usuario
     */
    get nombreCompleto(): string {
        return `${this.nombre || ''} ${this.apellido || ''}`.trim();
    }
}
