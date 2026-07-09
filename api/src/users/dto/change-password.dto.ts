import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Old password',
    example: 'oldPassword123',
  })
  @MinLength(8, {
    message: 'Old password must be at least 8 characters long',
  })
  oldPassword: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'New password',
    example: 'newPassword123',
  })
  newPassword: string;
}
