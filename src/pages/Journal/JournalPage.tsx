/**
 * JournalPage
 * - Reimagined the journal experience with hero metrics, insights, richer cards, and a story-like composer.
 * - Added reusable helpers (filters, tag input, entry card, composer) to keep the page modular.
 * TODO: Replace the placeholder photo-drop section with a real uploader once media storage is available.
 * TODO: Expand insights with backend-powered analytics when data APIs are ready.
 */
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  CalendarCheck,
  Camera,
  Filter,
  Flame,
  NotebookPen,
  PawPrint,
  PenSquare,
  Pencil,
  Plus,
  Sparkles,
  Tag as TagIcon,
  Tags,
  Trash2,
} from 'lucide-react';
import clsx from 'clsx';

import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/Button';
import { PageLayout } from '../../layouts/PageLayout';
import { useAppState } from '../../hooks/useAppState';
import { formatDate } from '../../utils/dates';
import { useToast } from '../../components/ui/ToastProvider';
import { isValidUrl } from '../../utils/validation';
import { calculateLevel, nextLevelProgress, XP_PER_LEVEL } from '../../utils/xp';
import type { JournalEntry, Pet } from '../../types';

const categories = ['Walk', 'Health', 'Training', 'Play', 'Other'] as const;
type JournalCategory = (typeof categories)[number];

type FilterState = {
  pet: string;
  category: 'all' | JournalCategory;
  tag: string;
};

type JournalFormState = {
  date: string;
  title: string;
  content: string;
  tags: string[];
  category: JournalCategory;
  photoUrl: string;
};

const categoryStyles: Record<
  JournalCategory,
  { tint: string; border: string; pill: string; pillText: string }
> = {
  Walk: {
    tint: 'bg-emerald-50',
    border: 'border-emerald-100',
    pill: 'bg-emerald-100/70',
    pillText: 'text-emerald-900',
  },
  Health: {
    tint: 'bg-rose-50',
    border: 'border-rose-100',
    pill: 'bg-rose-100/70',
    pillText: 'text-rose-900',
  },
  Training: {
    tint: 'bg-indigo-50',
    border: 'border-indigo-100',
    pill: 'bg-indigo-100/70',
    pillText: 'text-indigo-900',
  },
  Play: {
    tint: 'bg-amber-50',
    border: 'border-amber-100',
    pill: 'bg-amber-100/70',
    pillText: 'text-amber-900',
  },
  Other: {
    tint: 'bg-slate-50',
    border: 'border-slate-200',
    pill: 'bg-slate-200/70',
    pillText: 'text-slate-900',
  },
};

const createInitialFormState = (): JournalFormState => ({
  date: new Date().toISOString().slice(0, 10),
  title: '',
  content: '',
  tags: [],
  category: 'Walk',
  photoUrl: '',
});

const sanitizeTag = (value: string) => value.replace(/^#/, '').trim();

const calculateEntriesThisMonth = (entries: JournalEntry[]) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  return entries.filter((entry) => {
    const entryDate = new Date(entry.date);
    return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
  }).length;
};

const calculateMostUsedTag = (entries: JournalEntry[]) => {
  const counts: Record<string, number> = {};
  entries.forEach((entry) =>
    entry.tags.forEach((tag) => {
      const normalized = tag.toLowerCase();
      counts[normalized] = (counts[normalized] ?? 0) + 1;
    }),
  );
  const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!winner) return null;
  const [tag, frequency] = winner;
  return { tag, frequency };
};

