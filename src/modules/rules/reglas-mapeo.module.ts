import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReglasMapeoController } from './reglas-mapeo.controller';
import { ReglasMapeoService } from './reglas-mapeo.service';
import { ReglaMapeo } from './entities/regla-mapeo.entity';
import { ReglaCreadores } from './entities/regla-creadores.entity';
import { ReglaAsignados } from './entities/regla-asignados.entity';
import { ReglaCreadoresPerfil } from './entities/regla-creadores-perfil.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ReglaMapeo,
            ReglaCreadores,
            ReglaAsignados,
            ReglaCreadoresPerfil,
        ]),
        AuthModule,
    ],
    controllers: [ReglasMapeoController],
    providers: [ReglasMapeoService],
    exports: [ReglasMapeoService, TypeOrmModule],
})
export class ReglasMapeoModule { }
