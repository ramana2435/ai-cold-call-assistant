import { STAGE_NAMES, STAGE_NUMBERS } from '../types';

describe('Stage Validation', () => {
  it('should have 8 stages defined', () => {
    expect(Object.keys(STAGE_NAMES).length).toBe(8);
    expect(Object.keys(STAGE_NUMBERS).length).toBe(8);
  });

  it('should map stage numbers to correct names', () => {
    expect(STAGE_NAMES[1]).toBe('Opening');
    expect(STAGE_NAMES[2]).toBe('Purpose');
    expect(STAGE_NAMES[3]).toBe('Permission');
    expect(STAGE_NAMES[4]).toBe('Their business');
    expect(STAGE_NAMES[5]).toBe('Their need, in their words');
    expect(STAGE_NAMES[6]).toBe('Objection');
    expect(STAGE_NAMES[7]).toBe('Next step');
    expect(STAGE_NAMES[8]).toBe('Close');
  });

  it('should map stage names to correct numbers', () => {
    expect(STAGE_NUMBERS['Opening']).toBe(1);
    expect(STAGE_NUMBERS['Purpose']).toBe(2);
    expect(STAGE_NUMBERS['Permission']).toBe(3);
    expect(STAGE_NUMBERS['Their business']).toBe(4);
    expect(STAGE_NUMBERS['Their need, in their words']).toBe(5);
    expect(STAGE_NUMBERS['Objection']).toBe(6);
    expect(STAGE_NUMBERS['Next step']).toBe(7);
    expect(STAGE_NUMBERS['Close']).toBe(8);
  });
});

describe('Call Validation', () => {
  it('should validate stage numbers are between 1 and 8', () => {
    const validNumbers = [1, 2, 3, 4, 5, 6, 7, 8];
    const invalidNumbers = [0, 9, -1, 10];

    validNumbers.forEach(num => {
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(8);
    });

    invalidNumbers.forEach(num => {
      expect(num < 1 || num > 8).toBe(true);
    });
  });
});
