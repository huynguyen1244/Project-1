import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) { }

  // Tạo account mới
  async create(userId: number, dto: CreateAccountDto) {
    return this.prisma.account.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        balance: dto.balance ?? 0,
        currency: dto.currency ?? 'VND',
      },
    });
  }

  // Lấy tất cả accounts của user
  async findAll(userId: number) {
    return this.prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Lấy account theo id
  async findOne(id: number, userId: number) {
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
    });

    if (!account) {
      throw new NotFoundException(`Account id ${id} không tồn tại`);
    }

    return account;
  }

  // Cập nhật account
  async update(id: number, userId: number, dto: UpdateAccountDto) {
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
    });

    if (!account) {
      throw new NotFoundException(`Account id ${id} không tồn tại`);
    }

    return this.prisma.account.update({
      where: { id },
      data: dto,
    });
  }

  // Xóa account
  async remove(id: number, userId: number) {
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
    });

    if (!account) {
      throw new NotFoundException(`Account id ${id} không tồn tại`);
    }

    await this.prisma.account.delete({ where: { id } });

    return { message: `Account ${id} đã bị xóa` };
  }
}
