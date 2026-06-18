import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password', 'email'] as const),
) {
  @IsString()
  username?: string;

  @IsString()
  baseCurrency?: string;
}
