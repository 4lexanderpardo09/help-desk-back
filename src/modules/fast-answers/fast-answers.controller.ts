import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CreateFastAnswerDto } from './dto/create-fast-answer.dto';
import { UpdateFastAnswerDto } from './dto/update-fast-answer.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { FastAnswersService } from './fast-answers.service';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { AppAbility } from '../auth/abilities/ability.factory';
import { ApiQueryHelper } from '../../common/utils/api-query-helper';
import { ApiQueryDto } from '../../common/dto/api-query.dto';

@ApiTags('Fast Answers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('fast-answers')
export class FastAnswersController {
    constructor(private readonly service: FastAnswersService) { }

    @Get()
    @ApiOperation({ summary: 'Lista respuestas rápidas (Errores comunes/Tips)' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Ticket')) // Any user can see
    async findAll(@Query() query: ApiQueryDto) {
        return this.service.findAll(ApiQueryHelper.parse(query));
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtiene una respuesta rápida por ID' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Ticket'))
    async findOne(@Param('id') id: string) {
        return this.service.findOne(+id);
    }

    @Post()
    @ApiOperation({ summary: 'Crea una nueva respuesta rápida' })
    @CheckPolicies((ability: AppAbility) => ability.can('create', 'Ticket')) // Assuming who can create tickets/manage can create answers, or restrict to manage all
    // Better to use 'manage' 'Ticket' or specific permission if available. Let's use 'manage' 'all' or specific if 'manage' 'FastAnswer' exists? 
    // Rules say: manage implies all actions. 
    // Let's assume admins/managers can create.
    @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Ticket'))
    async create(@Body() createDto: CreateFastAnswerDto) {
        return this.service.create(createDto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Actualiza una respuesta rápida' })
    @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Ticket'))
    async update(@Param('id') id: string, @Body() updateDto: UpdateFastAnswerDto) {
        return this.service.update(+id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Elimina (soft delete) una respuesta rápida' })
    @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Ticket'))
    async remove(@Param('id') id: string) {
        return this.service.delete(+id);
    }
}
