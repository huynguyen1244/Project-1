import {
    IsDateString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';

export class CreateTransactionDto {
    @IsNotEmpty()
    @IsNumber()
    accountId: number;

    @IsNotEmpty()
    @IsNumber()
    categoryId: number;

    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNotEmpty()
    @IsDateString()
    executionDate: string;
}
