import { Test, TestingModule } from '@nestjs/testing';
import { RecurringTransactionService } from './recurring-transaction.service';

describe('RecurringTransactionService', () => {
  let service: RecurringTransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecurringTransactionService],
    }).compile();

    service = module.get<RecurringTransactionService>(
      RecurringTransactionService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
