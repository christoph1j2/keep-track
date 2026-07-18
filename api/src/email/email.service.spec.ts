import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { MailerService } from '@nestjs-modules/mailer';

describe('EmailService', () => {
  let service: EmailService;
  let mailerService: MailerService;

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: MailerService, useValue: mockMailerService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    mailerService = module.get<MailerService>(MailerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPasswordResetEmail', () => {
    it('should send email successfully', async () => {
      mockMailerService.sendMail.mockResolvedValue(true);
      await service.sendPasswordResetEmail('test@example.com', 'http://localhost/reset');
      
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(expect.objectContaining({
        to: 'test@example.com',
        subject: '🔒 Password reset for KeepTrack application',
      }));
    });

    it('should throw error if email sending fails', async () => {
      const error = new Error('Failed to send');
      mockMailerService.sendMail.mockRejectedValue(error);
      
      await expect(service.sendPasswordResetEmail('test@example.com', 'http://localhost/reset')).rejects.toThrow(error);
    });
  });
});
