import { PartialType } from '@nestjs/swagger';
import { CreatePasoFlujoDto } from './create-paso-flujo.dto';

export class UpdatePasoFlujoDto extends PartialType(CreatePasoFlujoDto) { }
