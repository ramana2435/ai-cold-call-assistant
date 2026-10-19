import {
  shouldTriggerAutoResponse,
  debounceAutoResponse,
  cancelStaleRequest,
  processAutoResponseTrigger,
  clearCallState,
} from '../services/autoResponseService';
import { suggestResponseWithReferences } from '../services/llmService';

// Mock llmService
jest.mock('../services/llmService');

describe('autoResponseService', () => {
  let mockSuggestResponseWithReferences: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSuggestResponseWithReferences = suggestResponseWithReferences as jest.Mock;
    
    // Clear all call states
    clearCallState('test-call-1');
    clearCallState('test-call-2');
  });

  describe('shouldTriggerAutoResponse', () => {
    it('should return true for finalized prospect utterances', () => {
      const result = shouldTriggerAutoResponse(
        'test-call-1',
        1,
        true, // isFinal
        'Hello, what is this about?'
      );

      expect(result).toBe(true);
    });

    it('should return false for interim (non-final) utterances', () => {
      const result = shouldTriggerAutoResponse(
        'test-call-1',
        1,
        false, // not final
        'Hello'
      );

      expect(result).toBe(false);
    });

    it('should return false for empty utterances', () => {
      const result = shouldTriggerAutoResponse(
        'test-call-1',
        1,
        true,
        '   ' // empty/whitespace only
      );

      expect(result).toBe(false);
    });

    it('should return false for already-processed turnOrder', () => {
      // Process turn 1
      shouldTriggerAutoResponse('test-call-1', 1, true, 'First');

      // Try to process turn 1 again
      const result = shouldTriggerAutoResponse('test-call-1', 1, true, 'First');

      expect(result).toBe(false);
    });

    it('should return false for turnOrder less than last processed', () => {
      // Process turn 3
      shouldTriggerAutoResponse('test-call-1', 3, true, 'Third');

      // Try to process turn 2 (older)
      const result = shouldTriggerAutoResponse('test-call-1', 2, true, 'Second');

      expect(result).toBe(false);
    });

    it('should return true for new turnOrder after previous', () => {
      // Process turn 1
      shouldTriggerAutoResponse('test-call-1', 1, true, 'First');

      // Process turn 2 (newer)
      const result = shouldTriggerAutoResponse('test-call-1', 2, true, 'Second');

      expect(result).toBe(true);
    });
  });

  describe('debouncing', () => {
    it('should debounce rapid finalized turns within 500ms', async () => {
      jest.useFakeTimers();

      const callback1 = jest.fn();
      const callback2 = jest.fn();

      // Rapid fire two debounced calls
      debounceAutoResponse('test-call-1', 1, callback1);
      debounceAutoResponse('test-call-1', 2, callback2);

      // Fast-forward 499ms (not yet triggered)
      jest.advanceTimersByTime(499);
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();

      // Fast-forward remaining time
      jest.advanceTimersByTime(1);
      
      // Only the latest callback should be called
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });

    it('should trigger callback after 500ms debounce delay', async () => {
      jest.useFakeTimers();

      const callback = jest.fn();
      debounceAutoResponse('test-call-1', 1, callback);

      // Before 500ms
      jest.advanceTimersByTime(400);
      expect(callback).not.toHaveBeenCalled();

      // After 500ms
      jest.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });

  describe('cancellation', () => {
    it('should cancel stale request when newer utterance arrives', () => {
      jest.useFakeTimers();

      const callback1 = jest.fn();
      const callback2 = jest.fn();

      // First debounced call
      debounceAutoResponse('test-call-1', 1, callback1);

      // Cancel it
      cancelStaleRequest('test-call-1');

      // Second debounced call
      debounceAutoResponse('test-call-1', 2, callback2);

      // Fast-forward 500ms
      jest.advanceTimersByTime(500);

      // Only callback2 should be called (callback1 was cancelled)
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });

  describe('duplicate prevention', () => {
    it('should not trigger generation for same turnOrder twice', async () => {
      mockSuggestResponseWithReferences.mockResolvedValue({
        primary: { text: 'Response 1', explanation: 'Explanation 1' },
        alternatives: [],
        referenceIntelligence: { examples: [], guidance: '' },
        contextSource: 'transcript',
      });

      // First call for turnOrder 1
      const result1 = await processAutoResponseTrigger(
        'test-call-1',
        1,
        'Hello?',
        'Opening',
        undefined
      );

      expect(result1).not.toBeNull();
      expect(mockSuggestResponseWithReferences).toHaveBeenCalledTimes(1);

      // Second call for same turnOrder 1
      const result2 = await processAutoResponseTrigger(
        'test-call-1',
        1,
        'Hello?',
        'Opening',
        undefined
      );

      expect(result2).toBeNull(); // Should be skipped
      expect(mockSuggestResponseWithReferences).toHaveBeenCalledTimes(1); // No additional call
    }, 15000);
  });

  describe('error handling', () => {
    it('should return null on AI failure without throwing', async () => {
      mockSuggestResponseWithReferences.mockRejectedValue(new Error('AI service unavailable'));

      const result = await processAutoResponseTrigger(
        'test-call-1',
        1,
        'Hello?',
        'Opening',
        undefined
      );

      expect(result).toBeNull();
      expect(mockSuggestResponseWithReferences).toHaveBeenCalled();
    }, 15000);

    it('should log errors without exposing full transcript or secrets', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockSuggestResponseWithReferences.mockRejectedValue(new Error('API key invalid'));

      await processAutoResponseTrigger(
        'test-call-1',
        1,
        'This is sensitive transcript content with secrets',
        'Opening',
        undefined
      );

      // Check that error was logged
      expect(consoleSpy).toHaveBeenCalled();
      
      // Check that logged message doesn't contain full transcript
      const loggedMessages = consoleSpy.mock.calls.map(call => call.join(' '));
      const fullLog = loggedMessages.join(' ');
      expect(fullLog).not.toContain('This is sensitive transcript content');

      consoleSpy.mockRestore();
    }, 15000);
  });

  describe('successful response generation', () => {
    it('should call llmService.suggestResponseWithReferences with correct parameters', async () => {
      const mockResponse = {
        primary: { text: 'Great question!', explanation: 'Positive engagement' },
        alternatives: [
          { text: 'Good question!', explanation: 'Alternative' },
        ],
        referenceIntelligence: { examples: [], guidance: 'Test guidance' },
        contextSource: 'transcript' as const,
      };

      mockSuggestResponseWithReferences.mockResolvedValue(mockResponse);

      const result = await processAutoResponseTrigger(
        'test-call-1',
        1,
        'What does your product do?',
        'Their business',
        { product: { product_name: 'Test Product' }, organization: undefined }
      );

      expect(result).toEqual(mockResponse);
      expect(mockSuggestResponseWithReferences).toHaveBeenCalledWith(
        'test-call-1',
        undefined, // prospectLastWords
        'Their business',
        'What does your product do?',
        { product: { product_name: 'Test Product' }, organization: undefined }
      );
    }, 15000);
  });

  describe('clearCallState', () => {
    it('should clear all state for a call', () => {
      // Set up some state
      shouldTriggerAutoResponse('test-call-1', 1, true, 'First');

      // Clear state
      clearCallState('test-call-1');

      // Should be able to trigger same turnOrder again
      const result = shouldTriggerAutoResponse('test-call-1', 1, true, 'First');

      expect(result).toBe(true);
    });
  });
});
