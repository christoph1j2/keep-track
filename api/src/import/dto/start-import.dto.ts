import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportTransactionDto {
  @ApiProperty({ description: 'Název transakce' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Datum transakce (ISO8601 string)' })
  @IsISO8601()
  date: string;

  @ApiProperty({ description: 'Částka' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: 'Původní částka' })
  @IsOptional()
  @IsNumber()
  originalAmount?: number;

  @ApiPropertyOptional({ description: 'Původní měna' })
  @IsOptional()
  @IsString()
  originalCurrency?: string;

  @ApiPropertyOptional({ description: 'ID kategorie' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Směnný kurz' })
  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @ApiPropertyOptional({ description: 'Zda byla transakce AI kategorizována' })
  @IsOptional()
  @IsBoolean()
  isAiCategorized?: boolean;
}

export class StartImportDto {
  @ApiProperty({
    type: [ImportTransactionDto],
    description: 'Seznam transakcí k importu',
  })
  @IsArray()
  @ArrayMaxSize(2048)
  @ValidateNested({ each: true })
  @Type(() => ImportTransactionDto)
  transactions: ImportTransactionDto[];

  @ApiPropertyOptional({ description: 'Použít AI kategorizaci' })
  @IsOptional()
  @IsBoolean()
  useAi?: boolean;
}
