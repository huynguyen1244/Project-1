import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

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

  // Tạo transaction mới
  async create(userId: number, dto: CreateTransactionDto) {
    await this.verifyAccountOwnership(dto.accountId, userId);

    return await this.prisma.transaction.create({
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
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
        account: { userId },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction id ${id} không tồn tại`);
    }

    // Nếu đổi account, kiểm tra quyền
    if (dto.accountId && dto.accountId !== transaction.accountId) {
      await this.verifyAccountOwnership(dto.accountId, userId);
    }

    const updateData: any = { ...dto };
    if (dto.executionDate) {
      updateData.executionDate = new Date(dto.executionDate);
    }

    return await this.prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        account: true,
        category: true,
      },
    });
  }

  // Xóa transaction
  async remove(id: number, userId: number) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
        account: { userId },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction id ${id} không tồn tại`);
    }

    await this.prisma.transaction.delete({ where: { id } });

    return { message: `Transaction ${id} đã bị xóa` };
  }
}
