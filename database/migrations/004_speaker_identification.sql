-- =====================================================
-- Migration 004: Speaker Identification Enhancement
-- =====================================================
-- Created: Phase 3A - Basic Speaker Diarization
-- Description: Adds speaker identification fields to transcript_segments
--              Tracks raw AssemblyAI labels, inferred roles, and confidence
-- 
-- IMPORTANT: Execute this in Supabase SQL Editor
--            This extends existing transcript_segments table
-- =====================================================

-- =====================================================
-- Add Speaker Identification Columns
-- =====================================================

-- Raw speaker label from AssemblyAI (e.g., "A", "B", "C")
ALTER TABLE transcript_segments
  ADD COLUMN IF NOT EXISTS assemblyai_speaker_label VARCHAR(20);

-- Speaker identification confidence (0.0 to 1.0)
ALTER TABLE transcript_segments
  ADD COLUMN IF NOT EXISTS speaker_confidence NUMERIC(4,3) 
    CHECK (speaker_confidence IS NULL OR (speaker_confidence >= 0 AND speaker_confidence <= 1));

-- Algorithm used for speaker identification
ALTER TABLE transcript_segments
  ADD COLUMN IF NOT EXISTS speaker_algorithm VARCHAR(20);

COMMENT ON COLUMN transcript_segments.assemblyai_speaker_label IS
  'Raw speaker label from AssemblyAI streaming API (e.g., "A", "B"). Preserved for reference.';

COMMENT ON COLUMN transcript_segments.speaker_confidence IS
  'Confidence score (0-1) for the inferred speaker role. Higher = more certain.';

COMMENT ON COLUMN transcript_segments.speaker_algorithm IS
  'Algorithm used: "turn-order" (heuristic), "assemblyai" (direct), or "combined"';

-- Update existing comment for speaker column
COMMENT ON COLUMN transcript_segments.speaker IS
  'Inferred speaker role: "salesperson", "prospect", or NULL (unknown). May be manually corrected.';

-- =====================================================
-- Speaker Corrections Table
-- =====================================================
-- Tracks manual corrections to speaker labels

CREATE TABLE IF NOT EXISTS speaker_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES transcript_segments(id) ON DELETE CASCADE,
  
  -- Original and corrected values
  original_speaker VARCHAR(20),
  corrected_speaker VARCHAR(20) NOT NULL,
  
  -- Optional reason for correction
  correction_reason TEXT,
  
  -- Timestamp
  corrected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_corrected_speaker CHECK (
    corrected_speaker IN ('salesperson', 'prospect', 'unknown')
  ),
  CONSTRAINT unique_segment_correction UNIQUE (segment_id)
);

-- =====================================================
-- Indexes for speaker_corrections
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_speaker_corrections_call_id 
  ON speaker_corrections(call_id);

CREATE INDEX IF NOT EXISTS idx_speaker_corrections_segment_id 
  ON speaker_corrections(segment_id);

CREATE INDEX IF NOT EXISTS idx_speaker_corrections_corrected_at 
  ON speaker_corrections(corrected_at DESC);

-- =====================================================
-- Row Level Security
-- =====================================================

ALTER TABLE speaker_corrections ENABLE ROW LEVEL SECURITY;

-- Grant permissions (consistent with other tables)
GRANT ALL ON speaker_corrections TO postgres;
GRANT ALL ON speaker_corrections TO authenticated;
GRANT ALL ON speaker_corrections TO service_role;

-- =====================================================
-- Table Comments
-- =====================================================

COMMENT ON TABLE speaker_corrections IS
  'Manual corrections to speaker labels. Allows users to override automatic identification.';

COMMENT ON COLUMN speaker_corrections.original_speaker IS
  'The speaker label before correction (for audit trail)';

COMMENT ON COLUMN speaker_corrections.corrected_speaker IS
  'The corrected speaker label: salesperson, prospect, or unknown';

-- =====================================================
-- Verification Queries
-- =====================================================
-- Run these after migration to verify:

-- 1. Check new columns exist
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'transcript_segments' 
--   AND column_name IN ('assemblyai_speaker_label', 'speaker_confidence', 'speaker_algorithm');

-- 2. Check speaker_corrections table exists
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'speaker_corrections';

-- 3. Check grants
-- SELECT table_name, grantee, privilege_type
-- FROM information_schema.table_privileges
-- WHERE table_name = 'speaker_corrections'
--   AND grantee IN ('postgres', 'authenticated', 'service_role')
-- ORDER BY grantee, privilege_type;

-- =====================================================
-- Rollback Instructions
-- =====================================================
-- If you need to rollback this migration:

-- DROP TABLE IF EXISTS speaker_corrections CASCADE;
-- ALTER TABLE transcript_segments 
--   DROP COLUMN IF EXISTS assemblyai_speaker_label,
--   DROP COLUMN IF EXISTS speaker_confidence,
--   DROP COLUMN IF EXISTS speaker_algorithm;
