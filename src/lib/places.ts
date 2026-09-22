export interface PlaceResult {
  id: number; // stable unique key from the API
  name: string;
  country: string;
  admin1: string; // state/region, e.g. "California"
  latitude: number;
  longitude: number;
  population: number | null;
}

interface OpenMeteoGeocodingItem {
  id: number;
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  population?: number;
}

interface OpenMeteoGeocodingResponse {
  results?: OpenMeteoGeocodingItem[];
}

interface OpenMeteoErrorResponse {
  error: true;
  reason: string;
}

const API_BASE = "https://geocoding-api.open-meteo.com/v1/search";

/**
 * Thrown when the API responds successfully but with no matching locations.
 * Distinguished from network/server errors so the UI can show an
 * "empty results" state instead of an "error" state.
 */
export class NoResultsError extends Error {}

/**
 * Searches cities/places by (partial) name via Open-Meteo's free, no-auth
 * Geocoding API (https://open-meteo.com/en/docs/geocoding-api). Accepts an
 * AbortSignal so callers can cancel in-flight requests when a newer
 * keystroke supersedes this one.
 */
export async function searchPlaces(
  query: string,
  signal: AbortSignal,
): Promise<PlaceResult[]> {
  const url = `${API_BASE}?name=${encodeURIComponent(
    query,
  )}&count=10&language=en&format=json`;

  const response = await fetch(url, { signal });

  if (!response.ok) {
    // The API returns a JSON body with a `reason` even on 4xx errors.
    const body = (await response
      .json()
      .catch(() => null)) as OpenMeteoErrorResponse | null;
    throw new Error(
      body?.reason ?? `Request failed with status ${response.status}`,
    );
  }

  const data: OpenMeteoGeocodingResponse = await response.json();

  if (!data.results || data.results.length === 0) {
    // No `results` key at all is how this API signals "no matches".
    throw new NoResultsError(`No places found for "${query}"`);
  }

  return data.results.map((item) => ({
    id: item.id,
    name: item.name,
    country: item.country ?? "",
    admin1: item.admin1 ?? "",
    latitude: item.latitude,
    longitude: item.longitude,
    population: item.population ?? null,
  }));
}
