import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus } from 'lucide-react';
import clsx from 'clsx';

import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/Button';
import { TagChip } from '../../components/ui/Tag';
import { PageLayout } from '../../components/layout/PageLayout';
import { useAppState } from '../../hooks/useAppState';
import { formatDate } from '../../utils/dates';
import { useToast } from '../../components/ui/ToastProvider';

const healthOptions = ['vet-visit', 'vaccine', 'medication', 'injury', 'weight', 'other'] as const;

export const PetsPage = () => {
  const { pets, addHealthRecord, selectedPetId } = useAppState();
  const { pushToast } = useToast();
  const [activePetId, setActivePetId] = useState(selectedPetId ?? pets[0]?.id);
  const [formState, setFormState] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'vet-visit' as (typeof healthOptions)[number],
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activePet = useMemo(() => pets.find((pet) => pet.id === activePetId), [pets, activePetId]);

  useEffect(() => {
    if (selectedPetId) {
      setActivePetId(selectedPetId);
    }
  }, [selectedPetId]);

  const fieldClasses = (hasError: boolean) =>
    clsx(
      'mt-1 rounded-2xl border border-brand-border px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent',
      hasError && 'border-red-300 focus-visible:outline-red-400',
    );

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!formState.date) {
      nextErrors.date = 'Pick a date.';
    }
    if (!formState.description.trim()) {
      nextErrors.description = 'Add a quick note.';
    }
    return nextErrors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activePet) return;
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      pushToast({ tone: 'error', message: 'Please fix the highlighted fields.' });
      return;
    }
    addHealthRecord({
      petId: activePet.id,
      record: {
        date: formState.date,
        type: formState.type,
        description: formState.description,
      },
    });
    setFormState((prev) => ({ ...prev, description: '' }));
    setErrors({});
    pushToast({ tone: 'success', message: 'Health note saved.' });
  };

  return (
    <PageLayout title="Pet Profiles" subtitle="Keep every pup shining">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          {pets.map((pet) => (
            <button
              key={pet.id}
              className={clsx(
                'flex w-full items-center gap-3 rounded-3xl border px-4 py-3 transition',
                pet.id === activePetId
                  ? 'border-brand-accent bg-brand-accent/10 text-brand-primary'
                  : 'border-brand-border bg-white text-brand-primary',
              )}
              onClick={() => setActivePetId(pet.id)}
            >
              <img src={pet.avatarUrl} alt={pet.name} className="h-14 w-14 rounded-2xl object-cover" />
              <div className="text-left">
                <p className="text-sm font-semibold text-brand-primary">{pet.name}</p>
                <p className="text-xs text-text-muted">{pet.breed}</p>
              </div>
            </button>
          ))}
        </div>
        {activePet && (
          <div className="lg:col-span-2 space-y-4">
            <Card padding="lg" className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <img src={activePet.avatarUrl} alt={activePet.name} className="h-40 w-40 rounded-3xl object-cover" />
                <div className="flex-1 space-y-2">
                  <h3 className="text-2xl font-semibold text-brand-primary">{activePet.name}</h3>
                  <p className="text-sm text-text-muted">{activePet.breed}</p>
                  <p className="text-sm text-text-secondary">{activePet.notes}</p>
                  <div className="flex gap-2">
                    <TagChip variant="accent">{activePet.ageYears} yrs old</TagChip>
                    <TagChip>Health records {activePet.healthRecords.length}</TagChip>
                  </div>
                </div>
              </div>
            </Card>
            <Card padding="lg">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-brand-primary">Health Records</h3>
                <TagChip variant="accent">{activePet.healthRecords.length} entries</TagChip>
              </div>
              <div className="mt-4 space-y-3">
                {activePet.healthRecords.map((record) => (
                  <div key={record.id} className="rounded-2xl border border-brand-border p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold capitalize text-brand-primary">
                        {record.type.replace('-', ' ')}
                      </p>
                      <span className="text-xs text-text-muted">{formatDate(record.date)}</span>
                    </div>
                    <p className="mt-2 text-sm text-text-secondary">{record.description}</p>
                  </div>
                ))}
                {activePet.healthRecords.length === 0 && (
                  <p className="rounded-2xl bg-brand-subtle p-4 text-sm text-text-secondary">No health notes yet.</p>
                )}
              </div>
            </Card>
            <Card padding="lg">
              <h3 className="text-lg font-semibold text-brand-primary">Add Health Note</h3>
              <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                  Date
                  <input
                    type="date"
                    className={fieldClasses(Boolean(errors.date))}
                    value={formState.date}
                    onChange={(event) => setFormState((prev) => ({ ...prev, date: event.target.value }))}
                    aria-invalid={Boolean(errors.date)}
                  />
                  {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
                </label>
                <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                  Type
                  <select
                    className={fieldClasses(false)}
                    value={formState.type}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, type: event.target.value as (typeof healthOptions)[number] }))
                    }
                  >
                    {healthOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                  Description
                  <textarea
                    rows={3}
                    className={fieldClasses(Boolean(errors.description))}
                    value={formState.description}
                    onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                    aria-invalid={Boolean(errors.description)}
                  />
                  {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                </label>
                <PrimaryButton type="submit" startIcon={<Plus size={16} />}>Save Record</PrimaryButton>
              </form>
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  );
};
