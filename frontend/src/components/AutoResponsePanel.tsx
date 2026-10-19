import { useState } from 'react';
import { SuggestedResponseEnhanced } from '../types';
import { suggestResponseWithReferences } from '../services/api';

interface AutoResponsePanelProps {
  callId: string;
  autoResponse: SuggestedResponseEnhanced | null;
  status: 'listening' | 'processing' | 'ready' | 'unavailable' | 'error';
  error?: string | null;
  contextSource?: 'prospectWords' | 'transcript' | 'limited';
}

export default function AutoResponsePanel({
  callId,
  autoResponse,
  status,
  error,
  contextSource,
}: AutoResponsePanelProps) {
  const [expandedAlternatives, setExpandedAlternatives] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('[AutoResponsePanel] Failed to copy:', err);
    }
  };

  const handleManualRetry = async () => {
    setRetrying(true);
    setRetryError(null);
    
    try {
      // Manual retry calls the endpoint directly (no prospectLastWords - will use recent transcript)
      await suggestResponseWithReferences(callId);
      // The WebSocket will deliver the response, we just trigger it here
      console.log('[AutoResponsePanel] Manual retry triggered');
    } catch (err: any) {
      console.error('[AutoResponsePanel] Manual retry failed:', err);
      setRetryError(err.message || 'Failed to generate response');
    } finally {
      setRetrying(false);
    }
  };

  // Status indicator
  const getStatusColor = () => {
    switch (status) {
      case 'listening':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'listening':
        return '👂';
      case 'processing':
        return '⏳';
      case 'ready':
        return '✅';
      case 'error':
      case 'unavailable':
        return '❌';
      default:
        return '⚪';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Generating response...';
      case 'ready':
        return 'Ready';
      case 'unavailable':
        return 'Unavailable';
      case 'error':
        return 'Error';
      default:
        return 'Waiting';
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-md border border-green-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-green-900">💬 Auto-Response</h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor()}`}>
          <span className="text-sm">{getStatusIcon()}</span>
          <span className="text-xs font-medium">{getStatusText()}</span>
        </div>
      </div>

      {/* Limited Context Warning */}
      {contextSource === 'limited' && (
        <div className="mb-4 bg-yellow-50 border border-yellow-300 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <svg className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-xs font-semibold text-yellow-900">Limited Context</p>
              <p className="text-xs text-yellow-800 mt-1">
                Response generated with sparse transcript context. For better suggestions, ensure microphone transcription is active.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && error && (
        <div className="mb-4 bg-red-50 border border-red-300 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-xs font-semibold text-red-900">Error</p>
              <p className="text-xs text-red-800 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Retry Error */}
      {retryError && (
        <div className="mb-4 bg-red-50 border border-red-300 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-xs text-red-800">{retryError}</p>
            </div>
            <button
              onClick={() => setRetryError(null)}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Processing State */}
      {status === 'processing' && (
        <div className="flex flex-col items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-green-600 mb-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-green-800">Generating response...</p>
        </div>
      )}

      {/* Ready State with Response */}
      {status === 'ready' && autoResponse && (
        <div className="space-y-4">
          {/* Primary Response */}
          <div className="bg-white rounded-lg border-2 border-green-300 p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-semibold text-green-900">Primary Response</h4>
              <button
                onClick={() => handleCopy(autoResponse.primary.text, -1)}
                className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                title="Copy to clipboard"
              >
                {copiedIndex === -1 ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
            <p className="text-sm text-gray-900 mb-3 leading-relaxed">
              {autoResponse.primary.text}
            </p>
            {autoResponse.primary.explanation && (
              <div className="bg-green-50 rounded p-2 border border-green-200">
                <p className="text-xs text-green-800">
                  <strong className="font-semibold">Why:</strong> {autoResponse.primary.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Alternatives */}
          {autoResponse.alternatives && autoResponse.alternatives.length > 0 && (
            <div className="border border-green-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedAlternatives(!expandedAlternatives)}
                className="w-full flex items-center justify-between bg-green-100 hover:bg-green-150 px-4 py-2 text-sm font-medium text-green-900 transition-colors"
              >
                <span>
                  Alternatives ({autoResponse.alternatives.length > 2 ? 'showing 2 of ' + autoResponse.alternatives.length : autoResponse.alternatives.length})
                </span>
                <svg
                  className={`h-5 w-5 transform transition-transform ${expandedAlternatives ? 'rotate-180' : ''}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {expandedAlternatives && (
                <div className="bg-white p-3 space-y-3">
                  {autoResponse.alternatives.slice(0, 2).map((alt, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="text-xs font-semibold text-gray-700">Option {idx + 1}</h5>
                        <button
                          onClick={() => handleCopy(alt.text, idx)}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white text-xs font-medium rounded hover:bg-gray-700 transition-colors"
                          title="Copy to clipboard"
                        >
                          {copiedIndex === idx ? '✓' : '📋'}
                        </button>
                      </div>
                      <p className="text-sm text-gray-800 mb-2 leading-relaxed">
                        {alt.text}
                      </p>
                      {alt.explanation && (
                        <p className="text-xs text-gray-600">
                          <strong className="font-semibold">Why:</strong> {alt.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reference Intelligence Snippet */}
          {autoResponse.referenceIntelligence && autoResponse.referenceIntelligence.examples.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-900 mb-2">📚 Reference Example</p>
              {autoResponse.referenceIntelligence.examples.slice(0, 1).map((example, idx) => (
                <div key={idx} className="text-xs text-blue-800">
                  <p className="mb-1">
                    <strong>Outcome:</strong> {example.outcome}
                  </p>
                  <p className="italic">"{example.excerpt}"</p>
                  {example.metadata && (
                    <p className="text-xs text-blue-600 mt-1">
                      {example.metadata.prospect_role}, {example.metadata.company_kind}
                    </p>
                  )}
                </div>
              ))}
              {autoResponse.referenceIntelligence.totalAvailable > 1 && (
                <p className="text-xs text-blue-600 mt-2">
                  +{autoResponse.referenceIntelligence.totalAvailable - 1} more examples available
                </p>
              )}
            </div>
          )}

          {/* Manual Retry Button */}
          <button
            onClick={handleManualRetry}
            disabled={retrying}
            className="w-full py-2 px-4 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {retrying ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate Response
              </>
            )}
          </button>
        </div>
      )}

      {/* Listening / Unavailable States */}
      {(status === 'listening' || status === 'unavailable') && !autoResponse && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-4xl mb-3">
            {status === 'listening' ? '👂' : '⚠️'}
          </div>
          <p className="text-sm text-gray-700 mb-1 font-medium">
            {status === 'listening' ? 'Listening for prospect speech...' : 'Auto-response unavailable'}
          </p>
          <p className="text-xs text-gray-600">
            {status === 'listening'
              ? 'Responses will appear automatically when prospect finishes speaking'
              : 'Unable to generate auto-responses at this time'}
          </p>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-gray-600 border-t border-green-200 pt-3 mt-4">
        <p className="mb-1">
          <strong>Auto-Response:</strong> Automatically generates suggested responses based on prospect utterances.
        </p>
        <p>
          <strong>Safety:</strong> Responses are suggestions only — never auto-sent. Copy and review before using.
        </p>
      </div>
    </div>
  );
}
