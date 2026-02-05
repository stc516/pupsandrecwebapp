import { MapPinned, Sparkles, Star } from 'lucide-react';
import { useState } from 'react';

import type { ExplorePlace } from '../../types';

export const PlaceDetailsPanel = ({
  place,
}: {
  place: ExplorePlace | null;
}) => {
  const [showModal, setShowModal] = useState(false);

  if (!place) {
    return (
      <div className="rounded-2xl border border-dashed border-brand-border bg-white/70 p-4 text-sm text-text-secondary">
        Select a place to see details and directions.
      </div>
    );
  }

  const rulesQuery = `${place.name} leash rules dogs allowed`;
  const rulesUrl = `https://www.google.com/search?q=${encodeURIComponent(rulesQuery)}`;

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
        <a
          href={rulesUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1 text-xs font-semibold text-brand-primary transition hover:border-brand-accent"
        >
          Check rules
        </a>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1 text-xs font-semibold text-brand-primary transition hover:border-brand-accent"
        >
          <Sparkles size={12} />
          Add a Hidden Gem
        </button>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-brand-border bg-white p-4 shadow-lg">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary/70">Coming soon</p>
              <h4 className="text-lg font-semibold text-brand-primary">Community ideas</h4>
              <ul className="space-y-1 text-sm text-text-secondary">
                <li>• Add a Hidden Gem</li>
                <li>• Set up a doggy play date</li>
              </ul>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-full border border-brand-border px-3 py-1 text-xs font-semibold text-brand-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
