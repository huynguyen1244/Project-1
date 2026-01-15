import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetService {
  constructor(private readonly prisma: PrismaService) { }

  // Tạo budget mới
  async create(userId: number, dto: CreateBudgetDto) {
    return await this.prisma.budget.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        amount: dto.amount,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
      include: {
        category: true,
      },
    });
  }

  // Lấy tất cả budgets của user
  async findAll(userId: number) {
    return await this.prisma.budget.findMany({
      where: { userId },
      include: {
        category: true,
      },
      orderBy: { startDate: 'desc' },
    });
  }

  // Lấy budget theo id
  async findOne(id: number, userId: number) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
      include: {
        category: true,
      },
    });

    if (!budget) {
      throw new NotFoundException(`Budget id ${id} không tồn tại`);
    }

    return budget;
  }

  // Cập nhật budget
  async update(id: number, userId: number, dto: UpdateBudgetDto) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!budget) {
      throw new NotFoundException(`Budget id ${id} không tồn tại`);
    }

    const updateData: any = { ...dto };
    if (dto.startDate) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate) updateData.endDate = new Date(dto.endDate);

    return await this.prisma.budget.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });
  }

  // Xóa budget
  async remove(id: number, userId: number) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!budget) {
      throw new NotFoundException(`Budget id ${id} không tồn tại`);
    }

    await this.prisma.budget.delete({ where: { id } });

    return { message: `Budget ${id} đã bị xóa` };
  }
}
