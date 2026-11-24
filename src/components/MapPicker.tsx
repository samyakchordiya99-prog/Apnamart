import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Shop } from '../types';
import { MAP_LAYERS } from '../services/location';

// Fix default marker icons under Vite bundling
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// Purple marker icon for shops
const shopIcon = new L.DivIcon({
  html: '<div style="background:linear-gradient(135deg, #7c3aed 0%, #9333ea 100%);color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 3px 10px rgba(124,58,237,0.4);border:2px solid #ffffff;">🏪</div>',
  className: 'custom-shop-pin',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -16],
});

// Precision Delivery Pin SVG (Needle tip points exactly at bottom center)
const deliveryPinHtml = `
<div class="delivery-pin-container">
  <div class="delivery-pin-pulse"></div>
  <svg class="delivery-pin-svg" width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 0C8.05888 0 0 8.05888 0 18C0 27.5 14.5 42.5 17.1 43.6C17.6 43.8 18.4 43.8 18.9 43.6C21.5 42.5 36 27.5 36 18C36 8.05888 27.9411 0 18 0Z" fill="url(#deliveryPinGradient)" filter="drop-shadow(0 3px 6px rgba(124,58,237,0.45))"/>
    <defs>
      <linearGradient id="deliveryPinGradient" x1="0" y1="0" x2="36" y2="44" gradientUnits="userSpaceOnUse">
        <stop stop-color="#9333ea"/>
        <stop offset="1" stop-color="#7c3aed"/>
      </linearGradient>
    </defs>
    <circle cx="18" cy="17" r="7.5" fill="#ffffff"/>
    <circle cx="18" cy="17" r="4.5" fill="#7c3aed"/>
  </svg>
</div>
`;

// User location marker icon with needle tip anchor at [18, 44]
const deliveryIcon = new L.DivIcon({
  html: deliveryPinHtml,
  className: 'custom-delivery-pin-wrapper',
  iconSize: [36, 44],
  iconAnchor: [18, 44], // Bottom needle tip is the exact anchor
  popupAnchor: [0, -44],
});

interface MapPickerProps {
  position: { lat: number; lng: number } | null;
  accuracy?: number;
  onPositionChange?: (lat: number, lng: number) => void;
  onMapCenterChange?: (lat: number, lng: number) => void;
  shops?: Shop[];
  height?: number;
  interactive?: boolean;
  onShopClick?: (shop: Shop) => void;
}

function MapEvents({
  onPositionChange,
  interactive,
  onMapCenterChange,
}: {
  onPositionChange?: (lat: number, lng: number) => void;
  interactive?: boolean;
  onMapCenterChange?: (lat: number, lng: number) => void;
}) {
  const map = useMapEvents({
    click(e) {
      if (interactive && onPositionChange) {
        onPositionChange(e.latlng.lat, e.latlng.lng);
      }
    },
    move() {
      const c = map.getCenter();
      onMapCenterChange?.(c.lat, c.lng);
    },
  });

  useEffect(() => {
    const c = map.getCenter();
    onMapCenterChange?.(c.lat, c.lng);
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map, onMapCenterChange]);

  return null;
}

function Recenter({ center }: { center: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (center && typeof center.lat === 'number' && typeof center.lng === 'number' && !isNaN(center.lat) && !isNaN(center.lng)) {
      map.setView([center.lat, center.lng], 15, { animate: true });
      map.invalidateSize();
    }
  }, [map, center?.lat, center?.lng]);
  return null;
}

