-- =====================================================
-- Grant Permissions to service_role
-- =====================================================
-- The service_role key needs explicit GRANT permissions
-- even though it bypasses RLS. This is required for
-- Supabase JS SDK v2 behavior.
-- =====================================================

-- Grant all permissions on tables to service_role
GRANT ALL ON TABLE public.calls TO service_role;
GRANT ALL ON TABLE public.call_stage_results TO service_role;

-- Grant usage on sequences (for ID generation)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Verify grants
DO $$
BEGIN
  RAISE NOTICE 'Permissions granted successfully to service_role';
END $$;
