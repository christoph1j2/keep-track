import { Type } from 'class-transformer';
import { ValidateNested, IsArray } from 'class-validator';
import { CreateTransactionDto } from './create-transaction.dto';

export class CreateBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionDto)
  transactions!: CreateTransactionDto[];
}
