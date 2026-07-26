import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { EmailService } from './email.service';

interface SendEmailRequest {
  to?: string;
  subject: string;
  text: string;
  html?: string;
}

interface SendEmailResponse {
  success: boolean;
  message: string;
  data: unknown;
}

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send_feedback')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 86400000 } })
  async sendFeedbackEmail(
    @Body()
    body: SendEmailRequest,
  ): Promise<SendEmailResponse> {
    try {
      const to = process.env.FEEDBACK_EMAIL_ADDRESS;
      if (!to) {
        throw new HttpException(
          'Feedback email address not configured',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      const result = await this.emailService.sendFeedbackEmail(
        to,
        body.subject,
        body.text,
      );
      return {
        success: true,
        message: 'Email sent successfully',
        data: result,
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new HttpException(
        'Failed to send email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
