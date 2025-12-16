import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { AccountType } from '@prisma/client';

export class CreateAccountDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(AccountType)
  type: AccountType;

  @IsOptional()
  @IsNumber()
  balance?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
