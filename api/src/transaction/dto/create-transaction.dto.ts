import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiPropertyOptional({ description: 'ID kategorie' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({
    example: 'Nákup Albert',
    description: 'Název / popis transakce',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: '2026-06-22T10:00:00Z',
    description: 'Datum a čas transakce',
  })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 10, description: 'Reálná útrata v původní měně' })
  @IsNumber()
  originalAmount: number;

  @ApiProperty({
    example: 'EUR',
    description: 'Původní měna (např. EUR na dovolené)',
  })
  @IsString()
  originalCurrency: string;

  @ApiProperty({
    example: 250,
    description: 'Přepočtená hodnota do baseCurrency uživatele',
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    example: 'true',
    description: 'Indikátor, zda je transakce AI kategorizovaná',
  })
  @IsBoolean()
  isAiCategorized: boolean;
}
