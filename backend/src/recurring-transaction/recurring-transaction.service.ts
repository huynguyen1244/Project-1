import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';

@Injectable()
export class RecurringTransactionService {
  private readonly logger = new Logger(RecurringTransactionService.name);

  constructor(private readonly prisma: PrismaService) { }

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

    const updateData: Prisma.RecurringTransactionUpdateInput = { ...dto };
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

  // ==================== CRON JOB ====================
  // Chạy mỗi phút để xử lý recurring transactions đến hạn
  // Cron format: giây phút giờ ngày tháng thứ
  @Cron(CronExpression.EVERY_MINUTE)
  async processRecurringTransactions() {
    const now = new Date();
    this.logger.log(
      `Processing recurring transactions at ${now.toISOString()}`,
    );

    try {
      // Lấy tất cả recurring transactions đến hạn (nextDate <= now)
      // và chưa hết hạn (endDate null hoặc endDate > now)
      const dueTransactions = await this.prisma.recurringTransaction.findMany({
        where: {
          nextDate: { lte: now },
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
        include: {
          account: true,
          category: true,
        },
      });

      this.logger.log(
        `Found ${dueTransactions.length} due recurring transactions`,
      );

      for (const recurring of dueTransactions) {
        try {
          // Xác định loại giao dịch (thu nhập hay chi tiêu)
          const isIncome = recurring.category?.type === 'INCOME';
          const amount = Number(recurring.amount);
          const currentBalance = Number(recurring.account.balance);

          // Kiểm tra số dư nếu là chi tiêu
          if (!isIncome && currentBalance < amount) {
            this.logger.warn(
              `Skipping recurring transaction ${recurring.id}: Insufficient balance in account ${recurring.accountId} (${currentBalance} < ${amount})`,
            );

            // Tạo thông báo lỗi
            await this.prisma.notification.create({
              data: {
                userId: recurring.account.userId,
                title: 'Giao dịch định kỳ thất bại',
                message: `Giao dịch định kỳ "${recurring.description || recurring.category?.name}" trị giá ${amount.toLocaleString('vi-VN')} VND không thể thực hiện do số dư tài khoản không đủ.`,
                notifyAt: now,
              },
            });

            // Vẫn cập nhật nextDate để không bị lặp lại lỗi mỗi phút
            const nextDate = this.calculateNextDate(
              recurring.nextDate,
              recurring.frequency,
            );
            await this.prisma.recurringTransaction.update({
              where: { id: recurring.id },
              data: { nextDate },
            });

            continue;
          }

          // Tạo transaction mới
          await this.prisma.transaction.create({
            data: {
              accountId: recurring.accountId,
              categoryId: recurring.categoryId,
              amount: recurring.amount,
              description: `[Tự động] ${recurring.description || recurring.category?.name || 'Giao dịch định kỳ'}`,
              executionDate: now,
            },
          });

          // Cập nhật số dư tài khoản
          await this.prisma.account.update({
            where: { id: recurring.accountId },
            data: {
              balance: isIncome ? { increment: amount } : { decrement: amount },
            },
          });

          // Tính ngày tiếp theo dựa trên tần suất
          const nextDate = this.calculateNextDate(
            recurring.nextDate,
            recurring.frequency,
          );

          // Cập nhật nextDate cho recurring transaction
          await this.prisma.recurringTransaction.update({
            where: { id: recurring.id },
            data: { nextDate },
          });

          this.logger.log(
            `Processed recurring transaction ${recurring.id}: ${isIncome ? '+' : '-'}${amount} for account ${recurring.accountId}`,
          );

          // Tạo thông báo
          await this.prisma.notification.create({
            data: {
              userId: recurring.account.userId,
              title: 'Giao dịch định kỳ đã xử lý',
              message: `Đã tự động xử lý giao dịch "${recurring.description || recurring.category?.name}" với số tiền ${amount.toLocaleString('vi-VN')} VND.`,
              notifyAt: now,
            },
          });
        } catch (error: unknown) {
          const err = error as Error;
          this.logger.error(
            `Failed to process recurring transaction ${recurring.id}: ${err.message}`,
          );
        }
      }
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Failed to process recurring transactions: ${err.message} `,
      );
    }
  }

  // Tính ngày tiếp theo dựa trên tần suất
  private calculateNextDate(currentDate: Date, frequency: string): Date {
    const next = new Date(currentDate);

    switch (frequency) {
      case 'DAILY':
        next.setDate(next.getDate() + 1);
        break;
      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'YEARLY':
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        next.setMonth(next.getMonth() + 1); // Default to monthly
    }

    return next;
  }
}
