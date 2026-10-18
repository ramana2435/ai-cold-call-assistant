import { useState, FormEvent } from 'react';
import { OUTCOMES } from '../constants/stages';
import { CallOutcome } from '../types';

interface CloseCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStage: number;
  onSubmit: (data: {
    reached_stage: number;
    outcome: CallOutcome;
    prospect_key_words?: string;
    next_action?: string;
  }) => Promise<void>;
}

export default function CloseCallModal({ isOpen, onClose, currentStage, onSubmit }: CloseCallModalProps) {
  const [reachedStage, setReachedStage] = useState(currentStage);
  const [outcome, setOutcome] = useState<CallOutcome>('not_logged');
  const [prospectKeyWords, setProspectKeyWords] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        reached_stage: reachedStage,
        outcome,
        prospect_key_words: prospectKeyWords || undefined,
        next_action: nextAction || undefined
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close call');
    } finally {
      setSubmitting(false);
    }
  };

  const showNextAction = outcome === 'next_step_agreed' || outcome === 'follow_up';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">End Call</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reached Stage
            </label>
            <select
              value={reachedStage}
              onChange={(e) => setReachedStage(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <option key={num} value={num}>Stage {num}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Outcome <span className="text-red-500">*</span>
            </label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as CallOutcome)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {OUTCOMES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prospect Key Words (Optional)
            </label>
            <textarea
              value={prospectKeyWords}
              onChange={(e) => setProspectKeyWords(e.target.value)}
              placeholder="Key phrases from the prospect..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>

          {showNextAction && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Next Action
              </label>
              <input
                type="text"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="e.g., Follow-up call on Friday 2pm"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Closing...' : 'Close Call'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
