import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'User password', example: 'password123' })
  password: string;
}
