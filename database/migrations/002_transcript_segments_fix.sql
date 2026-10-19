-- =====================================================
-- Migration 002 Fix: Grant Permissions for transcript_segments
-- =====================================================
-- Created: Critical Fix for Permission Error 42501
-- Description: Adds missing GRANT statements to allow service_role
--              to INSERT and SELECT transcript_segments
-- 
-- IMPORTANT: Execute this in Supabase SQL Editor IMMEDIATELY
--            This fixes "permission denied for table transcript_segments"
-- =====================================================

-- =====================================================
-- Grant Table Permissions
-- =====================================================
-- Service role needs full access (backend operations)
-- postgres role is the superuser/owner
-- authenticated role may be needed for future features

GRANT SELECT, INSERT, UPDATE, DELETE ON transcript_segments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON transcript_segments TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON transcript_segments TO authenticated;

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this after applying the grants to verify:
-- 
-- SELECT table_name, grantee, privilege_type
-- FROM information_schema.table_privileges
-- WHERE table_name = 'transcript_segments'
--   AND grantee IN ('postgres', 'authenticated', 'service_role')
-- ORDER BY grantee, privilege_type;
--
-- Expected output should show SELECT, INSERT, UPDATE, DELETE
-- for all three roles (postgres, authenticated, service_role)

-- =====================================================
-- Notes
-- =====================================================
-- This migration is safe to run multiple times (idempotent)
-- Row Level Security (RLS) is already enabled on the table
-- Service role bypasses RLS but still needs table-level grants