const calculateLongestStreak = (entries: JournalEntry[]) => {
  if (!entries.length) return 0;
  const uniqueDays = Array.from(
    new Set(entries.map((entry) => entry.date.slice(0, 10))),
  ).sort((a, b) => (a < b ? 1 : -1)); // newest first
  let longest = 1;
  let current = 1;
  for (let index = 1; index < uniqueDays.length; index += 1) {
    const prevDate = new Date(uniqueDays[index - 1]);
    const currentDate = new Date(uniqueDays[index]);
    const diff =
      (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else if (diff > 1) {
      current = 1;
    }
  }
  return longest;
};

const getPetById = (pets: Pet[], id: string | null | undefined) =>
  pets.find((pet) => pet.id === id);

const getPetAvatar = (pet?: Pet) =>
  pet?.avatarUrl ??
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=60';

export const JournalPage = () => {
  const {
    journalEntries,
    xp,
    selectedPetId,
    selectedPet,
    pets,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
  } = useAppState();
  const { pushToast } = useToast();

  const [filters, setFilters] = useState<FilterState>({
    pet: selectedPetId ?? 'all',
    category: 'all',
    tag: '',
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [formState, setFormState] = useState<JournalFormState>(() => createInitialFormState());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editState, setEditState] = useState<JournalFormState>(() => createInitialFormState());
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFilters((prev) => ({ ...prev, pet: selectedPetId ?? 'all' }));
  }, [selectedPetId]);

  const filteredEntries = useMemo(() => {
    return journalEntries.filter((entry) => {
      if (filters.pet !== 'all' && entry.petId !== filters.pet) return false;
      if (filters.category !== 'all' && entry.category !== filters.category) return false;
      if (
        filters.tag &&
        !entry.tags.some((tag) =>
          tag.toLowerCase().includes(filters.tag.toLowerCase()),
        )
      ) {
        return false;
      }
      return true;
    });
  }, [journalEntries, filters]);

  const entriesForInsights = useMemo(
    () =>
      filters.pet === 'all'
        ? journalEntries
        : journalEntries.filter((entry) => entry.petId === filters.pet),
    [journalEntries, filters.pet],
  );

  const tagSuggestions = useMemo(() => {
    const counts: Record<string, number> = {};
    journalEntries.forEach((entry) =>
      entry.tags.forEach((tag) => {
        const normalized = tag.toLowerCase();
        counts[normalized] = (counts[normalized] ?? 0) + 1;
      }),
    );
    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a])
      .slice(0, 6);
  }, [journalEntries]);

  const level = calculateLevel(xp);
  const levelProgress = nextLevelProgress(xp);
  const levelPercent = Math.round((levelProgress / XP_PER_LEVEL) * 100);
  const activePet =
    filters.pet === 'all' ? selectedPet : getPetById(pets, filters.pet);
  const heroPetName = activePet?.name ?? 'your pack';

  const validateForm = (stateToValidate: JournalFormState) => {
    const nextErrors: Record<string, string> = {};
    if (!stateToValidate.title.trim()) {
      nextErrors.title = 'Give your entry a title.';
    }
    if (!stateToValidate.content.trim()) {
      nextErrors.content = 'Share a few thoughts.';
    }
    if (!stateToValidate.date) {
      nextErrors.date = 'Pick a date.';
    }
    if (stateToValidate.photoUrl && !isValidUrl(stateToValidate.photoUrl)) {
      nextErrors.photoUrl = 'Enter a valid URL.';
    }
    return nextErrors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPetId) return;
    const nextErrors = validateForm(formState);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      pushToast({ tone: 'error', message: 'Fix the highlighted fields before saving.' });
      return;
    }
    addJournalEntry({
      petId: selectedPetId,
      date: new Date(formState.date).toISOString(),
      title: formState.title,
      content: formState.content,
      tags: formState.tags,
      category: formState.category,
      photoUrl: formState.photoUrl,
    });
    setFormState(() => createInitialFormState());
    setErrors({});
    pushToast({ tone: 'success', message: 'Journal entry saved.' });
  };

  const startEditingEntry = (entryId: string) => {
    const entry = journalEntries.find((item) => item.id === entryId);
    if (!entry) return;
    setEditingEntryId(entryId);
    setEditErrors({});
    setEditState({
      title: entry.title,
      date: entry.date.slice(0, 10),
      content: entry.content,
      tags: entry.tags,
      category: entry.category,
      photoUrl: entry.photoUrl ?? '',
    });
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingEntryId) return;
    const nextErrors = validateForm(editState);
    if (Object.keys(nextErrors).length > 0) {
      setEditErrors(nextErrors);
      pushToast({ tone: 'error', message: 'Fix highlighted fields before saving.' });
      return;
    }
    updateJournalEntry({
      id: editingEntryId,
      updates: {
        title: editState.title,
        date: new Date(editState.date).toISOString(),
        content: editState.content,
        tags: editState.tags,
        category: editState.category,
        photoUrl: editState.photoUrl,
      },
    });
    setEditingEntryId(null);
    pushToast({ tone: 'success', message: 'Journal entry updated.' });
  };

  const handleDeleteEntry = (entryId: string) => {
    if (!window.confirm('Delete this journal entry?')) return;
    deleteJournalEntry(entryId);
    if (editingEntryId === entryId) {
      setEditingEntryId(null);
      setEditErrors({});
    }
    pushToast({ tone: 'success', message: 'Entry deleted.' });
  };

  const entriesThisMonth = calculateEntriesThisMonth(entriesForInsights);
  const mostUsedTag = calculateMostUsedTag(entriesForInsights);
  const journalingStreak = calculateLongestStreak(entriesForInsights);

  return (
    <PageLayout
      title="Journal"
      subtitle="Capture the moments that make the day special."
    >
      <div className="space-y-6">
        <Card padding="lg" className="bg-gradient-to-br from-brand-subtle to-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-primary/70">
                {heroPetName}&rsquo;s Journal
              </p>
              <h3 className="text-2xl font-semibold text-brand-primary">
                Every little wag matters
              </h3>
              <p className="text-sm text-text-secondary">
                Write down the highlights, track streaks, and celebrate progress together.
              </p>
            </div>
            <div className="w-full max-w-sm rounded-2xl border border-white/60 bg-white/80 p-4 shadow-card">
              <div className="flex items-center justify-between text-xs font-semibold text-brand-primary">
                <span>Level {level}</span>
                <span>{xp} XP</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-brand-border/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-accent to-brand-primary transition-all"
                  style={{ width: `${levelPercent}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-text-muted">
                {XP_PER_LEVEL - levelProgress} XP to the next level
              </p>
            </div>
          </div>
          <JournalInsights
            entriesThisMonth={entriesThisMonth}
            totalEntries={entriesForInsights.length}
            mostUsedTag={mostUsedTag}
            streak={journalingStreak}
            petName={heroPetName}
          />
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(320px,1fr)]">
          <div className="space-y-6">
            <JournalFilters
              filters={filters}
              pets={pets}
              activePet={activePet}
              tagSuggestions={tagSuggestions}
              filtersOpen={filtersOpen}
              onToggleFilters={() => setFiltersOpen((prev) => !prev)}
              onChangeFilter={(next) => setFilters((prev) => ({ ...prev, ...next }))}
              entriesCount={filteredEntries.length}
            />
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <JournalEntryCard
                  key={entry.id}
                  entry={entry}
                  pet={getPetById(pets, entry.petId)}
                  onEdit={() => startEditingEntry(entry.id)}
                  onDelete={() => handleDeleteEntry(entry.id)}
                />
              ))}
              {filteredEntries.length === 0 && (
                <Card padding="lg" className="border-dashed text-center text-text-secondary">
                  <p className="text-sm">
                    No entries match these filters yet. Try choosing another pet, category, or tag.
                  </p>
                </Card>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <JournalComposer
              formState={formState}
              errors={errors}
              tagSuggestions={tagSuggestions}
              onChange={setFormState}
              onSubmit={handleSubmit}
              selectedPetName={selectedPet?.name ?? 'your pup'}
            />

            {editingEntryId && (
              <Card padding="lg" className="border-brand-accent/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary/60">
                      Editing
                    </p>
                    <h3 className="text-lg font-semibold text-brand-primary">Update entry</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEntryId(null);
                      setEditErrors({});
                    }}
                    className="text-sm font-semibold text-text-secondary hover:text-brand-primary"
                  >
                    Cancel
                  </button>
                </div>
                <form className="mt-4 space-y-4" onSubmit={handleEditSubmit}>
                  <JournalTextField
                    label="Title"
                    value={editState.title}
                    onChange={(value) => setEditState((prev) => ({ ...prev, title: value }))}
                    error={editErrors.title}
                  />
                  <JournalDateField
                    label="Date"
                    value={editState.date}
                    onChange={(value) => setEditState((prev) => ({ ...prev, date: value }))}
                    error={editErrors.date}
                  />
                  <JournalTextareaField
                    label="Thoughts"
                    value={editState.content}
                    onChange={(value) => setEditState((prev) => ({ ...prev, content: value }))}
                    error={editErrors.content}
                  />
                  <JournalCategoryField
                    value={editState.category}
                    onChange={(value) =>
                      setEditState((prev) => ({ ...prev, category: value }))
                    }
                  />
                  <TagInput
                    label="Tags"
                    tags={editState.tags}
                    onChange={(value) => setEditState((prev) => ({ ...prev, tags: value }))}
                    suggestions={tagSuggestions}
                    placeholder="Add new tags"
                  />
                  <JournalTextField
                    label="Photo URL"
                    value={editState.photoUrl}
                    onChange={(value) => setEditState((prev) => ({ ...prev, photoUrl: value }))}
                    error={editErrors.photoUrl}
                    placeholder="https://images..."
                  />
                  <PrimaryButton type="submit" startIcon={<Pencil size={16} />}>
                    Save changes
                  </PrimaryButton>
                </form>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

interface JournalFiltersProps {
  filters: FilterState;
  pets: Pet[];
  activePet?: Pet;
  tagSuggestions: string[];
  entriesCount: number;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  onChangeFilter: (next: Partial<FilterState>) => void;
}

const JournalFilters = ({
  filters,
  pets,
  activePet,
  tagSuggestions,
  entriesCount,
  filtersOpen,
  onToggleFilters,
  onChangeFilter,
}: JournalFiltersProps) => (
  <Card padding="lg" className="space-y-4">
    <div className="flex flex-wrap items-center gap-3">
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-subtle px-3 py-1 text-xs font-semibold text-brand-primary">
        <Sparkles size={14} />
        {entriesCount} entries
      </span>
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-full border border-brand-border px-3 py-1 text-xs font-semibold text-text-secondary md:hidden"
        onClick={onToggleFilters}
        aria-expanded={filtersOpen}
      >
        <Filter size={14} />
        Filters
      </button>
    </div>
    <div className={clsx('grid gap-3 md:grid-cols-3', !filtersOpen && 'hidden md:grid')}>
      <div className="flex items-center gap-3 rounded-2xl border border-brand-border bg-white px-3 py-2">
        <img
          src={getPetAvatar(activePet)}
          alt={activePet?.name ?? 'All pets'}
          className="h-10 w-10 rounded-full object-cover"
        />
        <select
          className="w-full border-none bg-transparent text-sm font-medium text-brand-primary focus:outline-none"
          value={filters.pet}
          onChange={(event) => onChangeFilter({ pet: event.target.value })}
        >
          <option value="all">All pets</option>
          {pets.map((pet) => (
            <option key={pet.id} value={pet.id}>
              {pet.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-brand-border bg-white px-3 py-2">
        <PawPrint size={16} className="text-brand-primary/60" />
        <select
          className="w-full border-none bg-transparent text-sm font-medium text-brand-primary focus:outline-none"
          value={filters.category}
          onChange={(event) =>
            onChangeFilter({ category: event.target.value as FilterState['category'] })
          }
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </div>
      <div className="rounded-2xl border border-brand-border bg-white px-3 py-2">
        <div className="flex items-center gap-2">
          <TagIcon size={16} className="text-brand-primary/60" />
          <input
            className="w-full border-none bg-transparent text-sm text-brand-primary focus:outline-none"
            placeholder="Filter by tag"
            value={filters.tag}
            onChange={(event) => onChangeFilter({ tag: event.target.value })}
            list="journal-tag-options"
          />
          <datalist id="journal-tag-options">
            {tagSuggestions.map((tag) => (
              <option key={tag} value={`#${tag}`} />
            ))}
          </datalist>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {tagSuggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onChangeFilter({ tag })}
              className={clsx(
                'rounded-full px-2 py-0.5 text-xs font-semibold transition',
                filters.tag === tag
                  ? 'bg-brand-accent text-white'
                  : 'bg-brand-subtle text-brand-primary hover:bg-brand-accent/30',
              )}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  </Card>
);

