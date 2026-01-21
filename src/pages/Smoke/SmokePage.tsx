import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Card } from '../../components/ui/Card';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/ToastProvider';
import { supabase, supabaseConfigError } from '../../lib/supabaseClient';

const SMOKE_ENABLED = import.meta.env.VITE_SMOKE_ENABLED === 'true';

type Counts = { pets: number; reminders: number; activities: number; journal_entries: number };

const initialCounts: Counts = { pets: 0, reminders: 0, activities: 0, journal_entries: 0 };

export const SmokePage = () => {
  const { user, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [counts, setCounts] = useState<Counts>(initialCounts);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [isSeeding, setSeeding] = useState(false);
  const [isClearing, setClearing] = useState(false);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (isAuthReady && !user) {
      navigate('/login', { replace: true });
    }
  }, [isAuthReady, user, navigate]);

  const fetchCounts = async () => {
    if (!user || !supabase) return;
    const client = supabase;
    setLoadingCounts(true);
    try {
      const tableCounts = await Promise.all(
        ['pets', 'reminders', 'activities', 'journal_entries'].map((table) =>
          client.from(table).select('id', { head: true, count: 'exact' }).eq('user_id', user.id),
        ),
      );
      const [pets, reminders, activities, journal_entries] = tableCounts.map((res) => res.count ?? 0);
      setCounts({ pets, reminders, activities, journal_entries });
    } catch (error) {
      pushToast({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Failed to load counts',
      });
    } finally {
      setLoadingCounts(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const seedDemoData = async () => {
    if (!user || !supabase) return;
    const client = supabase;
    setSeeding(true);
    try {
      const { data: petRows, error: petError } = await client
        .from('pets')
        .insert([
          {
            user_id: user.id,
            name: 'Buddy',
            breed: 'Golden Retriever',
            avatar_url:
              'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=60',
            notes: 'Demo pet 1',
          },
          {
            user_id: user.id,
            name: 'Luna',
            breed: 'Husky Mix',
            avatar_url:
              'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?auto=format&fit=crop&w=300&q=60',
            notes: 'Demo pet 2',
          },
        ])
        .select();
      if (petError) throw petError;
      const petIds = (petRows ?? []).map((p) => p.id).filter(Boolean);
      if (petIds.length === 0) throw new Error('Failed to create demo pets.');

      const pickPet = () => petIds[Math.floor(Math.random() * petIds.length)];
      const now = new Date();

      const reminders = Array.from({ length: 10 }).map((_, idx) => ({
        user_id: user.id,
        pet_id: pickPet(),
        type: 'walk',
        title: `Demo reminder ${idx + 1}`,
        date_time: new Date(now.getTime() + idx * 3600 * 1000).toISOString(),
        recurrence: { frequency: 'none' },
      }));
      const activities = Array.from({ length: 20 }).map((_, idx) => ({
        user_id: user.id,
        pet_id: pickPet(),
        type: 'walk',
        date: new Date(now.getTime() - idx * 86400 * 1000).toISOString(),
        duration_minutes: 20 + (idx % 30),
        distance_km: 1 + (idx % 5),
        notes: 'Demo activity',
      }));
      const journals = Array.from({ length: 15 }).map((_, idx) => ({
        user_id: user.id,
        pet_id: pickPet(),
        date: new Date(now.getTime() - idx * 86400 * 1000).toISOString(),
        title: `First day entry ${idx + 1}`,
        content: 'Welcome to Pups & Rec!',
        tags: ['demo'],
        category: 'Other',
      }));

      const [remErr, actErr, jrErr] = await Promise.all([
        client.from('reminders').insert(reminders),
        client.from('activities').insert(activities),
        client.from('journal_entries').insert(journals),
      ]).then((results) => results.map((r) => r.error));

      if (remErr || actErr || jrErr) {
        throw remErr || actErr || jrErr;
      }

      pushToast({ tone: 'success', message: 'Seeded demo data.' });
      setSeeded(true);
      fetchCounts();
    } catch (error) {
      pushToast({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Seeding failed',
      });
    } finally {
      setSeeding(false);
    }
  };

  const clearData = async () => {
    if (!user || !supabase) return;
    const client = supabase;
    setClearing(true);
    try {
      const tables = ['reminders', 'activities', 'journal_entries', 'pets'];
      for (const table of tables) {
        const { error } = await client.from(table).delete().eq('user_id', user.id);
        if (error) throw error;
      }
      pushToast({ tone: 'success', message: 'Cleared your data.' });
      fetchCounts();
    } catch (error) {
      pushToast({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Clear failed',
      });
    } finally {
      setClearing(false);
    }
  };

  if (!SMOKE_ENABLED) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center text-sm text-text-secondary">
        <p className="text-lg font-semibold text-brand-primary">Not enabled</p>
        <p>Set VITE_SMOKE_ENABLED=true to use smoke tools.</p>
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center text-sm text-text-secondary">
        <p className="text-lg font-semibold text-brand-primary">Supabase not configured</p>
        <p>{supabaseConfigError ?? 'Missing Supabase environment variables.'}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center text-sm text-text-secondary">
        <p className="text-lg font-semibold text-brand-primary">Please sign in to use smoke tests.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <Card padding="lg" className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary/70">Smoke</p>
        <h1 className="text-xl font-semibold text-brand-primary">Final Test</h1>
        <p className="text-sm text-text-secondary">Quick seed/clear for this account.</p>
        <p className="text-sm text-brand-primary">User: {user.email}</p>
      </Card>

      <Card padding="lg" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-primary">Counts</h2>
          <SecondaryButton type="button" onClick={fetchCounts} disabled={loadingCounts}>
            {loadingCounts ? 'Refreshing…' : 'Refresh'}
          </SecondaryButton>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm text-brand-primary sm:grid-cols-4">
          <div className="rounded-2xl bg-brand-subtle p-3">
            <p className="text-xs text-text-secondary">Pets</p>
            <p className="text-lg font-semibold">{counts.pets}</p>
          </div>
          <div className="rounded-2xl bg-brand-subtle p-3">
            <p className="text-xs text-text-secondary">Reminders</p>
            <p className="text-lg font-semibold">{counts.reminders}</p>
          </div>
          <div className="rounded-2xl bg-brand-subtle p-3">
            <p className="text-xs text-text-secondary">Activities</p>
            <p className="text-lg font-semibold">{counts.activities}</p>
          </div>
          <div className="rounded-2xl bg-brand-subtle p-3">
            <p className="text-xs text-text-secondary">Journal entries</p>
            <p className="text-lg font-semibold">{counts.journal_entries}</p>
          </div>
        </div>
      </Card>

      <Card padding="lg" className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <PrimaryButton type="button" onClick={seedDemoData} disabled={isSeeding || isClearing}>
            {isSeeding ? 'Seeding…' : 'Seed demo data'}
          </PrimaryButton>
          <SecondaryButton type="button" onClick={clearData} disabled={isClearing || isSeeding}>
            {isClearing ? 'Clearing…' : 'Clear my data'}
          </SecondaryButton>
        </div>
        <p className="text-xs text-text-secondary">
          Seeds 2 pets + sample reminders, activities, and journal entries for this account only.
        </p>
        {seeded && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-brand-subtle/80 p-3 text-sm text-brand-primary">
            <span className="font-semibold">Seed complete — refresh Home to see data.</span>
            <PrimaryButton type="button" onClick={() => navigate('/')} className="px-3 py-1 text-sm">
              Go Home
            </PrimaryButton>
          </div>
        )}
      </Card>
    </div>
  );
};
