import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Interface cho JWT payload từ JwtStrategy
export interface JwtPayload {
  userId: number;
  email: string;
  role?: string;
}

export const User = createParamDecorator(
  (
    data: keyof JwtPayload | undefined,
    ctx: ExecutionContext,
  ): JwtPayload | number | string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    // Nếu gọi @User() => trả toàn bộ user payload
    if (!data) return user;

    // Nếu gọi @User('userId') => trả user.userId
    // Nếu gọi @User('email') => trả user.email
    return user?.[data];
  },
);

// Decorator shorthand để lấy userId
export const UserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return user?.userId;
  },
);
