import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TicketEtiqueta } from '../../tickets/entities/ticket-etiqueta.entity';

@Entity('tm_etiqueta')
export class Etiqueta {
    @PrimaryGeneratedColumn({ name: 'eti_id' })
    id: number;

    @Column({ name: 'usu_id', type: 'int', comment: 'ID del usuario propietario de la etiqueta' })
    usuarioId: number;

    @Column({ name: 'eti_nom', type: 'varchar', length: 150 })
    nombre: string;

    @Column({ name: 'eti_color', type: 'varchar', length: 50 })
    color: string;

    @Column({ name: 'fech_crea', type: 'datetime', nullable: true })
    fechaCreacion: Date | null;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    @ManyToOne(() => User, (u) => u.etiquetasPropias)
    @JoinColumn({ name: 'usu_id' })
    usuario: User;

    @OneToMany(() => TicketEtiqueta, (te) => te.etiqueta)
    ticketEtiquetas: TicketEtiqueta[];
}
