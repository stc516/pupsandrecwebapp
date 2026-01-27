import { Loader } from '@googlemaps/js-api-loader';

import type { ExploreCategory, ExplorePlace } from '../types';

const categoryConfig: Record<ExploreCategory, { label: string; type?: string; keyword?: string }> = {
  dog_parks: { label: 'Dog Parks', type: 'dog_park' },
  trails: { label: 'Trails', keyword: 'trail', type: 'park' },
  parks: { label: 'Parks', type: 'park' },
};

let loader: Loader | null = null;

const getMapsApiKey = () => import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export const loadGoogleMaps = async () => {
  const apiKey = getMapsApiKey();
  if (!apiKey) {
    throw new Error('Google Maps API key is missing.');
  }
  if (!loader) {
    loader = new Loader({
      apiKey,
      libraries: ['places'],
    });
  }
  return loader.load();
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
      if (status === google.maps.places.PlacesServiceStatus.OK || status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        resolve(results ?? []);
        return;
      }
      reject(new Error(`Places request failed: ${status}`));
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
      const normalized = normalizePlace(place, center);
      if (!normalized) return;
      const existing = resultsMap.get(normalized.id);
      if (existing) {
        const nextCategories = new Set([...(existing.categories ?? []), category]);
        resultsMap.set(normalized.id, { ...existing, categories: Array.from(nextCategories) });
        return;
      }
      resultsMap.set(normalized.id, { ...normalized, categories: [category] });
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
