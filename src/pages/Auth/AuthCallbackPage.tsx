import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { supabase, supabaseConfigError } from '../../lib/supabaseClient';

const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) {
      return;
    }
    const client = supabase;
    const handleCallback = async () => {
      // getSession will pick up tokens from URL when detectSessionInUrl is true
      await client.auth.getSession();
      navigate('/', { replace: true });
    };
    handleCallback();
  }, [navigate]);

  if (!supabase) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-subtle to-white px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl shadow-brand-primary/10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-primary/70">Pups & Rec</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Supabase not configured</h1>
          <p className="mt-3 text-sm text-slate-600">
            {supabaseConfigError ?? 'Missing Supabase environment variables.'}
          </p>
          <Link
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary/90"
            to="/login"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return <LoadingScreen />;
};

export default AuthCallbackPage;
