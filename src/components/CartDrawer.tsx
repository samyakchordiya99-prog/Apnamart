import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { CheckoutModal } from './CheckoutModal';

interface CartDrawerProps {
  onClose: () => void;
}

export function CartDrawer({ onClose }: CartDrawerProps) {
  const { deliveryLocation } = useAuth();
  const {
    cart,
    cartShop,
    cartProducts,
    removeFromCart,
    addToCart,
    clearCart,
    totalCartCount,
    cartPricing,
  } = useCart();

  const [showCheckout, setShowCheckout] = useState(false);

  const cartEntries = Object.entries(cart).filter(([_, qty]) => qty > 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          background: '#ffffff',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          animation: 'slideInRight 0.25s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* DRAWER HEADER */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#faf5ff',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🛒</span>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#1e1b4b', fontWeight: 800 }}>
                My Cart ({totalCartCount})
              </h2>
            </div>
            {cartShop && (
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b21a8', fontWeight: 600 }}>
                🏪 {cartShop.name} ({cartShop.id})
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {cartEntries.length > 0 && (
              <button
                type="button"
                className="btn btn-outline small"
                onClick={clearCart}
                style={{ fontSize: '12px', padding: '4px 10px', color: '#ef4444', borderColor: '#fca5a5' }}
              >
                Clear
              </button>
            )}
            <button
              type="button"
              className="btn-close-modal"
              onClick={onClose}
              style={{ fontSize: '18px', padding: '4px 8px' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* DRAWER CONTENT */}
        {cartEntries.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '30px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🛍️</div>
            <h3 style={{ margin: '0 0 8px', color: '#1e293b' }}>Your Cart is Empty</h3>
            <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '14px', maxWidth: '280px' }}>
              Explore nearby Kirana stores and add fresh groceries or daily essentials to your cart!
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onClose}
              style={{ padding: '10px 24px', fontWeight: 700 }}
            >
              Browse Nearby Shops
            </button>
          </div>
        ) : (
          <>
            {/* ITEMS LIST */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {cartEntries.map(([pId, qty]) => {
                const p = cartProducts.find((item) => (item.productId || item.id) === pId);
                const title = p?.productName || p?.name || `Product ${pId}`;
                const price = typeof p?.sellingPrice === 'number' ? p.sellingPrice : p?.price || 0;
                const totalItemPrice = (price * qty).toFixed(2);
                const img =
                  p?.imageUrl ||
                  'https://www.bbassets.com/media/uploads/p/l/40174323_7-parle-g-gluco-biscuits-800-g-pouch.jpg';

                return (
                  <div
                    key={pId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <img
                      src={img}
                      alt={title}
                      style={{
                        width: '52px',
                        height: '52px',
                        objectFit: 'contain',
                        borderRadius: '6px',
                        background: '#ffffff',
                        border: '1px solid #f1f5f9',
                        padding: '2px',
                      }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          'https://www.bbassets.com/media/uploads/p/l/40174323_7-parle-g-gluco-biscuits-800-g-pouch.jpg';
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13.5px',
                          fontWeight: 700,
                          color: '#1e293b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={title}
                      >
                        {title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        ₹{price.toFixed(2)} {p?.quantityOrPack ? `• ${p.quantityOrPack}` : ''}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#7c3aed', marginTop: '2px' }}>
                        ₹{totalItemPrice}
                      </div>
                    </div>

                    {/* QTY CONTROLS */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: '#ffffff',
                        border: '1.5px solid #ddd6fe',
                        borderRadius: '6px',
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => removeFromCart(pId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          fontWeight: 800,
                          color: '#7c3aed',
                        }}
                      >
                        −
                      </button>
                      <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => p && cartShop && addToCart(cartShop, p)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          fontWeight: 800,
                          color: '#7c3aed',
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FOOTER & PRICING BREAKDOWN */}
            <div
              style={{
                borderTop: '1px solid #e2e8f0',
                background: '#ffffff',
                padding: '16px 20px',
                boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
              }}
            >
              {/* NUDGE BANNER */}
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  textAlign: 'center',
                  marginBottom: '12px',
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
                }}
              >
                {cartPricing.nudgeMessage}
              </div>

              {/* PRICE BREAKDOWN */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Items Subtotal:</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>₹{cartPricing.subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Delivery Charges:</span>
                  {cartPricing.deliveryFee === 0 ? (
                    <span style={{ fontWeight: 700, color: '#16a34a' }}>
                      <span style={{ textDecoration: 'line-through', color: '#94a3b8', marginRight: '4px' }}>₹20.00</span>
                      FREE
                    </span>
                  ) : (
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>₹{cartPricing.deliveryFee.toFixed(2)}</span>
                  )}
                </div>
                {cartPricing.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                    <span style={{ fontWeight: 600 }}>Discount (₹100–₹150 Tier):</span>
                    <span style={{ fontWeight: 700 }}>-₹{cartPricing.discount.toFixed(2)}</span>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '8px',
                    borderTop: '1px dashed #cbd5e1',
                    fontSize: '15px',
                    fontWeight: 800,
                    color: '#1e1b4b',
                  }}
                >
                  <span>Grand Total:</span>
                  <span style={{ color: '#7c3aed', fontSize: '18px' }}>₹{cartPricing.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* CHECKOUT BUTTON */}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (cartPricing.isMinOrderMet && cartShop) {
                    setShowCheckout(true);
                  }
                }}
                disabled={!cartPricing.isMinOrderMet || !cartShop}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '15px',
                  fontWeight: 700,
                  borderRadius: '10px',
                  background: !cartPricing.isMinOrderMet ? '#94a3b8' : '#16a34a',
                  borderColor: !cartPricing.isMinOrderMet ? '#94a3b8' : '#16a34a',
                  cursor: !cartPricing.isMinOrderMet ? 'not-allowed' : 'pointer',
                }}
              >
                {!cartPricing.isMinOrderMet
                  ? `Min Order ₹50 (Add ₹${cartPricing.minOrderShortfall.toFixed(2)})`
                  : `Proceed to Checkout (₹${cartPricing.grandTotal.toFixed(2)}) →`}
              </button>
            </div>
          </>
        )}

        {/* CHECKOUT MODAL FROM DRAWER */}
        {showCheckout && cartShop && (
          <CheckoutModal
            shop={cartShop}
            cart={cart}
            products={cartProducts}
            subtotal={cartPricing.subtotal}
            deliveryFee={cartPricing.deliveryFee}
            discount={cartPricing.discount}
            totalAmount={cartPricing.grandTotal}
            deliveryAddress={
              deliveryLocation
                ? `${deliveryLocation.flat ? `${deliveryLocation.flat}, ` : ''}${deliveryLocation.address}`
                : 'Delivery Address on file'
            }
            onClose={() => setShowCheckout(false)}
            onSuccess={() => {
              clearCart();
              setShowCheckout(false);
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
}

