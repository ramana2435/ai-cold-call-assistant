-- =====================================================
-- Migration 003: Product and Organization Knowledge Profiles
-- =====================================================
-- Created: Phase 2 - Product & Organization Knowledge
-- Description: Stores reusable product and organization profiles
--              for contextualizing AI suggestions during calls
-- 
-- IMPORTANT: Execute this in Supabase SQL Editor
--            This extends existing schema without breaking changes
-- =====================================================

-- =====================================================
-- Table: product_profiles
-- =====================================================
-- Stores reusable product knowledge for AI contextualization
CREATE TABLE IF NOT EXISTS product_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  product_name VARCHAR(255) NOT NULL,
  short_description TEXT,
  detailed_explanation TEXT,
  
  -- Problem and Solution
  problems_solved JSONB DEFAULT '[]', -- Array of problem strings
  features JSONB DEFAULT '[]', -- Array of feature objects {name, description}
  benefits JSONB DEFAULT '[]', -- Array of benefit strings
  use_cases JSONB DEFAULT '[]', -- Array of use case strings
  
  -- Commercial Information
  pricing_model TEXT,
  technical_requirements TEXT,
  product_limitations TEXT,
  
  -- Sales Enablement
  common_objections JSONB DEFAULT '[]', -- Array of {objection, response}
  ideal_customer_profile TEXT,
  supported_industries JSONB DEFAULT '[]', -- Array of industry names
  unsupported_industries JSONB DEFAULT '[]', -- Array of industry names
  
  -- Visual Assets (references to external URLs or paths)
  image_references JSONB DEFAULT '[]', -- Array of {type, url, description}
  
  -- Call to Action
  preferred_cta TEXT,
  preferred_next_steps TEXT,
  
  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT product_name_not_empty CHECK (product_name <> ''),
  CONSTRAINT valid_problems_solved CHECK (jsonb_typeof(problems_solved) = 'array'),
  CONSTRAINT valid_features CHECK (jsonb_typeof(features) = 'array'),
  CONSTRAINT valid_benefits CHECK (jsonb_typeof(benefits) = 'array'),
  CONSTRAINT valid_use_cases CHECK (jsonb_typeof(use_cases) = 'array'),
  CONSTRAINT valid_common_objections CHECK (jsonb_typeof(common_objections) = 'array'),
  CONSTRAINT valid_supported_industries CHECK (jsonb_typeof(supported_industries) = 'array'),
  CONSTRAINT valid_unsupported_industries CHECK (jsonb_typeof(unsupported_industries) = 'array'),
  CONSTRAINT valid_image_references CHECK (jsonb_typeof(image_references) = 'array')
);

-- Indexes for product_profiles
CREATE INDEX IF NOT EXISTS idx_product_profiles_active ON product_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_product_profiles_name ON product_profiles(product_name);
CREATE INDEX IF NOT EXISTS idx_product_profiles_created_at ON product_profiles(created_at DESC);

-- =====================================================
-- Table: organization_profiles
-- =====================================================
-- Stores information about target organizations/prospects
CREATE TABLE IF NOT EXISTS organization_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organization Information
  organization_name VARCHAR(255) NOT NULL,
  website VARCHAR(500),
  industry VARCHAR(255),
  organization_type VARCHAR(255), -- e.g., "startup", "mid-size private", "listed company"
  company_size VARCHAR(100), -- e.g., "10-50", "500+", "unknown"
  
  -- Contact Information
  prospect_name VARCHAR(255),
  prospect_role VARCHAR(255),
  is_decision_maker BOOLEAN,
  
  -- Business Context
  business_challenges TEXT,
  potential_use_cases TEXT,
  organization_notes TEXT,
  
  -- Data Quality
  information_source VARCHAR(255), -- e.g., "website", "LinkedIn", "first call", "research"
  confidence_level VARCHAR(50), -- e.g., "high", "medium", "low", "unverified"
  
  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_contacted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT org_name_not_empty CHECK (organization_name <> '')
);

-- Indexes for organization_profiles
CREATE INDEX IF NOT EXISTS idx_organization_profiles_active ON organization_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_organization_profiles_name ON organization_profiles(organization_name);
CREATE INDEX IF NOT EXISTS idx_organization_profiles_industry ON organization_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_organization_profiles_created_at ON organization_profiles(created_at DESC);

