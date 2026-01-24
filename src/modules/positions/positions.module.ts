import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PositionsService } from './positions.service';
import { PositionsController } from './positions.controller';
import { OrganigramaController } from './organigrama.controller';
import { OrganigramaService } from './organigrama.service';
import { Cargo } from './entities/cargo.entity';
import { Organigrama } from './entities/organigrama.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Cargo, Organigrama]),
        AuthModule
    ],
    controllers: [PositionsController, OrganigramaController],
    providers: [PositionsService, OrganigramaService],
    exports: [PositionsService, OrganigramaService],
})
export class PositionsModule { }
