import { useState } from 'react';
import type { Shop } from '../types';
import { BlinkitCatalogModal } from './BlinkitCatalogModal';

export function ShopCard({ shop, distanceKm }: { shop: Shop; distanceKm?: number }) {
  const products = shop.products || [];
  const [showModal, setShowModal] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const isOpen = shop.status !== 'closed' && shop.status !== 'inactive';
  const isGooglePlaces = shop.source === 'google_places';

  const handleOpenSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    setProductQuery('');
    setShowModal(true);
  };

  return (
    <>
      <div className="card shop-card">
        {/* Shop Media / Header */}
        {shop.imageUrl && (
          <div className="shop-card-image-wrap">
            <img src={shop.imageUrl} alt={shop.name} className="shop-card-image" />
          </div>
        )}

        <div className="shop-card-body">
          <div className="shop-card-head">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#1e1b4b' }}>{shop.name}</h3>
                {shop.isDemo ? (
                  <span
                    className="badge"
                    style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
                    title="Fictional Kirana shop created for college demonstration"
                  >
                    🧪 College Demo Shop
                  </span>
                ) : isGooglePlaces ? (
                  <span className="badge badge-places" title="Listing sourced from Google Places">
                    🗺️ Google Places Listing
                  </span>
                ) : (
                  <span className="badge badge-source-manual" title="Registered ApnaMart local shop">
                    🏪 Registered Local Shop
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
                <span className="badge">{shop.category}</span>
                <span className={`badge ${isOpen ? 'badge-status-active' : 'badge-status-inactive'}`}>
                  {isOpen ? 'Open Now' : 'Closed'}
                </span>
                {shop.openingHours && (
                  <span className="badge badge-hours">🕒 {shop.openingHours}</span>
                )}
              </div>
            </div>

            {typeof distanceKm === 'number' && (
              <span className="badge badge-distance">
                📍 {distanceKm.toFixed(2)} km
              </span>
            )}
          </div>

          {shop.description && (
            <p style={{ margin: '10px 0 6px', fontSize: '13.5px', color: '#475569' }}>
              {shop.description}
            </p>
          )}

          <p className="addr" style={{ margin: '6px 0 4px', fontSize: '13px' }}>
            <strong>Store Address:</strong> {shop.address}
          </p>

          <div className="row between align-center" style={{ marginTop: '6px', flexWrap: 'wrap', gap: '8px' }}>
            {shop.ownerName && (
              <span className="muted small">👤 Owner: <strong>{shop.ownerName}</strong></span>
            )}
            {shop.phone && (
              <span className="muted small">
                📞 <a href={`tel:${shop.phone}`} style={{ color: 'var(--purple-dark)', fontWeight: 600 }}>{shop.phone}</a>
              </span>
            )}
          </div>

          {/* DEDICATED IN-SHOP PRODUCT SEARCH BAR */}
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
            <form onSubmit={handleOpenSearch} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="input"
                placeholder={`Search in ${shop.name} (e.g. Parle-G, Basmati, Sprouts, Chips)…`}
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                🔍 Search
              </button>
            </form>

            {/* QUICK POPULAR CATEGORY PILLS */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => handleCategoryClick('Biscuits')}
                style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #fde68a',
                  borderRadius: '999px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                🍪 Biscuits
              </button>
              <button
                type="button"
                onClick={() => handleCategoryClick('Rice')}
                style={{
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                  borderRadius: '999px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                🌾 Types of Rice
              </button>
              <button
                type="button"
                onClick={() => handleCategoryClick('Dal')}
                style={{
                  background: '#fefce8',
                  color: '#854d0e',
                  border: '1px solid #fef08a',
                  borderRadius: '999px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                🥣 Types of Dal
              </button>
              <button
                type="button"
                onClick={() => handleCategoryClick('Sprouts')}
                style={{
                  background: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0',
                  borderRadius: '999px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                🌱 Fresh Sprouts
              </button>
              <button
                type="button"
                onClick={() => handleCategoryClick('Chips')}
                style={{
                  background: '#fef2f2',
                  color: '#b91c1c',
                  border: '1px solid #fecaca',
                  borderRadius: '999px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                🥔 Variety of Chips
              </button>
            </div>
          </div>
        </div>

        {/* QUICK-COMMERCE CATALOGUE TRIGGER */}
        <div style={{ marginTop: '10px', padding: '12px 16px', background: '#faf5ff', borderTop: '1px solid #f3e8ff' }}>
          <button
            type="button"
            className="btn btn-primary full"
            onClick={() => {
              setActiveCategory('All');
              setShowModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '11px 16px',
              fontSize: '14.5px',
              fontWeight: 700,
            }}
          >
            <span>🛍️</span> Browse Store Catalogue ({products.length > 0 ? products.length : '100+'} Items) →
          </button>
        </div>
      </div>

      {/* FULL BLINKIT-STYLE QUICK COMMERCE PRODUCTS CATALOG MODAL */}
      {showModal && (
        <BlinkitCatalogModal
          shop={shop}
          onClose={() => {
            setShowModal(false);
            setProductQuery('');
            setActiveCategory('All');
          }}
          initialSearchQuery={productQuery}
          initialCategory={activeCategory}
        />
      )}
    </>
  );
}