-- =====================================================
-- Table: call_knowledge_snapshots
-- =====================================================
-- Stores immutable snapshots of product/org knowledge used for each call
-- This preserves historical context even when profiles are edited later
CREATE TABLE IF NOT EXISTS call_knowledge_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  
  -- References to profiles used (nullable - call may not use profiles)
  product_profile_id UUID REFERENCES product_profiles(id) ON DELETE SET NULL,
  organization_profile_id UUID REFERENCES organization_profiles(id) ON DELETE SET NULL,
  
  -- Immutable snapshots of knowledge at time of call
  product_snapshot JSONB, -- Full product_profile data at time of use
  organization_snapshot JSONB, -- Full organization_profile data at time of use
  
  -- Metadata
  snapshot_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT one_snapshot_per_call UNIQUE (call_id),
  CONSTRAINT product_snapshot_valid CHECK (
    product_snapshot IS NULL OR jsonb_typeof(product_snapshot) = 'object'
  ),
  CONSTRAINT organization_snapshot_valid CHECK (
    organization_snapshot IS NULL OR jsonb_typeof(organization_snapshot) = 'object'
  )
);

-- Indexes for call_knowledge_snapshots
CREATE INDEX IF NOT EXISTS idx_call_knowledge_snapshots_call_id ON call_knowledge_snapshots(call_id);
CREATE INDEX IF NOT EXISTS idx_call_knowledge_snapshots_product ON call_knowledge_snapshots(product_profile_id);
CREATE INDEX IF NOT EXISTS idx_call_knowledge_snapshots_org ON call_knowledge_snapshots(organization_profile_id);

-- =====================================================
-- Trigger: Update updated_at timestamp
-- =====================================================
-- Reuse existing function, create triggers for new tables

DROP TRIGGER IF EXISTS update_product_profiles_updated_at ON product_profiles;
CREATE TRIGGER update_product_profiles_updated_at
  BEFORE UPDATE ON product_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organization_profiles_updated_at ON organization_profiles;
CREATE TRIGGER update_organization_profiles_updated_at
  BEFORE UPDATE ON organization_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================
-- Enable RLS consistent with existing tables
-- Backend service-role key bypasses RLS (correct behavior)

ALTER TABLE product_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_knowledge_snapshots ENABLE ROW LEVEL SECURITY;

-- NO POLICIES DEFINED (consistent with calls and call_stage_results)
-- All access must go through Express backend API

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE product_profiles IS 
  'Reusable product knowledge profiles for AI contextualization during calls';
COMMENT ON TABLE organization_profiles IS 
  'Target organization and prospect information for call preparation';
COMMENT ON TABLE call_knowledge_snapshots IS 
  'Immutable snapshots of product and organization knowledge used for each call';

COMMENT ON COLUMN product_profiles.common_objections IS 
  'Array of {objection: string, response: string} objects';
COMMENT ON COLUMN product_profiles.features IS 
  'Array of {name: string, description: string} objects';
COMMENT ON COLUMN product_profiles.image_references IS 
  'Array of {type: string, url: string, description: string} objects';

COMMENT ON COLUMN organization_profiles.confidence_level IS 
  'Data quality indicator: high, medium, low, or unverified';
COMMENT ON COLUMN organization_profiles.is_decision_maker IS 
  'NULL = unknown, true = confirmed decision maker, false = not decision maker';

COMMENT ON COLUMN call_knowledge_snapshots.product_snapshot IS 
  'Full product profile JSON at time of call creation (immutable)';
COMMENT ON COLUMN call_knowledge_snapshots.organization_snapshot IS 
  'Full organization profile JSON at time of call creation (immutable)';

-- =====================================================
-- Verification Queries
-- =====================================================
-- Run these after migration to verify:

-- 1. Check tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('product_profiles', 'organization_profiles', 'call_knowledge_snapshots');

-- 2. Check indexes exist
-- SELECT tablename, indexname FROM pg_indexes 
-- WHERE tablename IN ('product_profiles', 'organization_profiles', 'call_knowledge_snapshots');

-- 3. Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE tablename IN ('product_profiles', 'organization_profiles', 'call_knowledge_snapshots');

-- =====================================================
-- Rollback Instructions
-- =====================================================
-- If you need to rollback this migration:
-- DROP TABLE IF EXISTS call_knowledge_snapshots CASCADE;
-- DROP TABLE IF EXISTS organization_profiles CASCADE;
-- DROP TABLE IF EXISTS product_profiles CASCADE;
