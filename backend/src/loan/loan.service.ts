import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { Prisma, LoanStatus } from '@prisma/client';

@Injectable()
export class LoanService {
  private readonly logger = new Logger(LoanService.name);

  constructor(private prisma: PrismaService) { }

  // Tạo loan mới
  async create(userId: number, dto: CreateLoanDto) {
    return await this.prisma.loan.create({
      data: {
        userId,
        lender: dto.lender,
        principal: dto.principal,
        interestRate: dto.interestRate,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: dto.status ?? LoanStatus.ACTIVE,
      },
    });
  }

  // Lấy tất cả loans của user
  async findAll(userId: number, status?: LoanStatus) {
    return await this.prisma.loan.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Lấy loan theo id
  async findOne(id: number, userId: number) {
    const loan = await this.prisma.loan.findFirst({
      where: { id, userId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan id ${id} không tồn tại`);
    }

    return loan;
  }

  // Cập nhật loan
  async update(id: number, userId: number, dto: UpdateLoanDto) {
    const loan = await this.prisma.loan.findFirst({
      where: { id, userId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan id ${id} không tồn tại`);
    }

    const updateData: Prisma.LoanUpdateInput = { ...dto };
    if (dto.startDate) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate) updateData.endDate = new Date(dto.endDate);

    return await this.prisma.loan.update({
      where: { id },
      data: updateData,
    });
  }

  // Xóa loan
  async remove(id: number, userId: number) {
    const loan = await this.prisma.loan.findFirst({
      where: { id, userId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan id ${id} không tồn tại`);
    }

    await this.prisma.loan.delete({ where: { id } });

    return { message: `Loan ${id} đã bị xóa` };
  }

  // CRON JOB: Chạy hàng ngày lúc 0h để kiểm tra các khoản vay sắp đến hạn
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkDueLoans() {
    const today = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);

    const dueLoans = await this.prisma.loan.findMany({
      where: {
        status: LoanStatus.ACTIVE,
        endDate: {
          gte: today,
          lte: threeDaysLater,
        },
      },
    });

    for (const loan of dueLoans) {
      await this.prisma.notification.create({
        data: {
          userId: loan.userId,
          title: 'Khoản vay sắp đến hạn',
          message: `Khoản vay từ "${loan.lender || 'N/A'}" trị giá ${Number(loan.principal).toLocaleString('vi-VN')} VND sẽ đến hạn vào ngày ${loan.endDate?.toLocaleDateString('vi-VN')}.`,
          notifyAt: today,
        },
      });
    }

    if (dueLoans.length > 0) {
      this.logger.log(
        `Created ${dueLoans.length} notifications for due loans.`,
      );
    }
  }
}
