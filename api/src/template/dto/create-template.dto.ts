import {
  IsString,
  IsNumber,
  IsUUID,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty({ example: 'Kafe ve škole', description: 'Název šablony' })
  @IsString()
  title: string;

  @ApiProperty({ example: 60, description: 'Částka transakce' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'ID kategorie spojené se šablonou' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Zda se má šablona zobrazovat na hlavní obrazovce (hotbar)',
  })
  @IsOptional()
  @IsBoolean()
  showInHotbar?: boolean;
}
