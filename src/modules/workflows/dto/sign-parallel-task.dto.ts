import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class SignParallelTaskDto {
    @ApiProperty({ description: 'ID del ticket' })
    @IsInt()
    ticketId: number;

    @ApiProperty({ required: false, description: 'Comentario al firmar' })
    @IsOptional()
    @IsString()
    comentario?: string;

    @ApiProperty({ required: false, description: 'Firma en base64' })
    @IsOptional()
    @IsString()
    signature?: string;
}
