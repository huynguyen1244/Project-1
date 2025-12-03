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
  ) {}

  async register(dto: RegisterDto) {
    const hash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.users.create({
      data: {
        email: dto.email,
        username: dto.username,
        password_hash: hash,
        phone: dto.phone,
        role: 'user',
      },
    });

    const tokens = await this.generateTokens(
      Number(user.id),
      user.email,
      user.role,
    );
    await this.updateRefreshToken(Number(user.id), tokens.refresh_token);

    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password_hash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(
      Number(user.id),
      user.email,
      user.role,
    );
    await this.updateRefreshToken(Number(user.id), tokens.refresh_token);

    return { user, ...tokens };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken)
      throw new ForbiddenException('No refresh token provided');

    const payload = this.jwt.verify(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });

    const user = await this.prisma.users.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.refresh_token)
      throw new ForbiddenException('Invalid token');

    const valid = await bcrypt.compare(refreshToken, user.refresh_token);
    if (!valid) throw new ForbiddenException('Token mismatch');

    const tokens = await this.generateTokens(
      Number(user.id),
      user.email,
      user.role,
    );
    await this.updateRefreshToken(Number(user.id), tokens.refresh_token);

    return tokens;
  }

  async logout(userId: number) {
    await this.prisma.users.update({
      where: { id: userId },
      data: { refresh_token: null },
    });

    return { message: 'Logged out successfully' };
  }

  private otpStore = new Map<string, string>(); // email -> OTP

  // Send OTP

  async sendOtp(email: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore.set(email, otp);

    // OTP chỉ sống 5 phút
    setTimeout(() => this.otpStore.delete(email), 5 * 60 * 1000);

    console.log(`OTP for ${email}: ${otp}`);
    // Gửi OTP qua email/SMS
  }

  async verifyOtp(email: string, otp: string) {
    const storedOtp = this.otpStore.get(email);
    if (!storedOtp || storedOtp !== otp) {
      throw new UnauthorizedException('OTP invalid or expired');
    }

    this.otpStore.delete(email);

    // Cập nhật trạng thái đã xác thực
    await this.prisma.users.update({
      where: { email },
      data: { isVerified: true },
    });

    return { message: 'OTP verified successfully' };
  }

  // ===== Helpers =====

  async generateTokens(userId: number, email: string, role: string) {
    const payload = { sub: userId, email, role };

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
    await this.prisma.users.update({
      where: { id: userId },
      data: { refresh_token: hash },
    });
  }
}
