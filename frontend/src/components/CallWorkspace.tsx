import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCall, saveStage, closeCall } from '../services/api';
import { Call, CloseCallInput } from '../types';
import { STAGES } from '../constants/stages';
import StageNavigation from './StageNavigation';
import StageContent from './StageContent';
import AIActionsPanel from './AIActionsPanel';
import CloseCallModal from './CloseCallModal';

export default function CallWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [call, setCall] = useState<Call | null>(null);
  const [currentStage, setCurrentStage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!id) return;
    
    const fetchCall = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCall(id);
        setCall(data);
        // Set current stage to highest stage reached or 1
        if (data.stage_results && data.stage_results.length > 0) {
          const maxStage = Math.max(...data.stage_results.map(s => s.stage_number));
          setCurrentStage(Math.min(maxStage + 1, 8));
        } else {
          setCurrentStage(1);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load call');
      } finally {
        setLoading(false);
      }
    };

    fetchCall();
  }, [id]);

  useEffect(() => {
    if (!call) return;
    
    const timer = setInterval(() => {
      const start = new Date(call.created_at).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - start) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [call]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveStage = async (data: {
    stage_number: number;
    stage_name: string;
    quick_tap_events: string[];
    prospect_words?: string;
    notes?: string;
  }) => {
    if (!id) return;
    await saveStage(id, data);
    // Refetch call to update stage_results
    const updatedCall = await getCall(id);
    setCall(updatedCall);
  };

  const handleStageClick = (stage: number) => {
    setCurrentStage(stage);
  };

  const handleNext = async () => {
    if (currentStage < 8) {
      setCurrentStage(currentStage + 1);
    }
  };

  const handleCloseCall = async (data: CloseCallInput) => {
    if (!id) return;
    await closeCall(id, data);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading call...</p>
        </div>
      </div>
    );
  }

  if (error || !call) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Call not found'}
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const currentStageResult = call.stage_results?.find(s => s.stage_number === currentStage);
  const nextStage = STAGES.find(s => s.number === currentStage + 1);
  const isCompleted = call.status === 'completed';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {call.company_name.toUpperCase()} - CALL GUIDE
              </h1>
              <p className="text-sm text-gray-600">
                {call.prospect_name} {call.prospect_role && `• ${call.prospect_role}`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Call Duration</div>
                <div className="text-xl font-mono font-bold text-blue-600">
                  {formatTime(elapsedTime)}
                </div>
              </div>
              {!isCompleted && (
                <button
                  onClick={() => setShowCloseModal(true)}
                  className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
                >
                  End Call
                </button>
              )}
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700"
              >
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {isCompleted && (
        <div className="bg-gray-100 border-b border-gray-300">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <p className="text-center text-gray-700">
              ✓ This call is closed. Outcome: <strong>{call.outcome?.replace(/_/g, ' ')}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Stage Navigation */}
          <div className="lg:col-span-1">
            <StageNavigation
              currentStage={currentStage}
              onStageClick={handleStageClick}
            />
          </div>

          {/* Main Content - Stage Content */}
          <div className="lg:col-span-2">
            <StageContent
              stageNumber={currentStage}
              stageResult={currentStageResult}
              onSave={handleSaveStage}
            />

            {!isCompleted && (
              <div className="mt-6 flex gap-4">
                {currentStage < 8 ? (
                  <button
                    onClick={handleNext}
                    className="flex-1 py-4 bg-blue-800 text-white font-bold text-lg rounded-lg hover:bg-blue-900"
                  >
                    NEXT: {nextStage?.name.toUpperCase()} →
                  </button>
                ) : (
                  <button
                    onClick={handleSaveStage.bind(null, {
                      stage_number: currentStage,
                      stage_name: STAGES[currentStage - 1].name,
                      quick_tap_events: currentStageResult?.quick_tap_events || [],
                      prospect_words: currentStageResult?.prospect_words,
                      notes: currentStageResult?.notes
                    })}
                    className="flex-1 py-4 bg-blue-800 text-white font-bold text-lg rounded-lg hover:bg-blue-900"
                  >
                    SAVE STAGE
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar - AI Actions */}
          <div className="lg:col-span-1">
            <AIActionsPanel
              callId={call.id}
              currentStage={currentStage}
            />
          </div>
        </div>
      </div>

      {/* Close Call Modal */}
      <CloseCallModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        currentStage={currentStage}
        onSubmit={handleCloseCall}
      />
    </div>
  );
}
