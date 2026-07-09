import { IsArray, IsString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderBudgetItemDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsNumber()
  order: number;
}

export class ReorderBudgetsDto {
  @ApiProperty({ type: [ReorderBudgetItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderBudgetItemDto)
  budgets: ReorderBudgetItemDto[];
}
