import { Module } from '@nestjs/common';
import { RecurringTransactionService } from './recurring-transaction.service';
import { RecurringTransactionController } from './recurring-transaction.controller';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RecurringTransactionController],
  providers: [RecurringTransactionService],
  exports: [RecurringTransactionService],
})
export class RecurringTransactionModule {}
