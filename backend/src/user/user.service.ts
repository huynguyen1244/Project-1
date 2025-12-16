import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // Tạo user mới
  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        avatarUrl: dto.avatarUrl,
      },
    });

    return this.excludeSensitiveFields(user);
  }

  // Lấy danh sách user
  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => this.excludeSensitiveFields(u));
  }

  // Lấy 1 user theo id
  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException(`User id ${id} không tồn tại`);

    return this.excludeSensitiveFields(user);
  }

  // Update
  async update(id: number, dto: UpdateUserDto, currentUserId: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User id ${id} không tồn tại`);

    const isSelf = id === currentUserId;

    if (!isSelf) {
      throw new UnauthorizedException(`Bạn không thể sửa thông tin người khác`);
    }

    const dataToUpdate: any = { ...dto };

    if (dto.password) {
      dataToUpdate.passwordHash = await bcrypt.hash(dto.password, 10);
      delete dataToUpdate.password;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    return this.excludeSensitiveFields(updated);
  }

  // Xóa user
  async remove(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User id ${id} không tồn tại`);

    await this.prisma.user.delete({ where: { id } });

    return { message: `User ${id} đã bị xóa` };
  }

  // Helper: ẩn thông tin nhạy cảm
  private excludeSensitiveFields(user: any) {
    const { passwordHash, refreshToken, ...rest } = user;
    return rest;
  }
}
