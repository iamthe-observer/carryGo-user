import * as Location from 'expo-location';

import { ACCRA_QUICK_PLACES, APP_CONFIG } from '@/constants/config';
import { GeoPoint, LocationSelection } from '@/types/delivery';

const EARTH_RADIUS_KM = 6371;

export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function calculateBearing(from: GeoPoint, to: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const dLng = toRad(to.longitude - from.longitude);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function buildInterpolatedFallbackRoute(
  from: GeoPoint,
  to: GeoPoint,
  steps = 24
): GeoPoint[] {
  const points: GeoPoint[] = [];
  const midLat = (from.latitude + to.latitude) / 2;
  const midLng = (from.longitude + to.longitude) / 2;
  // Subtle road-like curve offset perpendicular to straight line
  const dLat = to.latitude - from.latitude;
  const dLng = to.longitude - from.longitude;
  const curveOffsetLat = -dLng * 0.08;
  const curveOffsetLng = dLat * 0.08;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const inv = 1 - t;
    const ctrlLat = midLat + curveOffsetLat;
    const ctrlLng = midLng + curveOffsetLng;
    points.push({
      latitude:
        inv * inv * from.latitude + 2 * inv * t * ctrlLat + t * t * to.latitude,
      longitude:
        inv * inv * from.longitude + 2 * inv * t * ctrlLng + t * t * to.longitude,
    });
  }
  return points;
}

export function interpolatePointOnRoute(
  route: GeoPoint[],
  progress: number
): { coordinate: GeoPoint; heading: number } {
  if (route.length === 0) {
    return {
      coordinate: {
        latitude: APP_CONFIG.defaultRegion.latitude,
        longitude: APP_CONFIG.defaultRegion.longitude,
      },
      heading: 0,
    };
  }
  if (route.length === 1) {
    return { coordinate: route[0], heading: 0 };
  }

  const clamped = Math.max(0, Math.min(1, progress));
  const scaled = clamped * (route.length - 1);
  const idx = Math.min(Math.floor(scaled), route.length - 2);
  const frac = scaled - idx;

  const p1 = route[idx];
  const p2 = route[idx + 1];

  const coordinate: GeoPoint = {
    latitude: p1.latitude + (p2.latitude - p1.latitude) * frac,
    longitude: p1.longitude + (p2.longitude - p1.longitude) * frac,
  };
  const heading = calculateBearing(p1, p2);
  return { coordinate, heading };
}

export async function fetchRoadRoute(
  from: GeoPoint,
  to: GeoPoint
): Promise<{
  coordinates: GeoPoint[];
  distanceKm: number;
  durationMinutes: number;
  isRoadRoute: boolean;
}> {
  const fallbackDistance = Math.max(0.6, haversineDistanceKm(from, to) * 1.24);
  const fallbackCoords = buildInterpolatedFallbackRoute(from, to, 28);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const url = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error('OSRM routing unavailable');
    }

    const data = await response.json();
    const route = data?.routes?.[0];
    if (!route?.geometry?.coordinates?.length) {
      throw new Error('No OSRM route found');
    }

    const coordinates: GeoPoint[] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => ({
        latitude: lat,
        longitude: lng,
      })
    );

    const distanceKm = Math.max(0.5, (route.distance ?? fallbackDistance * 1000) / 1000);
    const durationMinutes = Math.max(
      4,
      Math.round((route.duration ?? distanceKm * 150) / 60)
    );

    return {
      coordinates,
      distanceKm,
      durationMinutes,
      isRoadRoute: true,
    };
  } catch {
    return {
      coordinates: fallbackCoords,
      distanceKm: fallbackDistance,
      durationMinutes: Math.max(5, Math.round((fallbackDistance / 24) * 60)),
      isRoadRoute: false,
    };
  }
}

export async function searchPlaces(query: string): Promise<LocationSelection[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return ACCRA_QUICK_PLACES.map((p) => ({
      label: p.label,
      addressLine: p.addressLine,
      latitude: p.latitude,
      longitude: p.longitude,
    }));
  }

  const localMatches = ACCRA_QUICK_PLACES.filter(
    (p) =>
      p.label.toLowerCase().includes(trimmed.toLowerCase()) ||
      p.addressLine.toLowerCase().includes(trimmed.toLowerCase())
  ).map((p) => ({
    label: p.label,
    addressLine: p.addressLine,
    latitude: p.latitude,
    longitude: p.longitude,
  }));

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const encoded = encodeURIComponent(trimmed);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=${APP_CONFIG.countryBias}&limit=6&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'CarryGo-Expo-App/1.0',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return localMatches;
    }

    const items = (await res.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
      name?: string;
    }>;

    const remoteMatches: LocationSelection[] = items.map((item) => {
      const parts = item.display_name.split(',').map((s) => s.trim());
      const label = item.name || parts[0] || trimmed;
      const addressLine = parts.slice(0, 3).join(', ');
      return {
        label,
        addressLine,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      };
    });

    // Combine unique results with local Accra matches first if relevant
    const combined = [...localMatches];
    for (const r of remoteMatches) {
      const exists = combined.some(
        (c) =>
          Math.abs(c.latitude - r.latitude) < 0.001 &&
          Math.abs(c.longitude - r.longitude) < 0.001
      );
      if (!exists) {
        combined.push(r);
      }
    }
    return combined;
  } catch {
    return localMatches;
  }
}

export async function reverseGeocodePoint(
  point: GeoPoint
): Promise<LocationSelection> {
  try {
    const native = await Location.reverseGeocodeAsync(point);
    if (native && native.length > 0) {
      const first = native[0];
      const street = [first.streetNumber, first.street].filter(Boolean).join(' ');
      const area = first.district || first.subregion || first.city || 'Accra';
      const label = first.name || street || area;
      const addressLine = [street || first.name, area, first.region]
        .filter(Boolean)
        .join(', ');
      if (addressLine) {
        return {
          label,
          addressLine,
          latitude: point.latitude,
          longitude: point.longitude,
        };
      }
    }
  } catch {
    // Fall back to Nominatim or coordinate label
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${point.latitude}&lon=${point.longitude}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CarryGo-Expo-App/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data?.display_name) {
        const parts = String(data.display_name)
          .split(',')
          .map((s) => s.trim());
        return {
          label: parts[0] || 'Pinned Location',
          addressLine: parts.slice(0, 3).join(', '),
          latitude: point.latitude,
          longitude: point.longitude,
        };
      }
    }
  } catch {
    // Ignore
  }

  return {
    label: 'Pinned Location',
    addressLine: `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`,
    latitude: point.latitude,
    longitude: point.longitude,
  };
}

export async function getCurrentUserLocation(): Promise<LocationSelection | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const point = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    };
    return await reverseGeocodePoint(point);
  } catch {
    return null;
  }
}
