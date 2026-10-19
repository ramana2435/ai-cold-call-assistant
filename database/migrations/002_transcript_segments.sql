-- =====================================================
-- Migration 002: transcript_segments table
-- =====================================================
-- Created: Module 1 Speech-to-Text MVP
-- Description: Stores real-time speech-to-text transcript segments
--              Linked to existing calls table with cascade delete
-- 
-- IMPORTANT: Execute this in Supabase SQL Editor
--            This adds speech transcription to existing schema
-- =====================================================

-- =====================================================
-- Table: transcript_segments
-- =====================================================
-- Stores real-time transcript segments from speech-to-text
CREATE TABLE IF NOT EXISTS transcript_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  
  -- Transcript content
  text TEXT NOT NULL,
  speaker VARCHAR(20), -- NULL = unknown, 'salesperson', 'prospect' (future use)
  
  -- Confidence and timing
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  start_time NUMERIC, -- seconds from call start (not available in real-time)
  end_time NUMERIC, -- seconds from call start (not available in real-time)
  
  -- Finalization status
  is_final BOOLEAN NOT NULL DEFAULT false, -- true = finalized, false = partial
  
  -- Language detection (future use)
  language VARCHAR(10), -- e.g., 'en', 'te', 'en-US'
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_timing CHECK (
    (start_time IS NULL AND end_time IS NULL) OR
    (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time >= start_time)
  )
);

-- =====================================================
-- Indexes for transcript_segments
-- =====================================================
-- Optimize for common query patterns

-- Index for fetching all transcripts for a call
CREATE INDEX IF NOT EXISTS idx_transcript_segments_call_id 
  ON transcript_segments(call_id);k

-- Index for filtering by finalization status
CREATE INDEX IF NOT EXISTS idx_transcript_segments_is_final 
  ON transcript_segments(is_final);

-- Index for chronological queries
CREATE INDEX IF NOT EXISTS idx_transcript_segments_created_at 
  ON transcript_segments(created_at DESC);

-- Composite index for fetching call transcripts in chronological order
CREATE INDEX IF NOT EXISTS idx_transcript_segments_call_time 
  ON transcript_segments(call_id, start_time NULLS LAST, created_at);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================
-- Enable RLS consistent with existing tables
-- Backend service-role key bypasses RLS (correct behavior)
-- No public access policies defined

ALTER TABLE transcript_segments ENABLE ROW LEVEL SECURITY;

-- NO POLICIES DEFINED (consistent with calls and call_stage_results)
-- This means:
-- - Service role key (backend): FULL ACCESS (bypasses RLS)
-- - Anon key: NO ACCESS
-- - All access must go through Express backend API

-- =====================================================
-- Table and Column Comments
-- =====================================================
COMMENT ON TABLE transcript_segments IS 
  'Real-time speech-to-text transcript segments with timing and speaker identification';

COMMENT ON COLUMN transcript_segments.is_final IS 
  'False for partial/interim results, true for finalized transcript';

COMMENT ON COLUMN transcript_segments.speaker IS 
  'Speaker identification. NULL = unknown. Real-time API does not support speaker diarization.';

COMMENT ON COLUMN transcript_segments.confidence IS 
  'Speech recognition confidence score between 0 and 1 from AssemblyAI';

COMMENT ON COLUMN transcript_segments.text IS 
  'Transcript text. Partial results may be incomplete sentences. Final results are complete.';

COMMENT ON COLUMN transcript_segments.start_time IS 
  'Start time in seconds from call start. NULL for real-time transcripts (timing not available).';

COMMENT ON COLUMN transcript_segments.end_time IS 
  'End time in seconds from call start. NULL for real-time transcripts (timing not available).';

-- =====================================================
-- Verification Queries
-- =====================================================
-- Run these after migration to verify:

-- 1. Check table exists
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'transcript_segments';

-- 2. Check indexes exist
-- SELECT indexname FROM pg_indexes 
-- WHERE tablename = 'transcript_segments';

-- 3. Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE tablename = 'transcript_segments';

-- 4. Test insert (replace with actual call_id)
-- INSERT INTO transcript_segments (call_id, text, is_final, speaker, confidence)
-- VALUES ('your-call-id-here', 'Test transcript', true, NULL, 0.95);

-- =====================================================
-- Rollback Instructions
-- =====================================================
-- If you need to rollback this migration:
-- DROP TABLE IF EXISTS transcript_segments CASCADE;

