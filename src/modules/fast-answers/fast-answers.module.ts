import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FastAnswer } from './entities/fast-answer.entity';
import { FastAnswersService } from './fast-answers.service';
import { FastAnswersController } from './fast-answers.controller';

import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([FastAnswer]), AuthModule],
    providers: [FastAnswersService],
    controllers: [FastAnswersController],
    exports: [FastAnswersService],
})
export class FastAnswersModule { }
