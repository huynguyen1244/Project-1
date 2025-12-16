import { Test, TestingModule } from '@nestjs/testing';
import { RecurringTransactionController } from './recurring-transaction.controller';
import { RecurringTransactionService } from './recurring-transaction.service';

describe('RecurringTransactionController', () => {
  let controller: RecurringTransactionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecurringTransactionController],
      providers: [RecurringTransactionService],
    }).compile();

    controller = module.get<RecurringTransactionController>(
      RecurringTransactionController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
