import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubcategoriasController } from './subcategorias.controller';
import { SubcategoriasService } from './subcategorias.service';
import { Subcategoria } from './entities/subcategoria.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([Subcategoria]), AuthModule],
    controllers: [SubcategoriasController],
    providers: [SubcategoriasService],
    exports: [SubcategoriasService, TypeOrmModule],
})
export class SubcategoriasModule { }
