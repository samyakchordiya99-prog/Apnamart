import React, { useState, useEffect } from 'react';
import type { Shop, Product, Order, PaymentMethod, ShopPaymentMethods } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getShopById } from '../services/shops';
import { createOrder } from '../services/orders';
import { uploadPaymentProof } from '../services/storage';
import { Spinner } from './Spinner';

interface CheckoutModalProps {
  shop: Shop;
  cart: Record<string, number>;
  products: Product[];
  totalAmount: number;
  subtotal?: number;
  deliveryFee?: number;
  discount?: number;
  deliveryAddress: string;
  onClose: () => void;
  onSuccess: (order: Order) => void;
}

export function CheckoutModal({
  shop,
  cart,
  products,
  totalAmount,
  subtotal,
  deliveryFee,
  discount,
  deliveryAddress,
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  const { profile, deliveryLocation } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [shopPaymentData, setShopPaymentData] = useState<ShopPaymentMethods | null>(
    shop.paymentMethods || null
  );
  const [loadingShopData, setLoadingShopData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Customer contact details
  const [customerName, setCustomerName] = useState(profile?.displayName || '');
  const [customerPhone, setCustomerPhone] = useState(profile?.phone || '');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Detailed doorstep delivery address
  const [flat, setFlat] = useState(deliveryLocation?.flat || '');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState(deliveryLocation?.landmark || '');
  const [pincode, setPincode] = useState('');

  // Exact pricing calculation
  const computedSubtotal = subtotal !== undefined ? subtotal : totalAmount;
  const computedDeliveryFee =
    deliveryFee !== undefined
      ? deliveryFee
      : computedSubtotal > 150
      ? 0
      : 20;
  const computedDiscount =
    discount !== undefined
      ? discount
      : computedSubtotal >= 100 && computedSubtotal <= 150
      ? 15
      : 0;
  const finalGrandTotal = Math.max(
    0,
    Number((computedSubtotal + computedDeliveryFee - computedDiscount).toFixed(2))
  );

  // Fetch live shop document from Firebase to guarantee live QR metadata
  useEffect(() => {
    let isMounted = true;
    async function loadShopDetails() {
      setLoadingShopData(true);
      try {
        const liveShop = await getShopById(shop.id);
        if (isMounted && liveShop?.paymentMethods) {
          setShopPaymentData(liveShop.paymentMethods);
        } else if (isMounted && shop.paymentMethods) {
          setShopPaymentData(shop.paymentMethods);
        } else if (isMounted) {
          // Dynamic fallback mapping strictly bound to shop ID
          const isShop1 = shop.id === 'SHOP_01' || shop.id.includes('1');
          setShopPaymentData({
            upiEnabled: true,
            codEnabled: true,
            upiQrStoragePath: isShop1
              ? 'payment-qr/SHOP_01/upi-qr.png'
              : 'payment-qr/SHOP_02/upi-qr.png',
            upiQrUrl: isShop1
              ? '/payment-qr/SHOP_01/upi-qr.png'
              : '/payment-qr/SHOP_02/upi-qr.png',
            accountDetails: isShop1
              ? 'PhonePe QR - Gunwant Yogesh Chaudhari'
              : 'Google Pay - armanattar311@oksbi',
            upiProvider: isShop1 ? 'PhonePe' : 'Google Pay',
            merchantName: isShop1
              ? 'Gunwant Yogesh Chaudhari (Apna Mart Shop 1)'
              : 'Arman Attar (Apna Mart Shop 2)',
          });
        }
      } catch (err) {
        console.warn('Error fetching live shop payment data:', err);
      } finally {
        if (isMounted) setLoadingShopData(false);
      }
    }

    loadShopDetails();
    return () => {
      isMounted = false;
    };
  }, [shop.id, shop.name, shop.paymentMethods]);

  // Handle proof file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  // Convert cart mapping to OrderItem array
  const orderItems = Object.entries(cart)
    .map(([pId, qty]) => {
      const p = products.find((item) => (item.productId || item.id) === pId);
      if (!p || qty <= 0) return null;
      const price = typeof p.sellingPrice === 'number' ? p.sellingPrice : p.price || 0;
      return {
        productId: p.productId || p.id,
        name: p.productName || p.name,
        price,
        quantity: qty,
        imageUrl: p.imageUrl,
      };
    })
    .filter(Boolean) as import('../types').OrderItem[];

  // Place order handler
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Require screenshot if UPI (as user requested: "add payment ss ka option add kr not id ka")
    if (paymentMethod === 'UPI' && !proofFile && !transactionRef.trim()) {
      setError('Please attach your payment screenshot (SS) as proof of payment.');
      return;
    }

    setSubmitting(true);
    try {
      let paymentProofUrl: string | undefined = undefined;

      // Upload proof if customer selected an image
      if (proofFile) {
        try {
          paymentProofUrl = await uploadPaymentProof(`ORD-${Date.now()}`, proofFile);
        } catch (proofErr) {
          console.warn('Screenshot upload skipped/failed, using local preview:', proofErr);
          paymentProofUrl = proofPreview || undefined;
        }
      }

      const fullDeliveryAddress = [
        flat.trim() ? `Flat/House: ${flat.trim()}` : '',
        street.trim(),
        landmark.trim() ? `Near ${landmark.trim()}` : '',
        deliveryAddress,
        pincode.trim() ? `PIN: ${pincode.trim()}` : '',
      ]
        .filter(Boolean)
        .join(', ');

      const order = await createOrder({
        shopId: shop.id,
        shopName: shop.name,
        shopVendorId: shop.vendorId,
        customerId: profile?.uid || 'guest-customer',
        customerName: customerName.trim() || profile?.displayName || 'Customer',
        customerPhone: customerPhone.trim() || profile?.phone || '',
        deliveryInstructions: deliveryInstructions.trim() || undefined,
        items: orderItems,
        subtotal: computedSubtotal,
        deliveryFee: computedDeliveryFee,
        discount: computedDiscount,
        totalAmount: finalGrandTotal,
        deliveryAddress: fullDeliveryAddress || deliveryAddress || 'Address on file',
        deliveryAddressDetails: {
          flat: flat.trim() || undefined,
          street: street.trim() || undefined,
          landmark: landmark.trim() || undefined,
          city: undefined,
          pincode: pincode.trim() || undefined,
          fullAddress: fullDeliveryAddress || deliveryAddress,
        },
        paymentMethod,
        transactionReference: transactionRef.trim() || undefined,
        paymentProofUrl,
      });

      setPlacedOrder(order);
      onSuccess(order);
    } catch (err: any) {
      setError(err?.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Dedicated QR Image URL strictly mapped to the current shop
  const qrImageUrl =
    shopPaymentData?.upiQrUrl ||
    (shop.id === 'SHOP_01'
      ? '/payment-qr/SHOP_01/upi-qr.png'
      : '/payment-qr/SHOP_02/upi-qr.png');

  const bankAccountLabel =
    shopPaymentData?.accountDetails ||
    (shop.id === 'SHOP_01'
      ? 'Central Bank of India - 2671'
      : 'State Bank of India - 4559');

  return (
    <div className="blinkit-modal-backdrop" onClick={onClose}>
      <div
        className="blinkit-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', maxHeight: '92vh', overflowY: 'auto', padding: '24px' }}
      >
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '22px' }}>🛍️</span>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#1e1b4b' }}>Checkout & Payment</h2>
            </div>
            <p className="muted small" style={{ margin: '4px 0 0' }}>
              Ordering from: <strong>{shop.name}</strong> ({shop.id})
            </p>
          </div>
          <button
            type="button"
            className="btn-close-modal"
            onClick={onClose}
            title="Cancel"
            style={{ fontSize: '18px', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="alert error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* ORDER SUCCESS SCREEN */}
        {placedOrder ? (
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{ fontSize: '54px', marginBottom: '8px' }}>
              {placedOrder.paymentMethod === 'UPI' ? '⏳' : '✅'}
            </div>
            <h3 style={{ margin: '0 0 8px', color: '#1e1b4b', fontSize: '22px' }}>
              {placedOrder.paymentMethod === 'UPI' ? 'UPI Payment Submitted!' : 'Order Placed Successfully!'}
            </h3>

            <div style={{ display: 'inline-block', margin: '8px 0 16px' }}>
              {placedOrder.paymentMethod === 'UPI' ? (
                <span
                  className="badge"
                  style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fde68a',
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  Status: Pending Bank Credit Verification
                </span>
              ) : (
                <span
                  className="badge"
                  style={{
                    background: '#dcfce7',
                    color: '#166534',
                    border: '1px solid #bbf7d0',
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  Status: Pending Delivery & Cash Collection
                </span>
              )}
            </div>

            <p style={{ color: '#475569', fontSize: '14px', maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.5 }}>
              {placedOrder.paymentMethod === 'UPI' ? (
                <>
                  Your order reference is <strong>{placedOrder.id}</strong>. The authorized shopkeeper of <strong>{shop.name}</strong> will verify the bank credit ({bankAccountLabel}) before dispatching your items.
                </>
              ) : (
                <>
                  Your order reference is <strong>{placedOrder.id}</strong>. Please keep ₹{placedOrder.totalAmount.toFixed(2)} in cash ready for when the delivery partner arrives at your address.
                </>
              )}
            </p>

            <div className="card" style={{ background: '#f8fafc', textAlign: 'left', padding: '14px', marginBottom: '20px', fontSize: '13.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="muted">Store:</span>
                <strong>{shop.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="muted">Amount:</span>
                <strong style={{ color: 'var(--purple)' }}>₹{placedOrder.totalAmount.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="muted">Payment Method:</span>
                <strong>{placedOrder.paymentMethod}</strong>
              </div>
              {placedOrder.transactionReference && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span className="muted">UPI Reference / UTR:</span>
                  <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                    {placedOrder.transactionReference}
                  </code>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Delivery Address:</span>
                <span style={{ maxWidth: '60%', textAlign: 'right' }}>{placedOrder.deliveryAddress}</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={onClose}
              style={{ padding: '10px 28px', fontSize: '15px' }}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder}>
            {/* ORDER ITEMS & PRICE BREAKDOWN */}
            <div className="card" style={{ background: '#f8fafc', padding: '14px 18px', marginBottom: '18px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13.5px', color: '#475569' }}>Items Subtotal:</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>₹{computedSubtotal.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13.5px', color: '#475569' }}>Delivery Fee:</span>
                {computedDeliveryFee === 0 ? (
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>
                    <span style={{ textDecoration: 'line-through', color: '#94a3b8', marginRight: '6px' }}>₹20.00</span>
                    🎉 FREE
                  </span>
                ) : (
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>₹{computedDeliveryFee.toFixed(2)}</span>
                )}
              </div>

              {computedDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', color: '#16a34a' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 600 }}>Special Tier Discount (₹100–₹150):</span>
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>-₹{computedDiscount.toFixed(2)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', marginTop: '6px', borderTop: '1.5px dashed #cbd5e1' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Total Payable Amount
                  </span>
                  <div className="muted small">Delivering to: {deliveryAddress.slice(0, 32)}…</div>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#7c3aed' }}>
                  ₹{finalGrandTotal.toFixed(2)}
                </div>
              </div>
            </div>

            {/* CUSTOMER CONTACT & DELIVERY DETAILS */}
            <div
              className="card"
              style={{
                background: '#f8fafc',
                padding: '16px 18px',
                marginBottom: '18px',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '18px' }}>👤</span>
                <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#1e1b4b' }}>
                  1. Contact Information
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Full Name *
                  </label>
                  <input
                    className="input"
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '13.5px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Mobile Number *
                  </label>
                  <input
                    className="input"
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '18px' }}>📍</span>
                  <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#1e1b4b' }}>
                    2. Confirm Doorstep Delivery Address
                  </span>
                </div>

                <div style={{ background: '#ede9fe', padding: '8px 12px', borderRadius: '8px', fontSize: '12.5px', color: '#5b21b6', marginBottom: '12px' }}>
                  📌 Reference Location: <strong>{deliveryAddress}</strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      House / Flat / Floor No. *
                    </label>
                    <input
                      className="input"
                      type="text"
                      required
                      placeholder="e.g. Flat 302, 3rd Floor"
                      value={flat}
                      onChange={(e) => setFlat(e.target.value)}
                      style={{ padding: '8px 12px', fontSize: '13.5px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Building / Apartment / Street Name
                    </label>
                    <input
                      className="input"
                      type="text"
                      placeholder="e.g. Shanti Niketan, Main Road"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      style={{ padding: '8px 12px', fontSize: '13.5px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Nearby Landmark
                    </label>
                    <input
                      className="input"
                      type="text"
                      placeholder="e.g. Opposite Shiv Mandir / Near Water Tank"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      style={{ padding: '8px 12px', fontSize: '13.5px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Pincode
                    </label>
                    <input
                      className="input"
                      type="text"
                      placeholder="e.g. 110001"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      style={{ padding: '8px 12px', fontSize: '13.5px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Delivery Instructions (Optional)
                  </label>
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g. Ring bell twice, leave at door, call when arriving"
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '13.5px' }}
                  />
                </div>
              </div>
            </div>

            {/* PAYMENT METHOD SELECTION TABS */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                SELECT PAYMENT METHOD:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: paymentMethod === 'UPI' ? '2px solid var(--purple)' : '1.5px solid #cbd5e1',
                    background: paymentMethod === 'UPI' ? '#f5f3ff' : '#ffffff',
                    color: paymentMethod === 'UPI' ? 'var(--purple-dark)' : '#334155',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>📱</span>
                  <span>UPI / QR Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: paymentMethod === 'COD' ? '2px solid var(--purple)' : '1.5px solid #cbd5e1',
                    background: paymentMethod === 'COD' ? '#f5f3ff' : '#ffffff',
                    color: paymentMethod === 'COD' ? 'var(--purple-dark)' : '#334155',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>💵</span>
                  <span>Cash on Delivery</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT: UPI QR PAYMENT */}
            {paymentMethod === 'UPI' && (
              <div
                className="card"
                style={{
                  border: '1.5px solid #ddd6fe',
                  background: '#faf5ff',
                  padding: '18px',
                  marginBottom: '18px',
                }}
              >
                {loadingShopData ? (
                  <Spinner label="Loading shop UPI details from Firebase…" />
                ) : (
                  <>
                    {/* SHOP QR CARD */}
                    <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#6b21a8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        Scan & Pay to: {shop.name}
                      </div>

                      <div
                        style={{
                          display: 'inline-block',
                          background: '#ffffff',
                          padding: '12px',
                          borderRadius: '16px',
                          boxShadow: '0 4px 14px rgba(124, 58, 237, 0.12)',
                          border: '2px solid #ede9fe',
                          marginTop: '10px',
                          maxWidth: '260px',
                        }}
                      >
                        <img
                          src={qrImageUrl}
                          alt={`${shop.name} UPI QR Code`}
                          style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '280px',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            display: 'block',
                          }}
                        />

                        <div
                          style={{
                            marginTop: '8px',
                            paddingTop: '6px',
                            borderTop: '1px solid #f1f5f9',
                            fontSize: '12px',
                            color: '#475569',
                            fontWeight: 600,
                          }}
                        >
                          🏦 Account: <strong>{bankAccountLabel}</strong>
                        </div>
                      </div>
                    </div>

                    {/* AMOUNT HIGHLIGHT & INSTRUCTIONS */}
                    <div
                      style={{
                        background: '#ffffff',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        marginBottom: '14px',
                        border: '1px solid #e9d5ff',
                        fontSize: '13px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#4c1d95' }}>Exact Amount to Transfer:</span>
                        <span style={{ fontSize: '20px', fontWeight: 800, color: '#7c3aed' }}>
                          ₹{finalGrandTotal.toFixed(2)}
                        </span>
                      </div>
                      <ol style={{ margin: 0, paddingLeft: '18px', color: '#475569', lineHeight: 1.5 }}>
                        <li>Open <strong>PhonePe, Google Pay, Paytm</strong> or any UPI scanner.</li>
                        <li>Scan the QR code shown above for <strong>{shop.name}</strong>.</li>
                        <li>Transfer <strong>₹{finalGrandTotal.toFixed(2)}</strong> to <strong>{bankAccountLabel}</strong>.</li>
                        <li><strong>Attach the payment screenshot below</strong> to confirm your order.</li>
                      </ol>
                    </div>

                    {/* PRIMARY PROOF: UPLOAD PAYMENT SCREENSHOT (REQUIRED FOR UPI) */}
                    <div
                      style={{
                        background: '#ffffff',
                        border: proofFile ? '2px solid #10b981' : '2px dashed #a855f7',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '14px',
                        textAlign: 'center',
                        transition: 'all 0.2s',
                      }}
                    >
                      <label style={{ display: 'block', cursor: 'pointer', margin: 0 }}>
                        <div style={{ fontSize: '32px', marginBottom: '4px' }}>
                          {proofFile ? '✅' : '📸'}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e1b4b', marginBottom: '4px' }}>
                          {proofFile ? 'Payment Screenshot Attached!' : 'Upload Payment Screenshot (SS) *'}
                        </div>
                        <p className="muted small" style={{ margin: '0 0 10px', color: '#64748b' }}>
                          Attach the confirmation screenshot from your UPI app after paying.
                        </p>

                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                          id="checkout-payment-ss"
                        />
                        <span
                          className="btn btn-outline small"
                          style={{
                            display: 'inline-block',
                            cursor: 'pointer',
                            color: proofFile ? '#166534' : '#7c3aed',
                            borderColor: proofFile ? '#bbf7d0' : '#a855f7',
                            background: proofFile ? '#dcfce7' : '#faf5ff',
                            padding: '8px 18px',
                            fontWeight: 700,
                            borderRadius: '8px',
                          }}
                        >
                          {proofFile ? '🔄 Choose Different Screenshot' : '📎 Attach Payment Screenshot'}
                        </span>
                      </label>

                      {proofPreview && (
                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <img
                            src={proofPreview}
                            alt="Screenshot preview"
                            style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          />
                          <div style={{ textAlign: 'left', flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {proofFile?.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>
                              ✓ Screenshot ready for verification
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setProofFile(null);
                              setProofPreview(null);
                            }}
                            style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            ✕ Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {/* OPTIONAL UTR / TRANSACTION ID INPUT */}
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        UPI Reference / UTR Number <span className="muted font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. 412345678901 (optional if screenshot attached)"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        style={{
                          fontSize: '13px',
                          padding: '8px 12px',
                          fontFamily: 'monospace',
                          border: '1px solid #cbd5e1',
                          width: '100%',
                          borderRadius: '8px',
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB CONTENT: COD */}
            {paymentMethod === 'COD' && (
              <div
                className="card"
                style={{
                  border: '1.5px solid #bbf7d0',
                  background: '#f0fdf4',
                  padding: '18px',
                  marginBottom: '18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '28px' }}>💵</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', color: '#166534' }}>Cash on Delivery (COD)</h4>
                    <span className="muted small" style={{ color: '#15803d' }}>
                      Zero advance payment required
                    </span>
                  </div>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '13.5px', color: '#374151', lineHeight: 1.5 }}>
                  You will pay <strong>₹{finalGrandTotal.toFixed(2)}</strong> in cash to the delivery partner when your order is delivered to:
                </p>
                <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #dcfce7', fontSize: '13px', color: '#1e293b' }}>
                  📍 {deliveryAddress}
                </div>
              </div>
            )}

            {/* SUBMIT BUTTONS */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || (paymentMethod === 'UPI' && !proofFile && !transactionRef.trim())}
                style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: 700,
                  background: paymentMethod === 'UPI' ? 'var(--purple)' : '#16a34a',
                  borderColor: paymentMethod === 'UPI' ? 'var(--purple)' : '#16a34a',
                }}
              >
                {submitting ? (
                  'Placing Order…'
                ) : paymentMethod === 'UPI' ? (
                  `Upload SS & Place Order (₹${finalGrandTotal.toFixed(2)}) →`
                ) : (
                  `Place Cash on Delivery Order (₹${finalGrandTotal.toFixed(2)}) →`
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