export function MapPicker({
  position,
  accuracy,
  onPositionChange,
  onMapCenterChange,
  shops = [],
  height = 360,
  interactive = true,
}: MapPickerProps) {
  const [activeLayer, setActiveLayer] = useState<'googleRoadmap' | 'googleHybrid' | 'osm'>('googleRoadmap');

  // Center exactly matches the position if available, fallback only when no coordinates exist yet
  const center =
    position && typeof position.lat === 'number' && typeof position.lng === 'number'
      ? { lat: position.lat, lng: position.lng }
      : { lat: 28.6139, lng: 77.2090 };

  const zoom = position && position.lat ? 15 : 12;
  const currentLayerConfig = MAP_LAYERS[activeLayer];

  return (
    <div className="map-picker-container">
      {/* Map Layer Switcher Header */}
      <div className="map-toolbar">
        <div className="map-toolbar-badge">
          <span>🗺️ Map Provider:</span>
          <strong>{currentLayerConfig.name}</strong>
        </div>
        <div className="map-layer-selector">
          <button
            type="button"
            className={`map-layer-btn ${activeLayer === 'googleRoadmap' ? 'active' : ''}`}
            onClick={() => setActiveLayer('googleRoadmap')}
            title="Google Maps Roadmap View"
          >
            Google Maps
          </button>
          <button
            type="button"
            className={`map-layer-btn ${activeLayer === 'googleHybrid' ? 'active' : ''}`}
            onClick={() => setActiveLayer('googleHybrid')}
            title="Google Maps Satellite Hybrid"
          >
            Satellite
          </button>
          <button
            type="button"
            className={`map-layer-btn ${activeLayer === 'osm' ? 'active' : ''}`}
            onClick={() => setActiveLayer('osm')}
            title="OpenStreetMap Standard"
          >
            OpenStreetMap
          </button>
        </div>
      </div>

      <div className="map-wrap" style={{ height }}>
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            key={activeLayer}
            attribution={currentLayerConfig.attribution}
            url={currentLayerConfig.url}
            maxZoom={currentLayerConfig.maxZoom}
          />
          <MapEvents
            onPositionChange={onPositionChange}
            interactive={interactive}
            onMapCenterChange={onMapCenterChange}
          />
          <Recenter center={position} />

          {position && typeof position.lat === 'number' && typeof position.lng === 'number' && (
            <>
              <Marker
                position={[position.lat, position.lng]}
                icon={deliveryIcon}
                draggable={interactive}
                eventHandlers={
                  interactive
                    ? {
                        dragend: (e) => {
                          const m = e.target as L.Marker;
                          const ll = m.getLatLng();
                          onPositionChange?.(ll.lat, ll.lng);
                        },
                      }
                    : undefined
                }
              >
                <Popup>
                  <div style={{ textAlign: 'center', padding: '6px' }}>
                    <strong style={{ color: '#7c3aed', fontSize: '13px' }}>📍 Delivery Location Pin</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#1e1b4b' }}>
                      Lat: <strong>{position.lat.toFixed(6)}°</strong><br />
                      Lng: <strong>{position.lng.toFixed(6)}°</strong>
                    </p>
                    {accuracy !== undefined && (
                      <div
                        style={{
                          marginTop: '6px',
                          fontSize: '11px',
                          color: accuracy > 1000 ? '#ea580c' : '#16a34a',
                          fontWeight: 700,
                          background: accuracy > 1000 ? '#fff7ed' : '#f0fdf4',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: `1px solid ${accuracy > 1000 ? '#fed7aa' : '#bbf7d0'}`,
                        }}
                      >
                        Accuracy: ±{Math.round(accuracy)}m {accuracy > 1000 ? '(Network)' : '(GPS)'}
                      </div>
                    )}
                    {interactive && (
                      <div style={{ marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                        💡 Drag pin or tap map to adjust
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>

              {/* Visual accuracy radius circle */}
              {accuracy !== undefined && accuracy > 0 && accuracy < 25000 && (
                <Circle
                  center={[position.lat, position.lng]}
                  radius={accuracy}
                  pathOptions={{
                    color: '#7c3aed',
                    fillColor: '#7c3aed',
                    fillOpacity: 0.1,
                    weight: 1.5,
                    dashArray: '4, 4',
                  }}
                />
              )}
            </>
          )}

          {shops.map((s) => (
            <Marker key={s.id} position={[s.location.lat, s.location.lng]} icon={shopIcon}>
              <Popup>
                <div style={{ padding: '4px' }}>
                  <h4 style={{ margin: '0 0 4px', color: '#6d28d9', fontSize: '15px' }}>{s.name}</h4>
                  <div
                    style={{
                      display: 'inline-block',
                      background: '#ede9fe',
                      color: '#6d28d9',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      marginBottom: '6px',
                    }}
                  >
                    {s.category}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
                    📍 {s.address}
                  </div>
                  {s.phone && (
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      📞 {s.phone}
                    </div>
                  )}
                  {s.products && s.products.length > 0 && (
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#7c3aed', fontWeight: 600 }}>
                      🛍️ {s.products.length} product{s.products.length > 1 ? 's' : ''} available
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
