export interface GeoPosition { lat: number; lng: number; }

export interface ReverseGeocodeResult {
  address: string;
  isApproximate: boolean;
  provider: 'google' | 'bigdatacloud' | 'nominatim' | 'coordinates';
}

export function haversineKm(a: GeoPosition, b: GeoPosition): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s1 = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1));
}
function toRad(x: number) { return (x * Math.PI) / 180; }

export const MAP_LAYERS = {
  googleRoadmap: {
    id: 'googleRoadmap',
    name: 'Google Maps',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer">Google Maps</a>',
    maxZoom: 20,
  },
  googleHybrid: {
    id: 'googleHybrid',
    name: 'Google Satellite',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer">Google Maps</a>',
    maxZoom: 20,
  },
  osm: {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
} as const;

// In-memory cache for ultra-fast location re-use
const reverseGeocodeCache = new Map<string, ReverseGeocodeResult>();
const forwardGeocodeCache = new Map<string, { lat: number; lng: number; address: string }>();

/**
 * High-performance browser geolocation.
 * Uses sensible caching (60s) and fast fallback to prevent desktop browser freezing or long timeouts.
 */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    const validateAndResolve = (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
        reject(new Error('Invalid coordinates received from device.'));
        return;
      }
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        reject(new Error(`Coordinates out of range: lat=${latitude}, lng=${longitude}`));
        return;
      }
      resolve(pos);
    };

    // First attempt: fast response with 30s cache allowance
    navigator.geolocation.getCurrentPosition(
      validateAndResolve,
      (_firstErr) => {
        // Fallback: standard accuracy with longer maximumAge returns instantly on Wi-Fi/IP
        navigator.geolocation.getCurrentPosition(
          validateAndResolve,
          (fallbackErr) => {
            console.warn('[Geolocation] Fallback request failed:', fallbackErr);
            reject(fallbackErr);
          },
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 300000, // 5 min cache
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 4500, // Quick timeout (4.5s) to avoid UI hang
        maximumAge: 30000, // 30s cache gives instant response
      }
    );
  });
}

export function geoErrorToMessage(err: GeolocationPositionError | Error): string {
  if ('code' in err) {
    switch (err.code) {
      case 1: return 'Location permission was denied. Please allow location access in your browser or type your address manually.';
      case 2: return 'Position unavailable. Your device could not determine your current position. Please try again or type an address.';
      case 3: return 'Location request timed out. Please click "Use My Current Location" to try again or enter your address manually.';
      default: return 'Unable to get your location.';
    }
  }
  return err.message || 'Unable to get your location.';
}

const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
export const hasValidGoogleKey = typeof googleMapsKey === 'string' &&
  googleMapsKey.trim().length > 0 &&
  !googleMapsKey.includes('YOUR_GOOGLE_MAPS_API_KEY');

/**
 * Ultra-fast reverse geocoding with multi-tier fallback:
 * 1. Cache hit (0ms)
 * 2. Google Maps (if key present)
 * 3. BigDataCloud client API (free, ~100-200ms, optimized for Indian/global CDNs)
 * 4. OpenStreetMap Nominatim with strict 2.5s timeout
 * 5. Instant clean fallback
 */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (reverseGeocodeCache.has(cacheKey)) {
    return reverseGeocodeCache.get(cacheKey)!;
  }

  // 1. Google Maps Geocoding API if key configured
  if (hasValidGoogleKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsKey}`;
      const gRes = await fetch(gUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData.status === 'OK' && gData.results?.[0]) {
          const first = gData.results[0];
          const result: ReverseGeocodeResult = {
            address: first.formatted_address,
            isApproximate: first.geometry?.location_type === 'APPROXIMATE',
            provider: 'google',
          };
          reverseGeocodeCache.set(cacheKey, result);
          return result;
        }
      }
    } catch {}
  }

  // 2. BigDataCloud Client Reverse Geocode API (fast client CDN endpoint, no API key needed, <200ms)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const res = await fetch(bdcUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const locality = data.locality || data.localityInfo?.administrative?.[3]?.name;
      const city = data.city || data.principalSubdivision;
      const state = data.principalSubdivision;
      const parts = [locality, city, state].filter(Boolean);
      // Remove duplicates
      const uniqueParts = Array.from(new Set(parts));

      if (uniqueParts.length > 0) {
        const result: ReverseGeocodeResult = {
          address: uniqueParts.join(', '),
          isApproximate: false,
          provider: 'bigdatacloud',
        };
        reverseGeocodeCache.set(cacheKey, result);
        return result;
      }
    }
  } catch {}

  // 3. OpenStreetMap Nominatim with strict 2.5s timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const isApprox = !data?.address?.road && !data?.address?.house_number && !data?.address?.building;
      if (data?.address) {
        const primary = data.address.road || data.address.pedestrian || data.address.suburb || data.address.neighbourhood || data.address.residential;
        const city = data.address.city || data.address.town || data.address.village || data.address.county;
        const state = data.address.state;
        const parts = [primary, city, state].filter(Boolean);
        if (parts.length > 0) {
          const result: ReverseGeocodeResult = {
            address: parts.join(', '),
            isApproximate: isApprox,
            provider: 'nominatim',
          };
          reverseGeocodeCache.set(cacheKey, result);
          return result;
        }
      }
      if (data?.display_name) {
        const result: ReverseGeocodeResult = {
          address: data.display_name as string,
          isApproximate: isApprox,
          provider: 'nominatim',
        };
        reverseGeocodeCache.set(cacheKey, result);
        return result;
      }
    }
  } catch {}

  // 4. Clean Instant Fallback
  return {
    address: 'Current Location (GPS Detected)',
    isApproximate: true,
    provider: 'coordinates',
  };
}

export async function forwardGeocode(query: string): Promise<{ lat: number; lng: number; address: string } | null> {
  const q = query.trim();
  if (!q) return null;

  const cacheKey = q.toLowerCase();
  if (forwardGeocodeCache.has(cacheKey)) {
    return forwardGeocodeCache.get(cacheKey)!;
  }

  // 1. Google Maps Geocoding if configured
  if (hasValidGoogleKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${googleMapsKey}`;
      const gRes = await fetch(gUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData.status === 'OK' && gData.results?.[0]) {
          const first = gData.results[0];
          const result = {
            lat: first.geometry.location.lat,
            lng: first.geometry.location.lng,
            address: first.formatted_address as string,
          };
          forwardGeocodeCache.set(cacheKey, result);
          return result;
        }
      }
    } catch {}
  }

  // 2. OpenStreetMap Nominatim with 3s timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=1&accept-language=en`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error('Geocoding request failed.');
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const first = data[0];
    const result = { lat: parseFloat(first.lat), lng: parseFloat(first.lon), address: first.display_name as string };
    forwardGeocodeCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn('[Geocoding] Forward geocode error:', err);
    return null;
  }
}
