import { Injectable } from '@nestjs/common';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';

@Injectable()
export class RecurringTransactionService {
  create(createRecurringTransactionDto: CreateRecurringTransactionDto) {
    return 'This action adds a new recurringTransaction';
  }

  findAll() {
    return `This action returns all recurringTransaction`;
  }

  findOne(id: number) {
    return `This action returns a #${id} recurringTransaction`;
  }

  update(id: number, updateRecurringTransactionDto: UpdateRecurringTransactionDto) {
    return `This action updates a #${id} recurringTransaction`;
  }

  remove(id: number) {
    return `This action removes a #${id} recurringTransaction`;
  }
}
