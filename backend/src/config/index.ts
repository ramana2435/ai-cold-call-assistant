import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
  cors: {
    origins: string[];
  };
  gemini: {
    apiKey: string;
    model: string;
  };
  groq: {
    apiKey: string;
  };
  ai: {
    provider: 'auto' | 'gemini' | 'groq';
    fallbackEnabled: boolean;
  };
  assemblyai: {
    apiKey: string;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:5173'],
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
  },
  ai: {
    provider: (process.env.AI_PROVIDER as 'auto' | 'gemini' | 'groq') || 'auto',
    fallbackEnabled: process.env.AI_FALLBACK_ENABLED !== 'false',
  },
  assemblyai: {
    apiKey: process.env.ASSEMBLYAI_API_KEY || '',
  },
};

// Validate required environment variables
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.supabase.url) {
    errors.push('SUPABASE_URL is required');
  }

  if (!config.supabase.serviceRoleKey) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is required');
  }

  if (!config.gemini.apiKey) {
    errors.push('GEMINI_API_KEY is required');
  }

  // Warn if Groq is not configured (but don't fail validation)
  if (!config.groq.apiKey && config.nodeEnv === 'development') {
    console.warn('[Config] Warning: GROQ_API_KEY not configured. Dual-provider support disabled.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default config;
