import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Jídlo', description: 'Název kategorie' })
  @IsString()
  label: string;

  @ApiProperty({
    example: 'lucide-pizza',
    description: 'Název ikony pro frontend',
  })
  @IsString()
  iconName: string;

  @ApiProperty({
    example: '#ef4444',
    description: 'Barva kategorie (HEX nebo Tailwind class)',
  })
  @IsString()
  colorClass: string;

  @ApiPropertyOptional({
    example: 'uuid-rodicovske-kategorie',
    description: 'ID nadřazené kategorie (pokud jde o subkategorii)',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
