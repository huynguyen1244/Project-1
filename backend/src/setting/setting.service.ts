import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingService {
  constructor(private readonly prisma: PrismaService) { }

  // Tạo setting mới
  async create(userId: number, dto: CreateSettingDto) {
    return await this.prisma.setting.create({
      data: {
        userId,
        key: dto.key,
        value: dto.value,
      },
    });
  }

  // Lấy tất cả settings của user
  async findAll(userId: number) {
    return await this.prisma.setting.findMany({
      where: { userId },
      orderBy: { key: 'asc' },
    });
  }

  // Lấy setting theo id
  async findOne(id: number, userId: number) {
    const setting = await this.prisma.setting.findFirst({
      where: { id, userId },
    });

    if (!setting) {
      throw new NotFoundException(`Setting id ${id} không tồn tại`);
    }

    return setting;
  }

  // Lấy setting theo key
  async findByKey(userId: number, key: string) {
    const setting = await this.prisma.setting.findFirst({
      where: { userId, key },
    });

    return setting;
  }

  // Cập nhật setting
  async update(id: number, userId: number, dto: UpdateSettingDto) {
    const setting = await this.prisma.setting.findFirst({
      where: { id, userId },
    });

    if (!setting) {
      throw new NotFoundException(`Setting id ${id} không tồn tại`);
    }

    return await this.prisma.setting.update({
      where: { id },
      data: dto,
    });
  }

  // Upsert setting (tạo mới hoặc cập nhật theo key)
  async upsert(userId: number, key: string, value: string) {
    const existing = await this.prisma.setting.findFirst({
      where: { userId, key },
    });

    if (existing) {
      return await this.prisma.setting.update({
        where: { id: existing.id },
        data: { value },
      });
    }

    return await this.prisma.setting.create({
      data: { userId, key, value },
    });
  }

  // Xóa setting
  async remove(id: number, userId: number) {
    const setting = await this.prisma.setting.findFirst({
      where: { id, userId },
    });

    if (!setting) {
      throw new NotFoundException(`Setting id ${id} không tồn tại`);
    }

    await this.prisma.setting.delete({ where: { id } });

    return { message: `Setting ${id} đã bị xóa` };
  }
}