interface JournalEntryCardProps {
  entry: JournalEntry;
  pet?: Pet;
  onEdit: () => void;
  onDelete: () => void;
}

const JournalEntryCard = ({ entry, pet, onEdit, onDelete }: JournalEntryCardProps) => {
  const styles = categoryStyles[entry.category];
  return (
    <div
      className={clsx(
        'rounded-3xl border p-5 transition hover:-translate-y-0.5 hover:shadow-lg',
        styles.tint,
        styles.border,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-1 items-start gap-4">
          <img
            src={getPetAvatar(pet)}
            alt={pet?.name ?? 'Pet avatar'}
            className="h-14 w-14 flex-shrink-0 rounded-2xl object-cover shadow-card"
          />
          <div>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-lg font-semibold text-brand-primary">{entry.title}</h4>
                <span
                  className={clsx(
                    'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    styles.pill,
                    styles.pillText,
                  )}
                >
                  {entry.category}
                </span>
              </div>
              <p className="text-xs text-text-muted">
                {formatDate(entry.date)} · {pet?.name ?? 'Unknown pup'}
              </p>
            </div>
            <p className="mt-3 text-sm text-text-secondary">{entry.content}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-brand-primary"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        {entry.photoUrl && (
          <img
            src={entry.photoUrl}
            alt={`${entry.title} memory`}
            className="h-24 w-24 rounded-2xl object-cover shadow-card"
          />
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-full border border-brand-border px-3 py-1 text-xs font-semibold text-brand-primary transition hover:bg-white"
        >
          <Pencil size={14} />
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1 rounded-full border border-transparent bg-white/70 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );
};

interface JournalInsightsProps {
  entriesThisMonth: number;
  totalEntries: number;
  mostUsedTag: { tag: string; frequency: number } | null;
  streak: number;
  petName: string;
}

const JournalInsights = ({
  entriesThisMonth,
  totalEntries,
  mostUsedTag,
  streak,
  petName,
}: JournalInsightsProps) => (
  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <InsightPill
      icon={<NotebookPen size={18} />}
      label="Total entries"
      value={`${totalEntries}`}
      description={`${petName} memories logged`}
    />
    <InsightPill
      icon={<CalendarCheck size={18} />}
      label="Entries this month"
      value={`${entriesThisMonth}`}
    />
    <InsightPill
      icon={<Tags size={18} />}
      label="Most used tag"
      value={mostUsedTag ? `#${mostUsedTag.tag}` : '—'}
      description={mostUsedTag ? `${mostUsedTag.frequency} mentions` : 'Create a new trend'}
    />
    <InsightPill
      icon={<Flame size={18} />}
      label="Longest streak"
      value={`${streak} day${streak === 1 ? '' : 's'}`}
      description="Consecutive journaling days"
    />
  </div>
);

const InsightPill = ({
  icon,
  label,
  value,
  description,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  description?: string;
}) => (
  <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-card">
    <div className="flex items-center gap-2 text-brand-primary">
      <span className="rounded-full bg-brand-subtle p-2 text-brand-primary">{icon}</span>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary/60">
        {label}
      </p>
    </div>
    <p className="mt-3 text-2xl font-semibold text-brand-primary">{value}</p>
    {description && <p className="text-xs text-text-muted">{description}</p>}
  </div>
);

interface JournalComposerProps {
  formState: JournalFormState;
  errors: Record<string, string>;
  tagSuggestions: string[];
  selectedPetName: string;
  onChange: React.Dispatch<React.SetStateAction<JournalFormState>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const JournalComposer = ({
  formState,
  errors,
  tagSuggestions,
  selectedPetName,
  onChange,
  onSubmit,
}: JournalComposerProps) => (
  <Card padding="lg" className="space-y-4 bg-gradient-to-br from-white to-brand-subtle/60">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-primary/60">
        Add New Entry
      </p>
      <h3 className="text-xl font-semibold text-brand-primary">
        What did {selectedPetName} love today?
      </h3>
      <p className="text-sm text-text-secondary">
        Capture the little wins, big milestones, and everyday cuddles.
      </p>
    </div>
    <form className="space-y-4" onSubmit={onSubmit}>
      <JournalTextField
        label="Title"
        placeholder="Morning beach walk 🌊"
        value={formState.title}
        onChange={(value) => onChange((prev) => ({ ...prev, title: value }))}
        error={errors.title}
      />
      <JournalDateField
        label="Date"
        value={formState.date}
        onChange={(value) => onChange((prev) => ({ ...prev, date: value }))}
        error={errors.date}
      />
      <JournalTextareaField
        label="Thoughts"
        placeholder="Write a few sentences about today’s adventure…"
        value={formState.content}
        onChange={(value) => onChange((prev) => ({ ...prev, content: value }))}
        error={errors.content}
      />
      <JournalCategoryField
        value={formState.category}
        onChange={(value) => onChange((prev) => ({ ...prev, category: value }))}
      />
      <TagInput
        label="Tags"
        tags={formState.tags}
        onChange={(value) => onChange((prev) => ({ ...prev, tags: value }))}
        suggestions={tagSuggestions}
        placeholder="Add a tag and press Enter"
      />
      <JournalTextField
        label="Photo URL"
        placeholder="https://images..."
        value={formState.photoUrl}
        onChange={(value) => onChange((prev) => ({ ...prev, photoUrl: value }))}
        error={errors.photoUrl}
      />
      <div className="rounded-2xl border border-dashed border-brand-border/80 bg-white/60 p-3 text-xs text-text-muted">
        <div className="flex items-center gap-2 font-semibold text-brand-primary">
          <Camera size={14} />
          Photo uploads coming soon
        </div>
        <p className="mt-1">
          Drop a link for now and we&rsquo;ll showcase the snapshot. {/* TODO: real uploader */}
        </p>
      </div>
      <PrimaryButton type="submit" className="w-full" startIcon={<PenSquare size={16} />}>
        Save entry
      </PrimaryButton>
      <button
        type="button"
        onClick={() => onChange(createInitialFormState())}
        className="w-full text-sm font-semibold text-brand-primary underline-offset-4 hover:underline"
      >
        Clear composer
      </button>
    </form>
  </Card>
);

const fieldClasses = (hasError?: boolean) =>
  clsx(
    'mt-1 w-full rounded-2xl border px-3 py-2 text-sm text-brand-primary shadow-sm placeholder:text-text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary/50',
    hasError ? 'border-red-200' : 'border-brand-border',
  );

const JournalTextField = ({
  label,
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}) => (
  <label className="flex flex-col text-sm font-semibold text-brand-primary">
    {label}
    <input
      className={fieldClasses(Boolean(error))}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      aria-invalid={Boolean(error)}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </label>
);

const JournalDateField = ({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) => (
  <label className="flex flex-col text-sm font-semibold text-brand-primary">
    {label}
    <input
      type="date"
      className={fieldClasses(Boolean(error))}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-invalid={Boolean(error)}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </label>
);

const JournalTextareaField = ({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}) => (
  <label className="flex flex-col text-sm font-semibold text-brand-primary">
    {label}
    <textarea
      rows={5}
      className={clsx(fieldClasses(Boolean(error)), 'resize-none')}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      aria-invalid={Boolean(error)}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </label>
);

const JournalCategoryField = ({
  value,
  onChange,
}: {
  value: JournalCategory;
  onChange: (value: JournalCategory) => void;
}) => (
  <label className="flex flex-col text-sm font-semibold text-brand-primary">
    Category
    <div className="flex flex-wrap gap-2 pt-2">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onChange(category)}
          className={clsx(
            'rounded-full px-3 py-1 text-xs font-semibold transition',
            value === category
              ? 'bg-brand-primary text-white shadow'
              : 'bg-brand-subtle text-brand-primary hover:bg-brand-primary/10',
          )}
        >
          {category}
        </button>
      ))}
    </div>
  </label>
);

