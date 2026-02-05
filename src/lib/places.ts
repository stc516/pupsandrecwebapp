import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

import type { ExploreCategory, ExplorePlace } from '../types';

const categoryConfig: Record<ExploreCategory, { label: string; type?: string; keyword?: string }> = {
  dog_parks: { label: 'Dog Parks', type: 'dog_park' },
  trails: { label: 'Trails', keyword: 'trail', type: 'park' },
  parks: { label: 'Parks', type: 'park' },
};

let optionsSet = false;

const getMapsApiKey = () => import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const excludedTypes = new Set([
  'hospital',
  'doctor',
  'dentist',
  'pharmacy',
  'school',
  'university',
  'place_of_worship',
  'bank',
  'atm',
  'restaurant',
  'store',
  'shopping_mall',
  'lodging',
  'supermarket',
  'department_store',
  'clothing_store',
  'electronics_store',
  'furniture_store',
  'home_goods_store',
  'bar',
  'night_club',
  'movie_theater',
]);

const trailTypes = new Set(['hiking_area', 'park', 'campground', 'natural_feature']);
const trailKeywords = /(trail|hike|open space|preserve|canyon|loop|path|greenway|nature|bluffs|mesa)/i;
const dogIntentKeywords = /(dog park|off leash|off-leash|dog beach|leash[- ]free|dog run)/i;
const dogBeachKeywords = /dog beach/i;
const dogParkKeywords = /(dog park|off leash|off-leash|leash[- ]free|dog run)/i;
const excludedNameKeywords = /(hospital|medical|clinic|urgent care|er|pharmacy)/i;

export const loadGoogleMaps = async () => {
  const apiKey = getMapsApiKey();
  if (!apiKey) {
    throw new Error('Google Maps API key is missing.');
  }
  if (!optionsSet) {
    setOptions({
      key: apiKey,
      libraries: ['places'],
    });
    optionsSet = true;
  }
  await importLibrary('maps');
  await importLibrary('places');
  return window.google;
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const getDistanceMeters = (from: google.maps.LatLngLiteral, to: google.maps.LatLngLiteral) => {
  const earthRadius = 6371000;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

const buildGoogleMapsUrl = (place: google.maps.places.PlaceResult) => {
  if (place.place_id) {
    const query = place.name ?? place.vicinity ?? 'Dog friendly place';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}&query_place_id=${place.place_id}`;
  }
  const location = place.geometry?.location;
  if (location) {
    return `https://www.google.com/maps/search/?api=1&query=${location.lat()},${location.lng()}`;
  }
  return 'https://www.google.com/maps';
};

const isExcludedPlace = (place: google.maps.places.PlaceResult) => {
  const types = place.types ?? [];
  if (types.some((type) => excludedTypes.has(type))) return true;
  const name = `${place.name ?? ''} ${place.vicinity ?? ''}`.trim();
  return excludedNameKeywords.test(name);
};

const getPlaceCategories = (place: google.maps.places.PlaceResult): ExploreCategory[] => {
  const types = new Set(place.types ?? []);
  const name = (place.name ?? '').toLowerCase();
  const categories: ExploreCategory[] = [];

  const isDogPark = types.has('dog_park') || dogParkKeywords.test(name);
  const isTrail = [...trailTypes].some((type) => types.has(type)) && trailKeywords.test(name);
  const isPark = types.has('park');
  const isDogBeach = dogBeachKeywords.test(name);

  if (isDogPark) {
    categories.push('dog_parks');
  }
  if (isDogBeach) {
    categories.push('trails');
  }
  if (isTrail) {
    categories.push('trails');
  }
  if (isPark) {
    categories.push('parks');
  }

  return Array.from(new Set(categories));
};

const normalizePlace = (
  place: google.maps.places.PlaceResult,
  center: google.maps.LatLngLiteral,
): ExplorePlace | null => {
  const location = place.geometry?.location;
  if (!location || !place.place_id || !place.name) return null;
  const lat = location.lat();
  const lng = location.lng();
  return {
    id: place.place_id,
    name: place.name,
    lat,
    lng,
    address: place.vicinity ?? place.formatted_address ?? 'Address unavailable',
    rating: place.rating ?? undefined,
    userRatingsTotal: place.user_ratings_total ?? undefined,
    types: place.types ?? [],
    googleMapsUrl: place.url ?? buildGoogleMapsUrl(place),
    distanceMeters: getDistanceMeters(center, { lat, lng }),
  };
};

const requestNearbySearch = (
  service: google.maps.places.PlacesService,
  request: google.maps.places.PlaceSearchRequest,
) =>
  new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
    service.nearbySearch(request, (results, status) => {
      if (
        status === google.maps.places.PlacesServiceStatus.OK ||
        status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS
      ) {
        resolve(results ?? []);
        return;
      }
      reject(new Error(`Places request failed: ${status}`));
    });
  });

const requestTextSearch = (
  service: google.maps.places.PlacesService,
  request: google.maps.places.TextSearchRequest,
) =>
  new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
    service.textSearch(request, (results, status) => {
      if (
        status === google.maps.places.PlacesServiceStatus.OK ||
        status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS
      ) {
        resolve(results ?? []);
        return;
      }
      reject(new Error(`Places text search failed: ${status}`));
    });
  });

