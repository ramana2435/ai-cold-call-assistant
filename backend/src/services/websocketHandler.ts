// =====================================================
// WebSocket Handler for Real-Time Speech Transcription
// =====================================================
// Manages WebSocket connections between frontend and AssemblyAI

import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { AssemblyAI } from 'assemblyai';
import type { StreamingTranscriber } from 'assemblyai';
import config from '../config';
import { validateCallForStreaming, storeTranscriptSegment } from './speechService';
import { initializeCallSpeakerState, identifySpeaker, clearCallSpeakerState } from './speakerIdentificationService';
import { processAutoResponseTrigger, clearCallState } from './autoResponseService';

interface ClientConnection {
  client: WebSocket;
  callId: string;
  assemblyWs?: StreamingTranscriber;
  // Track turn IDs to prevent duplicate persistence
  persistedTurns: Set<number>;
}

const activeConnections = new Map<WebSocket, ClientConnection>();

/**
 * Initialize WebSocket server
 */
export function setupWebSocketServer(wss: WebSocketServer) {
  console.log('[WebSocket] Server initialized');

  wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
    const url = req.url || '';
    console.log(`[WebSocket] New connection: ${url}`);
    console.log(`[WebSocket] Origin: ${req.headers.origin || 'none'}`);

    // Parse call ID from URL: /ws/calls/:callId/transcribe
    const match = url.match(/\/ws\/calls\/([a-f0-9-]+)\/transcribe/);
    if (!match) {
      console.error('[WebSocket] Invalid URL format:', url);
      console.error('[WebSocket] Expected format: /ws/calls/:callId/transcribe');
      ws.close(1002, 'Invalid URL format');
      return;
    }

    const callId = match[1];
    console.log(`[WebSocket] Call ID extracted: ${callId}`);

    // Validate call exists and is in progress
    console.log(`[WebSocket] Validating call ${callId}...`);
    const isValid = await validateCallForStreaming(callId);
    console.log(`[WebSocket] Call validation result: ${isValid}`);
    if (!isValid) {
      console.error(`[WebSocket] Invalid call or call not in progress: ${callId}`);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Call not found or not in progress',
      }));
      ws.close(1008, 'Invalid call');
      return;
    }

    // Check AssemblyAI API key
    if (!config.assemblyai.apiKey) {
      console.error('[WebSocket] AssemblyAI API key not configured');
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Speech service not configured',
      }));
      ws.close(1011, 'Service not configured');
      return;
    }

    try {
      // Initialize AssemblyAI client
      console.log(`[WebSocket] Creating AssemblyAI client for call ${callId}...`);
      const client = new AssemblyAI({
        apiKey: config.assemblyai.apiKey,
      });

      // Create v3 streaming transcriber with speaker diarization
      console.log(`[WebSocket] Creating streaming transcriber with speaker diarization for call ${callId}...`);
      const st = client.streaming.transcriber({
        sampleRate: 16000,
        encoding: 'pcm_s16le',
        speechModel: 'universal-3-6', // Latest stable streaming model
        speakerLabels: true, // Enable speaker diarization
        maxSpeakers: 2, // Expect salesperson + prospect
        connectTimeout: 10000, // 10 seconds - increased from default 1000ms for Windows networking
        maxConnectionRetries: 2, // SDK default - up to 3 total attempts
        connectionRetryDelay: 500, // SDK default
      });
      console.log(`[WebSocket] Streaming transcriber created with speaker diarization for call ${callId}`);
      
      // Initialize speaker identification state
      initializeCallSpeakerState(callId);

      // Store connection info
      const connection: ClientConnection = {
        client: ws,
        callId,
        assemblyWs: st,
        persistedTurns: new Set(),
      };
      activeConnections.set(ws, connection);

      // Set up AssemblyAI v3 event handlers
      st.on('open', (event) => {
        console.log(`[WebSocket] AssemblyAI session opened: ${event.id} for call ${callId}`);
        
        // Handle session expiry - AssemblyAI SDK may return Date or timestamp
        let expiryDate: Date | null = null;
        try {
          if (event.expires_at) {
            // Try to parse as Date
            const parsed = new Date(event.expires_at);
            // Validate the date is reasonable (after year 2000, within next 24 hours)
            if (parsed.getFullYear() > 2000 && parsed.getTime() > Date.now() && parsed.getTime() < Date.now() + 86400000) {
              expiryDate = parsed;
            }
          }
        } catch (err) {
          console.warn('[WebSocket] Could not parse session expiry:', err);
        }
        
        if (expiryDate) {
          console.log(`[WebSocket] Session expires at: ${expiryDate.toISOString()}`);
        } else {
          console.log(`[WebSocket] Session expiry not available or invalid`);
        }
        
        ws.send(JSON.stringify({
          type: 'session_start',
          session_id: event.id,
          expires_at: expiryDate ? expiryDate.toISOString() : null,
        }));
      });

      st.on('turn', async (turn) => {
        if (!turn.transcript) return;

        const isFinal = turn.end_of_turn;
        const assemblyaiLabel = turn.speaker_label || null;
        const turnOrder = turn.turn_order;
        
        console.log(`[WebSocket] Turn #${turnOrder} (${isFinal ? 'final' : 'partial'}) Speaker: ${assemblyaiLabel || 'unknown'}: ${turn.transcript}`);

        // Identify speaker role using turn-order heuristic (only for final turns)
        let speakerIdentification = null;
        if (isFinal && assemblyaiLabel) {
          speakerIdentification = identifySpeaker(
            callId,
            assemblyaiLabel,
            turnOrder,
            turn.transcript.length
          );
          console.log(`[WebSocket] Speaker identified: ${speakerIdentification.speaker} (confidence: ${speakerIdentification.confidence.toFixed(2)}, ${speakerIdentification.reasoning})`);
        }

        // Send to frontend (both partial and final)
        ws.send(JSON.stringify({
          type: 'transcript',
          turn_order: turnOrder,
          text: turn.transcript,
          is_final: isFinal,
          confidence: turn.end_of_turn_confidence,
          speaker: speakerIdentification?.speaker || null,
          speaker_confidence: speakerIdentification?.confidence || null,
        }));

        // Store ONLY final transcripts in database, ONLY once per turn
        if (isFinal && turn.transcript.trim()) {
          // Check if this turn was already persisted
          if (connection.persistedTurns.has(turnOrder)) {
            console.log(`[WebSocket] Turn #${turnOrder} already persisted, skipping duplicate`);
            return;
          }

          try {
            await storeTranscriptSegment(
              callId,
              turn.transcript,
              true,
              turn.end_of_turn_confidence,
              undefined, // start_time (not available in streaming)
              undefined, // end_time (not available in streaming)
              speakerIdentification?.speaker || null,
              assemblyaiLabel,
              speakerIdentification?.confidence || null,
              speakerIdentification?.algorithm || null
            );
            // Mark this turn as persisted
            connection.persistedTurns.add(turnOrder);
            console.log(`[WebSocket] ✅ Stored final transcript #${turnOrder} with speaker for call ${callId}`);
            
            // Trigger auto-response if speaker is prospect
            if (speakerIdentification?.speaker === 'prospect') {
              try {
                // Import services
                const { getCallById } = await import('./callService');
                const knowledgeService = await import('./knowledgeService');
                
                // Get call details for current stage
                const call = await getCallById(callId);
                
                if (!call) {
                  console.warn(`[WebSocket] Call ${callId} not found, skipping auto-response`);
                  return; // Exit this callback
                }
                
                // Get knowledge context
                let knowledgeContext: { product?: any; organization?: any } | undefined;
                try {
                  const knowledgeSnapshot = await knowledgeService.getCallKnowledgeSnapshot(callId);
                  if (knowledgeSnapshot) {
                    knowledgeContext = {
                      product: knowledgeSnapshot.product_snapshot || undefined,
                      organization: knowledgeSnapshot.organization_snapshot || undefined,
                    };
                  }
                } catch (err) {
                  // Knowledge context is optional
                  knowledgeContext = undefined;
                }
                
                // Trigger auto-response generation
                const autoResponse = await processAutoResponseTrigger(
                  callId,
                  turnOrder,
                  turn.transcript,
                  call.current_stage_name,
                  knowledgeContext
                );
                
                if (autoResponse) {
                  // Send auto-response to frontend
                  ws.send(JSON.stringify({
                    type: 'auto_response',
                    turn_order: turnOrder,
                    response: {
                      primary: autoResponse.primary,
                      alternatives: autoResponse.alternatives,
                      referenceIntelligence: autoResponse.referenceIntelligence,
                    },
                    contextSource: autoResponse.contextSource,
                  }));
                  console.log(`[WebSocket] Auto-response generated for call ${callId}, turn #${turnOrder}`);
                } else {
                  console.log(`[WebSocket] Auto-response skipped/cancelled for call ${callId}, turn #${turnOrder}`);
                }
              } catch (autoResponseError: any) {
                // Log error but NEVER stop transcription
                console.error(`[WebSocket] Auto-response error for call ${callId}:`, autoResponseError.message);
                ws.send(JSON.stringify({
                  type: 'auto_response_error',
                  message: 'Failed to generate auto-response. You can manually request a suggestion.',
                }));
              }
            }
          } catch (error: any) {
            console.error(`[WebSocket] ❌ Failed to store transcript #${turnOrder}:`, error);
            console.error(`[WebSocket] Error code: ${error.code || 'unknown'}`);
            console.error(`[WebSocket] Error message: ${error.message || 'unknown'}`);
            // Send error to frontend but keep transcribing
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to save transcript to database',
              recoverable: true,
            }));
          }
        }
      });

      st.on('error', (error: Error) => {
        console.error(`[WebSocket] AssemblyAI error for call ${callId}:`, error);
        console.error(`[WebSocket] Error name: ${error.name}`);
        console.error(`[WebSocket] Error message: ${error.message}`);
        if ('cause' in error && error.cause) {
          console.error(`[WebSocket] Error cause:`, error.cause);
        }
        if ('stack' in error) {
          console.error(`[WebSocket] Error stack:`, error.stack);
        }
        ws.send(JSON.stringify({
          type: 'error',
          message: `Transcription error: ${error.message}`,
        }));
      });

      st.on('close', (code, reason) => {
        console.log(`[WebSocket] AssemblyAI session closed for call ${callId} (code: ${code}, reason: ${reason})`);
        ws.send(JSON.stringify({
          type: 'session_end',
        }));
      });

      // Connect to AssemblyAI v3 streaming
      console.log(`[WebSocket] Attempting to connect to AssemblyAI v3 streaming for call ${callId}...`);
      console.log(`[WebSocket] Connection config: sampleRate=16000, encoding=pcm_s16le, speechModel=universal-3-6, timeout=10000ms`);
      try {
        const beginEvent = await st.connect();
        console.log(`[WebSocket] ✅ Connected to AssemblyAI v3 streaming for call ${callId}`);
        console.log(`[WebSocket] Session ID: ${beginEvent.id}`);
        
        // Log expiry if available and valid
        try {
          if (beginEvent.expires_at) {
            const expiryDate = new Date(beginEvent.expires_at);
            if (expiryDate.getFullYear() > 2000) {
              console.log(`[WebSocket] Session expires: ${expiryDate.toISOString()}`);
            }
          }
        } catch (err) {
          console.log(`[WebSocket] Session expiry not available`);
        }
      } catch (connectError: any) {
        console.error(`[WebSocket] ❌ AssemblyAI connection failed for call ${callId}`);
        console.error(`[WebSocket] Error type: ${connectError.name}`);
        console.error(`[WebSocket] Error message: ${connectError.message}`);
        if (connectError.cause) {
          console.error(`[WebSocket] Error cause:`, connectError.cause);
        }
        if (connectError.stack) {
          console.error(`[WebSocket] Error stack:`, connectError.stack);
        }
        throw connectError;
      }

      // Handle messages from frontend
      ws.on('message', async (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());

          if (data.type === 'audio' && data.data) {
            // Decode base64 PCM audio
            const audioBuffer = Buffer.from(data.data, 'base64');
            // Send Buffer directly to AssemblyAI v3 streaming
            st.sendAudio(audioBuffer.buffer);
          }
        } catch (error) {
          console.error('[WebSocket] Error processing message:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', async () => {
        console.log(`[WebSocket] Client disconnected for call ${callId}`);
        
        // Close AssemblyAI connection
        if (st) {
          try {
            await st.close();
          } catch (error) {
            console.error('[WebSocket] Error closing AssemblyAI connection:', error);
          }
        }

        // Clear speaker identification state
        clearCallSpeakerState(callId);
        
        // Clear auto-response state
        clearCallState(callId);

        // Remove from active connections
        activeConnections.delete(ws);
      });

      ws.on('error', (error) => {
        console.error(`[WebSocket] Client error for call ${callId}:`, error);
      });

    } catch (error: any) {
      console.error(`[WebSocket] Failed to setup connection for call ${callId}:`, error);
      ws.send(JSON.stringify({
        type: 'error',
        message: `Failed to start transcription: ${error.message}`,
      }));
      ws.close(1011, 'Setup failed');
      activeConnections.delete(ws);
    }
  });

  wss.on('error', (error) => {
    console.error('[WebSocket] Server error:', error);
  });
}

/**
 * Cleanup all active connections
 */
export async function cleanupWebSocketConnections() {
  console.log(`[WebSocket] Cleaning up ${activeConnections.size} active connections`);
  
  for (const [ws, connection] of activeConnections.entries()) {
    try {
      if (connection.assemblyWs) {
        await connection.assemblyWs.close();
      }
      ws.close(1001, 'Server shutdown');
    } catch (error) {
      console.error('[WebSocket] Error cleaning up connection:', error);
    }
  }
  
  activeConnections.clear();
}
