// Type definitions matching backend types
export type CallStatus = 'in_progress' | 'completed' | 'abandoned';
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

export interface Call {
  id: string;
  prospect_name: string;
  company_name: string;
  prospect_role?: string;
  call_context?: string;
  status: CallStatus;
  outcome?: CallOutcome;
  next_action?: string;
  prospect_key_words?: string;
  created_at: string;
  updated_at: string;
  stage_results?: StageResult[];
}

export interface StageResult {
  id: string;
  call_id: string;
  stage_number: number;
  stage_name: string;
  quick_tap_events: string[];
  prospect_words?: string;
  notes?: string;
  created_at: string;
}

export interface CreateCallInput {
  prospect_name: string;
  company_name: string;
  prospect_role?: string;
  call_context?: string;
}

export interface SaveStageInput {
  stage_number: number;
  stage_name: string;
  quick_tap_events: string[];
  prospect_words?: string;
  notes?: string;
}

export interface CloseCallInput {
  reached_stage: number;
  outcome: CallOutcome;
  prospect_key_words?: string;
  next_action?: string;
}

export interface AnalysisResult {
  detectedStage: number;
  detectedStageName: string;
  confidence: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  keyPhrases: string[];
}

export interface StageRecommendation {
  recommendedStage: number;
  recommendedStageName: string;
  confidence: number;
  reasoning: string;
}

export interface SuggestedResponse {
  text: string;
  context: string;
  priority: number;
}

export interface CallIntelligence {
  callId: string;
  stageProgression: Array<{ stage: number; duration?: number }>;
  overallSentiment: string;
  criticalPhrases: string[];
  recommendedActions: string[];
  confidenceScore: number;
}
