import { Call, CreateCallInput, SaveStageInput, CloseCallInput, AnalysisResult, StageRecommendation, SuggestedResponse, CallIntelligence } from '../types';

const API_BASE = 'http://localhost:3000';

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

export async function suggestResponse(callId: string, prospectLastWords: string): Promise<SuggestedResponse> {
  const response = await fetch(`${API_BASE}/calls/${callId}/suggest-response`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prospectLastWords })
  });
  return handleResponse<SuggestedResponse>(response);
}

export async function getIntelligence(callId: string): Promise<CallIntelligence> {
  const response = await fetch(`${API_BASE}/calls/${callId}/intelligence`);
  return handleResponse<CallIntelligence>(response);
}

export async function checkHealth(): Promise<{ status: string; database: string }> {
  const response = await fetch(`${API_BASE}/health`);
  return handleResponse<{ status: string; database: string }>(response);
}
