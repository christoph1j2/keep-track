import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

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
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'User base currency', example: 'USD' })
  baseCurrency: string;
}
