import { PartialType } from '@nestjs/swagger';
import { CreateOrganigramaDto } from './create-organigrama.dto';

export class UpdateOrganigramaDto extends PartialType(CreateOrganigramaDto) { }
