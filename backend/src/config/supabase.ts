import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';
import { UnauthorizedError } from '../utils/errors';

let _adminClient: SupabaseClient | null = null;

/** Supabase admin client (service role) — bypasses RLS. Use only server-side. */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_adminClient) {
    _adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _adminClient;
}

export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

/**
 * Verifies a Supabase JWT and returns the authenticated user.
 * Throws UnauthorizedError if the token is missing, invalid, or expired.
 */
export async function verifySupabaseToken(token: string): Promise<SupabaseUser> {
  if (!token) {
    throw new UnauthorizedError('No authentication token provided');
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new UnauthorizedError('Invalid or expired authentication token');
  }

  return {
    id: data.user.id,
    email: data.user.email,
    user_metadata: data.user.user_metadata,
  };
}
