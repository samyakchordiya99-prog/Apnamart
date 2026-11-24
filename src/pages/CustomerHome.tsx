import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { listAllShops, syncTwoKiranaShopsWithFirestore } from '../services/shops';
import { haversineKm } from '../services/location';
import { LocationSelector, type SelectedLocation } from '../components/LocationSelector';
import { ShopCard } from '../components/ShopCard';
import { Spinner } from '../components/Spinner';
import { OrderHistorySection } from '../components/OrderHistorySection';
import type { Shop } from '../types';

export function CustomerHome() {
  const { deliveryLocation, saveDeliveryLocation, isLocationModalOpen, setIsLocationModalOpen } = useAuth();
  const { totalCartCount, cartShop, cartPricing, setIsCartDrawerOpen } = useCart();
  const [activeTab, setActiveTab] = useState<'stores' | 'orders'>('stores');
  const [radius] = useState(3); // Standard 3 km Kirana radius
  const [activeLocation, setActiveLocation] = useState<SelectedLocation | null>(deliveryLocation);
  const [isEditingLocation, setIsEditingLocation] = useState(!deliveryLocation);
  const [rawShops, setRawShops] = useState<Shop[]>([]);
  const [loadingShops, setLoadingShops] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load / Sync shops whenever activeLocation is established
  useEffect(() => {
    let isCancelled = false;

    async function loadShops() {
      setLoadingShops(true);
      setError(null);
      try {
        if (activeLocation) {
          // Synchronize 2 Kirana shops centered around the user's selected reference point
          const synced = await syncTwoKiranaShopsWithFirestore(activeLocation);
          if (!isCancelled) {
            setRawShops(synced);
          }
        } else {
          // Initial load from Firestore or local fallback
          const loaded = await listAllShops();
          if (!isCancelled) {
            setRawShops(loaded);
          }
        }
      } catch (e: any) {
        if (!isCancelled) {
          setError(e?.message || 'Failed to load shops.');
        }
      } finally {
        if (!isCancelled) {
          setLoadingShops(false);
        }
      }
    }

    loadShops();

    return () => {
      isCancelled = true;
    };
  }, [activeLocation]);

  // Sync with AuthContext deliveryLocation
  useEffect(() => {
    if (deliveryLocation) {
      setActiveLocation(deliveryLocation);
      if (!isLocationModalOpen) {
        setIsEditingLocation(false);
      }
    } else {
      setIsEditingLocation(true);
    }
  }, [deliveryLocation, isLocationModalOpen]);

  // If triggered by Navbar "Change" button
  useEffect(() => {
    if (isLocationModalOpen) {
      setIsEditingLocation(true);
    }
  }, [isLocationModalOpen]);

  // Filter and sort the shops by distance from the customer's reference location
  const nearby = useMemo(() => {
    if (!activeLocation) return [];

    return rawShops
      .filter((s) => s.status !== 'inactive')
      .map((s) => {
        const d = haversineKm(
          { lat: activeLocation.lat, lng: activeLocation.lng },
          { lat: s.location.lat, lng: s.location.lng }
        );
        return { shop: s, d };
      })
      .filter((x) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          x.shop.name.toLowerCase().includes(q) ||
          x.shop.category.toLowerCase().includes(q) ||
          x.shop.address.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.d - b.d);
  }, [rawShops, activeLocation, searchQuery]);

  const handleConfirmLocation = async (loc: SelectedLocation) => {
    setSaving(true);
    setError(null);
    try {
      await saveDeliveryLocation(loc);
      setActiveLocation(loc);
      setIsEditingLocation(false);
      setIsLocationModalOpen(false);

      // Persist the 2 Kirana shops centered on this confirmed location into Firestore
      const updated = await syncTwoKiranaShopsWithFirestore(loc);
      setRawShops(updated);

      setSavedMsg('✅ Delivery location confirmed and nearby Kirana stores updated!');
      setTimeout(() => setSavedMsg(null), 4000);
    } catch (e: any) {
      setError(e?.message || 'Failed to save delivery location.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (activeLocation || deliveryLocation) {
      setIsEditingLocation(false);
      setIsLocationModalOpen(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <h1>ApnaBazaar Kirana Discovery</h1>
        <p className="muted">
          Fast, simple doorstep grocery delivery from trusted local Kirana shops near you.
        </p>
      </div>

      {error && <div className="alert error">{error}</div>}
      {savedMsg && <div className="alert success">{savedMsg}</div>}

      {/* ACTIVE CART FLOATING BANNER */}
      {totalCartCount > 0 && cartShop && (
        <div
          style={{
            background: 'linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%)',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '12px 18px',
            marginTop: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>🛒</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14.5px' }}>
                Cart ({totalCartCount} items) • Ordering from {cartShop.name}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>
                Total: ₹{cartPricing.grandTotal.toFixed(2)} • {cartPricing.nudgeMessage}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn"
            onClick={() => setIsCartDrawerOpen(true)}
            style={{
              background: '#ffffff',
              color: '#7c3aed',
              fontWeight: 800,
              fontSize: '13px',
              padding: '7px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Open Cart & Checkout →
          </button>
        </div>
      )}

      {/* TABS: STORES VS ORDERS */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          margin: '16px 0',
          borderBottom: '2px solid #e2e8f0',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('stores')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'stores' ? '3px solid #7c3aed' : '3px solid transparent',
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '15px',
            color: activeTab === 'stores' ? '#7c3aed' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px',
          }}
        >
          🏪 Nearby Kirana Stores
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'orders' ? '3px solid #7c3aed' : '3px solid transparent',
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '15px',
            color: activeTab === 'orders' ? '#7c3aed' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px',
          }}
        >
          📦 My Orders & Complaints
        </button>
      </div>

      {activeTab === 'orders' ? (
        <OrderHistorySection />
      ) : (
        <>
          {/* DELIVERY LOCATION SECTION */}
      {isEditingLocation ? (
        <div className="card location-editor-container">
          <LocationSelector
            value={activeLocation}
            onChange={(l) => setActiveLocation(l)}
            onConfirm={handleConfirmLocation}
            onCancel={deliveryLocation ? handleCancelEdit : undefined}
            radiusKm={radius}
            isSaving={saving}
          />
        </div>
      ) : (
        <div className="card delivery-location-banner">
          <div className="delivery-banner-content">
            <div className="delivery-banner-left">
              <div className="delivery-banner-icon">📍</div>
              <div className="delivery-banner-text">
                <div className="delivery-banner-tag-row">
                  <span className="delivery-banner-tag">Delivering to</span>
                </div>

                <h3 className="delivery-banner-address">
                  {activeLocation?.flat ? `${activeLocation.flat}, ` : ''}
                  {activeLocation?.address}
                </h3>

                {activeLocation?.landmark && (
                  <div className="delivery-banner-landmark">
                    🏛️ Landmark: <strong>{activeLocation.landmark}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="delivery-banner-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsEditingLocation(true)}
                id="btn-change-location"
              >
                🔄 Change Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEMONSTRATION NOTICE */}
      <div
        className="alert info"
        style={{
          marginTop: '16px',
          borderLeft: '4px solid var(--purple)',
          background: '#f5f3ff',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '20px' }}>ℹ️</span>
        <div>
          <strong>College Demonstration Mode:</strong>
          <span style={{ display: 'block', fontSize: '13px', color: '#4b5563', marginTop: '2px' }}>
            Verified real Kirana businesses are not registered for this exact location. Exactly two clearly labeled fictional demo Kirana shops have been generated around your delivery location within 3 km and saved to Cloud Firestore.
          </span>
        </div>
      </div>

      {/* NEARBY KIRANA SHOPS SECTION */}
      <div className="section" style={{ marginTop: '20px' }}>
        <div className="row between gap align-center" style={{ marginBottom: '16px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', color: '#1e1b4b' }}>
              Nearby Kirana Stores ({nearby.length})
            </h2>
            <span className="muted small">
              {activeLocation
                ? `Showing stores within 3 km of your selected delivery location`
                : 'Please detect or enter your delivery location to view nearby stores'}
            </span>
          </div>

          {nearby.length > 0 && (
            <div style={{ minWidth: '240px' }}>
              <input
                className="input"
                placeholder="Filter shops by name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '13.5px' }}
              />
            </div>
          )}
        </div>

        {loadingShops && <Spinner label="Loading nearby Kirana stores from Firestore…" />}

        {!loadingShops && (!activeLocation || nearby.length === 0) && (
          <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>📍</div>
            <h3 style={{ margin: '0 0 6px' }}>No Kirana shops found</h3>
            <p className="muted small" style={{ margin: '0 0 16px' }}>
              {!activeLocation
                ? 'Click "Use My Current Location" or enter your delivery address to see stores.'
                : 'No registered shops found within 3 km of this address. Please choose your location above.'}
            </p>
            <button
              className="btn btn-primary small"
              onClick={() => setIsEditingLocation(true)}
            >
              📍 Set Delivery Location
            </button>
          </div>
        )}

        {/* EXACTLY TWO SHOPS CARDS GRID */}
        <div className="shop-grid">
          {nearby.map((x) => (
            <ShopCard key={x.shop.id} shop={x.shop} distanceKm={x.d} />
          ))}
        </div>
      </div>
      </>
      )}

      {/* FLOATING CART FAB BUTTON */}
      {totalCartCount > 0 && (
        <button
          type="button"
          onClick={() => setIsCartDrawerOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            background: '#7c3aed',
            color: '#ffffff',
            border: 'none',
            borderRadius: '50px',
            padding: '12px 20px',
            boxShadow: '0 8px 25px rgba(124, 58, 237, 0.45)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '14.5px',
          }}
        >
          <span style={{ fontSize: '18px' }}>🛒</span>
          <span>
            {totalCartCount} item{totalCartCount > 1 ? 's' : ''} • ₹{cartPricing.grandTotal.toFixed(2)}
          </span>
          <span
            style={{
              background: '#ffffff',
              color: '#7c3aed',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 800,
              marginLeft: '4px',
            }}
          >
            VIEW
          </span>
        </button>
      )}
    </div>
  );
}
