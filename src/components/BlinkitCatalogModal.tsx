import { useState, useEffect, useMemo } from 'react';
import type { Shop, Product } from '../types';
import { BLINKIT_CATEGORIES } from '../types';
import { listProductsForShop } from '../services/shops';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Spinner } from './Spinner';
import { CheckoutModal } from './CheckoutModal';

interface Props {
  shop: Shop;
  onClose: () => void;
  initialSearchQuery?: string;
  initialCategory?: string;
}

export function BlinkitCatalogModal({ shop, onClose, initialSearchQuery = '', initialCategory = 'All' }: Props) {
  const { deliveryLocation } = useAuth();
  const {
    cart,
    cartShop,
    addToCart: addGlobalToCart,
    removeFromCart,
    clearCart,
    totalCartCount,
    cartPricing,
    syncShopProducts,
  } = useCart();

  const [products, setProducts] = useState<Product[]>(shop.products || []);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [showCheckout, setShowCheckout] = useState(false);

  // Sync if initial props change
  useEffect(() => {
    if (initialSearchQuery) setSearchQuery(initialSearchQuery);
    if (initialCategory) setSelectedCategory(initialCategory);
  }, [initialSearchQuery, initialCategory]);

  // Fetch genuine Firestore products for this shop
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const prods = await listProductsForShop(shop.id);
        if (isMounted) {
          setProducts(prods);
          syncShopProducts(shop, prods);
        }
      } catch (err) {
        console.warn('Could not load products from Firestore:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [shop.id, shop, syncShopProducts]);

  const handleAddToCart = (productId: string) => {
    const p = products.find((item) => (item.productId || item.id) === productId);
    if (p) {
      addGlobalToCart(shop, p);
    }
  };

  const isCartFromThisShop = cartShop?.id === shop.id;

  // Filter products by category, special variety tabs, and search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const nameLower = (p.productName || p.name || '').toLowerCase();
      const catLower = (p.category || '').toLowerCase();
      const descLower = (p.description || '').toLowerCase();

      // Special Quick Variety Shortcuts
      if (selectedCategory === 'Biscuits') {
        const isBiscuit =
          p.category === 'Biscuits & Bakery' ||
          nameLower.includes('biscuit') ||
          nameLower.includes('cookie') ||
          nameLower.includes('cracker');
        if (!isBiscuit) return false;
      } else if (selectedCategory === 'Rice') {
        const isRice = nameLower.includes('rice') || descLower.includes('basmati') || descLower.includes('rice');
        if (!isRice) return false;
      } else if (selectedCategory === 'Dal') {
        const isDal =
          nameLower.includes('dal') ||
          nameLower.includes('lentil') ||
          nameLower.includes('rajma') ||
          nameLower.includes('chole') ||
          nameLower.includes('chana') ||
          nameLower.includes('matki');
        if (!isDal) return false;
      } else if (selectedCategory === 'Sprouts') {
        const isSprout = nameLower.includes('sprout') || descLower.includes('sprout') || descLower.includes('ankurit');
        if (!isSprout) return false;
      } else if (selectedCategory === 'Chips') {
        const isChip =
          p.category === 'Chips, Namkeen & Snacks' ||
          nameLower.includes('chip') ||
          nameLower.includes('crisp') ||
          nameLower.includes('curls') ||
          nameLower.includes('bhujia') ||
          nameLower.includes('sev') ||
          nameLower.includes('namkeen');
        if (!isChip) return false;
      } else if (selectedCategory !== 'All') {
        if (p.category !== selectedCategory) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = nameLower.includes(q);
        const matchBrand = (p.brand || '').toLowerCase().includes(q);
        const matchCat = catLower.includes(q);
        const matchDesc = descLower.includes(q);
        return matchName || matchBrand || matchCat || matchDesc;
      }

      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: products.length };
    for (const c of BLINKIT_CATEGORIES) {
      counts[c] = products.filter((p) => p.category === c).length;
    }
    return counts;
  }, [products]);

  return (
    <div className="blinkit-modal-backdrop" onClick={onClose}>
      <div className="blinkit-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="blinkit-modal-header">
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#1e1b4b' }}>{shop.name}</h2>
              <span
                className="badge"
                style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
              >
                🧪 Kirana Catalogue ({products.length} Products)
              </span>
            </div>
            <p className="muted small" style={{ margin: '3px 0 0' }}>
              📍 {shop.address} · 🕒 {shop.openingHours || 'Open Now'}
            </p>
          </div>

          {/* SEARCH BAR */}
          <div style={{ minWidth: '240px', maxWidth: '360px', flex: 1 }}>
            <input
              className="input"
              type="text"
              placeholder="Search in this store (e.g. Atta, Milk, Lay's)…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '13.5px' }}
            />
          </div>

          <button
            type="button"
            className="btn-close-modal"
            onClick={onClose}
            title="Close Catalogue"
          >
            ✕
          </button>
        </div>

        {/* 15 BLINKIT CATEGORIES & QUICK VARIETY SHORTCUTS BAR */}
        <div className="blinkit-categories-bar">
          <button
            type="button"
            className={`blinkit-category-chip ${selectedCategory === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('All')}
          >
            🛒 All ({products.length})
          </button>

          {/* Quick Variety Shortcuts requested specifically */}
          <button
            type="button"
            className={`blinkit-category-chip ${selectedCategory === 'Biscuits' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('Biscuits')}
            style={{ borderColor: '#f59e0b', color: selectedCategory === 'Biscuits' ? '#ffffff' : '#b45309' }}
          >
            🍪 Biscuits
          </button>
          <button
            type="button"
            className={`blinkit-category-chip ${selectedCategory === 'Rice' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('Rice')}
            style={{ borderColor: '#3b82f6', color: selectedCategory === 'Rice' ? '#ffffff' : '#1d4ed8' }}
          >
            🌾 Types of Rice
          </button>
          <button
            type="button"
            className={`blinkit-category-chip ${selectedCategory === 'Dal' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('Dal')}
            style={{ borderColor: '#eab308', color: selectedCategory === 'Dal' ? '#ffffff' : '#854d0e' }}
          >
            🥣 Types of Dal
          </button>
          <button
            type="button"
            className={`blinkit-category-chip ${selectedCategory === 'Sprouts' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('Sprouts')}
            style={{ borderColor: '#10b981', color: selectedCategory === 'Sprouts' ? '#ffffff' : '#047857' }}
          >
            🌱 Fresh Sprouts
          </button>
          <button
            type="button"
            className={`blinkit-category-chip ${selectedCategory === 'Chips' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('Chips')}
            style={{ borderColor: '#ef4444', color: selectedCategory === 'Chips' ? '#ffffff' : '#b91c1c' }}
          >
            🥔 Variety of Chips
          </button>

          {BLINKIT_CATEGORIES.map((cat) => {
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                type="button"
                className={`blinkit-category-chip ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat} {count > 0 && <span style={{ opacity: 0.8, fontSize: '11px' }}>({count})</span>}
              </button>
            );
          })}
        </div>

        {/* PRODUCTS SCROLL AREA */}
        <div className="blinkit-products-scroll">
          {loading && <Spinner label="Loading catalogue from Cloud Firestore…" />}

          {!loading && filteredProducts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ fontSize: '42px', marginBottom: '8px' }}>🔍</div>
              <h3 style={{ margin: '0 0 6px', color: '#334155' }}>No products match your filter</h3>
              <p className="muted small" style={{ margin: 0 }}>
                Try searching for another item or choose "All" categories.
              </p>
            </div>
          )}

          {!loading && filteredProducts.length > 0 && (
            <div className="blinkit-product-grid">
              {filteredProducts.map((p) => {
                const pId = p.productId || p.id;
                const mrp = p.mrp || p.price;
                const sellingPrice = typeof p.sellingPrice === 'number' ? p.sellingPrice : p.price;
                const discount = p.discountPercent || 0;
                const isOutOfStock = p.stockQuantity === 0 || p.stock === 0 || !p.isAvailable;
                const cartQty = isCartFromThisShop ? (cart[pId] || 0) : 0;

                return (
                  <div key={pId} className="blinkit-product-card">
                    {/* Image & Discount Badge */}
                    <div className="blinkit-card-img-wrap" style={{ position: 'relative', overflow: 'hidden', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={p.imageUrl}
                        alt={p.productName || p.name}
                        className="blinkit-card-img"
                        loading="lazy"
                        style={{ width: '100%', height: '140px', objectFit: 'contain', padding: '6px' }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://www.bbassets.com/media/uploads/p/l/40174323_7-parle-g-gluco-biscuits-800-g-pouch.jpg';
                        }}
                      />
                      {discount > 0 && (
                        <div className="blinkit-discount-badge">{discount}% OFF</div>
                      )}
                      {p.imageMatchStatus === 'verified' && (
                        <span
                          title="Verified Authentic Brand Packshot"
                          style={{
                            position: 'absolute',
                            bottom: '6px',
                            right: '6px',
                            background: '#10b981',
                            color: '#fff',
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '2px 5px',
                            borderRadius: '4px',
                            letterSpacing: '0.3px',
                          }}
                        >
                          ✓ VERIFIED
                        </span>
                      )}
                    </div>

                    {/* Pack size & brand */}
                    <div className="blinkit-pack-badge">{p.quantityOrPack || '1 pack'}</div>
                    <div className="blinkit-product-brand">{p.brand}</div>

                    {/* Product Name */}
                    <h4 className="blinkit-product-title" title={p.productName || p.name}>
                      {p.productName || p.name}
                    </h4>

                    {/* Card Footer: Prices & ADD Controls */}
                    <div className="blinkit-card-footer">
                      <div className="blinkit-price-box">
                        <span className="blinkit-selling-price">₹{sellingPrice}</span>
                        {discount > 0 && <span className="blinkit-mrp-price">₹{mrp}</span>}
                      </div>

                      {isOutOfStock ? (
                        <button type="button" disabled className="btn-blinkit-out-of-stock">
                          Out of Stock
                        </button>
                      ) : cartQty > 0 ? (
                        <div className="blinkit-qty-controls">
                          <button
                            type="button"
                            className="blinkit-qty-btn"
                            onClick={() => removeFromCart(pId)}
                            title="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="blinkit-qty-value">{cartQty}</span>
                          <button
                            type="button"
                            className="blinkit-qty-btn"
                            onClick={() => handleAddToCart(pId)}
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn-blinkit-add"
                          onClick={() => handleAddToCart(pId)}
                        >
                          ADD
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* BOTTOM QUICK-COMMERCE CART BAR WITH TIER PRICING */}
        {totalCartCount > 0 && (
          <div style={{ position: 'sticky', bottom: 0, zIndex: 100 }}>
            {/* DYNAMIC CART NUDGE BANNER */}
            <div
              style={{
                padding: '8px 16px',
                fontSize: '12.5px',
                fontWeight: 600,
                textAlign: 'center',
                background: !cartPricing.isMinOrderMet
                  ? '#fef3c7'
                  : cartPricing.subtotal < 100
                  ? '#ede9fe'
                  : cartPricing.subtotal <= 150
                  ? '#dcfce7'
                  : '#d1fae5',
                color: !cartPricing.isMinOrderMet
                  ? '#92400e'
                  : cartPricing.subtotal < 100
                  ? '#5b21b6'
                  : cartPricing.subtotal <= 150
                  ? '#166534'
                  : '#065f46',
                borderTop: '1px solid rgba(0,0,0,0.06)',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>{cartPricing.nudgeMessage}</span>
            </div>

            {/* MAIN CART ACTION BAR */}
            <div className="blinkit-cart-bar" style={{ padding: '12px 18px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                    {totalCartCount} item{totalCartCount > 1 ? 's' : ''}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
                    Items: ₹{cartPricing.subtotal.toFixed(2)}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
                  <span
                    style={{
                      fontSize: '11.5px',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      background: cartPricing.deliveryFee === 0 ? '#10b981' : 'rgba(255,255,255,0.18)',
                      color: '#ffffff',
                    }}
                  >
                    Delivery: {cartPricing.deliveryFee === 0 ? 'FREE' : `₹${cartPricing.deliveryFee}`}
                  </span>
                  {cartPricing.discount > 0 && (
                    <span
                      style={{
                        fontSize: '11.5px',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        background: '#eab308',
                        color: '#713f12',
                      }}
                    >
                      Discount: -₹{cartPricing.discount}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                  Total to Pay: ₹{cartPricing.grandTotal.toFixed(2)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => clearCart()}
                  style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', padding: '8px 14px', fontSize: '13px' }}
                >
                  Clear Cart
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (cartPricing.isMinOrderMet) {
                      setShowCheckout(true);
                    }
                  }}
                  disabled={!cartPricing.isMinOrderMet}
                  style={{
                    background: !cartPricing.isMinOrderMet ? '#94a3b8' : '#16a34a',
                    borderColor: !cartPricing.isMinOrderMet ? '#94a3b8' : '#16a34a',
                    padding: '9px 20px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: !cartPricing.isMinOrderMet ? 'not-allowed' : 'pointer',
                    opacity: !cartPricing.isMinOrderMet ? 0.8 : 1,
                  }}
                >
                  {!cartPricing.isMinOrderMet
                    ? `Min Order ₹50 (Add ₹${cartPricing.minOrderShortfall.toFixed(2)})`
                    : `View Cart & Deliver (₹${cartPricing.grandTotal.toFixed(2)}) →`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CHECKOUT & PAYMENT MODAL */}
        {showCheckout && (
          <CheckoutModal
            shop={shop}
            cart={cart}
            products={products}
            subtotal={cartPricing.subtotal}
            deliveryFee={cartPricing.deliveryFee}
            discount={cartPricing.discount}
            totalAmount={cartPricing.grandTotal}
            deliveryAddress={
              deliveryLocation
                ? `${deliveryLocation.flat ? `${deliveryLocation.flat}, ` : ''}${deliveryLocation.address}`
                : 'Selected delivery location'
            }
            onClose={() => setShowCheckout(false)}
            onSuccess={() => {
              clearCart();
            }}
          />
        )}
      </div>
    </div>
  );
}

