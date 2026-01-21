import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { TagsService } from './tags.service';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { AppAbility } from '../auth/abilities/ability.factory';

@ApiTags('Tags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('tags')
export class TagsController {
    constructor(private readonly service: TagsService) { }

    @Get()
    @ApiOperation({ summary: 'Listar mis etiquetas' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Ticket')) // Using Ticket ability as proxy for general access
    async findAll(@Req() req: any) {
        const user = req.user as AuthUser;
        return this.service.findAllByUser(user.id);
    }

    @Post()
    @ApiOperation({ summary: 'Crear nueva etiqueta personal' })
    @CheckPolicies((ability: AppAbility) => ability.can('create', 'Ticket'))
    async create(@Body() body: any, @Req() req: any) {
        const user = req.user as AuthUser;
        return this.service.create(body, user.id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar etiqueta' })
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Ticket'))
    async update(@Param('id') id: number, @Body() body: any, @Req() req: any) {
        const user = req.user as AuthUser;
        return this.service.update(id, body, user.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar etiqueta' })
    @CheckPolicies((ability: AppAbility) => ability.can('delete', 'Ticket'))
    async delete(@Param('id') id: number, @Req() req: any) {
        const user = req.user as AuthUser;
        return this.service.delete(id, user.id);
    }
}
