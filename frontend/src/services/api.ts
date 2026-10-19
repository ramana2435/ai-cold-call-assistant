import { Call, CreateCallInput, SaveStageInput, CloseCallInput, AnalysisResult, StageRecommendation, SuggestedResponseEnhanced, CallIntelligence, ProductProfile, OrganizationProfile, CreateProductProfileInput, CreateOrganizationProfileInput, ReferenceIntelligenceResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
  }
  const data = await response.json();
  return data.data !== undefined ? data.data : data;
}

export async function createCall(input: CreateCallInput): Promise<Call> {
  const response = await fetch(`${API_BASE}/calls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  return handleResponse<Call>(response);
}

export async function getCalls(): Promise<Call[]> {
  const response = await fetch(`${API_BASE}/calls`);
  return handleResponse<Call[]>(response);
}

export async function getCall(id: string): Promise<Call> {
  const response = await fetch(`${API_BASE}/calls/${id}`);
  return handleResponse<Call>(response);
}

export async function saveStage(callId: string, input: SaveStageInput): Promise<void> {
  const response = await fetch(`${API_BASE}/calls/${callId}/stages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  return handleResponse<void>(response);
}

export async function closeCall(callId: string, input: CloseCallInput): Promise<Call> {
  const response = await fetch(`${API_BASE}/calls/${callId}/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  return handleResponse<Call>(response);
}

export async function analyzeCall(callId: string, transcript: string, currentStage?: number): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE}/calls/${callId}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, currentStage })
  });
  return handleResponse<AnalysisResult>(response);
}

export async function suggestStage(callId: string, conversationSummary?: string): Promise<StageRecommendation> {
  const response = await fetch(`${API_BASE}/calls/${callId}/suggest-stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationSummary })
  });
  return handleResponse<StageRecommendation>(response);
}

export async function suggestResponse(callId: string, prospectLastWords?: string): Promise<SuggestedResponseEnhanced> {
  const response = await fetch(`${API_BASE}/calls/${callId}/suggest-response-with-references`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prospectLastWords ? { prospectLastWords } : {})
  });
  return handleResponse<SuggestedResponseEnhanced>(response);
}

export async function getIntelligence(callId: string): Promise<CallIntelligence> {
  const response = await fetch(`${API_BASE}/calls/${callId}/intelligence`);
  return handleResponse<CallIntelligence>(response);
}

export async function checkHealth(): Promise<{ status: string; database: string }> {
  const response = await fetch(`${API_BASE}/health`);
  return handleResponse<{ status: string; database: string }>(response);
}

// =====================================================
// Product Profile API
// =====================================================

export async function getProductProfiles(): Promise<ProductProfile[]> {
  const response = await fetch(`${API_BASE}/products`);
  return handleResponse<ProductProfile[]>(response);
}

export async function getProductProfile(id: string): Promise<ProductProfile> {
  const response = await fetch(`${API_BASE}/products/${id}`);
  return handleResponse<ProductProfile>(response);
}

export async function createProductProfile(input: CreateProductProfileInput): Promise<ProductProfile> {
  const response = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  return handleResponse<ProductProfile>(response);
}

export async function updateProductProfile(id: string, input: Partial<CreateProductProfileInput>): Promise<ProductProfile> {
  const response = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  return handleResponse<ProductProfile>(response);
}

export async function deleteProductProfile(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE'
  });
  return handleResponse<void>(response);
}

// =====================================================
// Organization Profile API
// =====================================================

export async function getOrganizationProfiles(): Promise<OrganizationProfile[]> {
  const response = await fetch(`${API_BASE}/organizations`);
  return handleResponse<OrganizationProfile[]>(response);
}

export async function searchOrganizationProfiles(query: string): Promise<OrganizationProfile[]> {
  const response = await fetch(`${API_BASE}/organizations/search?q=${encodeURIComponent(query)}`);
  return handleResponse<OrganizationProfile[]>(response);
}

export async function getOrganizationProfile(id: string): Promise<OrganizationProfile> {
  const response = await fetch(`${API_BASE}/organizations/${id}`);
  return handleResponse<OrganizationProfile>(response);
}

export async function createOrganizationProfile(input: CreateOrganizationProfileInput): Promise<OrganizationProfile> {
  const response = await fetch(`${API_BASE}/organizations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  return handleResponse<OrganizationProfile>(response);
}

export async function updateOrganizationProfile(id: string, input: Partial<CreateOrganizationProfileInput>): Promise<OrganizationProfile> {
  const response = await fetch(`${API_BASE}/organizations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  return handleResponse<OrganizationProfile>(response);
}

export async function deleteOrganizationProfile(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/organizations/${id}`, {
    method: 'DELETE'
  });
  return handleResponse<void>(response);
}

// =====================================================
// Call Knowledge Association API
// =====================================================

export async function associateKnowledge(
  callId: string,
  productProfileId?: string,
  organizationProfileId?: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/calls/${callId}/knowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_profile_id: productProfileId,
      organization_profile_id: organizationProfileId
    })
  });
  return handleResponse<void>(response);
}

export async function getCallKnowledge(callId: string): Promise<any> {
  const response = await fetch(`${API_BASE}/calls/${callId}/knowledge`);
  return handleResponse<any>(response);
}

// =====================================================
// Reference Intelligence API
// =====================================================

const STAGE_NAMES: Record<number, string> = {
  1: 'Opening',
  2: 'Purpose',
  3: 'Permission',
  4: 'Their business',
  5: 'Their need, in their words',
  6: 'Objection',
  7: 'Next step',
  8: 'Close',
};

export async function getReferenceIntelligence(
  callId: string,
  stageNumber: number,
  prospectWords?: string,
  maxExamples: number = 3
): Promise<ReferenceIntelligenceResponse> {
  const stageName = STAGE_NAMES[stageNumber];
  if (!stageName) {
    throw new Error(`Invalid stage number: ${stageNumber}. Must be 1-8.`);
  }
  const response = await fetch(`${API_BASE}/calls/${callId}/reference-intelligence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      current_stage: stageName,
      recent_transcript: prospectWords || '',
      max_examples: maxExamples,
    }),
  });
  return handleResponse<ReferenceIntelligenceResponse>(response);
}

export async function checkReferenceHealth(): Promise<{ available: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/reference-intelligence/health`);
  return handleResponse<{ available: boolean; message: string }>(response);
}

export async function getReferenceStats(): Promise<unknown> {
  const response = await fetch(`${API_BASE}/reference-intelligence/stats`);
  return handleResponse<unknown>(response);
}

// =====================================================
// Visual Assistance API
// =====================================================

export async function getVisualSuggestions(callId: string): Promise<{ suggestions: import('../types').VisualSuggestion[] }> {
  const response = await fetch(`${API_BASE}/calls/${callId}/visual-suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<{ suggestions: import('../types').VisualSuggestion[] }>(response);
}
