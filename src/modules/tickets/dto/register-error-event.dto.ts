import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class RegisterErrorEventDto {
    @ApiProperty({ description: 'ID of the Error Type', example: 1 })
    @IsInt()
    errorTypeId: number;

    @ApiPropertyOptional({ description: 'ID of the Error Subtype', example: 5 })
    @IsOptional()
    @IsInt()
    errorSubtypeId?: number;

    @ApiPropertyOptional({ description: 'Optional description or comment', example: 'System unresponsive' })
    @IsOptional()
    @IsString()
    description?: string;
}
