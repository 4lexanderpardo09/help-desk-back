import { PartialType } from '@nestjs/swagger';
import { CreateFlujoDto } from './create-flujo.dto';

export class UpdateFlujoDto extends PartialType(CreateFlujoDto) { }
