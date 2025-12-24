import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryType } from '@prisma/client';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  // Tạo category mới
  async create(dto: CreateCategoryDto) {
    return await this.prisma.category.create({
      data: {
        name: dto.name,
        type: dto.type,
      },
    });
  }

  // Lấy tất cả categories
  async findAll(type?: CategoryType) {
    return await this.prisma.category.findMany({
      where: type ? { type } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  // Lấy category theo id
  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category id ${id} không tồn tại`);
    }

    return category;
  }

  // Cập nhật category
  async update(id: number, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category id ${id} không tồn tại`);
    }

    return await this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  // Xóa category
  async remove(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category id ${id} không tồn tại`);
    }

    await this.prisma.category.delete({ where: { id } });

    return { message: `Category ${id} đã bị xóa` };
  }
}
