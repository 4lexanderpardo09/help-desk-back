import { PartialType } from '@nestjs/swagger';
import { CreateFastAnswerDto } from './create-fast-answer.dto';

export class UpdateFastAnswerDto extends PartialType(CreateFastAnswerDto) { }
