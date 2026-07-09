import { IsArray, IsString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderTemplateItemDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsNumber()
  order: number;
}

export class ReorderTemplatesDto {
  @ApiProperty({ type: [ReorderTemplateItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderTemplateItemDto)
  templates: ReorderTemplateItemDto[];
}
