import { PartialType } from '@nestjs/swagger';
import { CreateErrorTypeDto } from './create-error-type.dto';

export class UpdateErrorTypeDto extends PartialType(CreateErrorTypeDto) { }
