import { createClient, SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';
import config from '../config';

// Database client singleton
let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create Supabase client
 * Uses service role key for backend operations
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const { url, serviceRoleKey } = config.supabase;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase configuration is missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file.'
    );
  }

  supabaseClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      transport: ws as any,
    },
  });

  return supabaseClient;
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const client = getSupabaseClient();
    
    // Simple query to test connection
    const { error } = await client.from('calls').select('id').limit(1);

    if (error) {
      return {
        connected: false,
        error: error.message,
      };
    }

    return { connected: true };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Close database connection (for testing)
 */
export function closeConnection(): void {
  supabaseClient = null;
}
