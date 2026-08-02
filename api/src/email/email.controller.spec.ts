import { Test, TestingModule } from '@nestjs/testing';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('EmailController', () => {
  let controller: EmailController;
  let service: EmailService;

  const mockEmailService = {
    sendFeedbackEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    controller = module.get<EmailController>(EmailController);
    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendFeedbackEmail', () => {
    const mockBody = {
      subject: 'Test Subject',
      text: 'Test message',
    };

    it('should return success but skip sending if FEEDBACK_EMAIL_ADDRESS is not configured', async () => {
      const originalEnv = process.env.FEEDBACK_EMAIL_ADDRESS;
      delete process.env.FEEDBACK_EMAIL_ADDRESS;

      const result = await controller.sendFeedbackEmail(mockBody);

      expect(result).toEqual({
        success: true,
        message: 'Feedback received (email not sent due to missing config)',
        data: null,
      });
      expect(mockEmailService.sendFeedbackEmail).not.toHaveBeenCalled();

      process.env.FEEDBACK_EMAIL_ADDRESS = originalEnv;
    });

    it('should send email successfully when FEEDBACK_EMAIL_ADDRESS is configured', async () => {
      const originalEnv = process.env.FEEDBACK_EMAIL_ADDRESS;
      process.env.FEEDBACK_EMAIL_ADDRESS = 'test@example.com';

      mockEmailService.sendFeedbackEmail.mockResolvedValue('sent');

      const result = await controller.sendFeedbackEmail(mockBody);

      expect(mockEmailService.sendFeedbackEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test Subject',
        'Test message',
      );
      expect(result).toEqual({
        success: true,
        message: 'Email sent successfully',
        data: 'sent',
      });

      process.env.FEEDBACK_EMAIL_ADDRESS = originalEnv;
    });

    it('should throw an HttpException if sending fails', async () => {
      const originalEnv = process.env.FEEDBACK_EMAIL_ADDRESS;
      process.env.FEEDBACK_EMAIL_ADDRESS = 'test@example.com';

      mockEmailService.sendFeedbackEmail.mockRejectedValue(new Error('SMTP Error'));

      await expect(controller.sendFeedbackEmail(mockBody)).rejects.toThrow(
        new HttpException('Failed to send email', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      process.env.FEEDBACK_EMAIL_ADDRESS = originalEnv;
    });
  });
});
