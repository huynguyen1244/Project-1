import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AccountModule } from './account/account.module';
import { CategoryModule } from './category/category.module';
import { TransactionModule } from './transaction/transaction.module';
import { RecurringTransactionModule } from './recurring-transaction/recurring-transaction.module';
import { BudgetModule } from './budget/budget.module';
import { LoanModule } from './loan/loan.module';
import { SettingModule } from './setting/setting.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    AccountModule,
    CategoryModule,
    TransactionModule,
    RecurringTransactionModule,
    BudgetModule,
    LoanModule,
    SettingModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
