import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RecurringTransactionService } from './recurring-transaction.service';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';

@Controller('recurring-transaction')
export class RecurringTransactionController {
  constructor(private readonly recurringTransactionService: RecurringTransactionService) {}

  @Post()
  create(@Body() createRecurringTransactionDto: CreateRecurringTransactionDto) {
    return this.recurringTransactionService.create(createRecurringTransactionDto);
  }

  @Get()
  findAll() {
    return this.recurringTransactionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recurringTransactionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRecurringTransactionDto: UpdateRecurringTransactionDto) {
    return this.recurringTransactionService.update(+id, updateRecurringTransactionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recurringTransactionService.remove(+id);
  }
}
