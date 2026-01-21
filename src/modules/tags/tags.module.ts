import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Etiqueta } from './entities/etiqueta.entity';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Etiqueta]),
        AuthModule
    ],
    controllers: [TagsController],
    providers: [TagsService],
    exports: [TagsService],
})
export class TagsModule { }
