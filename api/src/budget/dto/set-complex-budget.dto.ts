import {
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  ValidateNested,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
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

  @ApiProperty({ description: 'Categories for the complex budget' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComplexBudgetCategoryDto)
  categories?: ComplexBudgetCategoryDto[];
}

class ComplexBudgetCategoryDto {
  @IsString()
  categoryId: string;

  @IsNumber()
  @Min(0)
  limit: number;
}
