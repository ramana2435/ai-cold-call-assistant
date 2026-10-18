// =====================================================
// Type Definitions for AI Cold-Call Assistant
// =====================================================

// Call status enum
export type CallStatus = 'in_progress' | 'closed';

// Call outcome enum (based on 100 transcript analysis)
export type CallOutcome =
  | 'next_step_agreed'
  | 'agreed_to_receive_report'
  | 'interested'
  | 'follow_up'
  | 'call_again'
  | 'not_interested'
  | 'do_not_call'
  | 'wrong_person'
  | 'moved_company'
  | 'not_logged';

// Official stage names (DO NOT MODIFY - from challenge requirements)
export type StageName =
  | 'Opening'
  | 'Purpose'
  | 'Permission'
  | 'Their business'
  | 'Their need, in their words'
  | 'Objection'
  | 'Next step'
  | 'Close';

// Stage number type (1-8)
export type StageNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// Map stage numbers to names
export const STAGE_NAMES: Record<StageNumber, StageName> = {
  1: 'Opening',
  2: 'Purpose',
  3: 'Permission',
  4: 'Their business',
  5: 'Their need, in their words',
  6: 'Objection',
  7: 'Next step',
  8: 'Close',
};

// Reverse map: stage names to numbers
export const STAGE_NUMBERS: Record<StageName, StageNumber> = {
  'Opening': 1,
  'Purpose': 2,
  'Permission': 3,
  'Their business': 4,
  'Their need, in their words': 5,
  'Objection': 6,
  'Next step': 7,
  'Close': 8,
};

// Call record from database
export interface Call {
  id: string;
  prospect_name: string;
  company_name: string;
  prospect_role?: string;
  call_context?: string;
  current_stage_number: StageNumber;
  current_stage_name: StageName;
  reached_stage_number: StageNumber;
  reached_stage_name: StageName;
  status: CallStatus;
  outcome?: CallOutcome;
  prospect_key_words?: string;
  agreed_next_action?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

// Stage result record from database
export interface CallStageResult {
  id: string;
  call_id: string;
  stage_number: StageNumber;
  stage_name: StageName;
  quick_tap_events: string[]; // Array of selected quick-tap choices
  prospect_words?: string; // Verbatim quote from prospect
  stage_notes?: string;
  created_at: string;
}

// Request body for creating a call
export interface CreateCallRequest {
  prospect_name: string;
  company_name: string;
  prospect_role?: string;
  call_context?: string;
}

// Request body for saving a stage result
export interface SaveStageRequest {
  stage_number: StageNumber;
  quick_tap_events: string[];
  prospect_words?: string;
  stage_notes?: string;
}

// Request body for closing a call
export interface CloseCallRequest {
  reached_stage_number: StageNumber;
  outcome: CallOutcome;
  prospect_key_words?: string;
  agreed_next_action?: string;
}

// Response format
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Call with stage results (for detailed view)
export interface CallWithStages extends Call {
  stage_results: CallStageResult[];
}

// =====================================================
// LLM API Types
// =====================================================

// Transcript chunk for analysis
export interface TranscriptChunk {
  text: string;
  timestamp?: string;
}

// Result of transcript analysis
export interface AnalysisResult {
  detectedStage: StageNumber;
  detectedStageName: StageName;
  confidence: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  keyPhrases: string[];
}

// Stage recommendation
export interface StageRecommendation {
  recommendedStage: StageNumber;
  recommendedStageName: StageName;
  confidence: number;
  reasoning: string;
}

// Suggested response
export interface SuggestedResponse {
  text: string;
  context: string;
  priority: number;
}

// Call intelligence summary
export interface CallIntelligence {
  callId: string;
  stageProgression: Array<{ stage: StageNumber; duration?: number }>;
  overallSentiment: string;
  criticalPhrases: string[];
  recommendedActions: string[];
  confidenceScore: number;
}

// Request body for analyzing transcript
export interface AnalyzeTranscriptRequest {
  transcript: string;
  currentStage?: StageNumber;
}

// Request body for suggesting next stage
export interface SuggestStageRequest {
  conversationSummary?: string;
}

// Request body for suggesting responses
export interface SuggestResponseRequest {
  prospectLastWords: string;
}
