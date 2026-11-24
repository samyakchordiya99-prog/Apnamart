import { useState } from 'react';

interface Props {
  detectedLocation: {
    lat: number;
    lng: number;
    accuracy?: number;
    timestamp?: number;
    isApproximate?: boolean;
    address?: string;
  } | null;
  mapCenter: { lat: number; lng: number } | null;
  markerPos: { lat: number; lng: number } | null;
}

export function LocationDebugPanel({ detectedLocation, mapCenter, markerPos }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  // Hidden in production builds
  if (!import.meta.env.DEV) {
    return null;
  }

  const isCenterSynced =
    detectedLocation && mapCenter
      ? Math.abs(detectedLocation.lat - mapCenter.lat) < 0.0001 &&
        Math.abs(detectedLocation.lng - mapCenter.lng) < 0.0001
      : null;

  const isMarkerSynced =
    detectedLocation && markerPos
      ? Math.abs(detectedLocation.lat - markerPos.lat) < 0.0001 &&
        Math.abs(detectedLocation.lng - markerPos.lng) < 0.0001
      : null;

  const accuracy = detectedLocation?.accuracy;
  const isPoorAccuracy = accuracy !== undefined && accuracy > 1000;

  return (
    <div
      className="debug-panel"
      style={{
        margin: '12px 0',
        padding: collapsed ? '8px 14px' : '14px 18px',
        background: '#1e1b4b',
        color: '#f8fafc',
        borderRadius: '10px',
        fontSize: '12px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        border: '1px solid #7c3aed',
        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>🛠️</span>
          <strong style={{ color: '#c4b5fd', fontSize: '13px' }}>
            LOCATION DIAGNOSTIC PANEL (DEV ONLY)
          </strong>
          {accuracy !== undefined && (
            <span
              style={{
                background: isPoorAccuracy ? '#ef4444' : '#10b981',
                color: '#fff',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 'bold',
              }}
            >
              ±{Math.round(accuracy)}m {isPoorAccuracy ? '(Approximate / Network)' : '(Accurate)'}
            </span>
          )}
        </div>
        <button
          type="button"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#a78bfa',
            cursor: 'pointer',
            fontSize: '11px',
          }}
        >
          {collapsed ? '▶ Expand' : '▼ Collapse'}
        </button>
      </div>

      {!collapsed && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid rgba(139, 92, 246, 0.3)',
          }}
        >
          <div>
            <div style={{ color: '#a78bfa', fontWeight: 'bold', marginBottom: '4px' }}>
              🛰️ Detected Coordinates
            </div>
            {detectedLocation ? (
              <div>
                <div>Lat: <strong>{detectedLocation.lat.toFixed(6)}°</strong></div>
                <div>Lng: <strong>{detectedLocation.lng.toFixed(6)}°</strong></div>
                <div>
                  Accuracy: <strong>{accuracy ? `±${Math.round(accuracy)} meters` : 'N/A'}</strong>
                </div>
                <div>
                  Fix Time:{' '}
                  <strong>
                    {detectedLocation.timestamp
                      ? new Date(detectedLocation.timestamp).toLocaleTimeString()
                      : 'Live'}
                  </strong>
                </div>
              </div>
            ) : (
              <span style={{ color: '#94a3b8' }}>No GPS coordinates detected yet</span>
            )}
          </div>

          <div>
            <div style={{ color: '#a78bfa', fontWeight: 'bold', marginBottom: '4px' }}>
              🗺️ Map View Coordinates
            </div>
            {mapCenter ? (
              <div>
                <div>Center Lat: <strong>{mapCenter.lat.toFixed(6)}°</strong></div>
                <div>Center Lng: <strong>{mapCenter.lng.toFixed(6)}°</strong></div>
                <div>
                  Center In Sync:{' '}
                  <span style={{ color: isCenterSynced ? '#34d399' : '#f87171' }}>
                    {isCenterSynced ? '✅ YES' : '❌ MISMATCH'}
                  </span>
                </div>
              </div>
            ) : (
              <span style={{ color: '#94a3b8' }}>Map not initialized</span>
            )}
          </div>

          <div>
            <div style={{ color: '#a78bfa', fontWeight: 'bold', marginBottom: '4px' }}>
              📍 Location Pin Marker
            </div>
            {markerPos ? (
              <div>
                <div>Marker Lat: <strong>{markerPos.lat.toFixed(6)}°</strong></div>
                <div>Marker Lng: <strong>{markerPos.lng.toFixed(6)}°</strong></div>
                <div>
                  Marker In Sync:{' '}
                  <span style={{ color: isMarkerSynced ? '#34d399' : '#f87171' }}>
                    {isMarkerSynced ? '✅ YES' : '❌ MISMATCH'}
                  </span>
                </div>
              </div>
            ) : (
              <span style={{ color: '#94a3b8' }}>No active pin</span>
            )}
          </div>

          <div>
            <div style={{ color: '#a78bfa', fontWeight: 'bold', marginBottom: '4px' }}>
              🏷️ Geocoded Address
            </div>
            <div style={{ wordBreak: 'break-word', color: '#e2e8f0', fontSize: '11px' }}>
              {detectedLocation?.address || 'None'}
            </div>
            <div style={{ marginTop: '4px', fontSize: '11px' }}>
              Precision:{' '}
              <span style={{ color: detectedLocation?.isApproximate ? '#f59e0b' : '#34d399' }}>
                {detectedLocation?.isApproximate ? 'Approximate (Area/City)' : 'Exact Street Level'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