export const fetchNearbyPlaces = async ({
  lat,
  lng,
  radiusMeters,
  includedTypes,
}: {
  lat: number;
  lng: number;
  radiusMeters: number;
  includedTypes: ExploreCategory[];
}): Promise<ExplorePlace[]> => {
  const googleMaps = await loadGoogleMaps();
  const center = { lat, lng };
  const service = new googleMaps.maps.places.PlacesService(document.createElement('div'));

  const categories = includedTypes.length > 0 ? includedTypes : (Object.keys(categoryConfig) as ExploreCategory[]);
  const resultsMap = new Map<string, ExplorePlace>();

  for (const category of categories) {
    const config = categoryConfig[category];
    const request: google.maps.places.PlaceSearchRequest = {
      location: center,
      radius: radiusMeters,
      type: config.type,
      keyword: config.keyword,
    };
    const results = await requestNearbySearch(service, request);
    results.forEach((place) => {
      if (isExcludedPlace(place)) return;
      const placeCategories = getPlaceCategories(place);
      const allowedCategories = placeCategories.filter((category) => categories.includes(category));
      if (allowedCategories.length === 0) return;
      const normalized = normalizePlace(place, center);
      if (!normalized) return;
      const existing = resultsMap.get(normalized.id);
      if (existing) {
        const nextCategories = new Set([...(existing.categories ?? []), ...allowedCategories]);
        resultsMap.set(normalized.id, { ...existing, categories: Array.from(nextCategories) });
        return;
      }
      resultsMap.set(normalized.id, { ...normalized, categories: allowedCategories });
    });
  }

  return Array.from(resultsMap.values()).sort((a, b) => {
    if (a.distanceMeters !== undefined && b.distanceMeters !== undefined) {
      return a.distanceMeters - b.distanceMeters;
    }
    return a.name.localeCompare(b.name);
  });
};

export const fetchDogPlaces = async ({
  lat,
  lng,
  radiusMeters,
  categories,
  query,
}: {
  lat: number;
  lng: number;
  radiusMeters: number;
  categories: ExploreCategory[];
  query?: string;
}): Promise<ExplorePlace[]> => {
  const googleMaps = await loadGoogleMaps();
  const center = { lat, lng };
  const service = new googleMaps.maps.places.PlacesService(document.createElement('div'));
  const selectedCategories = categories.length > 0 ? categories : (Object.keys(categoryConfig) as ExploreCategory[]);

  const queries = new Set<string>();
  const baseQuery = query?.trim() || 'dog park';
  queries.add(baseQuery);

  if (selectedCategories.includes('dog_parks')) {
    queries.add('dog park');
    queries.add('off leash dog park');
  }
  if (selectedCategories.includes('trails')) {
    queries.add('dog friendly trail');
    queries.add('hiking trail dogs allowed');
    queries.add('dog beach');
  }
  if (selectedCategories.includes('parks')) {
    queries.add('dog friendly park');
  }

  const resultsMap = new Map<string, ExplorePlace>();

  for (const searchQuery of queries) {
    const results = await requestTextSearch(service, {
      query: searchQuery,
      location: center,
      radius: radiusMeters,
    });

    results.forEach((place) => {
      if (isExcludedPlace(place)) return;
      const name = `${place.name ?? ''} ${place.vicinity ?? ''}`.toLowerCase();
      const types = new Set(place.types ?? []);
      const isTrailMatch = [...trailTypes].some((type) => types.has(type)) && trailKeywords.test(name);
      const allowlistMatch = types.has('dog_park') || dogIntentKeywords.test(name) || isTrailMatch;
      if (!allowlistMatch) return;

      const placeCategories = getPlaceCategories(place);
      const allowedCategories = placeCategories.filter((category) => selectedCategories.includes(category));
      if (allowedCategories.length === 0) return;

      const normalized = normalizePlace(place, center);
      if (!normalized) return;
      const existing = resultsMap.get(normalized.id);
      if (existing) {
        const nextCategories = new Set([...(existing.categories ?? []), ...allowedCategories]);
        resultsMap.set(normalized.id, { ...existing, categories: Array.from(nextCategories) });
        return;
      }
      resultsMap.set(normalized.id, { ...normalized, categories: allowedCategories });
    });
  }

  return Array.from(resultsMap.values()).sort((a, b) => {
    if (a.distanceMeters !== undefined && b.distanceMeters !== undefined) {
      return a.distanceMeters - b.distanceMeters;
    }
    return a.name.localeCompare(b.name);
  });
};

export const geocodeLocation = async (query: string) => {
  const googleMaps = await loadGoogleMaps();
  const geocoder = new googleMaps.maps.Geocoder();
  const response = await geocoder.geocode({ address: query });
  const result = response.results?.[0];
  if (!result) {
    throw new Error('No results found for that location.');
  }
  const location = result.geometry.location;
  return {
    lat: location.lat(),
    lng: location.lng(),
    formattedAddress: result.formatted_address,
  };
};
