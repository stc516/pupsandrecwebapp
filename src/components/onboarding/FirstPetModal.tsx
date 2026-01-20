import { useState } from 'react';

import { Card } from '../ui/Card';
import { PrimaryButton, SecondaryButton } from '../ui/Button';
import { useAppState } from '../../hooks/useAppState';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ui/ToastProvider';

const SEED_AFTER_CREATE = import.meta.env.VITE_SEED_FIRST_PET === 'true';

export const FirstPetModal = () => {
  const { addPet, setSelectedPet, addJournalEntry, addReminder } = useAppState();
  const { logout } = useAuth();
  const { pushToast } = useToast();
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCreate = async () => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'Name is required.';
    if (!breed.trim()) nextErrors.breed = 'Breed is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setIsSaving(true);
    try {
      const pet = await addPet({
        name: name.trim(),
        breed: breed.trim(),
        avatarUrl:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        notes: '',
        healthRecords: [],
      });
      await setSelectedPet(pet.id);

      if (SEED_AFTER_CREATE) {
        try {
          await addJournalEntry({
            petId: pet.id,
            date: new Date().toISOString(),
            title: 'First day on Pups & Rec 🐾',
            content: 'Welcome to your new companion dashboard!',
            tags: ['welcome'],
            category: 'Other',
            photoUrl: '',
          });
          await addReminder({
            petId: pet.id,
            type: 'other',
            title: `Add a photo of ${pet.name}`,
            dateTime: new Date().toISOString(),
            recurrence: { frequency: 'none' },
          });
        } catch (seedError) {
          console.warn('Seeding first pet failed', seedError);
        }
      }
      pushToast({ tone: 'success', message: 'Pet created!' });
    } catch (error) {
      pushToast({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Could not create pet. Try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur">
      <Card padding="lg" className="w-full max-w-md space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-primary/70">Welcome</p>
          <h2 className="text-xl font-semibold text-brand-primary">Create your first pet to get started</h2>
          <p className="text-sm text-text-secondary">
            We need at least one pet to personalize your activities, calendar, and journal.
          </p>
        </div>
        <div className="space-y-3">
          <label className="flex flex-col text-sm font-medium text-brand-primary/90">
            Name
            <input
              className="mt-1 rounded-2xl border border-brand-border px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </label>
          <label className="flex flex-col text-sm font-medium text-brand-primary/90">
            Breed
            <input
              className="mt-1 rounded-2xl border border-brand-border px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              disabled={isSaving}
            />
            {errors.breed && <p className="mt-1 text-xs text-red-500">{errors.breed}</p>}
          </label>
        </div>
        <div className="flex gap-2">
          <PrimaryButton type="button" onClick={handleCreate} disabled={isSaving} startIcon={null}>
            {isSaving ? 'Creating…' : 'Create pet'}
          </PrimaryButton>
          <SecondaryButton type="button" onClick={() => logout()} disabled={isSaving}>
            Log out
          </SecondaryButton>
        </div>
      </Card>
    </div>
  );
};
