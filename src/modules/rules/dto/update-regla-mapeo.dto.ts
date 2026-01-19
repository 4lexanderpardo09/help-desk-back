import { PartialType } from '@nestjs/swagger';
import { CreateReglaMapeoDto } from './create-regla-mapeo.dto';

/**
 * DTO para actualizar una regla de mapeo (todos los campos opcionales)
 */
export class UpdateReglaMapeoDto extends PartialType(CreateReglaMapeoDto) { }
