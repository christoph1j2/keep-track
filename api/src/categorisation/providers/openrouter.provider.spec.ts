import { Test, TestingModule } from '@nestjs/testing';
import { OpenRouterProvider } from './openrouter.provider';

jest.mock('@openrouter/sdk', () => {
  return {
    OpenRouter: jest.fn().mockImplementation(() => ({
      chat: {
        send: jest.fn(),
      },
    })),
  };
});

describe('OpenRouterProvider', () => {
  let provider: OpenRouterProvider;
  const originalApiKey = process.env.OPENROUTER_API_KEY;

  beforeEach(async () => {
    process.env.OPENROUTER_API_KEY = 'test-api-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenRouterProvider],
    }).compile();

    provider = module.get<OpenRouterProvider>(OpenRouterProvider);
  });

  afterEach(() => {
    process.env.OPENROUTER_API_KEY = originalApiKey;
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should throw an error if OPENROUTER_API_KEY is not configured', async () => {
    delete process.env.OPENROUTER_API_KEY;
    await expect(
      provider.categorise(['lidl'], [{ id: 'cat-1', label: 'Food' }]),
    ).rejects.toThrow('OPENROUTER_API_KEY is not configured');
  });

  it('should use custom OpenRouterConfig models when provided', async () => {
    const customConfig = {
      primaryModel: 'custom/primary-model',
      fallbackModels: ['custom/fallback-1', 'custom/fallback-2'],
    };
    const customProvider = new OpenRouterProvider(customConfig);
    const mockChatSend = jest.fn().mockResolvedValue({
      model: 'custom/primary-model',
      choices: [
        {
          message: {
            content: JSON.stringify([{ title: 'lidl', categoryId: 'cat-1' }]),
          },
        },
      ],
    });
    (customProvider as any).client = { chat: { send: mockChatSend } };

    await customProvider.categorise(['lidl'], [{ id: 'cat-1', label: 'Food' }]);

    expect(mockChatSend).toHaveBeenCalledWith({
      chatRequest: expect.objectContaining({
        model: 'custom/primary-model',
        models: ['custom/fallback-1', 'custom/fallback-2'],
      }),
    });
  });

  it('should propagate failure when a chunk exhausts all retry attempts', async () => {
    const mockChatSend = jest.fn().mockRejectedValue(new Error('API error'));
    (provider as any).client = { chat: { send: mockChatSend } };

    // Mock sleep to avoid waiting during test execution
    (provider as any).sleep = jest.fn().mockResolvedValue(undefined);

    await expect(
      provider.categorise(['lidl'], [{ id: 'cat-1', label: 'Food' }]),
    ).rejects.toThrow(
      'OpenRouter categorisation failed for chunk 1 of 1 (1 titles unclassified) after 3 attempts.',
    );

    expect(mockChatSend).toHaveBeenCalledTimes(3);
  });

  describe('categorise response parsing logic', () => {
    it('should parse an array response', async () => {
      const mockChatSend = jest.fn().mockResolvedValue({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        choices: [
          {
            message: {
              content: JSON.stringify([
                {
                  title: 'lidl dekuje za nakup',
                  categoryId: 'cat-1',
                  reasoning: 'Supermarket',
                },
                {
                  title: 'pmdp plb',
                  categoryId: 'cat-2',
                  reasoning: 'Transport',
                },
              ]),
            },
          },
        ],
      });
      (provider as any).client = { chat: { send: mockChatSend } };

      const results = await provider.categorise(
        ['lidl dekuje za nakup', 'pmdp plb'],
        [
          { id: 'cat-1', label: 'Food & Groceries' },
          { id: 'cat-2', label: 'Transport' },
        ],
      );

      expect(results).toEqual([
        { title: 'lidl dekuje za nakup', categoryId: 'cat-1' },
        { title: 'pmdp plb', categoryId: 'cat-2' },
      ]);
    });

    it('should parse response wrapped in { "results": [...] } object', async () => {
      const mockChatSend = jest.fn().mockResolvedValue({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        choices: [
          {
            message: {
              content: JSON.stringify({
                results: [
                  {
                    title: 'tesco marianske lazne',
                    categoryId: 'cat-1',
                    reasoning: 'Supermarket',
                  },
                ],
              }),
            },
          },
        ],
      });
      (provider as any).client = { chat: { send: mockChatSend } };

      const results = await provider.categorise(
        ['tesco marianske lazne'],
        [{ id: 'cat-1', label: 'Food & Groceries' }],
      );

      expect(results).toEqual([
        { title: 'tesco marianske lazne', categoryId: 'cat-1' },
      ]);
    });

    it('should parse single transaction object when LLM returns only one object', async () => {
      const mockChatSend = jest.fn().mockResolvedValue({
        model: 'nvidia/nemotron-3-super-120b-a12b:free',
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'portu investice',
                categoryId: null,
                reasoning: 'Investment platform',
              }),
            },
          },
        ],
      });
      (provider as any).client = { chat: { send: mockChatSend } };

      const results = await provider.categorise(
        ['portu investice'],
        [{ id: 'cat-1', label: 'Food & Groceries' }],
      );

      expect(results).toEqual([{ title: 'portu investice', categoryId: null }]);
    });
  });
});
