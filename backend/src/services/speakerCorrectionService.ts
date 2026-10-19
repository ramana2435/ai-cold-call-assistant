// =====================================================
// Speaker Correction Service
// =====================================================
// Manages manual corrections to speaker labels

import { getSupabaseClient } from '../db/supabase';

const supabase = getSupabaseClient();

export interface SpeakerCorrection {
  id: string;
  call_id: string;
  segment_id: string;
  original_speaker: string | null;
  corrected_speaker: string;
  correction_reason: string | null;
  corrected_at: string;
}

/**
 * Save or update a speaker correction for a segment
 * Uses upsert to handle both create and update cases
 */
export async function saveSpeakerCorrection(
  callId: string,
  segmentId: string,
  correctedSpeaker: 'salesperson' | 'prospect' | 'unknown',
  correctionReason?: string
): Promise<SpeakerCorrection> {
  try {
    // First, get the current speaker from the segment
    const { data: segment, error: segmentError } = await supabase
      .from('transcript_segments')
      .select('speaker, call_id')
      .eq('id', segmentId)
      .single();

    if (segmentError) {
      throw new Error(`Segment not found: ${segmentError.message}`);
    }

    // Verify segment belongs to the specified call
    if (segment.call_id !== callId) {
      throw new Error('Segment does not belong to the specified call');
    }

    // Upsert the correction (insert or update if exists)
    const { data, error } = await supabase
      .from('speaker_corrections')
      .upsert(
        {
          call_id: callId,
          segment_id: segmentId,
          original_speaker: segment.speaker,
          corrected_speaker: correctedSpeaker,
          correction_reason: correctionReason || null,
          corrected_at: new Date().toISOString(),
        },
        {
          onConflict: 'segment_id', // UNIQUE constraint on segment_id
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[SpeakerCorrection] Failed to save correction:', {
        code: error.code,
        message: error.message,
        details: error.details,
      });
      throw new Error(`Failed to save correction: ${error.message}`);
    }

    console.log(`[SpeakerCorrection] Saved correction for segment ${segmentId}: ${segment.speaker} → ${correctedSpeaker}`);
    return data as SpeakerCorrection;
  } catch (error: any) {
    console.error('[SpeakerCorrection] Error saving correction:', error);
    throw error;
  }
}

/**
 * Get all speaker corrections for a call
 */
export async function getSpeakerCorrections(callId: string): Promise<SpeakerCorrection[]> {
  try {
    const { data, error } = await supabase
      .from('speaker_corrections')
      .select('*')
      .eq('call_id', callId)
      .order('corrected_at', { ascending: false });

    if (error) {
      console.error('[SpeakerCorrection] Failed to fetch corrections:', error);
      throw new Error(`Failed to fetch corrections: ${error.message}`);
    }

    return (data || []) as SpeakerCorrection[];
  } catch (error: any) {
    console.error('[SpeakerCorrection] Error fetching corrections:', error);
    throw error;
  }
}

/**
 * Get speaker correction for a specific segment (if it exists)
 */
export async function getSpeakerCorrectionForSegment(
  segmentId: string
): Promise<SpeakerCorrection | null> {
  try {
    const { data, error } = await supabase
      .from('speaker_corrections')
      .select('*')
      .eq('segment_id', segmentId)
      .maybeSingle(); // Returns null if not found instead of error

    if (error) {
      console.error('[SpeakerCorrection] Failed to fetch correction:', error);
      throw new Error(`Failed to fetch correction: ${error.message}`);
    }

    return data as SpeakerCorrection | null;
  } catch (error: any) {
    console.error('[SpeakerCorrection] Error fetching correction:', error);
    throw error;
  }
}

/**
 * Delete a speaker correction (revert to automatic assignment)
 */
export async function deleteSpeakerCorrection(segmentId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('speaker_corrections')
      .delete()
      .eq('segment_id', segmentId);

    if (error) {
      console.error('[SpeakerCorrection] Failed to delete correction:', error);
      throw new Error(`Failed to delete correction: ${error.message}`);
    }

    console.log(`[SpeakerCorrection] Deleted correction for segment ${segmentId}`);
  } catch (error: any) {
    console.error('[SpeakerCorrection] Error deleting correction:', error);
    throw error;
  }
}
