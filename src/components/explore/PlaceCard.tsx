import clsx from 'clsx';
import { Star } from 'lucide-react';

import { TagChip } from '../ui/Tag';
import type { ExplorePlace } from '../../types';
import { exploreCategoryLabel } from './CategoryFilters';

const formatDistance = (meters?: number) => {
  if (!meters && meters !== 0) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

export const PlaceCard = ({
  place,
  selected,
  onSelect,
}: {
  place: ExplorePlace;
  selected: boolean;
  onSelect: (placeId: string) => void;
}) => {
  const distanceLabel = formatDistance(place.distanceMeters);
  const categoryLabel = place.categories?.[0] ? exploreCategoryLabel(place.categories[0]) : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(place.id)}
      className={clsx(
        'w-full rounded-2xl border px-4 py-3 text-left text-sm transition',
        selected
          ? 'border-brand-accent bg-brand-accent/10 shadow-sm'
          : 'border-brand-border bg-white hover:border-brand-accent',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-brand-primary">{place.name}</p>
          {place.address && <p className="text-xs text-text-secondary">{place.address}</p>}
        </div>
        {distanceLabel && (
          <span className="rounded-full border border-brand-border bg-white px-2 py-1 text-xs font-semibold text-text-secondary">
            {distanceLabel}
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
        {categoryLabel && <TagChip>{categoryLabel}</TagChip>}
        {place.rating !== undefined && (
          <span className="flex items-center gap-1 rounded-full border border-brand-border bg-white px-2 py-1 font-semibold text-brand-primary">
            <Star size={12} className="text-amber-500" />
            {place.rating.toFixed(1)}
            {place.userRatingsTotal ? ` · ${place.userRatingsTotal}` : ''}
          </span>
        )}
      </div>
    </button>
  );
};
