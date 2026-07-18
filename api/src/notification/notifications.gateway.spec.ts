import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsGateway } from './notifications.gateway';
import { JwtService } from '@nestjs/jwt';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let jwtService: JwtService;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should disconnect if no token', async () => {
      const client = { handshake: { auth: {} }, disconnect: jest.fn() } as any;
      await gateway.handleConnection(client);
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('should disconnect if token is invalid', async () => {
      const client = { handshake: { auth: { token: 'invalid' } }, disconnect: jest.fn() } as any;
      mockJwtService.verifyAsync.mockRejectedValue(new Error('invalid'));
      await gateway.handleConnection(client);
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('should join room if token is valid', async () => {
      const client = { id: 'client-1', data: {}, handshake: { auth: { token: 'valid' } }, join: jest.fn(), disconnect: jest.fn() } as any;
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' });
      
      await gateway.handleConnection(client);
      expect(client.join).toHaveBeenCalledWith('user-1');
      expect(client.data.userId).toBe('user-1');
    });
  });
});
