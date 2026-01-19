import { PartialType } from '@nestjs/swagger';
import { CreateSubcategoriaDto } from './create-subcategoria.dto';

/**
 * DTO para actualizar una subcategoría (todos los campos opcionales)
 */
export class UpdateSubcategoriaDto extends PartialType(CreateSubcategoriaDto) { }
