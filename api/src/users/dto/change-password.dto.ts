import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Current password',
    example: 'currentPassword123',
  })
  @MinLength(8, {
    message: 'Current password must be at least 8 characters long',
  })
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'New password',
    example: 'newPassword123',
  })
  newPassword: string;
}
