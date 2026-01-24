import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Query } from '@nestjs/common';
import { ErrorTypesService } from './error-types.service';
import { CreateErrorTypeDto } from './dto/create-error-type.dto';
import { UpdateErrorTypeDto } from './dto/update-error-type.dto';
import { User as AuthUser } from '../auth/decorators/user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { AppAbility } from '../auth/abilities/ability.factory';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Error Types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('error-types')
export class ErrorTypesController {
    constructor(private readonly errorTypesService: ErrorTypesService) { }

    @Post()
    @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Ticket'))
    @ApiOperation({ summary: 'Create a new error type' })
    create(@Body() createDto: CreateErrorTypeDto, @AuthUser() user: User) {
        return this.errorTypesService.create(createDto);
    }

    @Get()
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Ticket'))
    @ApiOperation({ summary: 'List error types with pagination and hierarchy support' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'sort', required: false, type: String, description: 'Format: field,-otherfield' })
    @ApiQuery({ name: 'parentId', required: false, type: Number, description: 'Filter by parent ID' })
    @ApiQuery({ name: 'onlyRoots', required: false, type: Boolean, description: 'Get only top-level categories' })
    findAll(@Query() query: any) {
        return this.errorTypesService.findAll(query);
    }

    @Get(':id')
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Ticket'))
    @ApiOperation({ summary: 'Get error type details' })
    findOne(@Param('id') id: string) {
        return this.errorTypesService.findOne(+id);
    }

    @Put(':id')
    @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Ticket'))
    @ApiOperation({ summary: 'Update an error type' })
    update(@Param('id') id: string, @Body() updateDto: UpdateErrorTypeDto) {
        return this.errorTypesService.update(+id, updateDto);
    }

    @Delete(':id')
    @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Ticket'))
    @ApiOperation({ summary: 'Delete (soft) an error type' })
    remove(@Param('id') id: string) {
        return this.errorTypesService.remove(+id);
    }
}
