import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CaslAbility = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.ability;
    },
);