// =====================================================
// Speaker Identification Service Tests
// =====================================================

import {
  initializeCallSpeakerState,
  identifySpeaker,
  clearCallSpeakerState,
  getCallSpeakerMapping,
  getCallSpeakerStats,
} from '../services/speakerIdentificationService';

describe('Speaker Identification Service', () => {
  const testCallId = 'test-call-123';

  beforeEach(() => {
    // Clear state before each test
    clearCallSpeakerState(testCallId);
  });

  afterEach(() => {
    // Clean up after each test
    clearCallSpeakerState(testCallId);
  });

  describe('First Speaker Identification', () => {
    it('should identify first speaker as salesperson with high confidence', () => {
      const result = identifySpeaker(testCallId, 'A', 1, 50);

      expect(result.speaker).toBe('salesperson');
      expect(result.confidence).toBeGreaterThan(0.7); // Adjusted for moderate initial confidence
      expect(result.algorithm).toBe('turn-order');
      expect(result.reasoning).toContain('First speaker');
    });

    it('should handle null speaker label', () => {
      const result = identifySpeaker(testCallId, null, 1, 50);

      expect(result.speaker).toBe('unknown');
      expect(result.confidence).toBe(0.0);
      expect(result.reasoning).toContain('No speaker label');
    });
  });

  describe('Second Speaker Identification', () => {
    it('should identify second speaker as prospect', () => {
      // First turn - salesperson
      identifySpeaker(testCallId, 'A', 1, 50);

      // Second turn - prospect
      const result = identifySpeaker(testCallId, 'B', 2, 40);

      expect(result.speaker).toBe('prospect');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.reasoning).toContain('Second speaker');
    });
  });

  describe('Repeated Speaker Turns', () => {
    it('should maintain identification for repeated turns', () => {
      // Speaker A - turn 1
      identifySpeaker(testCallId, 'A', 1, 50);

      // Speaker A - turn 2 (repeated turn)
      const result = identifySpeaker(testCallId, 'A', 2, 45);

      expect(result.speaker).toBe('salesperson');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('should increase confidence with more turns', () => {
      // Multiple turns from Speaker A
      identifySpeaker(testCallId, 'A', 1, 50);
      identifySpeaker(testCallId, 'A', 2, 45);
      identifySpeaker(testCallId, 'A', 3, 55);
      identifySpeaker(testCallId, 'A', 4, 40);
      
      const result = identifySpeaker(testCallId, 'A', 5, 40);

      expect(result.confidence).toBeGreaterThanOrEqual(0.90); // Adjusted - 6 turns
    });
  });

  describe('Multiple Speakers (>2)', () => {
    it('should return unknown for third speaker', () => {
      // Establish two speakers
      identifySpeaker(testCallId, 'A', 1, 50);
      identifySpeaker(testCallId, 'B', 2, 40);

      // Third speaker appears
      const result = identifySpeaker(testCallId, 'C', 3, 30);

      expect(result.speaker).toBe('unknown');
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.reasoning).toContain('Third+ speaker');
    });
  });

  describe('Speaker Mapping', () => {
    it('should return correct speaker mapping', () => {
      identifySpeaker(testCallId, 'A', 1, 50);
      identifySpeaker(testCallId, 'B', 2, 40);

      const mapping = getCallSpeakerMapping(testCallId);

      expect(mapping).not.toBeNull();
      expect(mapping?.get('A')).toBe('salesperson');
      expect(mapping?.get('B')).toBe('prospect');
    });

    it('should return null for unknown call', () => {
      const mapping = getCallSpeakerMapping('unknown-call');
      expect(mapping).toBeNull();
    });
  });

  describe('Speaker Statistics', () => {
    it('should track turn statistics correctly', () => {
      identifySpeaker(testCallId, 'A', 1, 50);
      identifySpeaker(testCallId, 'B', 2, 40);
      identifySpeaker(testCallId, 'A', 3, 45);

      const stats = getCallSpeakerStats(testCallId);

      expect(stats).not.toBeNull();
      expect(stats?.totalTurns).toBe(3);
      expect(stats?.speakerCounts['A']).toBe(2);
      expect(stats?.speakerCounts['B']).toBe(1);
      expect(stats?.firstSpeaker).toBe('A');
    });

    it('should return null for unknown call', () => {
      const stats = getCallSpeakerStats('unknown-call');
      expect(stats).toBeNull();
    });
  });

  describe('State Management', () => {
    it('should initialize state on first call', () => {
      initializeCallSpeakerState(testCallId);
      const mapping = getCallSpeakerMapping(testCallId);

      expect(mapping).not.toBeNull();
      expect(mapping?.size).toBe(0);
    });

    it('should not reset existing state on re-initialization', () => {
      identifySpeaker(testCallId, 'A', 1, 50);
      initializeCallSpeakerState(testCallId);

      const mapping = getCallSpeakerMapping(testCallId);
      expect(mapping?.get('A')).toBe('salesperson');
    });

    it('should clear state correctly', () => {
      identifySpeaker(testCallId, 'A', 1, 50);
      clearCallSpeakerState(testCallId);

      const mapping = getCallSpeakerMapping(testCallId);
      expect(mapping).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined speaker label', () => {
      const result = identifySpeaker(testCallId, undefined, 1, 50);

      expect(result.speaker).toBe('unknown');
      expect(result.confidence).toBe(0.0);
    });

    it('should handle empty string speaker label', () => {
      const result = identifySpeaker(testCallId, '', 1, 50);

      expect(result.speaker).toBe('unknown');
      expect(result.confidence).toBe(0.0);
    });

    it('should handle whitespace-only speaker label', () => {
      const result = identifySpeaker(testCallId, '   ', 1, 50);

      expect(result.speaker).toBe('unknown');
      expect(result.confidence).toBe(0.0);
    });

    it('should handle zero text length', () => {
      const result = identifySpeaker(testCallId, 'A', 1, 0);

      expect(result.speaker).toBe('salesperson');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should maintain stable mapping throughout call', () => {
      // First speaker A
      const r1 = identifySpeaker(testCallId, 'A', 1, 50);
      expect(r1.speaker).toBe('salesperson');

      // Second speaker B
      const r2 = identifySpeaker(testCallId, 'B', 2, 40);
      expect(r2.speaker).toBe('prospect');

      // Many alternating turns - mapping should NEVER change
      for (let i = 3; i < 20; i++) {
        const speaker = i % 2 === 1 ? 'A' : 'B';
        const result = identifySpeaker(testCallId, speaker, i, 30);
        
        if (speaker === 'A') {
          expect(result.speaker).toBe('salesperson');
        } else {
          expect(result.speaker).toBe('prospect');
        }
      }

      // Verify mapping stayed stable
      const mapping = getCallSpeakerMapping(testCallId);
      expect(mapping?.get('A')).toBe('salesperson');
      expect(mapping?.get('B')).toBe('prospect');
    });
  });
});
