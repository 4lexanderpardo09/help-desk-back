import { PartialType } from '@nestjs/swagger';
import { CreateRutaPasoDto } from './create-ruta-paso.dto';

export class UpdateRutaPasoDto extends PartialType(CreateRutaPasoDto) { }
