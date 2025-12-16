import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';

@Injectable()
export class RecurringTransactionService {
  constructor(private prisma: PrismaService) { }

  // Kiểm tra account thuộc user
  private async verifyAccountOwnership(accountId: number, userId: number) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new ForbiddenException('Bạn không có quyền truy cập account này');
    }

    return account;
  }

  // Tạo recurring transaction mới
  async create(userId: number, dto: CreateRecurringTransactionDto) {
    await this.verifyAccountOwnership(dto.accountId, userId);

    return await this.prisma.recurringTransaction.create({
      data: {
        accountId: dto.accountId,
        categoryId: dto.categoryId,
        amount: dto.amount,
        description: dto.description,
        frequency: dto.frequency,
        nextDate: new Date(dto.nextDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
      include: {
        account: true,
        category: true,
      },
    });
  }

  // Lấy tất cả recurring transactions của user
  async findAll(userId: number) {
    return await this.prisma.recurringTransaction.findMany({
      where: {
        account: { userId },
      },
      include: {
        account: true,
        category: true,
      },
      orderBy: { nextDate: 'asc' },
    });
  }

  // Lấy recurring transaction theo id
  async findOne(id: number, userId: number) {
    const recurringTransaction =
      await this.prisma.recurringTransaction.findFirst({
        where: {
          id,
          account: { userId },
        },
        include: {
          account: true,
          category: true,
        },
      });

    if (!recurringTransaction) {
      throw new NotFoundException(
        `RecurringTransaction id ${id} không tồn tại`,
      );
    }

    return recurringTransaction;
  }

  // Cập nhật recurring transaction
  async update(id: number, userId: number, dto: UpdateRecurringTransactionDto) {
    const recurringTransaction =
      await this.prisma.recurringTransaction.findFirst({
        where: {
          id,
          account: { userId },
        },
      });

    if (!recurringTransaction) {
      throw new NotFoundException(
        `RecurringTransaction id ${id} không tồn tại`,
      );
    }

    // Nếu đổi account, kiểm tra quyền
    if (dto.accountId && dto.accountId !== recurringTransaction.accountId) {
      await this.verifyAccountOwnership(dto.accountId, userId);
    }

    const updateData: any = { ...dto };
    if (dto.nextDate) updateData.nextDate = new Date(dto.nextDate);
    if (dto.endDate) updateData.endDate = new Date(dto.endDate);

    return await this.prisma.recurringTransaction.update({
      where: { id },
      data: updateData,
      include: {
        account: true,
        category: true,
      },
    });
  }

  // Xóa recurring transaction
  async remove(id: number, userId: number) {
    const recurringTransaction =
      await this.prisma.recurringTransaction.findFirst({
        where: {
          id,
          account: { userId },
        },
      });

    if (!recurringTransaction) {
      throw new NotFoundException(
        `RecurringTransaction id ${id} không tồn tại`,
      );
    }

    await this.prisma.recurringTransaction.delete({ where: { id } });

    return { message: `RecurringTransaction ${id} đã bị xóa` };
  }
}
