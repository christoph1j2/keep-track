import { IsNumber, IsUUID, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBudgetDto {
  @ApiProperty({
    description: 'ID kategorie, pro kterou se rozpočet nastavuje',
  })
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    example: 5000,
    description: 'Měsíční limit v základní měně (baseCurrency)',
  })
  @IsNumber()
  @IsPositive()
  limit: number;
}
