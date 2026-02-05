import { AlertTriangle, LocateFixed, RefreshCcw, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Card } from '../../components/ui/Card';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
import { PageLayout } from '../../layouts/PageLayout';
import { CategoryFilters, allExploreCategories } from '../../components/explore/CategoryFilters';
import { PlaceCard } from '../../components/explore/PlaceCard';
import { PlaceDetailsPanel } from '../../components/explore/PlaceDetailsPanel';
import { fetchDogPlaces, geocodeLocation, loadGoogleMaps } from '../../lib/places';
import type { ExploreCategory, ExplorePlace } from '../../types';

type LatLng = { lat: number; lng: number };

const DEFAULT_RADIUS_METERS = 5000;
const MAX_RESULTS = 20;

export const ExplorePage = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [center, setCenter] = useState<LatLng | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'ready' | 'denied' | 'error'>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualQuery, setManualQuery] = useState('');
  const [filters, setFilters] = useState<ExploreCategory[]>(allExploreCategories);
  const [places, setPlaces] = useState<ExplorePlace[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const googleRef = useRef<typeof google | null>(null);
  const debounceRef = useRef<number | null>(null);
  const fetchIdRef = useRef(0);
  const hasFetchedRef = useRef(false);

  const selectedPlace = useMemo(
    () => places.find((place) => place.id === selectedPlaceId) ?? null,
    [places, selectedPlaceId],
  );

  useEffect(() => {
    if (!apiKey) return;
    const maskedKey = apiKey.length > 8 ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : 'set';
    if (import.meta.env.DEV) {
      // Temporary diagnostics for Google Maps key presence.
      // eslint-disable-next-line no-console
      console.info(`[Explore] Maps key present=${Boolean(apiKey)} key=${maskedKey}`);
    }
    loadGoogleMaps()
      .then((googleMaps) => {
        googleRef.current = googleMaps;
        setMapsReady(true);
      })
      .catch((error: unknown) => {
        setFetchError(error instanceof Error ? error.message : 'Map failed to load.');
      });
  }, [apiKey]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationError('Location services are unavailable on this device.');
      return;
    }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationStatus('ready');
        setLocationError(null);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('denied');
          setLocationError('Location access was blocked. Enter a city or zip instead.');
        } else {
          setLocationStatus('error');
          setLocationError('Unable to get your location. Try again.');
        }
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    requestLocation();
  }, [apiKey, requestLocation]);

  useEffect(() => {
    if (!mapsReady || !googleRef.current || !center || !mapContainerRef.current) return;
    if (!mapRef.current) {
      mapRef.current = new googleRef.current.maps.Map(mapContainerRef.current, {
        center,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
      });
    } else {
      mapRef.current.setCenter(center);
    }
  }, [center, mapsReady]);

  const toggleFilter = (category: ExploreCategory) => {
    setFilters((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category],
    );
  };

  const updateMarkers = useCallback(
    (nextPlaces: ExplorePlace[]) => {
      if (!googleRef.current || !mapRef.current) return;
      const googleMaps = googleRef.current;
      const nextIds = new Set(nextPlaces.map((place) => place.id));

      markersRef.current.forEach((marker, id) => {
        if (!nextIds.has(id)) {
          marker.setMap(null);
          markersRef.current.delete(id);
        }
      });

      const makeIcon = (isSelected: boolean) => ({
        path: googleMaps.maps.SymbolPath.CIRCLE,
        fillColor: isSelected ? '#2563eb' : '#111827',
        fillOpacity: 0.9,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: isSelected ? 8 : 6,
      });

      nextPlaces.forEach((place) => {
        const isSelected = place.id === selectedPlaceId;
        const existing = markersRef.current.get(place.id);
        if (existing) {
          existing.setIcon(makeIcon(isSelected));
          existing.setZIndex(isSelected ? 2 : 1);
          return;
        }
        const marker = new googleMaps.maps.Marker({
          map: mapRef.current,
          position: { lat: place.lat, lng: place.lng },
          title: place.name,
          icon: makeIcon(isSelected),
        });
        marker.addListener('click', () => setSelectedPlaceId(place.id));
        markersRef.current.set(place.id, marker);
      });
    },
    [selectedPlaceId],
  );

  useEffect(() => {
    updateMarkers(places);
  }, [places, updateMarkers]);

  const fetchPlaces = useCallback(
    async (nextCenter: LatLng, reason: 'initial' | 'refresh' | 'filters', query?: string) => {
      if (filters.length === 0) {
        setPlaces([]);
        setSelectedPlaceId(null);
        setFetchError('Select at least one category to see results.');
        updateMarkers([]);
        return;
      }
      const requestId = ++fetchIdRef.current;
      setIsFetching(true);
      setFetchError(null);
      try {
        const results = await fetchDogPlaces({
          lat: nextCenter.lat,
          lng: nextCenter.lng,
          radiusMeters: DEFAULT_RADIUS_METERS,
          categories: filters,
          query,
        });
        if (requestId !== fetchIdRef.current) return;
        const limited = results.slice(0, MAX_RESULTS);
        setPlaces(limited);
        updateMarkers(limited);
        if (selectedPlaceId && !limited.find((place) => place.id === selectedPlaceId)) {
          setSelectedPlaceId(limited[0]?.id ?? null);
        }
        if (limited.length === 0 && reason !== 'filters') {
          setFetchError('No places found nearby. Try a different area.');
        }
      } catch (error) {
        if (requestId !== fetchIdRef.current) return;
        setFetchError(error instanceof Error ? error.message : 'Unable to load places.');
      } finally {
        if (requestId === fetchIdRef.current) {
          setIsFetching(false);
        }
      }
    },
    [filters, selectedPlaceId, updateMarkers],
  );

  useEffect(() => {
    if (!center) return;
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    const reason: 'initial' | 'filters' = hasFetchedRef.current ? 'filters' : 'initial';
    debounceRef.current = window.setTimeout(() => {
      void fetchPlaces(center, reason, manualQuery.trim());
    }, 350);
    hasFetchedRef.current = true;
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [center, fetchPlaces, filters, manualQuery]);

  useEffect(() => {
    if (!selectedPlace || !mapRef.current) return;
    mapRef.current.panTo({ lat: selectedPlace.lat, lng: selectedPlace.lng });
  }, [selectedPlace]);

  const handleRefresh = () => {
    const mapCenter = mapRef.current?.getCenter();
    const nextCenter = mapCenter ? { lat: mapCenter.lat(), lng: mapCenter.lng() } : center;
    if (!nextCenter) return;
    setCenter(nextCenter);
    void fetchPlaces(nextCenter, 'refresh', manualQuery.trim());
  };

  const handleManualSearch = async () => {
    const rawQuery = manualQuery.trim();
    if (!rawQuery && !center) return;
    setIsGeocoding(true);
    setFetchError(null);
    let nextCenter = center;
    if (rawQuery) {
      try {
        const result = await geocodeLocation(rawQuery);
        nextCenter = { lat: result.lat, lng: result.lng };
        setCenter(nextCenter);
        setLocationStatus('ready');
        setLocationError(null);
      } catch (error) {
        if (!center) {
          setFetchError(error instanceof Error ? error.message : 'Unable to find that location.');
          setIsGeocoding(false);
          return;
        }
      }
    }
    if (nextCenter) {
      void fetchPlaces(nextCenter, 'initial', rawQuery);
    }
    setIsGeocoding(false);
  };

  if (!apiKey) {
    return (
      <PageLayout title="Find a Walk" subtitle="Discover dog-friendly places nearby.">
        <Card className="border border-amber-200 bg-amber-50 text-sm text-amber-900">
          Map is not configured yet. Add a Google Maps API key to enable Explore.
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Find a Walk" subtitle="Discover dog-friendly places nearby.">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <Card className="relative overflow-hidden" padding="none">
          <div className="h-[60vh] w-full lg:h-full">
            <div ref={mapContainerRef} className="h-full w-full bg-brand-subtle/40" />
          </div>
          {isFetching && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-semibold text-brand-primary">
              Loading places…
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card padding="lg">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary/70">Search area</p>
                <div className="flex flex-wrap gap-2">
                  <input
                    value={manualQuery}
                    onChange={(event) => setManualQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void handleManualSearch();
                      }
                    }}
                    placeholder="Search dog parks, beaches, trails…"
                    className="flex-1 rounded-xl border border-brand-border px-3 py-2 text-sm text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
                  />
                  <PrimaryButton
                    type="button"
                    onClick={handleManualSearch}
                    disabled={isGeocoding}
                    startIcon={<Search size={14} />}
                  >
                    Search
                  </PrimaryButton>
                </div>
                {locationError && (
                  <p className="flex items-center gap-2 text-xs font-semibold text-brand-primary">
                    <AlertTriangle size={14} />
                    {locationError}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary/70">Filters</p>
                  <p className="text-sm text-text-secondary">Choose what you want to explore.</p>
                </div>
                <SecondaryButton
                  type="button"
                  onClick={handleRefresh}
                  startIcon={<RefreshCcw size={14} />}
                  disabled={!center || isFetching}
                >
                  Refresh this area
                </SecondaryButton>
              </div>
              <CategoryFilters selected={filters} onToggle={toggleFilter} />
              <p className="text-xs text-text-secondary">
                Leash rules vary—tap a place to check signage or official rules.
              </p>
              {locationStatus === 'loading' && (
                <div className="rounded-2xl border border-brand-border bg-white/80 px-3 py-2 text-xs text-text-secondary">
                  Finding your location…
                </div>
              )}
              {locationStatus === 'ready' && (
                <button
                  type="button"
                  onClick={requestLocation}
                  className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1 text-xs font-semibold text-brand-primary"
                >
                  <LocateFixed size={12} />
                  Use my location
                </button>
              )}
            </div>
          </Card>

          <Card padding="lg" className="flex-1 overflow-hidden">
            <div className="space-y-3">
              <PlaceDetailsPanel place={selectedPlace} />
              <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1 lg:max-h-[54vh]">
                {fetchError && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    {fetchError}
                  </div>
                )}
                {!fetchError && !isFetching && places.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-brand-border bg-white/70 p-4 text-sm text-text-secondary">
                    No places to show yet. Try refreshing this area.
                  </div>
                )}
                {places.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    selected={place.id === selectedPlaceId}
                    onSelect={setSelectedPlaceId}
                  />
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};
