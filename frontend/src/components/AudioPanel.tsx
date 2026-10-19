import { useState, useEffect, useRef } from 'react';

interface AudioPanelProps {
  callId: string;
  onTranscriptUpdate?: (text: string, isFinal: boolean) => void;
  onAutoResponse?: (response: any, contextSource: string) => void;
  onAutoResponseError?: (error: string) => void;
}

interface TranscriptEntry {
  id: number;
  segmentId?: string; // Database ID for persisted segments
  turnOrder?: number; // Track turn order for proper interim handling
  text: string;
  isFinal: boolean;
  timestamp: Date;
  speaker?: string | null;
  speakerConfidence?: number | null;
  isPersisted?: boolean; // Track if this came from database
  hasCorrection?: boolean; // Track if manually corrected
  correctionReason?: string | null;
  originalSpeaker?: string | null; // Original auto-assigned speaker
  isEditingCorrection?: boolean; // UI state for inline correction
}

export default function AudioPanel({ callId, onTranscriptUpdate, onAutoResponse, onAutoResponseError }: AudioPanelProps) {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<string>('Not connected');
  const [error, setError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [savingCorrection, setSavingCorrection] = useState<string | null>(null); // segmentId being saved
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const transcriptIdCounter = useRef(0);
  const persistedSegmentIds = useRef<Set<string>>(new Set()); // Track DB segment IDs

  // Load saved transcript history on mount
  useEffect(() => {
    loadTranscriptHistory();
  }, [callId]);

  // Check microphone permission on mount
  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setMicPermission(result.state as 'granted' | 'denied' | 'prompt');
      
      result.addEventListener('change', () => {
        setMicPermission(result.state as 'granted' | 'denied' | 'prompt');
      });
    } catch (err) {
      console.warn('[AudioPanel] Could not check microphone permission:', err);
    }
  };

  const loadTranscriptHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch(`http://localhost:3000/calls/${callId}/transcript?final=true`);
      if (!response.ok) {
        throw new Error(`Failed to load transcript history: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const historyEntries: TranscriptEntry[] = result.data.map((segment: any) => {
          persistedSegmentIds.current.add(segment.id); // Track persisted segment IDs
          return {
            id: transcriptIdCounter.current++,
            segmentId: segment.id,
            text: segment.text,
            isFinal: true,
            timestamp: new Date(segment.created_at),
            speaker: segment.speaker_display || segment.speaker || null,
            speakerConfidence: segment.speaker_confidence || null,
            isPersisted: true,
            hasCorrection: segment.has_correction || false,
            correctionReason: segment.correction_reason || null,
            originalSpeaker: segment.original_speaker || segment.speaker || null,
          };
        });
        
        setTranscripts(historyEntries);
        setHistoryLoaded(true);
        console.log(`[AudioPanel] Loaded ${historyEntries.length} transcript segments from history`);
      }
    } catch (err) {
      console.error('[AudioPanel] Failed to load transcript history:', err);
      // Non-blocking error - user can still record new transcripts
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSpeakerCorrection = async (
    segmentId: string,
    newSpeaker: 'salesperson' | 'prospect' | 'unknown',
    reason?: string
  ) => {
    if (!segmentId) {
      console.error('[AudioPanel] Cannot correct speaker: no segment ID');
      return;
    }

    setSavingCorrection(segmentId);
    
    try {
      const response = await fetch(
        `http://localhost:3000/calls/${callId}/segments/${segmentId}/speaker-correction`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            corrected_speaker: newSpeaker,
            correction_reason: reason || 'Manual correction',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to save correction: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        // Update local state
        setTranscripts((prev) =>
          prev.map((t) => {
            if (t.segmentId === segmentId) {
              return {
                ...t,
                speaker: newSpeaker,
                hasCorrection: true,
                correctionReason: reason || 'Manual correction',
                originalSpeaker: t.originalSpeaker || t.speaker,
                isEditingCorrection: false,
              };
            }
            return t;
          })
        );

        console.log(`[AudioPanel] Saved speaker correction for segment ${segmentId}: ${newSpeaker}`);
      }
    } catch (err) {
      console.error('[AudioPanel] Failed to save speaker correction:', err);
      setError('Failed to save speaker correction. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSavingCorrection(null);
    }
  };

  const toggleCorrectionEdit = (segmentId: string) => {
    setTranscripts((prev) =>
      prev.map((t) => {
        if (t.segmentId === segmentId) {
          return {
            ...t,
            isEditingCorrection: !t.isEditingCorrection,
          };
        }
        return t;
      })
    );
  };

  const startListening = async () => {
    try {
      setError(null);
      setStatus('Requesting microphone access...');

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      mediaStreamRef.current = stream;
      setMicPermission('granted');
      setStatus('Connecting to speech service...');

      // Connect to backend WebSocket
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.hostname}:3000/ws/calls/${callId}/transcribe`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[AudioPanel] WebSocket connected');
        setStatus('🎙️ Listening... (microphone active)');
        setIsListening(true);
        
        // Start capturing and sending audio
        startAudioCapture(stream, ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'transcript') {
            const turnOrder = data.turn_order;
            const entry: TranscriptEntry = {
              id: transcriptIdCounter.current++,
              turnOrder,
              text: data.text,
              isFinal: data.is_final,
              timestamp: new Date(),
              speaker: data.speaker || null,
              speakerConfidence: data.speaker_confidence || null,
              isPersisted: false,
            };

            setTranscripts((prev) => {
              // Check if this is a duplicate of already-persisted content
              if (entry.isFinal) {
                const isDuplicate = prev.some(t => 
                  t.isPersisted && 
                  t.text === entry.text && 
                  t.speaker === entry.speaker &&
                  Math.abs(t.timestamp.getTime() - entry.timestamp.getTime()) < 10000 // Within 10 seconds
                );
                if (isDuplicate) {
                  console.log('[AudioPanel] Skipping duplicate of persisted transcript');
                  return prev;
                }
              }

              // Find if we already have an interim for this turn
              const existingIndex = turnOrder !== undefined 
                ? prev.findIndex(t => t.turnOrder === turnOrder && !t.isFinal && !t.isPersisted)
                : -1;

              if (entry.isFinal) {
                // Final: replace any existing interim for this turn
                if (existingIndex >= 0) {
                  const updated = [...prev];
                  updated[existingIndex] = entry;
                  return updated;
                }
                // No interim found, just append
                return [...prev, entry];
              } else {
                // Interim: replace existing interim or append new
                if (existingIndex >= 0) {
                  const updated = [...prev];
                  updated[existingIndex] = entry;
                  return updated;
                }
                return [...prev, entry];
              }
            });

            // Notify parent component (only for final transcripts)
            if (data.is_final && onTranscriptUpdate) {
              onTranscriptUpdate(data.text, true);
            }

            console.log('[AudioPanel] Transcript:', {
              turnOrder,
              text: data.text.substring(0, 50) + (data.text.length > 50 ? '...' : ''),
              isFinal: data.is_final,
            });
          } else if (data.type === 'session_start') {
            console.log('[AudioPanel] Session started:', data.session_id);
            if (data.expires_at) {
              const expiryDate = new Date(data.expires_at);
              if (expiryDate.getFullYear() > 2000) {
                console.log('[AudioPanel] Session expires:', expiryDate.toISOString());
              }
            }
            setStatus('🎙️ Session active - Speak now');
          } else if (data.type === 'error') {
            const isRecoverable = data.recoverable === true;
            setError(data.message || 'Transcription error');
            if (!isRecoverable) {
              setStatus('Error occurred');
            }
          } else if (data.type === 'auto_response') {
            // Handle auto-response from backend
            console.log('[AudioPanel] Received auto-response for turn', data.turn_order);
            if (onAutoResponse && data.response) {
              onAutoResponse(data.response, data.contextSource || 'transcript');
            }
          } else if (data.type === 'auto_response_error') {
            // Handle auto-response error (non-blocking)
            console.error('[AudioPanel] Auto-response error:', data.message);
            if (onAutoResponseError) {
              onAutoResponseError(data.message || 'Failed to generate auto-response');
            }
          }
        } catch (err) {
          console.error('[AudioPanel] Failed to parse message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[AudioPanel] WebSocket error:', event);
        setError('Connection error. Please try again.');
        setStatus('Connection error');
      };

      ws.onclose = () => {
        console.log('[AudioPanel] WebSocket closed');
        setStatus('Connection closed');
        setIsListening(false);
      };

    } catch (err: any) {
      console.error('[AudioPanel] Failed to start listening:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
        setMicPermission('denied');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError(`Failed to start: ${err.message}`);
      }
      
      setStatus('Failed to connect');
      setIsListening(false);
    }
  };

  const startAudioCapture = (stream: MediaStream, ws: WebSocket) => {
    const audioContext = new AudioContext({ sampleRate: 16000 });
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      if (ws.readyState === WebSocket.OPEN) {
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32Array to Int16Array (PCM)
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        // Send as base64-encoded PCM data
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        ws.send(JSON.stringify({ type: 'audio', data: base64Audio }));
      }
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
  };

  const stopListening = async () => {
    try {
      setStatus('Stopping...');

      // Close WebSocket
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      // Stop audio context
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Stop microphone
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      setIsListening(false);
      setStatus('Stopped');
    } catch (err: any) {
      console.error('[AudioPanel] Error stopping:', err);
      setError(`Error stopping: ${err.message}`);
    }
  };

  const clearTranscripts = () => {
    setTranscripts([]);
    transcriptIdCounter.current = 0;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">🎙️ Microphone Transcription</h3>
        {isListening && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-red-600 font-medium">Recording</span>
          </div>
        )}
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-xs text-yellow-900">
          <strong>⚠️ Important:</strong> This captures audio from your microphone only. 
          It does not record phone calls or capture both sides of a conversation. 
          Use this to transcribe what you (the salesperson) say during the call.
        </p>
      </div>

      {/* Permission Status */}
      {micPermission === 'denied' && (
        <div className="bg-red-100 border border-red-400 rounded-lg p-3">
          <p className="text-sm text-red-900">
            <strong>🚫 Microphone Blocked:</strong> Please enable microphone access in your browser settings.
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-start">
          <svg className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">{error}</div>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">✕</button>
        </div>
      )}

      {/* Status */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-gray-700">Status:</span>
        <span className={`${isListening ? 'text-green-600' : 'text-gray-600'}`}>
          {status}
        </span>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {!isListening ? (
          <button
            onClick={startListening}
            disabled={micPermission === 'denied'}
            className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            Start Listening
          </button>
        ) : (
          <button
            onClick={stopListening}
            className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
            Stop Listening
          </button>
        )}
        
        {transcripts.length > 0 && (
          <button
            onClick={clearTranscripts}
            className="px-4 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Transcript Display */}
      {loadingHistory && transcripts.length === 0 && (
        <div className="mt-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading transcript history...</p>
          </div>
        </div>
      )}
      
      {transcripts.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-700">
              {historyLoaded ? 'Transcript History' : 'Live Transcript'}
            </h4>
            <span className="text-xs text-gray-500">
              {transcripts.length} segment{transcripts.length !== 1 ? 's' : ''}
              {historyLoaded && transcripts.filter(t => t.isPersisted).length > 0 && (
                <span className="ml-2 text-green-600">
                  ({transcripts.filter(t => t.isPersisted).length} saved)
                </span>
              )}
            </span>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
            {transcripts.map((entry) => (
              <div
                key={entry.id}
                className={`text-sm ${
                  entry.isFinal ? 'text-gray-900' : 'text-gray-500 italic'
                } ${entry.isPersisted ? 'bg-green-50 p-2 rounded' : ''}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {entry.timestamp.toLocaleTimeString()}
                  </span>
                  
                  {/* Speaker Badge or Correction UI */}
                  {entry.isPersisted && entry.segmentId && !entry.isEditingCorrection && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleCorrectionEdit(entry.segmentId!)}
                        className={`text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0 hover:opacity-80 transition-opacity ${
                          entry.speaker === 'salesperson'
                            ? 'bg-blue-100 text-blue-800'
                            : entry.speaker === 'prospect'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                        title={`Click to edit. ${entry.hasCorrection ? 'Manually corrected' : `Auto: ${entry.speakerConfidence ? (entry.speakerConfidence * 100).toFixed(0) : '?'}%`}`}
                      >
                        {entry.speaker === 'salesperson' ? '🎤 You' : entry.speaker === 'prospect' ? '👤 Prospect' : '❓ Unknown'}
                        {entry.hasCorrection && <span className="ml-1">✏️</span>}
                      </button>
                    </div>
                  )}

                  {/* Inline Correction Dropdown */}
                  {entry.isPersisted && entry.segmentId && entry.isEditingCorrection && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {savingCorrection === entry.segmentId ? (
                        <span className="text-xs text-gray-500">Saving...</span>
                      ) : (
                        <>
                          <select
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                            value={entry.speaker || 'unknown'}
                            onChange={(e) => {
                              const newSpeaker = e.target.value as 'salesperson' | 'prospect' | 'unknown';
                              handleSpeakerCorrection(entry.segmentId!, newSpeaker);
                            }}
                          >
                            <option value="salesperson">🎤 Salesperson</option>
                            <option value="prospect">👤 Prospect</option>
                            <option value="unknown">❓ Unknown</option>
                          </select>
                          <button
                            onClick={() => toggleCorrectionEdit(entry.segmentId!)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Non-persisted segments show static badge */}
                  {!entry.isPersisted && entry.speaker && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0 ${
                        entry.speaker === 'salesperson'
                          ? 'bg-blue-100 text-blue-800'
                          : entry.speaker === 'prospect'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                      title={`Confidence: ${entry.speakerConfidence ? (entry.speakerConfidence * 100).toFixed(0) : '?'}%`}
                    >
                      {entry.speaker === 'salesperson' ? '🎤 You' : entry.speaker === 'prospect' ? '👤 Prospect' : '❓ Unknown'}
                    </span>
                  )}

                  {entry.isPersisted && (
                    <span className="text-xs text-green-600 flex-shrink-0" title="Saved to database">
                      💾
                    </span>
                  )}
                  
                  <span className="flex-1">
                    {entry.text}
                    {!entry.isFinal && <span className="text-gray-400 ml-1">(partial)</span>}
                    {entry.hasCorrection && entry.correctionReason && (
                      <span className="text-xs text-gray-500 ml-2" title={`Reason: ${entry.correctionReason}`}>
                        (corrected)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-gray-500 border-t pt-3 mt-4">
        <p className="mb-1">
          <strong>How it works:</strong> Speech is transcribed in real-time using AssemblyAI. 
          Partial results appear in gray (interim), final results in black.
        </p>
        <p>
          <strong>Auto-save:</strong> Finalized transcripts are automatically saved to the database. 
          Transcript history loads when you reopen this call.
        </p>
      </div>
    </div>
  );
}
