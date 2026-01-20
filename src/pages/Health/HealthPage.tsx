import { useEffect, useState } from 'react';

import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

type ProbeResult =
  | { status: 'idle' | 'loading' }
  | { status: 'ok'; count: number }
  | { status: 'error'; message: string };

export const HealthPage = () => {
  const { user, isAuthReady } = useAuth();
  const [probe, setProbe] = useState<ProbeResult>({ status: 'idle' });
  const envLoaded = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  const clientInit = Boolean(supabase);

  useEffect(() => {
    let active = true;
    const runProbe = async () => {
      setProbe({ status: 'loading' });
      const { count, error } = await supabase.from('pets').select('id', { count: 'exact', head: true }).limit(1);
      if (!active) return;
      if (error) {
        setProbe({ status: 'error', message: error.message });
        return;
      }
      setProbe({ status: 'ok', count: count ?? 0 });
    };
    runProbe();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-3 p-6">
      <h1 className="text-xl font-semibold text-brand-primary">Health</h1>
      <div className="rounded-2xl border border-brand-border bg-white p-4 text-sm text-brand-primary">
        <p>
          Env loaded: <strong>{String(envLoaded)}</strong>
        </p>
        <p>
          Supabase client initialized: <strong>{String(clientInit)}</strong>
        </p>
        <p>
          Auth ready: <strong>{String(isAuthReady)}</strong>
        </p>
        <p>
          User: <strong>{user ? `${user.email} (${user.id.slice(0, 8)}…)` : 'none'}</strong>
        </p>
      </div>
      <div className="rounded-2xl border border-brand-border bg-white p-4 text-sm text-brand-primary">
        <p className="font-semibold">Supabase connectivity</p>
        {probe.status === 'loading' && <p>Checking…</p>}
        {probe.status === 'ok' && <p>OK. Pets count (head): {probe.count}</p>}
        {probe.status === 'error' && <p className="text-red-600">Error: {probe.message}</p>}
      </div>
    </div>
  );
};
