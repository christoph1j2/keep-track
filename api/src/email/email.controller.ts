import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';

interface SendEmailResponse {
  success: boolean;
  message: string;
  data: unknown;
}

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send_feedback')
  @Throttle({ default: { limit: 10, ttl: 86400000 } })
  async sendFeedbackEmail(
    @Body()
    body: SendEmailDto,
  ): Promise<SendEmailResponse> {
    try {
      const to = process.env.FEEDBACK_EMAIL_ADDRESS;
      if (!to) {
        console.warn(
          'FEEDBACK_EMAIL_ADDRESS is not configured, skipping sending email.',
        );
        return {
          success: true,
          message: 'Feedback received (email not sent due to missing config)',
          data: null,
        };
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
