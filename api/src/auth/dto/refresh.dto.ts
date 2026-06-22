import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Refresh token',
    example: 'refresh_token_example',
  })
  refreshToken: string;
}
