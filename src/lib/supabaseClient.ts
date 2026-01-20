import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const missingVars: string[] = [];
if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY');

if (missingVars.length > 0) {
  const message = `Supabase env vars missing: ${missingVars.join(', ')}. Check .env.local or Vercel env.`;
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error(message);
  }
  throw new Error(message);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

if (import.meta.env.DEV) {
  const maskedUrl = supabaseUrl.slice(0, 6) + '***';
  const anonLen = supabaseAnonKey.length;
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
