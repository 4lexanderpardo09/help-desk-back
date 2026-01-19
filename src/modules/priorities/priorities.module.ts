import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrioritiesService } from './priorities.service';
import { PrioritiesController } from './priorities.controller';
import { Prioridad } from './entities/prioridad.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Prioridad]),
        AuthModule
    ],
    controllers: [PrioritiesController],
    providers: [PrioritiesService],
    exports: [PrioritiesService],
})
export class PrioritiesModule { }
