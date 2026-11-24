import { useEffect, useState, useCallback } from 'react';
import type { Order } from '../types';
import { listOrdersForCustomer } from '../services/orders';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from './Spinner';
import { ComplaintModal } from './ComplaintModal';

export function OrderHistorySection() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderForComplaint, setSelectedOrderForComplaint] = useState<Order | null>(null);

  const loadOrders = useCallback(async () => {
    if (!profile?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listOrdersForCustomer(profile.uid);
      setOrders(data);
    } catch (err: any) {
      console.warn('Failed to load orders for customer:', err);
      setError('Could not retrieve your previous orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [profile?.uid]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#1e1b4b' }}>📦 My Order History</h2>
          <p className="muted small" style={{ margin: '4px 0 0' }}>
            Track live order status, vendor confirmations, and report any issues.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline small"
          onClick={loadOrders}
          disabled={loading}
          style={{ fontSize: '12.5px' }}
        >
          🔄 Refresh
        </button>
      </div>

      {loading && <Spinner label="Loading your past orders…" />}

      {error && <div className="alert error">{error}</div>}

      {!loading && orders.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛍️</div>
          <h3 style={{ margin: '0 0 6px', color: '#334155' }}>No Orders Placed Yet</h3>
          <p className="muted small" style={{ margin: 0 }}>
            Once you order from a nearby Kirana store, your active tracking and invoices will appear here.
          </p>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map((ord) => {
            const isPending = ord.status === 'pending';
            const isAccepted = ord.status === 'accepted';
            const isOutForDelivery = ord.status === 'out_for_delivery';
            const isDelivered = ord.status === 'delivered';

            return (
              <div
                key={ord.id}
                className="card"
                style={{
                  border: isOutForDelivery
                    ? '2px solid #059669'
                    : isAccepted
                    ? '2px solid #86efac'
                    : isPending
                    ? '1.5px solid #fde68a'
                    : '1px solid #e2e8f0',
                  boxShadow: isOutForDelivery
                    ? '0 6px 20px rgba(5, 150, 105, 0.15)'
                    : isAccepted
                    ? '0 4px 16px rgba(34, 197, 94, 0.12)'
                    : undefined,
                  borderRadius: '12px',
                  padding: '18px',
                }}
              >
                {/* ORDER HEADER */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '10px',
                    borderBottom: '1px solid #f1f5f9',
                    paddingBottom: '12px',
                    marginBottom: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '17px', fontWeight: 800, color: '#1e1b4b' }}>
                        Order #{ord.id}
                      </span>
                      <span
                        className="badge"
                        style={{
                          background: isOutForDelivery
                            ? '#d1fae5'
                            : isAccepted
                            ? '#dcfce7'
                            : isPending
                            ? '#fef3c7'
                            : isDelivered
                            ? '#e0f2fe'
                            : '#f1f5f9',
                          color: isOutForDelivery
                            ? '#065f46'
                            : isAccepted
                            ? '#166534'
                            : isPending
                            ? '#92400e'
                            : isDelivered
                            ? '#0369a1'
                            : '#475569',
                          fontWeight: 800,
                          padding: '4px 10px',
                        }}
                      >
                        {isPending && '⏳ Order Placed • Store confirmation pending'}
                        {isAccepted && '📦 Order Pack Ho Raha Hai'}
                        {isOutForDelivery && '🚚 Out for Delivery • Live Track'}
                        {isDelivered && '🎉 Delivered Successfully'}
                        {!isPending && !isAccepted && !isOutForDelivery && !isDelivered && ord.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                      🏪 Store: <strong>{ord.shopName}</strong> ({ord.shopId}) • 🕒{' '}
                      {new Date(ord.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#7c3aed' }}>
                      ₹{ord.totalAmount.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {ord.paymentMethod === 'UPI' ? '📱 UPI' : '💵 Cash on Delivery'}
                    </div>
                  </div>
                </div>

                {/* LIFECYCLE STAGE 1: ORDER PLACED (PENDING) */}
                {isPending && (
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1.5px solid #fde68a',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>⏳</span>
                    <div>
                      <strong style={{ color: '#92400e', fontSize: '13.5px', display: 'block' }}>
                        Order Placed Successfully!
                      </strong>
                      <span style={{ color: '#b45309', fontSize: '12.5px' }}>
                        The Kirana store has received your grocery list. As soon as the shopkeeper accepts, packing will begin!
                      </span>
                    </div>
                  </div>
                )}

                {/* LIFECYCLE STAGE 2: ACCEPTED / PACKING */}
                {isAccepted && (
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1.5px solid #86efac',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <span style={{ fontSize: '26px' }}>📦</span>
                    <div>
                      <strong style={{ color: '#166534', fontSize: '14.5px', display: 'block' }}>
                        Order Pack Ho Raha Hai!
                      </strong>
                      <span style={{ color: '#15803d', fontSize: '12.5px' }}>
                        {ord.vendorMessage || 'The shopkeeper is packing your fresh groceries. Once packed, your delivery partner will leave immediately!'}
                      </span>
                    </div>
                  </div>
                )}

                {/* LIFECYCLE STAGE 3: OUT FOR DELIVERY + LIVE LOCATION TRACKING */}
                {isOutForDelivery && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                      border: '2px solid #059669',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      marginBottom: '14px',
                      boxShadow: '0 4px 14px rgba(5, 150, 105, 0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '24px' }}>🛵</span>
                        <div>
                          <strong style={{ color: '#065f46', fontSize: '15px', display: 'block' }}>
                            Out for Delivery — On the Way!
                          </strong>
                          <span style={{ color: '#047857', fontSize: '12px' }}>
                            Your delivery partner has left the store and is heading to your doorstep.
                          </span>
                        </div>
                      </div>

                      {ord.tracking?.lat && ord.tracking?.lng && (
                        <a
                          href={`https://www.google.com/maps?q=${ord.tracking.lat},${ord.tracking.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline small"
                          style={{ borderColor: '#059669', color: '#065f46', background: '#ffffff', fontWeight: 700 }}
                        >
                          🗺️ View on Google Maps
                        </a>
                      )}
                    </div>

                    {/* LIVE TRACKING DETAILS & PARTNER CONTACT */}
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #a7f3d0',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '10px',
                        fontSize: '13px',
                      }}
                    >
                      <div>
                        <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                          Delivery Partner
                        </div>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>
                          {ord.tracking?.partnerName || 'Kirana Delivery Boy'}
                        </div>
                        {ord.tracking?.partnerPhone && (
                          <a
                            href={`tel:${ord.tracking.partnerPhone}`}
                            style={{ color: '#059669', fontWeight: 700, fontSize: '12.5px', textDecoration: 'none' }}
                          >
                            📞 {ord.tracking.partnerPhone}
                          </a>
                        )}
                      </div>

                      <div>
                        <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                          Live Location Status
                        </div>
                        <div style={{ color: '#047857', fontWeight: 600 }}>
                          {ord.tracking?.lat && ord.tracking?.lng ? (
                            <>
                              📍 GPS: {ord.tracking.lat.toFixed(4)}, {ord.tracking.lng.toFixed(4)}
                              <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                                Updated: {new Date(ord.tracking.updatedAt || Date.now()).toLocaleTimeString()}
                              </span>
                            </>
                          ) : (
                            '📍 Partner transmitting location…'
                          )}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                          Delivering To
                        </div>
                        <div style={{ color: '#334155', fontSize: '12.5px' }}>
                          {ord.deliveryAddress}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* LIFECYCLE STAGE 4: DELIVERED */}
                {isDelivered && (
                  <div
                    style={{
                      background: '#eff6ff',
                      border: '1.5px solid #bfdbfe',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>🎉</span>
                    <div>
                      <strong style={{ color: '#1e40af', fontSize: '14px', display: 'block' }}>
                        Order Delivered!
                      </strong>
                      <span style={{ color: '#2563eb', fontSize: '12.5px' }}>
                        Your items have been delivered to your doorstep. Thank you for shopping with {ord.shopName}!
                      </span>
                    </div>
                  </div>
                )}

                {/* PAYMENT STATUS BADGE */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '12.5px',
                    marginBottom: '12px',
                    padding: '8px 12px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#475569' }}>Payment Status:</span>
                  {ord.paymentMethod === 'UPI' ? (
                    ord.paymentStatus === 'confirmed' ? (
                      <span style={{ color: '#16a34a', fontWeight: 700 }}>
                        ✓ Bank Credit Verified by Shopkeeper
                      </span>
                    ) : (
                      <span style={{ color: '#d97706', fontWeight: 700 }}>
                        ⏳ Pending Shopkeeper Bank Credit Verification
                      </span>
                    )
                  ) : ord.paymentStatus === 'collected' ? (
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Cash Collected by Delivery Agent</span>
                  ) : (
                    <span style={{ color: '#64748b', fontWeight: 600 }}>💵 Cash to be collected at doorstep</span>
                  )}
                </div>

                {/* ORDER ITEMS LIST */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    ITEMS ({ord.items.length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {ord.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '13px',
                          color: '#475569',
                          padding: '3px 0',
                        }}
                      >
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COMPLAINT STATUS OR REPORT BUTTON */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '12px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  {ord.complaint ? (
                    <div style={{ fontSize: '12.5px', color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>⚠️ Grievance Registered:</span>
                      <strong>{ord.complaint.category}</strong>
                      <span className="badge small" style={{ background: '#fef3c7', color: '#92400e' }}>
                        {ord.complaint.status}
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Need help with this order? Our Kirana support is here.
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn btn-outline small"
                    onClick={() => setSelectedOrderForComplaint(ord)}
                    style={{
                      fontSize: '12.5px',
                      color: ord.complaint ? '#b45309' : '#dc2626',
                      borderColor: ord.complaint ? '#fde68a' : '#fca5a5',
                      fontWeight: 600,
                    }}
                  >
                    {ord.complaint ? '🔍 View Issue Status' : '🆘 Report an Issue / Complaint'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* COMPLAINT MODAL */}
      {selectedOrderForComplaint && (
        <ComplaintModal
          order={selectedOrderForComplaint}
          onClose={() => setSelectedOrderForComplaint(null)}
          onSuccess={() => {
            loadOrders();
            setSelectedOrderForComplaint(null);
          }}
        />
      )}
    </div>
  );
}
