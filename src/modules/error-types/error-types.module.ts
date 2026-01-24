import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorTypesService } from './error-types.service';
import { ErrorTypesController } from './error-types.controller';
import { ErrorType } from './entities/error-type.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ErrorType]),
        AuthModule
    ],
    controllers: [ErrorTypesController],
    providers: [ErrorTypesService],
    exports: [ErrorTypesService]
})
export class ErrorTypesModule { }
