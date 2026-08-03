import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetComplexBudgetDto {
  @ApiProperty({ description: 'User income' })
  @IsNumber()
  @Min(0)
  income: number;

  @ApiProperty({ description: 'User necessary expenses' })
  @IsNumber()
  @Min(0)
  necessaryExpenses: number;
}
