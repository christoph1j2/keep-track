import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    })
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return login response', async () => {
      const dto = { email: 'test@test.com', password: 'password' };
      mockAuthService.validateUser.mockResolvedValue({ id: '1' });
      mockAuthService.login.mockResolvedValue({ access_token: 'token' });

      const result = await controller.login(dto);
      expect(result.access_token).toBe('token');
    });

    it('should throw UnauthorizedException if validation fails', async () => {
      const dto = { email: 'test@test.com', password: 'password' };
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(controller.login(dto)).rejects.toThrow();
    });
  });

  describe('refresh', () => {
    it('should return new tokens', async () => {
      mockAuthService.refreshTokens.mockResolvedValue({ access_token: 'token' });
      const result = await controller.refresh({ refreshToken: 'oldToken' });
      expect(result.access_token).toBe('token');
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      const req = { user: { id: '1' } } as any;
      const result = await controller.logout(req);
      expect(result.message).toBe('Logged out successfully');
      expect(service.logout).toHaveBeenCalledWith('1');
    });
  });

  describe('forgotPassword', () => {
    it('should call forgotPassword', async () => {
      const result = await controller.forgotPassword({ email: 'test@test.com' });
      expect(result.message).toBeDefined();
      expect(service.forgotPassword).toHaveBeenCalledWith('test@test.com');
    });
  });

  describe('resetPassword', () => {
    it('should call resetPassword', async () => {
      const result = await controller.resetPassword({ newPassword: 'pass', confirmPassword: 'pass' }, 'token');
      expect(result.message).toBeDefined();
      expect(service.resetPassword).toHaveBeenCalledWith('token', { newPassword: 'pass', confirmPassword: 'pass' });
    });
  });
});
