import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ErrorTypeCategory } from '../entities/error-type.entity';

export class CreateErrorTypeDto {
    @ApiProperty({ example: 'Error de Hardware' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title: string;

    @ApiProperty({ example: 'Problemas físicos con el equipo...' })
    @IsString()
    @IsOptional()
    @MaxLength(255)
    description?: string;

    @ApiProperty({
        enum: ErrorTypeCategory,
        example: ErrorTypeCategory.PROCESS_ERROR,
        description: '0=Info, 1=Process Error'
    })
    @IsEnum(ErrorTypeCategory)
    @IsOptional()
    category?: ErrorTypeCategory;

    @ApiProperty({ example: 1, required: false, description: 'ID of parent error type' })
    @IsInt()
    @IsOptional()
    parentId?: number;

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    isActive?: boolean;
}
