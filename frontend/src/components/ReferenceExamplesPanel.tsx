import { useState } from 'react';
import { getReferenceIntelligence } from '../services/api';
import { ReferenceIntelligenceResponse, ReferenceExample } from '../types';

interface ReferenceExamplesPanelProps {
  callId: string;
  currentStage: number;
  prospectWords?: string;
  isReadOnly?: boolean;
}

function outcomeColor(outcome: string): string {
  const o = outcome.toLowerCase();
  if (o.includes('success') || o.includes('agree') || o.includes('next_step') || o.includes('positive') || o.includes('sale')) {
    return 'bg-green-100 text-green-800 border border-green-200';
  }
  if (o.includes('fail') || o.includes('refused') || o.includes('do_not') || o.includes('not_interested') || o.includes('negativ')) {
    return 'bg-red-100 text-red-800 border border-red-200';
  }
  return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
}

function outcomeLabel(outcome: string): string {
  return outcome
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ReferenceExamplesPanel({
  callId,
  currentStage,
  prospectWords,
  isReadOnly = false,
}: ReferenceExamplesPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReferenceIntelligenceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [expandedExamples, setExpandedExamples] = useState<Set<string>>(new Set());

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReferenceIntelligence(callId, currentStage, prospectWords, 3);
      setResult(data);
      setExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reference examples');
    } finally {
      setLoading(false);
    }
  };

  const toggleExample = (id: string) => {
    setExpandedExamples((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="bg-indigo-50 rounded-lg shadow p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-indigo-900 flex items-center gap-1">
          &#127919; Reference Examples
          <span className="text-xs font-normal text-indigo-600 ml-1">(Stage {currentStage})</span>
        </h4>
        <div className="flex items-center gap-2">
          {result && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
              aria-label={expanded ? 'Collapse examples' : 'Expand examples'}
            >
              {expanded ? '\u25b2 Collapse' : '\u25bc Expand'}
            </button>
          )}
          <button
            onClick={handleFetch}
            disabled={loading || isReadOnly}
            title={isReadOnly ? 'Reference examples not available in read-only mode' : 'Fetch relevant reference examples'}
            className={`py-1 px-3 rounded font-medium text-xs flex items-center gap-1 transition-colors ${
              isReadOnly
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {loading ? '\u23f3 Loading...' : '\ud83c\udfaf Get Examples'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-xs">
          <strong>Error:</strong> {error}
          <button
            onClick={handleFetch}
            disabled={loading}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {!result && !loading && !error && (
        <p className="text-xs text-indigo-600 italic">
          Click &quot;Get Examples&quot; to see relevant reference calls for stage {currentStage}.
        </p>
      )}

      {result && expanded && (
        <div className="space-y-2">
          {result.guidance && (
            <div className="bg-indigo-100 border border-indigo-200 rounded p-2 text-xs text-indigo-900">
              <strong>&#128161; Guidance:</strong> {result.guidance}
            </div>
          )}

          {result.examples.length === 0 && (
            <p className="text-xs text-gray-500 italic">No relevant reference examples found for this stage.</p>
          )}

          {result.examples.map((ex: ReferenceExample) => (
            <div key={ex.id} className="bg-white rounded border border-indigo-100 overflow-hidden">
              <button
                onClick={() => toggleExample(ex.id)}
                className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-indigo-50 transition-colors"
                aria-expanded={expandedExamples.has(ex.id)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${outcomeColor(ex.outcome)}`}>
                    {outcomeLabel(ex.outcome)}
                  </span>
                  <span className="text-xs text-gray-600 truncate">{ex.matchReason}</span>
                </div>
                <span className="text-xs text-gray-400 ml-2 shrink-0">
                  {ex.metadata.turns} turns {expandedExamples.has(ex.id) ? '\u25b2' : '\u25bc'}
                </span>
              </button>
              {expandedExamples.has(ex.id) && (
                <div className="px-3 pb-3 pt-1 space-y-1">
                  <div className="text-xs text-gray-500 flex gap-3">
                    <span>&#127962; {ex.metadata.company_kind}</span>
                    <span>&#128100; {ex.metadata.prospect_role}</span>
                    {ex.metadata.duration_seconds && (
                      <span>&#9201; {Math.round(Number(ex.metadata.duration_seconds) / 60)}m</span>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded p-2 text-xs text-gray-800 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {ex.excerpt}
                  </div>
                  <p className="text-xs text-indigo-600 italic">
                    <strong>Why relevant:</strong> {ex.matchReason}
                  </p>
                </div>
              )}
            </div>
          ))}

          {result.totalAvailable > result.examples.length && (
            <p className="text-xs text-gray-500 text-center">
              + {result.totalAvailable - result.examples.length} more examples available
            </p>
          )}
        </div>
      )}
    </div>
  );
}
