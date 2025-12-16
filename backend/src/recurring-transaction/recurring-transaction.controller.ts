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
} from '@nestjs/common';
import { RecurringTransactionService } from './recurring-transaction.service';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserId } from '../common/decorators/user.decorator';

@Controller('recurring-transaction')
@UseGuards(AuthGuard('jwt'))
export class RecurringTransactionController {
  constructor(
    private readonly recurringTransactionService: RecurringTransactionService,
  ) { }

  @Post()
  async create(
    @UserId() userId: number,
    @Body() dto: CreateRecurringTransactionDto,
  ) {
    return await this.recurringTransactionService.create(userId, dto);
  }

  @Get()
  async findAll(@UserId() userId: number) {
    return await this.recurringTransactionService.findAll(userId);
  }

  @Get(':id')
  async findOne(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.recurringTransactionService.findOne(id, userId);
  }

  @Patch(':id')
  async update(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRecurringTransactionDto,
  ) {
    return await this.recurringTransactionService.update(id, userId, dto);
  }

  @Delete(':id')
  async remove(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.recurringTransactionService.remove(id, userId);
  }
}
