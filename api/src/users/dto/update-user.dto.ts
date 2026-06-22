import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password', 'email'] as const),
) {
  @IsString()
  @ApiProperty({ description: 'User username', example: 'username123' })
  username?: string;

  @IsString()
  @ApiProperty({ description: 'User base currency', example: 'USD' })
  baseCurrency?: string;
}
