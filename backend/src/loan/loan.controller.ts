import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { LoanService } from './loan.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserId } from '../common/decorators/user.decorator';
import { LoanStatus } from '@prisma/client';

@Controller('loan')
@UseGuards(AuthGuard('jwt'))
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Post()
  async create(@UserId() userId: number, @Body() dto: CreateLoanDto) {
    return await this.loanService.create(userId, dto);
  }

  @Get()
  async findAll(
    @UserId() userId: number,
    @Query('status') status?: LoanStatus,
  ) {
    return await this.loanService.findAll(userId, status);
  }

  @Get(':id')
  async findOne(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.loanService.findOne(id, userId);
  }

  @Patch(':id')
  async update(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLoanDto,
  ) {
    return await this.loanService.update(id, userId, dto);
  }

  @Delete(':id')
  async remove(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.loanService.remove(id, userId);
  }
}
