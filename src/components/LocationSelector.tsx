import { useState, useEffect } from 'react';
import { getCurrentPosition, geoErrorToMessage, reverseGeocode, forwardGeocode } from '../services/location';
import { Spinner } from './Spinner';
import type { Shop } from '../types';

export interface SelectedLocation {
  lat: number;
  lng: number;
  address: string;
  flat?: string;
  landmark?: string;
  accuracy?: number;
  timestamp?: number;
  isApproximate?: boolean;
}

interface Props {
  value: SelectedLocation | null;
  onChange: (loc: SelectedLocation) => void;
  onConfirm?: (loc: SelectedLocation) => void;
  onCancel?: () => void;
  radiusKm?: number;
  onRadiusChange?: (r: number) => void;
  shops?: Shop[];
  isSaving?: boolean;
}

export function LocationSelector({
  value,
  onChange,
  onConfirm,
  onCancel,
  radiusKm = 3,
  isSaving = false,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState('');
  const [flat, setFlat] = useState(value?.flat || '');
  const [landmark, setLandmark] = useState(value?.landmark || '');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync flat and landmark if value changes
  useEffect(() => {
    if (value) {
      if (value.flat !== undefined) setFlat(value.flat);
      if (value.landmark !== undefined) setLandmark(value.landmark);
    }
  }, [value?.address, value?.flat, value?.landmark]);

  // Built-in Browser Geolocation API
  async function useCurrentLocation() {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    setStatusMsg('Accessing GPS coordinates from your browser…');

    try {
      const pos = await getCurrentPosition();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = pos.coords.accuracy;
      const timestamp = pos.timestamp;

      setStatusMsg('Resolving street address…');
      try {
        const geoResult = await reverseGeocode(lat, lng);
        onChange({
          lat,
          lng,
          address: geoResult.address,
          flat,
          landmark,
          accuracy,
          timestamp,
          isApproximate: geoResult.isApproximate,
        });
        setSuccessMsg('✅ Current location detected successfully!');
        setTimeout(() => setSuccessMsg(null), 3500);
      } catch {
        // Fallback friendly readable address without exposing coordinates
        onChange({
          lat,
          lng,
          address: 'Current Location (GPS Detected)',
          flat,
          landmark,
          accuracy,
          timestamp,
          isApproximate: true,
        });
        setSuccessMsg('✅ Current location detected!');
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (e: any) {
      setError(geoErrorToMessage(e));
    } finally {
      setLoading(false);
      setStatusMsg(null);
    }
  }

  // Manual Address Geocoding / Selection
  async function submitManualAddress(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!manual.trim()) {
      setError('Please enter a locality, street, or city address.');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    setStatusMsg(`Locating "${manual.trim()}"…`);

    try {
      const res = await forwardGeocode(manual);
      if (res) {
        onChange({
          lat: res.lat,
          lng: res.lng,
          address: res.address,
          flat,
          landmark,
          timestamp: Date.now(),
          isApproximate: false,
        });
        setSuccessMsg(`✅ Address set: ${res.address}`);
        setManual('');
        setTimeout(() => setSuccessMsg(null), 3500);
      } else {
        // Fallback: If geocoding service doesn't return exact coordinates,
        // use default reference point with the user's manual address text so they aren't blocked!
        const fallbackLat = value?.lat || 28.6139;
        const fallbackLng = value?.lng || 77.2090;
        onChange({
          lat: fallbackLat,
          lng: fallbackLng,
          address: manual.trim(),
          flat,
          landmark,
          timestamp: Date.now(),
          isApproximate: true,
        });
        setSuccessMsg(`✅ Delivery address set to: ${manual.trim()}`);
        setManual('');
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (e: any) {
      setError(e?.message || 'Could not locate address. Please check spelling.');
    } finally {
      setLoading(false);
      setStatusMsg(null);
    }
  }

  const handleConfirmLocation = () => {
    if (!value) {
      setError('Please detect your current location or enter an address.');
      return;
    }
    const confirmedData: SelectedLocation = {
      ...value,
      flat: flat.trim(),
      landmark: landmark.trim(),
    };
    if (onConfirm) {
      onConfirm(confirmedData);
    }
  };

  return (
    <div className="loc-compact-card">
      {/* Header row */}
      <div className="loc-compact-header">
        <div className="loc-compact-title">
          <span className="loc-pin-icon">📍</span>
          <div>
            <div className="loc-compact-label">Set Delivery Location</div>
            <div className="loc-compact-sub">Find Kirana shops within {radiusKm} km</div>
          </div>
        </div>
        {onCancel && (
          <button type="button" className="loc-close-btn" onClick={onCancel} title="Close">✕</button>
        )}
      </div>

      {/* GPS + Search in one compact row */}
      <div className="loc-action-row">
        <button
          type="button"
          className="loc-gps-btn"
          onClick={useCurrentLocation}
          disabled={loading}
          id="btn-use-current-location"
          title="Use my current GPS location"
        >
          {loading ? <Spinner label="" /> : <span>🎯</span>}
          <span className="loc-gps-label">Use My Location</span>
        </button>

        <form onSubmit={submitManualAddress} className="loc-search-form">
          <input
            className="loc-search-input"
            placeholder="Search colony, landmark, city…"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="loc-search-btn"
            disabled={loading || !manual.trim()}
          >
            🔍
          </button>
        </form>
      </div>

      {/* Status / feedback */}
      {loading && statusMsg && (
        <div className="loc-status-msg">⏳ {statusMsg}</div>
      )}
      {error && <div className="alert error" style={{ marginTop: '10px', padding: '10px 14px', fontSize: '13px' }}>{error}</div>}
      {successMsg && <div className="alert success" style={{ marginTop: '10px', padding: '10px 14px', fontSize: '13px' }}>{successMsg}</div>}

      {/* Selected address preview */}
      {value && (
        <div className="loc-selected-box">
          <div className="loc-selected-tag">📍 Delivering to</div>
          <div className="loc-selected-addr">{value.address}</div>

          <div className="loc-optional-row">
            <input
              className="loc-opt-input"
              placeholder="Flat / House No. (optional)"
              value={flat}
              onChange={(e) => setFlat(e.target.value)}
            />
            <input
              className="loc-opt-input"
              placeholder="Landmark (optional)"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Confirm / Cancel row */}
      <div className="loc-footer-row">
        {onCancel && (
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleConfirmLocation}
          disabled={!value || isSaving || loading}
          style={{ flex: 1, padding: '11px 20px' }}
        >
          {isSaving ? 'Saving…' : '✅ Confirm Location'}
        </button>
      </div>
    </div>
  );
}


