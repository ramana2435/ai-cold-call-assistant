import { useState, useEffect } from 'react';
import { StageResult } from '../types';
import { STAGES, SHE_MAY_SAY } from '../constants/stages';
import QuickTapButtons from './QuickTapButtons';
import ProspectWordsInput from './ProspectWordsInput';

interface StageContentProps {
  stageNumber: number;
  stageResult?: StageResult;
  onSave: (data: { 
    stage_number: number; 
    stage_name: string;
    quick_tap_events: string[]; 
    prospect_words?: string; 
    stage_notes?: string;
  }) => Promise<void>;
}

export default function StageContent({ stageNumber, stageResult, onSave }: StageContentProps) {
  const stage = STAGES.find(s => s.number === stageNumber);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [prospectWords, setProspectWords] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (stageResult) {
      setSelectedEvents(stageResult.quick_tap_events || []);
      setProspectWords(stageResult.prospect_words || '');
      setNotes(stageResult.stage_notes || '');
    } else {
      setSelectedEvents([]);
      setProspectWords('');
      setNotes('');
    }
  }, [stageResult, stageNumber]);

  if (!stage) return null;

  const handleToggle = (event: string) => {
    setSelectedEvents(prev =>
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await onSave({
        stage_number: stage.number,
        stage_name: stage.name,
        quick_tap_events: selectedEvents,
        prospect_words: prospectWords || undefined,
        stage_notes: notes || undefined
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save stage:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            STAGE {stage.number} OF 8
          </h2>
          <h3 className="text-xl font-semibold text-blue-600 mt-1">{stage.name}</h3>
          <p className="text-gray-600 mt-2">{stage.guidance}</p>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">SHE MAY SAY</h4>
            <ul className="space-y-2">
              {SHE_MAY_SAY[stage.number]?.map((phrase, idx) => (
                <li key={idx} className="text-gray-600 flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>"{phrase}"</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">WHAT HAPPENED</h4>
            <QuickTapButtons
              options={stage.quickTaps}
              selectedEvents={selectedEvents}
              onToggle={handleToggle}
            />
          </div>

          <ProspectWordsInput
            value={prospectWords}
            onChange={setProspectWords}
            stageName={stage.name}
          />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ADDITIONAL NOTES (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context or observations..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : saved ? (
              <>✓ Saved</>
            ) : (
              'Save Stage Progress'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
