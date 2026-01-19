import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Consulta } from './entities/consulta.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Consulta]),
        AuthModule,
    ],
    controllers: [ReportsController],
    providers: [ReportsService],
    exports: [ReportsService, TypeOrmModule],
})
export class ReportsModule { }
