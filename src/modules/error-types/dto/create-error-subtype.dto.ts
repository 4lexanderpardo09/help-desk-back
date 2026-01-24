import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateErrorSubtypeDto {
    @ApiProperty({ example: 1 })
    @IsInt()
    @IsNotEmpty()
    errorTypeId: number;

    @ApiProperty({ example: 'Monitor' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title: string;

    @ApiProperty({ example: 'Problemas con el monitor', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    isActive?: boolean;
}
