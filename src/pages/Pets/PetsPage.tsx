import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Pencil, Plus } from 'lucide-react';
import clsx from 'clsx';

import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/Button';
import { TagChip } from '../../components/ui/Tag';
import { PageLayout } from '../../layouts/PageLayout';
import { useAppState } from '../../hooks/useAppState';
import { formatDate } from '../../utils/dates';
import { useToast } from '../../components/ui/ToastProvider';
import { PetAvatar } from '../../components/ui/PetAvatar';
import { useAuth } from '../../hooks/useAuth';
import { getSupabaseClient, supabaseConfigured } from '../../lib/supabaseClient';

const healthOptions = ['vet-visit', 'vaccine', 'medication', 'injury', 'weight', 'other'] as const;

const textFieldClasses = (hasError?: boolean) =>
  clsx(
    'mt-1 rounded-2xl border border-brand-border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent',
    hasError && 'border-red-300 focus-visible:outline-red-400',
  );

export const PetsPage = () => {
  const {
    pets,
    selectedPetId,
    setSelectedPet,
    addPet,
    updatePet,
    deletePet,
    addHealthRecord,
    updateHealthRecord,
    deleteHealthRecord,
  } = useAppState();
  const { pushToast } = useToast();
  const { user } = useAuth();

  const [activePetId, setActivePetId] = useState(selectedPetId ?? pets[0]?.id);
  const activePet = useMemo(() => pets.find((pet) => pet.id === activePetId), [pets, activePetId]);

  const [petForm, setPetForm] = useState({ name: '', breed: '', avatarUrl: '', notes: '' });
  const [petImageFile, setPetImageFile] = useState<File | null>(null);
  const [petErrors, setPetErrors] = useState<Record<string, string>>({});
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [editPetState, setEditPetState] = useState({ name: '', breed: '', avatarUrl: '', notes: '' });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  const [healthForm, setHealthForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'vet-visit' as (typeof healthOptions)[number],
    description: '',
  });
  const [healthErrors, setHealthErrors] = useState<Record<string, string>>({});
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [recordForm, setRecordForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'vet-visit' as (typeof healthOptions)[number],
    description: '',
  });
  const [recordErrors, setRecordErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedPetId) setActivePetId(selectedPetId);
  }, [selectedPetId]);

  useEffect(() => {
    if (activePetId) setSelectedPet(activePetId);
  }, [activePetId, setSelectedPet]);

  const validatePetState = (state: typeof petForm) => {
    const next: Record<string, string> = {};
    if (!state.name.trim()) next.name = 'Name is required.';
    if (!state.breed.trim()) next.breed = 'Breed is required.';
    return next;
  };

  const uploadAvatar = async (file: File, petId: string) => {
    if (!user) throw new Error('Sign in to upload a photo.');
    if (!supabaseConfigured) throw new Error('Supabase is not configured.');
    let client;
    try {
      client = getSupabaseClient();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Supabase is not configured.');
    }
    const fileExt = file.name.split('.').pop() ?? 'jpg';
    const filePath = `${user.id}/${petId}.${fileExt}`;
    const { error } = await client.storage.from('pet-avatars').upload(filePath, file, {
      upsert: true,
      cacheControl: '3600',
    });
    if (error) throw error;
    const { data } = client.storage.from('pet-avatars').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleAddPet = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validatePetState(petForm);
    if (Object.keys(validation).length) {
      setPetErrors(validation);
      pushToast({ tone: 'error', message: 'Fix the highlighted pet fields.' });
      return;
    }
    try {
      const created = await addPet({
        name: petForm.name.trim(),
        breed: petForm.breed.trim(),
        avatarUrl: '',
        notes: petForm.notes,
        healthRecords: [],
      });

      if (petImageFile) {
        const url = await uploadAvatar(petImageFile, created.id);
        await updatePet({ ...created, avatarUrl: url });
      }
      setPetForm({ name: '', breed: '', avatarUrl: '', notes: '' });
      setPetImageFile(null);
      setPetErrors({});
      pushToast({ tone: 'success', message: 'Pet added.' });
    } catch (error) {
      pushToast({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Could not add pet.',
      });
    }
  };

  const startEditingPet = (petId: string) => {
    const pet = pets.find((p) => p.id === petId);
    if (!pet) return;
    setEditingPetId(petId);
    setEditPetState({
      name: pet.name,
      breed: pet.breed,
      avatarUrl: pet.avatarUrl ?? '',
      notes: pet.notes ?? '',
    });
    setPetErrors({});
  };

  const handleEditPet = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingPetId) return;
    const validation = validatePetState(editPetState);
    if (Object.keys(validation).length) {
      setPetErrors(validation);
      pushToast({ tone: 'error', message: 'Fix the highlighted pet fields.' });
      return;
    }
    const original = pets.find((p) => p.id === editingPetId);
    if (!original) return;
    try {
      let avatarUrl = editPetState.avatarUrl;
      if (editImageFile) {
        avatarUrl = await uploadAvatar(editImageFile, original.id);
      }
      await updatePet({
        ...original,
        name: editPetState.name.trim(),
        breed: editPetState.breed.trim(),
        avatarUrl,
        notes: editPetState.notes,
      });
      setEditingPetId(null);
      setEditImageFile(null);
      pushToast({ tone: 'success', message: 'Pet updated.' });
    } catch (error) {
      pushToast({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Could not update pet.',
      });
    }
  };

  const handleDeletePet = (petId: string) => {
    if (pets.length <= 1) {
      pushToast({ tone: 'error', message: 'Keep at least one pet in your crew.' });
      return;
    }
    if (!window.confirm('Delete this pet and their history?')) return;
    deletePet(petId);
    if (editingPetId === petId) setEditingPetId(null);
    if (activePetId === petId) {
      const fallback = pets.find((pet) => pet.id !== petId);
      setActivePetId(fallback?.id ?? '');
    }
    pushToast({ tone: 'success', message: 'Pet removed.' });
  };

  const validateHealthState = (state: typeof healthForm) => {
    const next: Record<string, string> = {};
    if (!state.date) next.date = 'Pick a date.';
    if (!state.description.trim()) next.description = 'Add a note.';
    return next;
  };

  const handleAddRecord = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activePet) return;
    const validation = validateHealthState(healthForm);
    if (Object.keys(validation).length) {
      setHealthErrors(validation);
      pushToast({ tone: 'error', message: 'Fix the highlighted record fields.' });
      return;
    }
    addHealthRecord({
      petId: activePet.id,
      record: {
        date: healthForm.date,
        type: healthForm.type,
        description: healthForm.description,
      },
    });
    setHealthForm((prev) => ({ ...prev, description: '' }));
    setHealthErrors({});
    pushToast({ tone: 'success', message: 'Health note saved.' });
  };

  const startEditingRecord = (recordId: string) => {
    if (!activePet) return;
    const record = activePet.healthRecords.find((rec) => rec.id === recordId);
    if (!record) return;
    setEditingRecordId(recordId);
    setRecordForm({
      date: record.date,
      type: record.type,
      description: record.description,
    });
    setRecordErrors({});
  };

  const handleEditRecord = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activePet || !editingRecordId) return;
    const validation = validateHealthState(recordForm);
    if (Object.keys(validation).length) {
      setRecordErrors(validation);
      pushToast({ tone: 'error', message: 'Fix the highlighted record fields.' });
      return;
    }
    updateHealthRecord({
      petId: activePet.id,
      recordId: editingRecordId,
      updates: {
        date: recordForm.date,
        type: recordForm.type,
        description: recordForm.description,
      },
    });
    setEditingRecordId(null);
    pushToast({ tone: 'success', message: 'Health note updated.' });
  };

  const handleDeleteRecord = (recordId: string) => {
    if (!activePet) return;
    if (!window.confirm('Delete this health note?')) return;
    deleteHealthRecord({ petId: activePet.id, recordId });
    if (editingRecordId === recordId) setEditingRecordId(null);
    pushToast({ tone: 'success', message: 'Health note deleted.' });
  };

  return (
    <PageLayout title="Pet Profiles" subtitle="Keep every pup shining">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <Card padding="lg" className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-primary">Add Pet</h3>
            <form className="space-y-3" onSubmit={handleAddPet}>
              <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                Name
                <input
                  className={textFieldClasses(Boolean(petErrors.name))}
                  value={petForm.name}
                  onChange={(event) => setPetForm((prev) => ({ ...prev, name: event.target.value }))}
                />
                {petErrors.name && <p className="mt-1 text-xs text-red-500">{petErrors.name}</p>}
              </label>
              <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                Breed
                <input
                  className={textFieldClasses(Boolean(petErrors.breed))}
                  value={petForm.breed}
                  onChange={(event) => setPetForm((prev) => ({ ...prev, breed: event.target.value }))}
                />
                {petErrors.breed && <p className="mt-1 text-xs text-red-500">{petErrors.breed}</p>}
              </label>
              <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                Upload photo
                <input
                  type="file"
                  accept="image/*"
                  className={textFieldClasses()}
                  onChange={(event) => setPetImageFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                Notes
                <textarea
                  rows={3}
                  className={textFieldClasses()}
                  value={petForm.notes}
                  onChange={(event) => setPetForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </label>
              <PrimaryButton type="submit" startIcon={<Plus size={16} />}>
                Add pet
              </PrimaryButton>
            </form>
          </Card>
          {pets.map((pet) => (
            <Card
              key={pet.id}
              padding="md"
              className={clsx(
                'flex items-center justify-between rounded-3xl border px-4 py-3 transition',
                pet.id === activePetId
                  ? 'border-brand-accent bg-brand-accent/10 text-brand-primary'
                  : 'border-brand-border bg-white text-brand-primary',
              )}
            >
              <button className="flex flex-1 items-center gap-3 text-left" onClick={() => setActivePetId(pet.id)}>
                <PetAvatar name={pet.name} avatarUrl={pet.avatarUrl} petId={pet.id} size="md" className="rounded-2xl" />
                <div>
                  <p className="text-sm font-semibold text-brand-primary">{pet.name}</p>
                  <p className="text-xs text-text-muted">{pet.breed}</p>
                </div>
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEditingPet(pet.id)}
                  className="rounded-full border border-brand-border px-3 py-1 text-xs font-semibold text-brand-primary"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePet(pet.id)}
                  className="rounded-full border border-red-100 px-3 py-1 text-xs font-semibold text-red-600"
                >
                  Remove
                </button>
              </div>
            </Card>
          ))}
        </div>

        {activePet && (
          <div className="lg:col-span-2 space-y-4">
            <Card padding="lg" className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <PetAvatar name={activePet.name} avatarUrl={activePet.avatarUrl} petId={activePet.id} size="xl" className="rounded-3xl" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-semibold text-brand-primary">{activePet.name}</h3>
                    {editingPetId === activePet.id ? (
                      <button
                        type="button"
                        className="text-sm font-semibold text-text-secondary"
                        onClick={() => {
                          setEditingPetId(null);
                          setPetErrors({});
                        }}
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="rounded-full border border-brand-border px-3 py-1 text-xs font-semibold text-brand-primary"
                        onClick={() => startEditingPet(activePet.id)}
                      >
                        Edit details
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-text-muted">{activePet.breed}</p>
                  <p className="text-sm text-text-secondary">{activePet.notes}</p>
                  <div className="flex gap-2">
                    <TagChip variant="accent">{activePet.ageYears} yrs old</TagChip>
                    <TagChip>{activePet.healthRecords.length} health notes</TagChip>
                  </div>
                </div>
              </div>
              {editingPetId === activePet.id && (
                <form className="space-y-3 pt-2" onSubmit={handleEditPet}>
                  <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                    Name
                    <input
                      className={textFieldClasses(Boolean(petErrors.name))}
                      value={editPetState.name}
                      onChange={(event) => setEditPetState((prev) => ({ ...prev, name: event.target.value }))}
                    />
                    {petErrors.name && <p className="mt-1 text-xs text-red-500">{petErrors.name}</p>}
                  </label>
                  <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                    Breed
                    <input
                      className={textFieldClasses(Boolean(petErrors.breed))}
                      value={editPetState.breed}
                      onChange={(event) => setEditPetState((prev) => ({ ...prev, breed: event.target.value }))}
                    />
                    {petErrors.breed && <p className="mt-1 text-xs text-red-500">{petErrors.breed}</p>}
                  </label>
                  <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                    Upload photo
                    <input
                      type="file"
                      accept="image/*"
                      className={textFieldClasses()}
                      onChange={(event) => setEditImageFile(event.target.files?.[0] ?? null)}
                    />
                  </label>
                  <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                    Notes
                    <textarea
                      rows={3}
                      className={textFieldClasses()}
                      value={editPetState.notes}
                      onChange={(event) => setEditPetState((prev) => ({ ...prev, notes: event.target.value }))}
                    />
                  </label>
                  <PrimaryButton type="submit" startIcon={<Pencil size={16} />}>
                    Save pet
                  </PrimaryButton>
                </form>
              )}
            </Card>

            <Card padding="lg">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-brand-primary">Health Records</h3>
                <TagChip variant="accent">{activePet.healthRecords.length} entries</TagChip>
              </div>
              <div className="mt-4 space-y-3">
                {activePet.healthRecords.map((record) => (
                  <div key={record.id} className="space-y-2 rounded-2xl border border-brand-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold capitalize text-brand-primary">
                          {record.type.replace('-', ' ')}
                        </p>
                        <span className="text-xs text-text-muted">{formatDate(record.date)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEditingRecord(record.id)}
                          className="rounded-full border border-brand-border px-3 py-1 text-xs font-semibold text-brand-primary"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(record.id)}
                          className="rounded-full border border-red-100 px-3 py-1 text-xs font-semibold text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary">{record.description}</p>
                    {editingRecordId === record.id && (
                      <form className="space-y-3 pt-2" onSubmit={handleEditRecord}>
                        <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                          Date
                          <input
                            type="date"
                            className={textFieldClasses(Boolean(recordErrors.date))}
                            value={recordForm.date}
                            onChange={(event) => setRecordForm((prev) => ({ ...prev, date: event.target.value }))}
                          />
                          {recordErrors.date && <p className="mt-1 text-xs text-red-500">{recordErrors.date}</p>}
                        </label>
                        <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                          Type
                          <select
                            className={textFieldClasses()}
                            value={recordForm.type}
                            onChange={(event) =>
                              setRecordForm((prev) => ({ ...prev, type: event.target.value as (typeof healthOptions)[number] }))
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
                            className={textFieldClasses(Boolean(recordErrors.description))}
                            value={recordForm.description}
                            onChange={(event) => setRecordForm((prev) => ({ ...prev, description: event.target.value }))}
                          />
                          {recordErrors.description && (
                            <p className="mt-1 text-xs text-red-500">{recordErrors.description}</p>
                          )}
                        </label>
                        <PrimaryButton type="submit" startIcon={<Pencil size={16} />}>
                          Save note
                        </PrimaryButton>
                      </form>
                    )}
                  </div>
                ))}
                {activePet.healthRecords.length === 0 && (
                  <p className="rounded-2xl bg-brand-subtle p-4 text-sm text-text-secondary">No health notes yet.</p>
                )}
              </div>
            </Card>

            <Card padding="lg">
              <h3 className="text-lg font-semibold text-brand-primary">Add Health Note</h3>
              <form className="mt-4 space-y-4" onSubmit={handleAddRecord}>
                <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                  Date
                  <input
                    type="date"
                    className={textFieldClasses(Boolean(healthErrors.date))}
                    value={healthForm.date}
                    onChange={(event) => setHealthForm((prev) => ({ ...prev, date: event.target.value }))}
                    aria-invalid={Boolean(healthErrors.date)}
                  />
                  {healthErrors.date && <p className="mt-1 text-xs text-red-500">{healthErrors.date}</p>}
                </label>
                <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                  Type
                  <select
                    className={textFieldClasses()}
                    value={healthForm.type}
                    onChange={(event) =>
                      setHealthForm((prev) => ({ ...prev, type: event.target.value as (typeof healthOptions)[number] }))
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
                    className={textFieldClasses(Boolean(healthErrors.description))}
                    value={healthForm.description}
                    onChange={(event) => setHealthForm((prev) => ({ ...prev, description: event.target.value }))}
                    aria-invalid={Boolean(healthErrors.description)}
                  />
                  {healthErrors.description && (
                    <p className="mt-1 text-xs text-red-500">{healthErrors.description}</p>
                  )}
                </label>
                <PrimaryButton type="submit" startIcon={<Plus size={16} />}>
                  Save record
                </PrimaryButton>
              </form>
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  );
};
