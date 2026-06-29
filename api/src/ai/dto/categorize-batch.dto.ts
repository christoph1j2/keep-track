import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class IncomingTransactionDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  date!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsNotEmpty()
  @IsNumber()
  amount!: number; // The normalized base currency (e.g., CZK)

  @IsNotEmpty()
  @IsNumber()
  originalAmount!: number; // The actual spent amount

  @IsString()
  @IsNotEmpty()
  originalCurrency!: string; // e.g., 'CZK', 'EUR'
}

export class CategorizeBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IncomingTransactionDto)
  transactions!: IncomingTransactionDto[];
}
