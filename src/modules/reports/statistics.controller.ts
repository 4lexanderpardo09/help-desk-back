import { Controller, Get, Query, Param, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { AppAbility } from '../auth/abilities/ability.factory';
import { TicketStatisticsService } from './services/ticket-statistics.service';
import { DashboardFiltersDto } from './dto/dashboard-filters.dto';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { StepMetricDto } from './dto/step-metric.dto';
import { User } from '../auth/decorators/user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('statistics')
export class StatisticsController {
    constructor(private readonly statisticsService: TicketStatisticsService) { }

    @Get('dashboard')
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Report'))
    @ApiOperation({ summary: 'Obtener estadísticas del dashboard (KPIs)' })
    @ApiResponse({ status: 200, type: DashboardStatsDto })
    async getDashboard(
        @User() user: JwtPayload,
        @Query() filters: DashboardFiltersDto
    ): Promise<DashboardStatsDto> {
        return this.statisticsService.getDashboardStats(user, filters);
    }

    @Get('ticket/:id/performance')
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Report'))
    @ApiOperation({ summary: 'Obtener métricas de rendimiento de un ticket' })
    @ApiResponse({ status: 200, type: [StepMetricDto] })
    async getPerformance(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<StepMetricDto[]> {
        return this.statisticsService.getPerformanceMetrics(id);
    }
    @Get('median-response-time')
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Report'))
    @ApiOperation({ summary: 'Obtener mediana de tiempo de respuesta (minutos)' })
    @ApiResponse({ status: 200, type: Number })
    async getMedianResponseTime(
        @User() user: JwtPayload,
        @Query() filters: DashboardFiltersDto
    ): Promise<{ minutes: number }> {
        const median = await this.statisticsService.getMedianResponseTime(user, filters);
        return { minutes: median };
    }
}
