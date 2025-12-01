import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Filter, PenSquare, Tags } from 'lucide-react';
import clsx from 'clsx';

import { Card } from '../../components/ui/Card';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
import { TagChip } from '../../components/ui/Tag';
import { PageLayout } from '../../components/layout/PageLayout';
import { useAppState } from '../../hooks/useAppState';
import { formatDate } from '../../utils/dates';
import { useToast } from '../../components/ui/ToastProvider';
import { isValidUrl } from '../../utils/validation';

const categories = ['Walk', 'Health', 'Training', 'Play', 'Other'] as const;
type JournalCategory = (typeof categories)[number];

export const JournalPage = () => {
  const { journalEntries, selectedPetId, pets, addJournalEntry } = useAppState();
  const { pushToast } = useToast();
  const [filters, setFilters] = useState({ pet: selectedPetId ?? 'all', category: 'all', tag: '' });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [formState, setFormState] = useState({
    date: new Date().toISOString().slice(0, 10),
    title: '',
    content: '',
    tags: '',
    category: 'Walk' as JournalCategory,
    photoUrl: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFilters((prev) => ({ ...prev, pet: selectedPetId ?? 'all' }));
  }, [selectedPetId]);

  const filteredEntries = useMemo(() => {
    return journalEntries.filter((entry) => {
      if (filters.pet !== 'all' && entry.petId !== filters.pet) return false;
      if (filters.category !== 'all' && entry.category !== filters.category) return false;
      if (filters.tag && !entry.tags.some((tag) => tag.toLowerCase().includes(filters.tag.toLowerCase()))) return false;
      return true;
    });
  }, [journalEntries, filters]);

  const fieldClasses = (hasError: boolean) =>
    clsx(
      'mt-1 rounded-2xl border border-brand-border px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent',
      hasError && 'border-red-300 focus-visible:outline-red-400',
    );

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!formState.title.trim()) {
      nextErrors.title = 'Give your entry a title.';
    }
    if (!formState.content.trim()) {
      nextErrors.content = 'Share a few thoughts.';
    }
    if (!formState.date) {
      nextErrors.date = 'Pick a date.';
    }
    if (formState.photoUrl && !isValidUrl(formState.photoUrl)) {
      nextErrors.photoUrl = 'Enter a valid URL.';
    }
    return nextErrors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPetId) return;
    const nextErrors = validateForm();
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
      tags: formState.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      category: formState.category,
      photoUrl: formState.photoUrl,
    });
    setFormState((prev) => ({ ...prev, title: '', content: '', tags: '', photoUrl: '' }));
    setErrors({});
    pushToast({ tone: 'success', message: 'Journal entry saved.' });
  };

  return (
    <PageLayout title="Journal" subtitle="Capture the moments that make the day special">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" padding="lg">
          <div className="flex flex-wrap items-center gap-3">
            <TagChip variant="accent">{filteredEntries.length} entries</TagChip>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-brand-border px-3 py-1 text-xs font-semibold text-text-secondary md:hidden"
              onClick={() => setFiltersOpen((prev) => !prev)}
              aria-expanded={filtersOpen}
            >
              <Filter size={14} />
              Filters
            </button>
            <div className={`flex w-full flex-wrap gap-2 ${filtersOpen ? '' : 'hidden md:flex'}`}>
              <select
                className="rounded-2xl border border-brand-border px-3 py-2 text-sm"
                value={filters.pet}
                onChange={(event) => setFilters((prev) => ({ ...prev, pet: event.target.value }))}
              >
                <option value="all">All pets</option>
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name}
                  </option>
                ))}
              </select>
              <select
                className="rounded-2xl border border-brand-border px-3 py-2 text-sm"
                value={filters.category}
                onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
              <div className="flex items-center rounded-2xl border border-brand-border px-3">
                <Tags size={16} className="text-slate-400" />
                <input
                  className="ml-2 border-none text-sm focus:outline-none"
                  placeholder="Filter by tag"
                  value={filters.tag}
                  onChange={(event) => setFilters((prev) => ({ ...prev, tag: event.target.value }))}
                />
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="rounded-3xl border border-brand-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-brand-primary">{entry.title}</p>
                    <p className="text-xs text-text-muted">{formatDate(entry.date)}</p>
                  </div>
                  <TagChip>{entry.category}</TagChip>
                </div>
                <p className="mt-3 text-sm text-text-secondary">{entry.content}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.tags.map((tag) => (
                    <TagChip key={tag} variant="accent">
                      #{tag}
                    </TagChip>
                  ))}
                </div>
              </div>
            ))}
            {filteredEntries.length === 0 && (
              <p className="rounded-2xl bg-brand-subtle p-4 text-sm text-text-secondary">No entries match your filters yet.</p>
            )}
          </div>
        </Card>
        <Card padding="lg">
          <h3 className="text-lg font-semibold text-brand-primary">Add New Entry</h3>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <label className="flex flex-col text-sm font-medium text-brand-primary/90">
              Title
              <input
                className={fieldClasses(Boolean(errors.title))}
                value={formState.title}
                onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="A wonderful walk..."
                aria-invalid={Boolean(errors.title)}
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
            </label>
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
              Thoughts
              <textarea
                rows={5}
                className={fieldClasses(Boolean(errors.content))}
                value={formState.content}
                onChange={(event) => setFormState((prev) => ({ ...prev, content: event.target.value }))}
                aria-invalid={Boolean(errors.content)}
              />
              {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content}</p>}
            </label>
            <label className="flex flex-col text-sm font-medium text-brand-primary/90">
              Tags (comma separated)
              <input
                className={fieldClasses(false)}
                value={formState.tags}
                onChange={(event) => setFormState((prev) => ({ ...prev, tags: event.target.value }))}
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-brand-primary/90">
              Category
              <select
                className={fieldClasses(false)}
                value={formState.category}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, category: event.target.value as JournalCategory }))
                }
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm font-medium text-brand-primary/90">
              Photo URL
              <input
                className={fieldClasses(Boolean(errors.photoUrl))}
                value={formState.photoUrl}
                onChange={(event) => setFormState((prev) => ({ ...prev, photoUrl: event.target.value }))}
                aria-invalid={Boolean(errors.photoUrl)}
              />
              {errors.photoUrl && <p className="mt-1 text-xs text-red-500">{errors.photoUrl}</p>}
            </label>
            <PrimaryButton type="submit" startIcon={<PenSquare size={16} />}>Save Entry</PrimaryButton>
            <SecondaryButton
              type="button"
              startIcon={<Filter size={16} />}
              onClick={() => setFilters({ pet: 'all', category: 'all', tag: '' })}
            >
              Clear filters
            </SecondaryButton>
          </form>
        </Card>
      </div>
    </PageLayout>
  );
};
