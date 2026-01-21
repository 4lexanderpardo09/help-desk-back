import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataExcel } from './entities/data-excel.entity';
import { ExcelDataService } from './services/excel-data.service';

@Module({
    imports: [TypeOrmModule.forFeature([DataExcel])],
    providers: [ExcelDataService],
    exports: [ExcelDataService],
})
export class ImportsModule { }
