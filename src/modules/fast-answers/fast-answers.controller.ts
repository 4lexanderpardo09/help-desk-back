import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { FastAnswersService } from './fast-answers.service';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { AppAbility } from '../auth/abilities/ability.factory';
import { ApiQueryHelper, ApiQueryDto } from '../../common/utils/api-query-helper';

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
}
