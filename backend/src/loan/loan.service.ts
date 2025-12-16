import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoanStatus } from '@prisma/client';

@Injectable()
export class LoanService {
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

    const updateData: any = { ...dto };
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
}
