import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCall, saveStage, closeCall, getCallKnowledge } from '../services/api';
import { Call, CloseCallInput } from '../types';
import { STAGES } from '../constants/stages';
import StageNavigation from './StageNavigation';
import StageContent from './StageContent';
import AIActionsPanel from './AIActionsPanel';
import AudioPanel from './AudioPanel';
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
  const [saving, setSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  // Knowledge profiles
  const [knowledgeSnapshot, setKnowledgeSnapshot] = useState<any>(null);
  
  // Track current form state from StageContent
  const [currentFormState, setCurrentFormState] = useState<{
    selectedEvents: string[];
    prospectWords: string;
    notes: string;
  }>({
    selectedEvents: [],
    prospectWords: '',
    notes: ''
  });

  useEffect(() => {
    if (!id) return;
    
    const fetchCall = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCall(id);
        setCall(data);
        
        // Fetch knowledge profiles
        try {
          const knowledge = await getCallKnowledge(id);
          setKnowledgeSnapshot(knowledge);
        } catch (err) {
          console.error('Failed to load knowledge profiles:', err);
          // Non-blocking error
        }
        
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
    stage_notes?: string;
  }) => {
    if (!id) return;
    
    setSaving(true);
    setError(null);
    
    try {
      await saveStage(id, data);
      // Refetch call to update stage_results
      const updatedCall = await getCall(id);
      setCall(updatedCall);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save stage';
      setError(errorMessage);
      console.error('Save stage error:', err);
      throw err; // Re-throw to let caller handle it
    } finally {
      setSaving(false);
    }
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

  const handleSaveCurrentStage = async () => {
    if (!id || currentStage !== 8) return;
    
    setSaving(true);
    setError(null);
    
    try {
      await handleSaveStage({
        stage_number: currentStage,
        stage_name: STAGES[currentStage - 1].name,
        quick_tap_events: currentFormState.selectedEvents,
        prospect_words: currentFormState.prospectWords || undefined,
        stage_notes: currentFormState.notes || undefined
      });
      
      // Show success feedback
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 5000); // Auto-hide after 5 seconds
    } catch (err) {
      // Error already set in handleSaveStage
    } finally {
      setSaving(false);
    }
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
  const isCompleted = call.status === 'closed';

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
              
              {/* Display selected knowledge profiles */}
              {knowledgeSnapshot && (knowledgeSnapshot.product_profile || knowledgeSnapshot.organization_profile) && (
                <div className="flex gap-2 mt-2">
                  {knowledgeSnapshot.product_profile && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      📦 {knowledgeSnapshot.product_profile.product_name}
                    </span>
                  )}
                  {knowledgeSnapshot.organization_profile && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      🏢 {knowledgeSnapshot.organization_profile.organization_name}
                    </span>
                  )}
                </div>
              )}
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
        <div className="bg-blue-50 border-b-2 border-blue-300">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-center text-blue-900 font-semibold">
                Call Closed • Outcome: <span className="uppercase">{call.outcome?.replace(/_/g, ' ')}</span> • Read-Only Mode
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {showSaveSuccess && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-start">
            <svg className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <strong className="font-semibold">Stage 8 saved successfully!</strong>
              <p className="mt-1">You can now close the call using the "End Call" button.</p>
            </div>
            <button
              onClick={() => setShowSaveSuccess(false)}
              className="ml-auto text-green-700 hover:text-green-900"
            >
              ✕
            </button>
          </div>
        )}
        
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-start">
            <svg className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <strong className="font-semibold">Error:</strong> {error}
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-700 hover:text-red-900"
            >
              ✕
            </button>
          </div>
        )}
        
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
              isReadOnly={isCompleted}
              onStateChange={setCurrentFormState}
            />

            {!isCompleted && (
              <div className="mt-6 flex gap-4">
                {currentStage < 8 ? (
                  <button
                    onClick={handleNext}
                    className="flex-1 py-4 bg-blue-800 text-white font-bold text-lg rounded-lg hover:bg-blue-900 transition-colors"
                  >
                    NEXT: {nextStage?.name.toUpperCase()} →
                  </button>
                ) : (
                  <button
                    onClick={handleSaveCurrentStage}
                    disabled={saving}
                    className="flex-1 py-4 bg-blue-800 text-white font-bold text-lg rounded-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        SAVING...
                      </>
                    ) : (
                      'SAVE STAGE 8'
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar - AI Actions & Audio */}
          <div className="lg:col-span-1 space-y-6">
            <AIActionsPanel
              callId={call.id}
              currentStage={currentStage}
              isReadOnly={isCompleted}
            />
            {!isCompleted && (
              <AudioPanel callId={call.id} />
            )}
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