interface TagInputProps {
  label: string;
  tags: string[];
  onChange: (value: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

const TagInput = ({ label, tags, onChange, suggestions = [], placeholder }: TagInputProps) => {
  const [draft, setDraft] = useState('');

  const addTag = (rawValue: string) => {
    const sanitized = sanitizeTag(rawValue);
    if (!sanitized) return;
    if (tags.map((tag) => tag.toLowerCase()).includes(sanitized.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...tags, sanitized]);
    setDraft('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div>
      <p className="text-sm font-semibold text-brand-primary">{label}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2 rounded-2xl border border-brand-border bg-white px-3 py-2 focus-within:outline focus-within:outline-2 focus-within:outline-brand-primary/40">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-semibold text-brand-primary"
          >
            #{tag}
            <button
              type="button"
              className="text-brand-primary/70 hover:text-brand-primary"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="flex-1 border-none bg-transparent text-sm text-brand-primary focus:outline-none"
          placeholder={placeholder}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addTag(draft);
            }
            if (event.key === 'Backspace' && !draft && tags.length) {
              removeTag(tags[tags.length - 1]);
            }
          }}
        />
        <Plus size={16} className="text-brand-primary/60" />
      </div>
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              className="rounded-full bg-brand-subtle px-2 py-0.5 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary/10"
              onClick={() => addTag(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

