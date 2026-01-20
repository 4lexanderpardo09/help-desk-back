import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Organigrama } from '../positions/entities/organigrama.entity';
import { Cargo } from '../positions/entities/cargo.entity';
import { AssignmentService } from './assignment.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Organigrama, Cargo])
    ],
    providers: [AssignmentService],
    exports: [AssignmentService]
})
export class AssignmentModule { }
