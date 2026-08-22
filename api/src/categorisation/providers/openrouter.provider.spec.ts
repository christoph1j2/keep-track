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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenRouterProvider],
    }).compile();

    provider = module.get<OpenRouterProvider>(OpenRouterProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('categorise response parsing logic', () => {
    it('should parse an array response', async () => {
      const mockChatSend = jest.fn().mockResolvedValue({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        choices: [
          {
            message: {
              content: JSON.stringify([
                { title: 'lidl dekuje za nakup', categoryId: 'cat-1', reasoning: 'Supermarket' },
                { title: 'pmdp plb', categoryId: 'cat-2', reasoning: 'Transport' },
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
                  { title: 'tesco marianske lazne', categoryId: 'cat-1', reasoning: 'Supermarket' },
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

      expect(results).toEqual([
        { title: 'portu investice', categoryId: null },
      ]);
    });
  });
});
