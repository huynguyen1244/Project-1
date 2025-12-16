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
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserId } from '../common/decorators/user.decorator';

@Controller('transaction')
@UseGuards(AuthGuard('jwt'))
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) { }

  @Post()
  async create(@UserId() userId: number, @Body() dto: CreateTransactionDto) {
    return await this.transactionService.create(userId, dto);
  }

  @Get()
  async findAll(
    @UserId() userId: number,
    @Query('accountId') accountId?: string,
  ) {
    return await this.transactionService.findAll(
      userId,
      accountId ? parseInt(accountId) : undefined,
    );
  }

  @Get(':id')
  async findOne(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.transactionService.findOne(id, userId);
  }

  @Patch(':id')
  async update(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTransactionDto,
  ) {
    return await this.transactionService.update(id, userId, dto);
  }

  @Delete(':id')
  async remove(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.transactionService.remove(id, userId);
  }
}
