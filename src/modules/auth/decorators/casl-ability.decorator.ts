import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AppAbility } from '../abilities/ability.factory';

export const CaslAbility = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): AppAbility => {
        const request = ctx.switchToHttp().getRequest();
        return request.ability;
    },
);
