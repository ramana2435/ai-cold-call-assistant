// =====================================================
// Speech Service - AssemblyAI Streaming Integration
// =====================================================
// Manages WebSocket streaming sessions for real-time transcription
// Uses AssemblyAI Streaming API v3

import { AssemblyAI } from 'assemblyai';
import config from '../config';
import { getSupabaseClient } from '../db/supabase';
import { TranscriptSegment } from '../types';

const supabase = getSupabaseClient();

// =====================================================
// AssemblyAI Client Setup
// =====================================================

let assemblyClient: AssemblyAI | null = null;

function getAssemblyClient(): AssemblyAI {
  if (!assemblyClient) {
    if (!config.assemblyai.apiKey) {
      throw new Error('AssemblyAI API key not configured. Set ASSEMBLYAI_API_KEY in .env');
    }
    assemblyClient = new AssemblyAI({
      apiKey: config.assemblyai.apiKey,
    });
  }
  return assemblyClient;
}

// =====================================================
// Transcript Storage
// =====================================================

/**
 * Store transcript segment in database
 * Only stores finalized segments by default
 */
export async function storeTranscriptSegment(
  callId: string,
  text: string,
  isFinal: boolean,
  confidence?: number,
  startTime?: number,
  endTime?: number,
  speaker?: string | null,
  assemblyaiSpeakerLabel?: string | null,
  speakerConfidence?: number | null,
  speakerAlgorithm?: string | null
): Promise<TranscriptSegment> {
  try {
    const { data, error } = await supabase
      .from('transcript_segments')
      .insert({
        call_id: callId,
        text,
        is_final: isFinal,
        confidence,
        start_time: startTime,
        end_time: endTime,
        speaker: speaker || null,
        assemblyai_speaker_label: assemblyaiSpeakerLabel || null,
        speaker_confidence: speakerConfidence || null,
        speaker_algorithm: speakerAlgorithm || null,
        language: 'en', // TODO: Add language detection
      })
      .select()
      .single();

    if (error) {
      // Enhanced error logging
      console.error('[Speech] Failed to store transcript segment:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      
      // Provide actionable error message
      if (error.code === '42501') {
        throw new Error(
          `Database permission denied. Please run migration: database/migrations/002_transcript_segments_fix.sql`
        );
      }
      
      throw new Error(`Failed to store transcript: ${error.message}`);
    }

    return data as TranscriptSegment;
  } catch (error: any) {
    console.error('[Speech] Database error storing transcript:', {
      name: error.name,
      message: error.message,
      code: error.code,
    });
    throw error;
  }
}

/**
 * Get all transcript segments for a call
 * Optionally joins with speaker_corrections to return corrected speaker labels
 */
export async function getTranscriptSegments(
  callId: string,
  finalOnly: boolean = false
): Promise<TranscriptSegment[]> {
  try {
    // Build query with LEFT JOIN to speaker_corrections
    let query = supabase
      .from('transcript_segments')
      .select(`
        *,
        speaker_correction:speaker_corrections(
          corrected_speaker,
          correction_reason,
          corrected_at
        )
      `)
      .eq('call_id', callId)
      .order('start_time', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (finalOnly) {
      query = query.eq('is_final', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Speech] Failed to fetch transcript segments:', error);
      throw new Error(`Failed to fetch transcripts: ${error.message}`);
    }

    // Transform data to merge correction into main object
    const segments = (data || []).map((segment: any) => {
      const correction = Array.isArray(segment.speaker_correction) 
        ? segment.speaker_correction[0] 
        : segment.speaker_correction;
      
      return {
        ...segment,
        // If correction exists, use corrected_speaker; otherwise use original
        speaker_display: correction?.corrected_speaker || segment.speaker,
        has_correction: !!correction,
        correction_reason: correction?.correction_reason || null,
        corrected_at: correction?.corrected_at || null,
        // Keep original speaker separate
        original_speaker: segment.speaker,
      };
    });

    return segments as TranscriptSegment[];
  } catch (error) {
    console.error('[Speech] Database error fetching transcripts:', error);
    throw error;
  }
}

/**
 * Get full transcript text for a call
 */
export async function getFullTranscript(callId: string): Promise<string> {
  const segments = await getTranscriptSegments(callId, true); // Final only
  return segments.map(s => s.text).join(' ');
}

/**
 * Delete all transcript segments for a call
 * (Used for testing or call cleanup)
 */
export async function deleteTranscriptSegments(callId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('transcript_segments')
      .delete()
      .eq('call_id', callId);

    if (error) {
      console.error('[Speech] Failed to delete transcript segments:', error);
      throw new Error(`Failed to delete transcripts: ${error.message}`);
    }
  } catch (error) {
    console.error('[Speech] Database error deleting transcripts:', error);
    throw error;
  }
}

// =====================================================
// Session Validation
// =====================================================

/**
 * Verify that a call exists and is in_progress
 */
export async function validateCallForStreaming(callId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('calls')
      .select('id, status')
      .eq('id', callId)
      .single();

    if (error || !data) {
      console.error('[Speech] Call not found:', callId);
      return false;
    }

    if (data.status !== 'in_progress') {
      console.error('[Speech] Call is not in progress:', callId);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Speech] Error validating call:', error);
    return false;
  }
}

// =====================================================
// Exports
// =====================================================

export { getAssemblyClient };
