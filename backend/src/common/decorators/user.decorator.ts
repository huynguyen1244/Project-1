import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: keyof any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Nếu gọi @User() => trả toàn bộ user
    if (!data) return user;

    // Nếu gọi @User('id') => trả user.id
    return user?.[data];
  },
);
