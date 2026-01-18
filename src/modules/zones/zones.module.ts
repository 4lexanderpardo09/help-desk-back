import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Zona } from './entities/zona.entity';
import { ZonesService } from './zones.service';
import { ZonesController } from './zones.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Zona]),
        forwardRef(() => AuthModule),
    ],
    controllers: [ZonesController],
    providers: [ZonesService],
    exports: [ZonesService],
})
export class ZonesModule { }
