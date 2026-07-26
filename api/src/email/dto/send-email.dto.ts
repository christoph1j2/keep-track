import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendEmailDto {
  @IsOptional()
  @IsString()
  to?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  subject: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  text: string;

  @IsOptional()
  @IsString()
  html?: string;
}
