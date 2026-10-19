import { useState, useEffect } from 'react';
import { getVisualSuggestions } from '../services/api';
import { VisualSuggestion } from '../types';

interface VisualAssistancePanelProps {
  callId: string;
  onRefresh?: () => void;
}

export default function VisualAssistancePanel({ callId, onRefresh }: VisualAssistancePanelProps) {
  const [suggestions, setSuggestions] = useState<VisualSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getVisualSuggestions(callId);
      setSuggestions(result.suggestions || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load visual suggestions';
      setError(errorMessage);
      console.error('Visual suggestions error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [callId]);

  const handleRetry = () => {
    fetchSuggestions();
  };

  const handleRefresh = () => {
    fetchSuggestions();
    if (onRefresh) {
      onRefresh();
    }
  };

  // Visual type badge colors
  const getVisualTypeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('dashboard') || lowerType.includes('screenshot')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (lowerType.includes('workflow') || lowerType.includes('diagram')) {
      return 'bg-purple-100 text-purple-800';
    }
    if (lowerType.includes('chart') || lowerType.includes('comparison')) {
      return 'bg-green-100 text-green-800';
    }
    if (lowerType.includes('illustration') || lowerType.includes('feature')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Visual Sales Assistance</h3>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
          title="Refresh suggestions"
        >
          <svg className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-600 mb-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-gray-600">Analyzing conversation context...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleRetry}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && suggestions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-600 mb-1">No visual suggestions yet</p>
          <p className="text-xs text-gray-500">Continue the conversation to get relevant visuals</p>
        </div>
      )}

      {/* Suggestions List */}
      {!loading && !error && suggestions.length > 0 && (
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              {/* Title and Badge */}
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900 text-sm flex-1">{suggestion.title}</h4>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${getVisualTypeColor(suggestion.visualType)}`}>
                  {suggestion.visualType}
                </span>
              </div>

              {/* Relevance */}
              <div className="mb-3">
                <p className="text-xs text-gray-600 mb-1 font-medium">Why this helps:</p>
                <p className="text-sm text-gray-700">{suggestion.relevance}</p>
              </div>

              {/* Visual Description */}
              <div className="bg-gray-50 rounded p-3 border border-gray-100">
                <p className="text-xs text-gray-600 mb-1 font-medium">Visual description:</p>
                <p className="text-sm text-gray-700 leading-relaxed">{suggestion.description}</p>
              </div>

              {/* Visual Icon Placeholder */}
              <div className="mt-3 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg py-8 border border-blue-100">
                <div className="text-center">
                  <svg className="h-12 w-12 text-blue-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs text-gray-500">Text-based description (no image generation configured)</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
