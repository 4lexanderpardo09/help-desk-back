import { PartialType } from '@nestjs/swagger';
import { CreateRegionalDto } from './create-regional.dto';

export class UpdateRegionalDto extends PartialType(CreateRegionalDto) { }
