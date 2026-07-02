import { LatLng, TravelMode } from './types';

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

export type GeocodeResult = {
  formatted: string;
  location: LatLng;
};

export type Suggestion = {
  placeId: string;
  description: string;
};

export type ComputedRoute = {
  /** ordem de visita: índices dos waypoints originais */
  order: number[];
  /** legs[0] = origem→1ª parada ... legs[n] = última parada→destino */
  legs: { durationSec: number; distanceMeters: number }[];
  totalDurationSec: number;
  totalDistanceMeters: number;
  travelMode: TravelMode;
};

function query(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

function parseSeconds(duration: string | undefined): number {
  if (!duration) return 0;
  const n = parseInt(duration.replace('s', ''), 10);
  return Number.isFinite(n) ? n : 0;
}

async function geocode(params: Record<string, string>, apiKey: string): Promise<GeocodeResult> {
  const res = await fetch(`${GEOCODE_URL}?${query({ ...params, key: apiKey, region: 'br', language: 'pt-BR' })}`);
  const data = await res.json();
  if (data.status === 'REQUEST_DENIED' || data.status === 'OVER_QUERY_LIMIT') {
    throw new Error(data.error_message || 'Chave de API inválida ou sem permissão para a Geocoding API.');
  }
  if (data.status !== 'OK' || !data.results?.length) {
    throw new Error('Endereço não encontrado. Confira e tente ser mais específico (rua, número, cidade).');
  }
  const r = data.results[0];
  return {
    formatted: r.formatted_address,
    location: { lat: r.geometry.location.lat, lng: r.geometry.location.lng },
  };
}

export function geocodeAddress(address: string, apiKey: string): Promise<GeocodeResult> {
  return geocode({ address }, apiKey);
}

export function geocodePlaceId(placeId: string, apiKey: string): Promise<GeocodeResult> {
  return geocode({ place_id: placeId }, apiKey);
}

/**
 * Autocomplete de endereços (Places API New). Falha de forma silenciosa:
 * se a API não estiver habilitada na chave, o app segue funcionando só com a Geocoding.
 */
export async function autocompleteAddress(
  input: string,
  apiKey: string,
  bias?: LatLng
): Promise<Suggestion[]> {
  try {
    const body: Record<string, unknown> = {
      input,
      languageCode: 'pt-BR',
      regionCode: 'BR',
    };
    if (bias) {
      body.locationBias = {
        circle: {
          center: { latitude: bias.lat, longitude: bias.lng },
          radius: 30000,
        },
      };
    }
    const res = await fetch(AUTOCOMPLETE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const suggestions: Suggestion[] = [];
    for (const s of data.suggestions ?? []) {
      const p = s.placePrediction;
      if (p?.placeId && p?.text?.text) {
        suggestions.push({ placeId: p.placeId, description: p.text.text });
      }
    }
    return suggestions;
  } catch {
    return [];
  }
}

function toWaypoint(location: LatLng) {
  return {
    location: {
      latLng: { latitude: location.lat, longitude: location.lng },
    },
  };
}

/**
 * Calcula a rota otimizada com trânsito em tempo real (Routes API v2).
 * Se o modo TWO_WHEELER (moto) não estiver disponível na região/chave,
 * tenta automaticamente com DRIVE (carro).
 */
export async function computeOptimizedRoute(
  origin: LatLng,
  destination: LatLng,
  waypoints: LatLng[],
  travelMode: TravelMode,
  apiKey: string
): Promise<ComputedRoute> {
  const body = {
    origin: toWaypoint(origin),
    destination: toWaypoint(destination),
    intermediates: waypoints.map(toWaypoint),
    travelMode,
    routingPreference: 'TRAFFIC_AWARE',
    optimizeWaypointOrder: waypoints.length > 1,
    languageCode: 'pt-BR',
    units: 'METRIC',
  };
  const res = await fetch(ROUTES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'routes.duration,routes.distanceMeters,routes.legs.duration,routes.legs.distanceMeters,routes.optimizedIntermediateWaypointIndex',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  if (!res.ok) {
    const message: string = data?.error?.message ?? 'Falha ao calcular a rota.';
    // Modo moto não é suportado em todas as regiões — cai para carro.
    if (travelMode === 'TWO_WHEELER' && res.status === 400 && /travel[_ ]?mode|two.?wheeler/i.test(message)) {
      return computeOptimizedRoute(origin, destination, waypoints, 'DRIVE', apiKey);
    }
    if (res.status === 403 || /api key/i.test(message)) {
      throw new Error(
        'A chave de API foi recusada. Confira em Ajustes se a chave está correta e se a "Routes API" está habilitada no Google Cloud.'
      );
    }
    throw new Error(message);
  }

  const route = data.routes?.[0];
  if (!route || !route.legs?.length) {
    throw new Error('O Google não encontrou uma rota entre esses pontos. Confira os endereços.');
  }

  const legs = route.legs.map((leg: { duration?: string; distanceMeters?: number }) => ({
    durationSec: parseSeconds(leg.duration),
    distanceMeters: leg.distanceMeters ?? 0,
  }));

  const order: number[] =
    route.optimizedIntermediateWaypointIndex ?? waypoints.map((_, i) => i);

  return {
    order,
    legs,
    totalDurationSec: parseSeconds(route.duration),
    totalDistanceMeters: route.distanceMeters ?? 0,
    travelMode,
  };
}
