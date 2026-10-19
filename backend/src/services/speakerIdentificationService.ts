// =====================================================
// Speaker Identification Service
// =====================================================
// Implements turn-order heuristic for mapping AssemblyAI
// speaker labels to salesperson/prospect roles

export interface SpeakerMapping {
  speaker: 'salesperson' | 'prospect' | 'unknown';
  confidence: number;
  algorithm: 'turn-order' | 'assemblyai' | 'combined';
  reasoning: string;
}

interface CallSpeakerState {
  callId: string;
  firstSpeakerLabel?: string; // The AssemblyAI label of the first speaker
  speakerMapping: Map<string, 'salesperson' | 'prospect'>; // Maps AssemblyAI label to role
  turnHistory: Array<{
    label: string;
    turnOrder: number;
    textLength: number;
  }>;
}

// In-memory state for active calls
const callStates = new Map<string, CallSpeakerState>();

/**
 * Initialize speaker identification for a new call
 */
export function initializeCallSpeakerState(callId: string): void {
  if (!callStates.has(callId)) {
    callStates.set(callId, {
      callId,
      turnHistory: [],
      speakerMapping: new Map(),
    });
  }
}

/**
 * Identify speaker role using turn-order heuristic
 * 
 * Algorithm:
 * 1. First speaker in a cold call is LIKELY the salesperson (but not certain)
 * 2. Second speaker is LIKELY the prospect
 * 3. Mapping becomes stable once established - no mid-call switching
 * 4. Confidence reflects certainty based on turn patterns
 * 
 * @param callId - The call ID
 * @param assemblyaiLabel - Raw speaker label from AssemblyAI (e.g., "A", "B")
 * @param turnOrder - Turn sequence number
 * @param textLength - Length of the transcript text
 * @returns Speaker mapping with confidence and reasoning
 */
export function identifySpeaker(
  callId: string,
  assemblyaiLabel: string | null | undefined,
  turnOrder: number,
  textLength: number = 0
): SpeakerMapping {
  // Handle missing speaker label
  if (!assemblyaiLabel || assemblyaiLabel.trim() === '') {
    return {
      speaker: 'unknown',
      confidence: 0.0,
      algorithm: 'turn-order',
      reasoning: 'No speaker label provided by AssemblyAI',
    };
  }

  // Initialize state if needed
  initializeCallSpeakerState(callId);
  const state = callStates.get(callId)!;

  // Record turn history
  state.turnHistory.push({
    label: assemblyaiLabel,
    turnOrder,
    textLength,
  });

  // First speaker identification
  if (!state.firstSpeakerLabel) {
    state.firstSpeakerLabel = assemblyaiLabel;
    state.speakerMapping.set(assemblyaiLabel, 'salesperson');
    
    return {
      speaker: 'salesperson',
      confidence: 0.75, // Moderate confidence - usually correct but not certain
      algorithm: 'turn-order',
      reasoning: 'First speaker assumed to be salesperson (cold call pattern)',
    };
  }

  // Check if this is a known speaker - STABLE MAPPING (never changes once set)
  if (state.speakerMapping.has(assemblyaiLabel)) {
    const role = state.speakerMapping.get(assemblyaiLabel)!;
    const sameRoleTurns = state.turnHistory.filter(t => t.label === assemblyaiLabel).length;
    
    // Confidence increases with consistent usage
    let confidence = 0.75;
    if (sameRoleTurns >= 2) {
      confidence = 0.85;
    }
    if (sameRoleTurns >= 4) {
      confidence = 0.90;
    }
    if (sameRoleTurns >= 6) {
      confidence = 0.95;
    }
    
    return {
      speaker: role,
      confidence,
      algorithm: 'turn-order',
      reasoning: `Stable mapping established (${sameRoleTurns} turn${sameRoleTurns !== 1 ? 's' : ''})`,
    };
  }

  // New speaker - likely the prospect (second speaker in conversation)
  if (state.speakerMapping.size === 1) {
    state.speakerMapping.set(assemblyaiLabel, 'prospect');
    
    return {
      speaker: 'prospect',
      confidence: 0.80, // Good confidence - second speaker pattern
      algorithm: 'turn-order',
      reasoning: 'Second speaker assumed to be prospect',
    };
  }

  // More than 2 speakers detected - unusual for cold calls
  // Could be interruption, background noise, conference call, or transfer
  return {
    speaker: 'unknown',
    confidence: 0.20,
    algorithm: 'turn-order',
    reasoning: `Third+ speaker detected (${state.speakerMapping.size + 1} total speakers). Cannot reliably identify role.`,
  };
}

/**
 * Get current speaker mapping for a call
 */
export function getCallSpeakerMapping(callId: string): Map<string, 'salesperson' | 'prospect'> | null {
  const state = callStates.get(callId);
  return state ? state.speakerMapping : null;
}

/**
 * Clear speaker state for a completed call
 */
export function clearCallSpeakerState(callId: string): void {
  callStates.delete(callId);
}

/**
 * Get speaker statistics for debugging
 */
export function getCallSpeakerStats(callId: string): {
  totalTurns: number;
  speakerCounts: Record<string, number>;
  firstSpeaker?: string;
} | null {
  const state = callStates.get(callId);
  if (!state) return null;

  const speakerCounts: Record<string, number> = {};
  for (const turn of state.turnHistory) {
    speakerCounts[turn.label] = (speakerCounts[turn.label] || 0) + 1;
  }

  return {
    totalTurns: state.turnHistory.length,
    speakerCounts,
    firstSpeaker: state.firstSpeakerLabel,
  };
}
