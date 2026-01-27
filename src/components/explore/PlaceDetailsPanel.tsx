import { MapPinned, Star } from 'lucide-react';

import type { ExplorePlace } from '../../types';

export const PlaceDetailsPanel = ({
  place,
}: {
  place: ExplorePlace | null;
}) => {
  if (!place) {
    return (
      <div className="rounded-2xl border border-dashed border-brand-border bg-white/70 p-4 text-sm text-text-secondary">
        Select a place to see details and directions.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-border bg-white/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-brand-primary">{place.name}</p>
          <p className="mt-1 text-xs text-text-secondary">{place.address}</p>
        </div>
        {place.rating !== undefined && (
          <div className="flex items-center gap-1 text-xs font-semibold text-brand-primary">
            <Star size={12} className="text-amber-500" />
            {place.rating.toFixed(1)}
            {place.userRatingsTotal ? ` · ${place.userRatingsTotal}` : ''}
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={place.googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1 text-xs font-semibold text-brand-primary transition hover:border-brand-accent"
        >
          <MapPinned size={12} />
          Open in Maps
        </a>
      </div>
    </div>
  );
};
