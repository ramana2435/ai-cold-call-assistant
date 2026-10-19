// Type definitions matching backend types
export type CallStatus = 'in_progress' | 'closed';
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
  agreed_next_action?: string;
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
  stage_notes?: string;
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
  stage_notes?: string;
}

export interface CloseCallInput {
  reached_stage_number: number;
  outcome: CallOutcome;
  prospect_key_words?: string;
  agreed_next_action?: string;
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

export interface SuggestedResponseItem {
  text: string;
  explanation: string;
}

export interface SuggestedResponseEnhanced {
  primary: SuggestedResponseItem;
  alternatives: SuggestedResponseItem[];
  referenceIntelligence?: ReferenceIntelligenceResponse;
  contextSource?: 'prospectWords' | 'transcript' | 'limited';
}

export interface CallIntelligence {
  callId: string;
  stageProgression: Array<{ stage: number; duration?: number }>;
  overallSentiment: string;
  criticalPhrases: string[];
  recommendedActions: string[];
  confidenceScore: number;
}

// =====================================================
// Product & Organization Knowledge Types
// =====================================================

export interface ProductFeature {
  name: string;
  description: string;
}

export interface ObjectionResponse {
  objection: string;
  response: string;
}

export interface ImageReference {
  type: string;
  url: string;
  description?: string;
}

export interface ProductProfile {
  id: string;
  product_name: string;
  short_description?: string;
  detailed_explanation?: string;
  problems_solved: string[];
  features: ProductFeature[];
  benefits: string[];
  use_cases: string[];
  pricing_model?: string;
  technical_requirements?: string;
  product_limitations?: string;
  common_objections: ObjectionResponse[];
  ideal_customer_profile?: string;
  supported_industries: string[];
  unsupported_industries: string[];
  image_references: ImageReference[];
  preferred_cta?: string;
  preferred_next_steps?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationProfile {
  id: string;
  organization_name: string;
  website?: string;
  industry?: string;
  organization_type?: string;
  company_size?: string;
  prospect_name?: string;
  prospect_role?: string;
  is_decision_maker?: boolean;
  business_challenges?: string;
  potential_use_cases?: string;
  organization_notes?: string;
  information_source?: string;
  confidence_level?: 'high' | 'medium' | 'low' | 'unverified';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_contacted_at?: string;
}

export interface CreateProductProfileInput {
  product_name: string;
  short_description?: string;
  detailed_explanation?: string;
  problems_solved?: string[];
  features?: ProductFeature[];
  benefits?: string[];
  use_cases?: string[];
  pricing_model?: string;
  technical_requirements?: string;
  product_limitations?: string;
  common_objections?: ObjectionResponse[];
  ideal_customer_profile?: string;
  supported_industries?: string[];
  unsupported_industries?: string[];
  image_references?: ImageReference[];
  preferred_cta?: string;
  preferred_next_steps?: string;
}

export interface CreateOrganizationProfileInput {
  organization_name: string;
  website?: string;
  industry?: string;
  organization_type?: string;
  company_size?: string;
  prospect_name?: string;
  prospect_role?: string;
  is_decision_maker?: boolean;
  business_challenges?: string;
  potential_use_cases?: string;
  organization_notes?: string;
  information_source?: string;
  confidence_level?: 'high' | 'medium' | 'low' | 'unverified';
}

// =====================================================
// Reference Intelligence Types
// =====================================================

export interface ReferenceExampleMetadata {
  prospect_role: string;
  company_kind: string;
  duration_seconds: string;
  turns: number;
}

export interface ReferenceExample {
  id: string;
  relevanceScore: number;
  matchReason: string;
  outcome: string;
  excerpt: string;
  metadata: ReferenceExampleMetadata;
}

export interface ReferenceIntelligenceResponse {
  examples: ReferenceExample[];
  guidance: string;
  totalAvailable: number;
}

export interface ReferenceHealthResponse {
  available: boolean;
  message: string;
}
