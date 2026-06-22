import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'User username', example: 'username123' })
  username: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'User password', example: 'password123' })
  password: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'User base currency', example: 'USD' })
  baseCurrency: string;
}
