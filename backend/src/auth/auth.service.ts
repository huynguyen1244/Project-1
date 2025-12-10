import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) { }

  async register(dto: RegisterDto) {
    const hash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash: hash,
      },
    });

    const tokens = await this.generateTokens(Number(user.id), user.email);
    await this.updateRefreshToken(Number(user.id), tokens.refresh_token);

    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(Number(user.id), user.email);
    await this.updateRefreshToken(Number(user.id), tokens.refresh_token);

    return { user, ...tokens };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken)
      throw new ForbiddenException('No refresh token provided');

    const payload = this.jwt.verify(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshToken)
      throw new ForbiddenException('Invalid token');

    const valid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!valid) throw new ForbiddenException('Token mismatch');

    const tokens = await this.generateTokens(Number(user.id), user.email);
    await this.updateRefreshToken(Number(user.id), tokens.refresh_token);

    return tokens;
  }

  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'Logged out successfully' };
  }


  // ===== Helpers =====

  async generateTokens(userId: number, email: string) {
    const payload = { sub: userId, email };

    const access_token = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '1d',
    });

    const refresh_token = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    return { access_token, refresh_token };
  }

  async updateRefreshToken(userId: number, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hash },
    });
  }
}
