import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { EmpresaUsuario } from './empresa-usuario.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { CategoriaEmpresa } from 'src/modules/categories/entities/categoria-empresa.entity';
import { FlujoPlantilla } from 'src/modules/workflows/entities/flujo-plantilla.entity';

@Entity('td_empresa')
export class Empresa {
    @PrimaryGeneratedColumn({ name: 'emp_id', comment: 'Primary Key' })
    id: number;

    @Column({ name: 'emp_nom', type: 'varchar', length: 100, nullable: true })
    nombre: string | null;

    @Column({ name: 'fech_crea', type: 'datetime', nullable: true })
    fechaCreacion: Date | null;

    @Column({ name: 'fech_elim', type: 'datetime', nullable: true })
    fechaEliminacion: Date | null;

    @Column({ name: 'est', type: 'int', nullable: true })
    estado: number | null;

    @OneToMany(() => EmpresaUsuario, (eu) => eu.empresa)
    empresaUsuarios: EmpresaUsuario[];

    @OneToMany(() => CategoriaEmpresa, (ce) => ce.empresa)
    categoriaEmpresa: CategoriaEmpresa[];

    @OneToMany(() => Ticket, (t) => t.empresa)
    tickets: Ticket[];

    @OneToMany(() => FlujoPlantilla, (fp) => fp.empresa)
    flujosPlantilla: FlujoPlantilla[];
}
