import { suggestResponseWithReferences, SuggestedResponseEnhanced } from './llmService';
import { StageName } from '../types';

// =====================================================
// Auto-Response Service - Real-Time Response Generation
// =====================================================

interface CallAutoResponseState {
  lastProcessedTurnOrder: number | null;
  inProgressRequest: AbortController | null;
  pendingUtterance: {
    turnOrder: number;
    callback: () => void;
    timeoutId: NodeJS.Timeout;
  } | null;
}

// In-memory state tracking per call
const callStates = new Map<string, CallAutoResponseState>();

/**
 * Get or create state for a call
 */
function getCallState(callId: string): CallAutoResponseState {
  if (!callStates.has(callId)) {
    callStates.set(callId, {
      lastProcessedTurnOrder: null,
      inProgressRequest: null,
      pendingUtterance: null,
    });
  }
  return callStates.get(callId)!;
}

/**
 * Determine if auto-response should be triggered for this utterance
 */
export function shouldTriggerAutoResponse(
  callId: string,
  turnOrder: number,
  isFinal: boolean,
  text: string
): boolean {
  // Only trigger on final utterances with content
  if (!isFinal || !text.trim()) {
    return false;
  }

  const state = getCallState(callId);

  // Don't process if already processed this turnOrder
  if (state.lastProcessedTurnOrder !== null && turnOrder <= state.lastProcessedTurnOrder) {
    return false;
  }

  // Mark as processed (will be confirmed when processing actually starts)
  state.lastProcessedTurnOrder = turnOrder;
  return true;
}

/**
 * Debounce auto-response generation (500ms)
 */
export function debounceAutoResponse(
  callId: string,
  turnOrder: number,
  callback: () => void
): void {
  const state = getCallState(callId);

  // Clear any pending timeout
  if (state.pendingUtterance?.timeoutId) {
    clearTimeout(state.pendingUtterance.timeoutId);
  }

  // Set new timeout (500ms debounce)
  const timeoutId = setTimeout(callback, 500);

  state.pendingUtterance = {
    turnOrder,
    callback,
    timeoutId,
  };
}

/**
 * Cancel in-progress request and pending timeouts
 */
export function cancelStaleRequest(callId: string): void {
  const state = getCallState(callId);

  // Abort in-progress request
  if (state.inProgressRequest) {
    state.inProgressRequest.abort();
    state.inProgressRequest = null;
    console.log(`[Auto-Response] Cancelled stale request for call ${callId}`);
  }

  // Clear pending timeout
  if (state.pendingUtterance?.timeoutId) {
    clearTimeout(state.pendingUtterance.timeoutId);
    state.pendingUtterance = null;
  }
}

/**
 * Process auto-response trigger (main entry point)
 */
export async function processAutoResponseTrigger(
  callId: string,
  turnOrder: number,
  transcript: string,
  currentStage: StageName,
  knowledgeContext?: { product?: any; organization?: any }
): Promise<SuggestedResponseEnhanced | null> {
  // Check if we should trigger for this utterance
  if (!shouldTriggerAutoResponse(callId, turnOrder, true, transcript)) {
    return null;
  }

  // Cancel any stale request
  cancelStaleRequest(callId);

  // Debounce: wait 500ms before processing
  return new Promise((resolve) => {
    debounceAutoResponse(callId, turnOrder, async () => {
      const state = getCallState(callId);

      // Create AbortController for this request
      const abortController = new AbortController();
      state.inProgressRequest = abortController;

      try {
        // Call llmService to generate response
        const response = await suggestResponseWithReferences(
          callId,
          undefined, // prospectLastWords (use recentTranscript instead)
          currentStage,
          transcript,
          knowledgeContext
        );

        // Clear in-progress flag
        state.inProgressRequest = null;

        console.log(`[Auto-Response] Generated response for call ${callId}, turn ${turnOrder}`);
        resolve(response);
      } catch (error: any) {
        // Clear in-progress flag
        state.inProgressRequest = null;

        // Log error but don't expose full transcript or secrets
        console.error(`[Auto-Response] Error generating response for call ${callId}:`, error.message);

        // Return null instead of throwing (graceful degradation)
        resolve(null);
      }
    });
  });
}

/**
 * Clear call state (e.g., when call is closed)
 */
export function clearCallState(callId: string): void {
  cancelStaleRequest(callId);
  callStates.delete(callId);
  console.log(`[Auto-Response] Cleared state for call ${callId}`);
}
