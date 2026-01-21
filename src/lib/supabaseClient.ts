import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const missingVars: string[] = [];
if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY');

export const supabaseConfigError =
  missingVars.length > 0
    ? `Supabase env vars missing: ${missingVars.join(', ')}. Check .env.local or Vercel env.`
    : null;
export const supabaseConfigured = missingVars.length === 0;

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    })
  : null;

export const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? 'Supabase is not configured.');
  }
  return supabase;
};

if (import.meta.env.DEV) {
  if (supabaseConfigError) {
    // eslint-disable-next-line no-console
    console.error(supabaseConfigError);
  }
  if (supabase) {
    const maskedUrl = supabaseUrl!.slice(0, 6) + '***';
    const anonLen = supabaseAnonKey!.length;
    // eslint-disable-next-line no-console
    console.info(
      'Supabase config',
      JSON.stringify({
        configured: true,
        project: maskedUrl,
        anonLength: anonLen,
        authClient: Boolean(supabase),
      }),
    );
  }
}
