-- =====================================================
-- Migration 003 Fix: Grant Permissions for Knowledge Profiles
-- =====================================================
-- Purpose: Grant necessary permissions to service role for knowledge profile tables
-- Context: RLS is enabled but service role needs explicit grants to bypass
--
-- Execute this AFTER running 003_knowledge_profiles.sql
-- =====================================================

-- Grant all privileges to authenticated role (backend service role)
GRANT ALL ON product_profiles TO authenticated;
GRANT ALL ON organization_profiles TO authenticated;
GRANT ALL ON call_knowledge_snapshots TO authenticated;

-- Grant usage on sequences (for auto-generated IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant select to anon role (if needed for public read access)
-- Uncomment these if you want anonymous read access:
-- GRANT SELECT ON product_profiles TO anon;
-- GRANT SELECT ON organization_profiles TO anon;

-- Verify grants
-- Run this to confirm grants are in place:
-- SELECT 
--   table_name,
--   grantee,
--   privilege_type
-- FROM information_schema.table_privileges
-- WHERE table_name IN ('product_profiles', 'organization_profiles', 'call_knowledge_snapshots')
-- ORDER BY table_name, grantee, privilege_type;
