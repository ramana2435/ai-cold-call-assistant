import { useState } from 'react';
import { analyzeCall, suggestStage, suggestResponse, getIntelligence } from '../services/api';
import { AnalysisResult, StageRecommendation, SuggestedResponseEnhanced, CallIntelligence } from '../types';
import ReferenceExamplesPanel from './ReferenceExamplesPanel';

interface AIActionsPanelProps {
  callId: string;
  currentStage: number;
  isReadOnly?: boolean;
}

export default function AIActionsPanel({ callId, currentStage, isReadOnly = false }: AIActionsPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [recommendation, setRecommendation] = useState<StageRecommendation | null>(null);
  const [responseResult, setResponseResult] = useState<SuggestedResponseEnhanced | null>(null);
  const [intelligence, setIntelligence] = useState<CallIntelligence | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [analyzeInput, setAnalyzeInput] = useState('');
  const [showStageModal, setShowStageModal] = useState(false);
  const [stageInput, setStageInput] = useState('');

  const handleAnalyze = () => {
    setShowAnalyzeModal(true);
    setAnalyzeInput('');
  };

  const handleAnalyzeSubmit = async () => {
    if (!analyzeInput.trim()) {
      setError('Please enter a transcript to analyze');
      return;
    }
    
    setLoading('analyze');
    setError(null);
    setShowAnalyzeModal(false);
    
    try {
      const result = await analyzeCall(callId, analyzeInput.trim(), currentStage);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(null);
    }
  };

  const handleSuggestStage = () => {
    setShowStageModal(true);
    setStageInput('');
  };

  const handleSuggestStageSubmit = async () => {
    setLoading('suggest-stage');
    setError(null);
    setShowStageModal(false);
    
    try {
      const summary = stageInput.trim() || undefined;
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
      // Call backend without prospectLastWords - backend will use saved transcript
      const result = await suggestResponse(callId);
      setResponseResult(result);
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">AI Actions</h3>
        {isReadOnly && (
          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
            Read-only
          </span>
        )}
      </div>

      {isReadOnly && (
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
          <p className="text-xs text-blue-900">
            <strong>ℹ️ Analysis Mode:</strong> Intelligence analysis is available for closed calls. 
            Stage and response suggestions are disabled as they require an active call context.
          </p>
        </div>
      )}
      
      <div className="space-y-3">
        <button
          onClick={handleAnalyze}
          disabled={loading === 'analyze' || isReadOnly}
          title={isReadOnly ? "Transcript analysis not available for closed calls" : "Analyze a transcript"}
          className={`w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
            isReadOnly
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {loading === 'analyze' ? '⏳ Analyzing...' : '🔍 Analyze Transcript'}
          {isReadOnly && (
            <svg className="h-4 w-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <button
          onClick={handleSuggestStage}
          disabled={loading === 'suggest-stage' || isReadOnly}
          title={isReadOnly ? "Stage suggestions not available for closed calls" : "Get stage recommendation"}
          className={`w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
            isReadOnly
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {loading === 'suggest-stage' ? '⏳ Suggesting...' : '💡 Suggest Next Stage'}
          {isReadOnly && (
            <svg className="h-4 w-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <button
          onClick={handleSuggestResponse}
          disabled={loading === 'suggest-response' || isReadOnly}
          title={isReadOnly ? "Response suggestions not available for closed calls" : "Generate response suggestion"}
          className={`w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
            isReadOnly
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {loading === 'suggest-response' ? '⏳ Generating...' : '💬 Suggest Response'}
          {isReadOnly && (
            <svg className="h-4 w-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <button
          onClick={handleGetIntelligence}
          disabled={loading === 'intelligence'}
          title="Analyze saved call data"
          className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-colors"
        >
          {loading === 'intelligence' ? '⏳ Loading...' : '📊 Get Intelligence'}
        </button>
      </div>

      {isReadOnly && (
        <div className="text-xs text-gray-600 bg-white rounded p-2 border border-gray-200">
          <strong>💡 Tip:</strong> Use "Get Intelligence" to analyze the saved call data and stage progression.
        </div>
      )}

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

      {responseResult && (
        <div className="space-y-3">
          {/* Limited Context Warning */}
          {responseResult.contextSource === 'limited' && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-start gap-2">
              <span className="text-amber-600 text-lg leading-none">⚠️</span>
              <p className="text-sm text-amber-800">
                <strong>Limited context:</strong> No transcript available yet. Suggestions are generic. Start recording to get context-aware recommendations.
              </p>
            </div>
          )}
          
          {/* Primary Recommendation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-blue-900 text-sm">✨ Recommended Response</h4>
              <button
                onClick={() => navigator.clipboard.writeText(responseResult.primary.text)}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                title="Copy to clipboard"
              >
                📋 Copy
              </button>
            </div>
            <p className="text-gray-900">{responseResult.primary.text}</p>
            <p className="text-xs text-blue-700 italic">
              <strong>Why:</strong> {responseResult.primary.explanation}
            </p>
          </div>

          {/* Alternatives */}
          {responseResult.alternatives && responseResult.alternatives.length > 0 && (
            <div className="space-y-2">
              {responseResult.alternatives.map((alt, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-700 text-xs">
                      Alternative {idx + 1}
                    </h4>
                    <button
                      onClick={() => navigator.clipboard.writeText(alt.text)}
                      className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors"
                      title="Copy to clipboard"
                    >
                      📋 Copy
                    </button>
                  </div>
                  <p className="text-sm text-gray-900">{alt.text}</p>
                  <p className="text-xs text-gray-600 italic">
                    <strong>Why:</strong> {alt.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {intelligence && (
        <div className="bg-white rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-gray-900">Call Intelligence</h4>
          <p><strong>Sentiment:</strong> {intelligence.overallSentiment}</p>
          <p><strong>Confidence:</strong> {(intelligence.confidenceScore * 100).toFixed(0)}%</p>
          {intelligence.criticalPhrases && intelligence.criticalPhrases.length > 0 && (
            <p><strong>Critical Phrases:</strong> {intelligence.criticalPhrases.join(', ')}</p>
          )}
          {intelligence.stageProgression && intelligence.stageProgression.length > 0 && (
            <p><strong>Stages Covered:</strong> {intelligence.stageProgression.map(s => s.stage).join(' → ')}</p>
          )}
          <p><strong>Actions:</strong></p>
          <ul className="list-disc pl-5">
            {intelligence.recommendedActions && intelligence.recommendedActions.length > 0 ? (
              intelligence.recommendedActions.map((action, idx) => (
                <li key={idx}>{action}</li>
              ))
            ) : (
              <li>No specific actions recommended</li>
            )}
          </ul>
        </div>
      )}

      <ReferenceExamplesPanel callId={callId} currentStage={currentStage} isReadOnly={isReadOnly} />

      {/* Analyze Transcript Modal */}
      {showAnalyzeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analyze Transcript</h3>
            <textarea
              value={analyzeInput}
              onChange={(e) => setAnalyzeInput(e.target.value)}
              placeholder="Enter the transcript text you want to analyze..."
              className="w-full border border-gray-300 rounded-lg p-3 min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAnalyzeSubmit}
                disabled={!analyzeInput.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Analyze
              </button>
              <button
                onClick={() => {
                  setShowAnalyzeModal(false);
                  setAnalyzeInput('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggest Stage Modal */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggest Next Stage</h3>
            <p className="text-sm text-gray-600 mb-3">
              Optionally provide a conversation summary to improve stage recommendation accuracy.
            </p>
            <textarea
              value={stageInput}
              onChange={(e) => setStageInput(e.target.value)}
              placeholder="Optional: Enter a brief summary of the conversation so far..."
              className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSuggestStageSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Get Suggestion
              </button>
              <button
                onClick={() => {
                  setShowStageModal(false);
                  setStageInput('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
