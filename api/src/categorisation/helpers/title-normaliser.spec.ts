import { Test, TestingModule } from '@nestjs/testing';
import { normaliseTitle } from './title-normaliser';

describe('normaliseTitle', () => {
  it('should normalise titles correctly', () => {
    const testCases = [
      { input: 'Company s.r.o.', expected: 'company' },
      { input: 'Another Company a.s.', expected: 'another company' },
      { input: 'Z.S. Some Title', expected: 'some title' },
      { input: 'Spol. s r.o. Example', expected: 'example' },
      { input: 'Title with numbers 12345', expected: 'title with numbers' },
      { input: 'Special chars !@#$%^&*()', expected: 'special chars' },
      { input: '   Extra   spaces   ', expected: 'extra spaces' },
      { input: 'Short', expected: 'short' },
      { input: '12', expected: '12' }, // Fallback case
    ];

    for (const testCase of testCases) {
      const result = normaliseTitle(testCase.input);
      expect(result).toBe(testCase.expected);
    }
  });
});
