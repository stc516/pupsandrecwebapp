import clsx from 'clsx';
import type { ExploreCategory } from '../../types';

const categoryOptions: Array<{ id: ExploreCategory; label: string }> = [
  { id: 'dog_parks', label: 'Dog Parks' },
  { id: 'trails', label: 'Trails' },
  { id: 'parks', label: 'Parks' },
];

export const CategoryFilters = ({
  selected,
  onToggle,
}: {
  selected: ExploreCategory[];
  onToggle: (category: ExploreCategory) => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {categoryOptions.map((category) => {
      const isActive = selected.includes(category.id);
      return (
        <button
          key={category.id}
          type="button"
          onClick={() => onToggle(category.id)}
          className={clsx(
            'rounded-full px-3 py-1 text-xs font-semibold transition',
            isActive
              ? 'bg-brand-accent text-white shadow-sm'
              : 'border border-brand-border bg-white text-brand-primary hover:border-brand-accent',
          )}
        >
          {category.label}
        </button>
      );
    })}
  </div>
);

export const allExploreCategories = categoryOptions.map((category) => category.id);
export const exploreCategoryLabel = (category: ExploreCategory) =>
  categoryOptions.find((item) => item.id === category)?.label ?? category;
