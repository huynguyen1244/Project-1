import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TransactionService {
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

  // Lấy category để biết là INCOME hay EXPENSE
  private async getCategoryType(categoryId: number): Promise<string> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    return category?.type || 'EXPENSE';
  }

  // Cập nhật số dư tài khoản
  private async updateAccountBalance(
    accountId: number,
    amount: number | Decimal,
    categoryType: string,
    isAdd: boolean, // true = thêm giao dịch, false = xóa giao dịch
  ) {
    const amountNum = typeof amount === 'number' ? amount : Number(amount);

    // INCOME: cộng tiền khi thêm, trừ khi xóa
    // EXPENSE: trừ tiền khi thêm, cộng khi xóa
    let balanceChange: number;
    if (categoryType === 'INCOME') {
      balanceChange = isAdd ? amountNum : -amountNum;
    } else {
      balanceChange = isAdd ? -amountNum : amountNum;
    }

    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        balance: { increment: balanceChange },
      },
    });
  }

  // Tạo transaction mới
  async create(userId: number, dto: CreateTransactionDto) {
    return await this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({
        where: { id: dto.accountId, userId },
      });

      if (!account) {
        throw new ForbiddenException('Bạn không có quyền truy cập account này');
      }

      const category = await tx.category.findUnique({
        where: { id: dto.categoryId },
      });
      const categoryType = category?.type || 'EXPENSE';

      // Kiểm tra số dư nếu là giao dịch chi tiêu (EXPENSE)
      if (categoryType === 'EXPENSE') {
        const currentBalance = Number(account.balance);
        const transactionAmount = Number(dto.amount);

        if (currentBalance < transactionAmount) {
          throw new BadRequestException(
            `Số dư hiện tại không đủ. Số dư hiện tại: ${currentBalance.toLocaleString('vi-VN')} VND, Số tiền giao dịch: ${transactionAmount.toLocaleString('vi-VN')} VND`,
          );
        }
      }

      const transaction = await tx.transaction.create({
        data: {
          accountId: dto.accountId,
          categoryId: dto.categoryId,
          amount: dto.amount,
          description: dto.description,
          executionDate: new Date(dto.executionDate),
        },
        include: {
          account: true,
          category: true,
        },
      });

      // Cập nhật số dư tài khoản
      const amountNum = typeof dto.amount === 'number' ? dto.amount : Number(dto.amount);
      const balanceChange = categoryType === 'INCOME' ? amountNum : -amountNum;

      await tx.account.update({
        where: { id: dto.accountId },
        data: {
          balance: { increment: balanceChange },
        },
      });

      // Kiểm tra ngân sách (Budget)
      await this.checkBudgetUsage(tx, userId, dto.categoryId);

      return transaction;
    });
  }

  // Kiểm tra sử dụng ngân sách và thông báo
  private async checkBudgetUsage(
    tx: Prisma.TransactionClient,
    userId: number,
    categoryId: number,
  ) {
    const now = new Date();
    const budget = await tx.budget.findFirst({
      where: {
        userId,
        categoryId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    if (budget) {
      const spent = await tx.transaction.aggregate({
        where: {
          accountId: {
            in: (
              await tx.account.findMany({
                where: { userId },
                select: { id: true },
              })
            ).map((a) => a.id),
          },
          categoryId,
          executionDate: { gte: budget.startDate, lte: budget.endDate },
        },
        _sum: { amount: true },
      });

      const spentAmount = Number(spent._sum.amount || 0);
      const budgetAmount = Number(budget.amount);

      if (spentAmount >= budgetAmount) {
        await tx.notification.create({
          data: {
            userId,
            title: 'Vượt ngân sách!',
            message: `Bạn đã chi tiêu ${spentAmount.toLocaleString('vi-VN')} VND, vượt quá ngân sách ${budgetAmount.toLocaleString('vi-VN')} VND cho danh mục này.`,
            notifyAt: now,
          },
        });
      } else if (spentAmount >= budgetAmount * 0.8) {
        await tx.notification.create({
          data: {
            userId,
            title: 'Cảnh báo ngân sách',
            message: `Bạn đã sử dụng hơn 80% ngân sách cho danh mục này (${spentAmount.toLocaleString('vi-VN')} / ${budgetAmount.toLocaleString('vi-VN')} VND).`,
            notifyAt: now,
          },
        });
      }
    }
  }

  // Lấy tất cả transactions của user
  async findAll(userId: number, accountId?: number) {
    const whereClause: any = {
      account: { userId },
    };

    if (accountId) {
      whereClause.accountId = accountId;
    }

    return await this.prisma.transaction.findMany({
      where: whereClause,
      include: {
        account: true,
        category: true,
      },
      orderBy: { executionDate: 'desc' },
    });
  }

  // Lấy transaction theo id
  async findOne(id: number, userId: number) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
        account: { userId },
      },
      include: {
        account: true,
        category: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction id ${id} không tồn tại`);
    }

    return transaction;
  }

  // Cập nhật transaction
  async update(id: number, userId: number, dto: UpdateTransactionDto) {
    return await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findFirst({
        where: {
          id,
          account: { userId },
        },
        include: { category: true, account: true },
      });

      if (!transaction) {
        throw new NotFoundException(`Transaction id ${id} không tồn tại`);
      }

      // Lấy thông tin tài khoản mới (nếu đổi account)
      let targetAccount = transaction.account;

      // Nếu đổi account, kiểm tra quyền và lấy thông tin account mới
      if (dto.accountId && dto.accountId !== transaction.accountId) {
        const account = await tx.account.findFirst({
          where: { id: dto.accountId, userId },
        });
        if (!account) {
          throw new ForbiddenException(
            'Bạn không có quyền truy cập account này',
          );
        }
        targetAccount = account;
      }

      // Tính toán biến động số dư
      const oldAmount = Number(transaction.amount);
      const newAmount =
        dto.amount !== undefined ? Number(dto.amount) : oldAmount;
      const oldCategoryType = transaction.category.type;
      let newCategoryType = oldCategoryType;

      if (dto.categoryId && dto.categoryId !== transaction.categoryId) {
        const category = await tx.category.findUnique({
          where: { id: dto.categoryId },
        });
        newCategoryType = category?.type || 'EXPENSE';
      }

      // Tính số dư sau khi hoàn lại giao dịch cũ
      let balanceAfterRevert = Number(transaction.account.balance);
      if (oldCategoryType === 'INCOME') {
        balanceAfterRevert -= oldAmount; // Hoàn lại thu nhập = trừ đi
      } else {
        balanceAfterRevert += oldAmount; // Hoàn lại chi tiêu = cộng lại
      }

      // Nếu đổi tài khoản, số dư tài khoản mới không bị ảnh hưởng bởi giao dịch cũ
      if (dto.accountId && dto.accountId !== transaction.accountId) {
        balanceAfterRevert = Number(targetAccount.balance);
      }

      // Tính số dư sau khi áp dụng giao dịch mới
      let finalBalance = balanceAfterRevert;
      if (newCategoryType === 'INCOME') {
        finalBalance += newAmount; // Thu nhập = cộng tiền
      } else {
        finalBalance -= newAmount; // Chi tiêu = trừ tiền
      }

      // Kiểm tra nếu số dư âm thì từ chối
      if (finalBalance < 0) {
        const accountName = targetAccount.name;
        const currentBalance =
          dto.accountId && dto.accountId !== transaction.accountId
            ? Number(targetAccount.balance)
            : balanceAfterRevert;
        throw new BadRequestException(
          `Không thể cập nhật giao dịch. Số dư tài khoản "${accountName}" sau khi cập nhật sẽ bị âm. Số dư hiện tại: ${currentBalance.toLocaleString('vi-VN')} VND`,
        );
      }

      // Cập nhật số dư cũ (hoàn lại)
      await tx.account.update({
        where: { id: transaction.accountId },
        data: {
          balance: {
            increment: oldCategoryType === 'INCOME' ? -oldAmount : oldAmount,
          },
        },
      });

      const updateData: Prisma.TransactionUpdateInput = { ...dto };
      if (dto.executionDate) {
        updateData.executionDate = new Date(dto.executionDate);
      }

      const updatedTransaction = await tx.transaction.update({
        where: { id },
        data: updateData,
        include: {
          account: true,
          category: true,
        },
      });

      // Cập nhật số dư mới
      await tx.account.update({
        where: { id: updatedTransaction.accountId },
        data: {
          balance: {
            increment: newCategoryType === 'INCOME' ? newAmount : -newAmount,
          },
        },
      });

      // Kiểm tra ngân sách (Budget)
      await this.checkBudgetUsage(tx, userId, updatedTransaction.categoryId);

      return updatedTransaction;
    });
  }

  // Xóa transaction
  async remove(id: number, userId: number) {
    return await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findFirst({
        where: {
          id,
          account: { userId },
        },
        include: { category: true, account: true },
      });

      if (!transaction) {
        throw new NotFoundException(`Transaction id ${id} không tồn tại`);
      }

      // Tính toán số dư sau khi xóa giao dịch
      const currentBalance = Number(transaction.account.balance);
      const transactionAmount = Number(transaction.amount);
      const categoryType = transaction.category.type;

      let balanceAfterDelete = currentBalance;
      if (categoryType === 'INCOME') {
        // Xóa giao dịch thu nhập = trừ tiền
        balanceAfterDelete -= transactionAmount;
      } else {
        // Xóa giao dịch chi tiêu = cộng tiền (không cần kiểm tra vì chỉ tăng số dư)
        balanceAfterDelete += transactionAmount;
      }

      // Kiểm tra nếu số dư âm thì từ chối xóa
      if (balanceAfterDelete < 0) {
        throw new BadRequestException(
          `Không thể xóa giao dịch. Số dư tài khoản "${transaction.account.name}" sau khi xóa sẽ bị âm. Số dư hiện tại: ${currentBalance.toLocaleString('vi-VN')} VND`,
        );
      }

      // Hoàn lại số dư (giảm đi khoản thu nhập hoặc tăng lại khoản chi tiêu)
      await tx.account.update({
        where: { id: transaction.accountId },
        data: {
          balance: {
            increment:
              categoryType === 'INCOME'
                ? -transactionAmount
                : transactionAmount,
          },
        },
      });

      await tx.transaction.delete({ where: { id } });

      return { message: `Transaction ${id} đã bị xóa` };
    });
  }
}
