import { useState } from 'react';
import { analyzeCall, suggestStage, suggestResponse, getIntelligence } from '../services/api';
import { AnalysisResult, StageRecommendation, SuggestedResponse, CallIntelligence } from '../types';

interface AIActionsPanelProps {
  callId: string;
  currentStage: number;
}

export default function AIActionsPanel({ callId, currentStage }: AIActionsPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [recommendation, setRecommendation] = useState<StageRecommendation | null>(null);
  const [response, setResponse] = useState<SuggestedResponse | null>(null);
  const [intelligence, setIntelligence] = useState<CallIntelligence | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading('analyze');
    setError(null);
    try {
      const transcript = prompt('Enter transcript to analyze:');
      if (!transcript) return;
      const result = await analyzeCall(callId, transcript, currentStage);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(null);
    }
  };

  const handleSuggestStage = async () => {
    setLoading('suggest-stage');
    setError(null);
    try {
      const summary = prompt('Enter conversation summary (optional):') || undefined;
      const result = await suggestStage(callId, summary);
      setRecommendation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stage suggestion failed');
    } finally {
      setLoading(null);
    }
  };

  const handleSuggestResponse = async () => {
    setLoading('suggest-response');
    setError(null);
    try {
      const lastWords = prompt('Enter prospect\'s last words:');
      if (!lastWords) return;
      const result = await suggestResponse(callId, lastWords);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Response suggestion failed');
    } finally {
      setLoading(null);
    }
  };

  const handleGetIntelligence = async () => {
    setLoading('intelligence');
    setError(null);
    try {
      const result = await getIntelligence(callId);
      setIntelligence(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Intelligence fetch failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-blue-50 rounded-lg shadow p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Actions</h3>
      
      <div className="space-y-3">
        <button
          onClick={handleAnalyze}
          disabled={loading === 'analyze'}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading === 'analyze' ? '⏳ Analyzing...' : '🔍 Analyze Transcript'}
        </button>

        <button
          onClick={handleSuggestStage}
          disabled={loading === 'suggest-stage'}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading === 'suggest-stage' ? '⏳ Suggesting...' : '💡 Suggest Next Stage'}
        </button>

        <button
          onClick={handleSuggestResponse}
          disabled={loading === 'suggest-response'}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading === 'suggest-response' ? '⏳ Generating...' : '💬 Suggest Response'}
        </button>

        <button
          onClick={handleGetIntelligence}
          disabled={loading === 'intelligence'}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading === 'intelligence' ? '⏳ Loading...' : '📊 Get Intelligence'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {analysis && (
        <div className="bg-white rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-gray-900">Analysis Result</h4>
          <p><strong>Detected Stage:</strong> Stage {analysis.detectedStage} - {analysis.detectedStageName}</p>
          <p><strong>Confidence:</strong> {(analysis.confidence * 100).toFixed(0)}%</p>
          <p><strong>Sentiment:</strong> {analysis.sentiment}</p>
          <p><strong>Key Phrases:</strong> {analysis.keyPhrases.join(', ')}</p>
        </div>
      )}

      {recommendation && (
        <div className="bg-white rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-gray-900">Stage Recommendation</h4>
          <p><strong>Recommended:</strong> Stage {recommendation.recommendedStage} - {recommendation.recommendedStageName}</p>
          <p><strong>Confidence:</strong> {(recommendation.confidence * 100).toFixed(0)}%</p>
          <p><strong>Reasoning:</strong> {recommendation.reasoning}</p>
        </div>
      )}

      {response && (
        <div className="bg-white rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-gray-900">Suggested Response</h4>
          <p className="italic">"{response.text}"</p>
          <p className="text-sm text-gray-600"><strong>Context:</strong> {response.context}</p>
        </div>
      )}

      {intelligence && (
        <div className="bg-white rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-gray-900">Call Intelligence</h4>
          <p><strong>Sentiment:</strong> {intelligence.overallSentiment}</p>
          <p><strong>Confidence:</strong> {(intelligence.confidenceScore * 100).toFixed(0)}%</p>
          <p><strong>Critical Phrases:</strong> {intelligence.criticalPhrases.join(', ')}</p>
          <p><strong>Actions:</strong></p>
          <ul className="list-disc pl-5">
            {intelligence.recommendedActions.map((action, idx) => (
              <li key={idx}>{action}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
