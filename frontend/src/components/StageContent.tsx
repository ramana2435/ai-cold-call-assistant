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
  isReadOnly?: boolean;
  onStateChange?: (state: {
    selectedEvents: string[];
    prospectWords: string;
    notes: string;
  }) => void;
}

export default function StageContent({ stageNumber, stageResult, onSave, isReadOnly = false, onStateChange }: StageContentProps) {
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

  // Notify parent of state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        selectedEvents,
        prospectWords,
        notes
      });
    }
  }, [selectedEvents, prospectWords, notes, onStateChange]);

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
      {isReadOnly && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-4 rounded-lg shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-bold text-yellow-900 mb-1">
                🔒 Read-Only Mode
              </h3>
              <p className="text-sm text-yellow-800">
                This call is closed. You can view saved stage information but cannot make changes. 
                Stage notes, prospect words, and quick-tap selections are locked.
              </p>
            </div>
          </div>
        </div>
      )}
      
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
              disabled={isReadOnly}
            />
          </div>

          <ProspectWordsInput
            value={prospectWords}
            onChange={setProspectWords}
            stageName={stage.name}
            disabled={isReadOnly}
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                ADDITIONAL NOTES (Optional)
              </label>
              {isReadOnly && (
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Locked
                </span>
              )}
            </div>
            <div className="relative">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isReadOnly ? "No additional notes" : "Any additional context or observations..."}
                className={`w-full px-4 py-3 rounded-lg resize-none transition-colors ${
                  isReadOnly 
                    ? 'bg-gray-50 border-2 border-gray-200 text-gray-600 cursor-not-allowed' 
                    : 'bg-white border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                }`}
                rows={3}
                disabled={isReadOnly}
                readOnly={isReadOnly}
              />
              {isReadOnly && notes === '' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-gray-400 text-sm italic">No additional notes recorded</span>
                </div>
              )}
            </div>
          </div>

          {!isReadOnly && (
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
          )}
        </div>
      </div>
    </div>
  );
}
