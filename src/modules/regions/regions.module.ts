import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegionsService } from './regions.service';
import { RegionsController } from './regions.controller';
import { Regional } from './entities/regional.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Regional]),
        forwardRef(() => AuthModule),
    ],
    controllers: [RegionsController],
    providers: [RegionsService],
    exports: [RegionsService],
})
export class RegionsModule { }
