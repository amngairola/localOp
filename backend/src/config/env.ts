import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),

  // Database (Supabase / PostgreSQL)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),

  // Supabase
  SUPABASE_URL: z.string().min(1, 'SUPABASE_URL is required'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // Upstash Redis (Optional / Graceful Degradation)
  REDIS_URL: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // AI Providers (Configurable models)
  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required'),
  GROQ_MODEL: z.string().default('llama-3.3-70b-versatile'),

  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),

  // CORS
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Optional notification providers
  RESEND_API_KEY: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),

  // Optional JWT secret
  JWT_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function validateEnv(): Env {
  // Support backward compatibility for GEMINI_API_KEY if GOOGLE_AI_API_KEY was passed
  const rawEnv = {
    ...process.env,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '',
    REDIS_URL: process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || undefined,
  };

  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`❌ Invalid environment variables:\n${formatted}`);
  }

  _env = result.data;
  return _env;
}

export function getEnv(): Env {
  if (!_env) {
    return validateEnv();
  }
  return _env;
}

export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    return getEnv()[prop as keyof Env];
  },
});
