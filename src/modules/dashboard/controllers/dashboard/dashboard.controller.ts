import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/jwt.guard';
import { DashboardService } from '../../services/dashboard/dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('stats')
    @ApiOperation({ summary: 'Obtener estadísticas del usuario para el dashboard' })
    @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
    async getStats(@Req() req: any) {
        const userId = req.user.usu_id;
        return this.dashboardService.getDashboardStats(userId);
    }
}
