import { Controller, Get, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { AppAbility } from '../auth/abilities/ability.factory';
import { TemplatesService } from './services/templates.service';
import { ApiQueryDto } from '../../common/dto/api-query.dto';

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('templates')
export class TemplatesController {
    constructor(private readonly templatesService: TemplatesService) { }

    @Get()
    @ApiOperation({ summary: 'Listar plantillas de flujo (PDF)' })
    @ApiResponse({ status: 200, description: 'Lista de plantillas' })
    @ApiQuery({ name: 'included', required: false })
    @ApiQuery({ name: 'filter[flujo.id]', required: false })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'all'))
    async list(@Query() query: ApiQueryDto) {
        return this.templatesService.findAll({
            limit: query.limit,
            page: query.page,
            filter: query.filter,
            sort: query.sort
        });
    }

    @Get('fields/:stepId')
    @ApiOperation({ summary: 'Obtiene los campos dinámicos configurados para un paso de flujo' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Ticket'))
    async getFieldsByStep(@Param('stepId', ParseIntPipe) stepId: number) {
        return this.templatesService.getFieldsByStep(stepId);
    }



    @Get('query/:fieldId')
    @ApiOperation({ summary: 'Ejecuta la query dinámica de un campo (Autocomplete)' })
    @ApiQuery({ name: 'term', required: false, description: 'Término de búsqueda' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Ticket')) // Users creating tickets need this
    async executeFieldQuery(
        @Param('fieldId', ParseIntPipe) fieldId: number,
        @Query('term') term?: string
    ) {
        return this.templatesService.executeFieldQuery(fieldId, term);
    }

    @Get('values/:ticketId')
    @ApiOperation({ summary: 'Obtiene los valores dinámicos guardados en un ticket' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Ticket'))
    async getValuesByTicket(@Param('ticketId', ParseIntPipe) ticketId: number) {
        return this.templatesService.getValuesByTicket(ticketId);
    }
}
