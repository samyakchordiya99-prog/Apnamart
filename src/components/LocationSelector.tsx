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
    <div className="card-location-modal" style={{ padding: '24px' }}>
      <div className="location-modal-header" style={{ marginBottom: '18px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#1e1b4b' }}>
            📍 Set Delivery Location
          </h2>
          <p className="muted small" style={{ margin: '4px 0 0' }}>
            Choose your location to find nearby Kirana shops within {radiusKm} km.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            className="btn-close-modal"
            onClick={onCancel}
            title="Close"
          >
            ✕
          </button>
        )}
      </div>

      {/* PRIMARY ACTION: USE MY CURRENT LOCATION */}
      <div style={{ marginBottom: '20px' }}>
        <button
          type="button"
          className="btn btn-primary full"
          onClick={useCurrentLocation}
          disabled={loading}
          id="btn-use-current-location"
          style={{
            padding: '14px 20px',
            fontSize: '15.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '18px' }}>🎯</span> Use My Current Location
        </button>
        <span className="muted small" style={{ display: 'block', textAlign: 'center', marginTop: '6px' }}>
          Uses browser GPS to automatically locate you and discover nearby Kirana stores.
        </span>
      </div>

      {loading && <Spinner label={statusMsg || 'Updating location…'} />}
      {error && <div className="alert error">{error}</div>}
      {successMsg && <div className="alert success">{successMsg}</div>}

      <div className="auth-divider">or</div>

      {/* MANUAL ADDRESS SEARCH */}
      <div style={{ marginBottom: '22px' }}>
        <label className="small" style={{ fontWeight: 600, marginBottom: '6px', display: 'block' }}>
          🔍 Enter Delivery Address Manually:
        </label>
        <form onSubmit={submitManualAddress} style={{ display: 'flex', gap: '8px' }}>
          <input
            className="input"
            placeholder="Type colony, landmark, street, or city (e.g. Connaught Place, New Delhi)…"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="btn btn-outline"
            disabled={loading || !manual.trim()}
            style={{ whiteSpace: 'nowrap', padding: '0 16px' }}
          >
            Set Address
          </button>
        </form>
      </div>

      {/* SELECTED ADDRESS BOX (READABLE FORMAT - ZERO LAT/LNG SHOWN) */}
      {value && (
        <div
          style={{
            background: '#faf5ff',
            border: '1.5px solid #d8b4fe',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
          }}
        >
          <div className="row between align-center" style={{ marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--purple-dark)',
                background: '#ede9fe',
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              📍 Selected Delivery Address
            </span>
          </div>

          <p
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#1e1b4b',
              margin: '6px 0 12px',
              lineHeight: 1.4,
            }}
          >
            {value.address}
          </p>

          {/* Optional flat and landmark for doorstep delivery */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            <div>
              <label className="small muted" style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Flat / House No. <span style={{ fontWeight: 400 }}>(Optional)</span>
              </label>
              <input
                className="input small"
                placeholder="e.g. Flat 402, Metro View"
                value={flat}
                onChange={(e) => setFlat(e.target.value)}
              />
            </div>
            <div>
              <label className="small muted" style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Landmark <span style={{ fontWeight: 400 }}>(Optional)</span>
              </label>
              <input
                className="input small"
                placeholder="e.g. Near Mother Dairy"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION & ACTION BUTTONS */}
      <div className="row between align-center" style={{ marginTop: '16px', gap: '12px' }}>
        {onCancel ? (
          <button
            type="button"
            className="btn btn-outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
        ) : <div />}

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleConfirmLocation}
          disabled={!value || isSaving || loading}
          style={{ minWidth: '220px', padding: '12px 24px', fontSize: '15px' }}
        >
          {isSaving ? 'Saving Location…' : '✅ Confirm Delivery Location'}
        </button>
      </div>
    </div>
  );
}


