import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AllResParams = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return {
      query: request.query,
      body: request.body,
      params: request.params,
    };
  },
);
