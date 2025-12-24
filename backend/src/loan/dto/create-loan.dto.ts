import {
  IsDateString,
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { LoanStatus } from '@prisma/client';

export class CreateLoanDto {
  @IsOptional()
  @IsString()
  lender?: string;

  @IsNotEmpty()
  @IsNumber()
  principal: number;

  @IsOptional()
  @IsNumber()
  interestRate?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;
}
