import React, { useState } from 'react';
import type { Order } from '../types';
import { submitOrderComplaint } from '../services/orders';
import { useAuth } from '../contexts/AuthContext';

interface ComplaintModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

const COMPLAINT_CATEGORIES = [
  'Missing item from order',
  'Received wrong item or variant',
  'Damaged or spoiled item',
  'Delivery delay / Partner behavior',
  'Payment or billing issue',
  'Item expired or near expiry',
  'Other query / feedback',
];

export function ComplaintModal({ order, onClose, onSuccess }: ComplaintModalProps) {
  const { profile } = useAuth();
  const [category, setCategory] = useState(COMPLAINT_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a brief explanation of the issue.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await submitOrderComplaint(order.id, {
        customerId: profile?.uid || order.customerId,
        category,
        description: description.trim(),
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="blinkit-modal-backdrop" onClick={onClose}>
      <div
        className="blinkit-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', padding: '24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '22px' }}>🆘</span>
              <h3 style={{ margin: 0, fontSize: '19px', color: '#1e1b4b' }}>Help & Order Issue</h3>
            </div>
            <p className="muted small" style={{ margin: '4px 0 0' }}>
              Order ID: <strong>{order.id}</strong> • Store: <strong>{order.shopName}</strong>
            </p>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            ✕
          </button>
        </div>

        {order.complaint ? (
          <div
            style={{
              background: '#fef3c7',
              border: '1px solid #fde68a',
              borderRadius: '10px',
              padding: '16px',
              color: '#92400e',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>
              ⚠️ Complaint Already Registered
            </div>
            <div style={{ fontSize: '13px', marginBottom: '8px' }}>
              <strong>Category:</strong> {order.complaint.category}
            </div>
            <div style={{ fontSize: '13px', marginBottom: '8px' }}>
              <strong>Description:</strong> {order.complaint.description}
            </div>
            <div style={{ fontSize: '12.5px', color: '#78350f' }}>
              Status: <strong>{order.complaint.status.toUpperCase()}</strong> • Our support team and the Kirana store
              have received your grievance and are addressing it.
            </div>
            <div style={{ marginTop: '14px', textAlign: 'right' }}>
              <button type="button" className="btn btn-outline small" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="alert error small" style={{ marginBottom: '12px' }}>{error}</div>}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                What went wrong? *
              </label>
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13.5px' }}
              >
                {COMPLAINT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Describe your issue in detail *
              </label>
              <textarea
                className="input"
                rows={4}
                required
                placeholder="Tell us what happened with your order so we can resolve it immediately with the store..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ background: '#dc2626', borderColor: '#dc2626', padding: '9px 20px', fontWeight: 700 }}
              >
                {submitting ? 'Submitting…' : 'Submit Issue'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
