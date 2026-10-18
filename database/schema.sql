-- =====================================================
-- AI Cold-Call Assistant Database Schema
-- =====================================================
-- This schema supports the 8-stage cold-call process
-- Stages: Opening, Purpose, Permission, Their business,
--         Their need in their words, Objection, 
--         Next step, Close
--
-- SECURITY:
-- - Row Level Security (RLS) enabled on all tables
-- - Backend uses service-role key (bypasses RLS)
-- - No public/anon access policies defined
-- - All data access must go through Express backend
-- =====================================================

-- Create custom types for enums (idempotent)
DO $$ BEGIN
  CREATE TYPE call_status AS ENUM ('in_progress', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE call_outcome AS ENUM (
    'next_step_agreed',
    'agreed_to_receive_report',
    'interested',
    'follow_up',
    'call_again',
    'not_interested',
    'do_not_call',
    'wrong_person',
    'moved_company',
    'not_logged'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE stage_name AS ENUM (
    'Opening',
    'Purpose',
    'Permission',
    'Their business',
    'Their need, in their words',
    'Objection',
    'Next step',
    'Close'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- Table: calls
-- =====================================================
-- Stores high-level call information
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Prospect information
  prospect_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  prospect_role VARCHAR(255),
  call_context VARCHAR(100), -- e.g., 'first call', 'follow-up', 'second attempt'
  
  -- Call progress tracking
  current_stage_number INTEGER NOT NULL DEFAULT 1 CHECK (current_stage_number BETWEEN 1 AND 8),
  current_stage_name stage_name NOT NULL DEFAULT 'Opening',
  reached_stage_number INTEGER NOT NULL DEFAULT 1 CHECK (reached_stage_number BETWEEN 1 AND 8),
  reached_stage_name stage_name NOT NULL DEFAULT 'Opening',
  
  -- Call status and outcome
  status call_status NOT NULL DEFAULT 'in_progress',
  outcome call_outcome,
  
  -- Notes and next actions
  prospect_key_words TEXT, -- Key words/phrases from prospect
  agreed_next_action TEXT, -- e.g., "Send report on WhatsApp, call Tuesday 3PM"
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_closed_call CHECK (
    (status = 'closed' AND closed_at IS NOT NULL AND outcome IS NOT NULL) OR
    (status = 'in_progress' AND closed_at IS NULL)
  )
);

-- Create indexes for common queries (idempotent)
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_outcome ON calls(outcome) WHERE outcome IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calls_prospect_name ON calls(prospect_name);
CREATE INDEX IF NOT EXISTS idx_calls_company_name ON calls(company_name);

-- =====================================================
-- Table: call_stage_results
-- =====================================================
-- Stores results/events for each stage progression
CREATE TABLE IF NOT EXISTS call_stage_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  
  -- Stage identification
  stage_number INTEGER NOT NULL CHECK (stage_number BETWEEN 1 AND 8),
  stage_name stage_name NOT NULL,
  
  -- What happened at this stage (multiple selections allowed)
  quick_tap_events JSONB NOT NULL DEFAULT '[]', -- Array of selected event strings
  
  -- Prospect's exact words
  prospect_words TEXT, -- Verbatim quote from prospect at this stage
  
  -- Additional notes
  stage_notes TEXT, -- Optional additional context
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_stage_data CHECK (
    jsonb_typeof(quick_tap_events) = 'array'
  )
);

-- Create indexes for stage results (idempotent)
CREATE INDEX IF NOT EXISTS idx_stage_results_call_id ON call_stage_results(call_id);
CREATE INDEX IF NOT EXISTS idx_stage_results_stage_number ON call_stage_results(stage_number);
CREATE INDEX IF NOT EXISTS idx_stage_results_created_at ON call_stage_results(created_at DESC);

-- Composite index for fetching all stages of a call in order
CREATE INDEX IF NOT EXISTS idx_stage_results_call_stage ON call_stage_results(call_id, stage_number);

-- =====================================================
-- Trigger: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop and recreate to ensure it's up to date)
DROP TRIGGER IF EXISTS update_calls_updated_at ON calls;
CREATE TRIGGER update_calls_updated_at
  BEFORE UPDATE ON calls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE calls IS 'Stores high-level information for each cold call';
COMMENT ON TABLE call_stage_results IS 'Stores detailed results and events for each stage of a call';

COMMENT ON COLUMN calls.current_stage_number IS 'The stage the salesperson is currently on (1-8)';
COMMENT ON COLUMN calls.reached_stage_number IS 'The furthest stage reached before call ended';
COMMENT ON COLUMN calls.prospect_key_words IS 'Key words or phrases captured from the prospect';
COMMENT ON COLUMN calls.agreed_next_action IS 'Next action agreed upon (e.g., meeting time, follow-up date)';

COMMENT ON COLUMN call_stage_results.quick_tap_events IS 'Array of selected quick-tap choices (e.g., ["Asked what we do", "Said make it quick"])';
COMMENT ON COLUMN call_stage_results.prospect_words IS 'Verbatim quote from prospect at this stage, especially important for Stage 5 (Their need)';

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================
-- Enable RLS on both tables to prevent unauthorized access
-- The backend service-role key bypasses RLS (correct behavior)
-- No public policies are defined - all access MUST go through backend

-- Enable RLS on calls table
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Enable RLS on call_stage_results table
ALTER TABLE call_stage_results ENABLE ROW LEVEL SECURITY;

-- NO POLICIES DEFINED
-- This means:
-- - Service role key (backend): FULL ACCESS (bypasses RLS)
-- - Anon key (if exposed): NO ACCESS
-- - Authenticated users (if auth added): NO ACCESS
-- All client access must go through Express backend API

-- =====================================================
-- Security Notes
-- =====================================================
-- 1. RLS is enabled but no policies exist
-- 2. Backend uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS)
-- 3. Never expose service-role key to frontend
-- 4. If frontend needs direct access later, create explicit policies
-- 5. Current architecture: Backend-only access (correct)

-- =====================================================
-- Sample data (optional, for testing)
-- =====================================================
-- Uncomment to insert sample call data for testing

/*
INSERT INTO calls (
  prospect_name, 
  company_name, 
  prospect_role, 
  call_context,
  current_stage_number,
  current_stage_name,
  reached_stage_number,
  reached_stage_name,
  status
) VALUES (
  'Dr. Anjali Menon',
  'Menon Family Clinic',
  'Owner',
  'first call',
  2,
  'Purpose',
  2,
  'Purpose',
  'in_progress'
);
*/
