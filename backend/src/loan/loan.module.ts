import { Module } from '@nestjs/common';
import { LoanService } from './loan.service';
import { LoanController } from './loan.controller';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LoanController],
  providers: [LoanService],
  exports: [LoanService],
})
export class LoanModule { }
