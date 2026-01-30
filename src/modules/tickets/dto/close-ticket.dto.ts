import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CloseTicketDto {
    @ApiProperty({
        description: 'Nota o comentario de cierre',
        example: 'El proceso finalizó correctamente.'
    })
    @IsNotEmpty()
    @IsString()
    comentario: string;
}
