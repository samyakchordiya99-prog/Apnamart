export interface GeoPosition { lat: number; lng: number; }

export interface ReverseGeocodeResult {
  address: string;
  isApproximate: boolean;
  provider: 'google' | 'nominatim' | 'coordinates';
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

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    const validateAndResolve = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords;
      console.log('[Geolocation] Position fix acquired:', {
        latitude,
        longitude,
        accuracyMeters: accuracy,
        timestamp: new Date(pos.timestamp).toLocaleTimeString(),
      });

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

    console.log('[Geolocation] Requesting fresh GPS coordinates (highAccuracy: true)...');
    navigator.geolocation.getCurrentPosition(
      validateAndResolve,
      (firstErr) => {
        // If high accuracy times out or position is unavailable, try standard accuracy fallback
        if (firstErr.code === 3 || firstErr.code === 2) {
          console.warn('[Geolocation] High accuracy request timed out or unavailable, attempting standard accuracy fallback...');
          navigator.geolocation.getCurrentPosition(
            validateAndResolve,
            (fallbackErr) => {
              console.warn('[Geolocation] Fallback request failed:', fallbackErr);
              reject(fallbackErr);
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 60000,
            }
          );
        } else {
          console.warn('[Geolocation] Geolocation error:', firstErr);
          reject(firstErr);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0, // CRITICAL: Never return a stale cached position
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

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  // 1. Try Google Maps Geocoding API if a valid key is provided
  if (hasValidGoogleKey) {
    try {
      const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsKey}`;
      const gRes = await fetch(gUrl);
      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData.status === 'OK' && gData.results?.[0]) {
          const first = gData.results[0];
          const isApprox = first.geometry?.location_type === 'APPROXIMATE';
          return {
            address: first.formatted_address,
            isApproximate: isApprox,
            provider: 'google',
          };
        }
      }
    } catch (err) {
      console.warn('[Geocoding] Google geocoding failed, falling back to OpenStreetMap:', err);
    }
  }

  // 2. OpenStreetMap Nominatim (Free, zero-cost, no billing required)
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      const isApprox = !data?.address?.road && !data?.address?.house_number && !data?.address?.building;
      if (data?.address) {
        const primary = data.address.road || data.address.pedestrian || data.address.suburb || data.address.neighbourhood || data.address.residential;
        const city = data.address.city || data.address.town || data.address.village || data.address.county;
        const state = data.address.state;
        const parts = [primary, city, state].filter(Boolean);
        if (parts.length > 0) {
          return {
            address: parts.join(', '),
            isApproximate: isApprox,
            provider: 'nominatim',
          };
        }
      }
      if (data?.display_name) {
        return {
          address: data.display_name as string,
          isApproximate: isApprox,
          provider: 'nominatim',
        };
      }
    }
  } catch (err) {
    console.warn('[Geocoding] Reverse geocoding failed:', err);
  }

  // 3. Fallback: Friendly readable location (do NOT expose lat/lng to customers)
  return {
    address: 'Current Location (GPS Detected)',
    isApproximate: true,
    provider: 'coordinates',
  };
}

export async function forwardGeocode(query: string): Promise<{ lat: number; lng: number; address: string } | null> {
  const q = query.trim();
  if (!q) return null;

  // 1. Google Maps Geocoding if configured
  if (hasValidGoogleKey) {
    try {
      const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${googleMapsKey}`;
      const gRes = await fetch(gUrl);
      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData.status === 'OK' && gData.results?.[0]) {
          const first = gData.results[0];
          return {
            lat: first.geometry.location.lat,
            lng: first.geometry.location.lng,
            address: first.formatted_address as string,
          };
        }
      }
    } catch {
      // Fallback seamlessly to OpenStreetMap
    }
  }

  // 2. OpenStreetMap Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=1&accept-language=en`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('Geocoding request failed.');
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const first = data[0];
    return { lat: parseFloat(first.lat), lng: parseFloat(first.lon), address: first.display_name as string };
  } catch (err) {
    console.warn('[Geocoding] Forward geocode error:', err);
    return null;
  }
}
