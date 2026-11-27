import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  listAllShops,
  createShop,
  updateShop,
  deleteShop,
  listAllProducts,
  updateProduct,
} from '../services/shops';
import { forwardGeocode, reverseGeocode } from '../services/location';
import { MapPicker } from '../components/MapPicker';
import { Spinner } from '../components/Spinner';
import { SHOP_CATEGORIES, type Shop, type ShopCategory, type ShopSource, type Product } from '../types';

export function AdminDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'shops' | 'audit'>('shops');
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Image Audit states
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditShopFilter, setAuditShopFilter] = useState<'all' | 'SHOP_01' | 'SHOP_02'>('all');
  const [auditStatusFilter, setAuditStatusFilter] = useState<'all' | 'verified' | 'needs_review' | 'placeholder'>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editMatchStatus, setEditMatchStatus] = useState<'verified' | 'needs_review' | 'placeholder'>('verified');
  const [editMatchType, setEditMatchType] = useState<'exact_product' | 'exact_variant' | 'category_fallback'>('exact_product');
  const [savingProduct, setSavingProduct] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'manual' | 'google_places' | 'vendor'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingShopId, setEditingShopId] = useState<string | null>(null);

  const initialFormData = {
    name: '',
    category: SHOP_CATEGORIES[0] as ShopCategory,
    ownerName: '',
    phone: '',
    address: '',
    lat: 28.6139,
    lng: 77.2090,
    imageUrl: '',
    openingHours: '8:00 AM - 10:00 PM',
    description: '',
    status: 'active' as 'active' | 'inactive',
    approvalStatus: 'approved' as 'approved' | 'pending' | 'rejected',
    source: 'manual' as ShopSource,
    googlePlaceId: '',
  };

  const [form, setForm] = useState(initialFormData);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [geocodingLoading, setGeocodingLoading] = useState(false);

  const loadShops = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAllShops();
      setShops(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load shops.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const data = await listAllProducts();
      setProducts(data);
    } catch (e: any) {
      console.warn('Failed to load products for audit:', e);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'audit' && products.length === 0) {
      loadProducts();
    }
  }, [activeTab, products.length, loadProducts]);

  const handleStartEditProduct = (p: Product) => {
    setEditingProduct(p);
    setEditImageUrl(p.imageUrl || '');
    setEditMatchStatus(p.imageMatchStatus || 'verified');
    setEditMatchType(p.imageMatchType || 'exact_product');
  };

  const handleSaveProductImage = async () => {
    if (!editingProduct) return;
    setSavingProduct(true);
    try {
      await updateProduct(editingProduct.id, {
        imageUrl: editImageUrl.trim(),
        imageMatchStatus: editMatchStatus,
        imageMatchType: editMatchType,
        imageSource: 'admin_verified',
      });

      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === editingProduct.id) {
            return {
              ...p,
              imageUrl: editImageUrl.trim(),
              imageMatchStatus: editMatchStatus,
              imageMatchType: editMatchType,
              imageSource: 'admin_verified',
            };
          }
          return p;
        })
      );

      setSuccessMsg(`Image updated successfully for "${editingProduct.productName || editingProduct.name}"!`);
      setEditingProduct(null);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err?.message || 'Failed to update product image.');
    } finally {
      setSavingProduct(false);
    }
  };

  const auditStats = useMemo(() => {
    const total = products.length;
    const verified = products.filter((p) => p.imageMatchStatus === 'verified' || !p.imageMatchStatus).length;
    const needsReview = products.filter((p) => p.imageMatchStatus === 'needs_review').length;
    const placeholder = products.filter((p) => p.imageMatchStatus === 'placeholder').length;
    const broken = products.filter((p) => !p.imageUrl || p.imageUrl.trim() === '').length;
    return { total, verified, needsReview, placeholder, broken };
  }, [products]);

  const filteredAuditProducts = useMemo(() => {
    return products.filter((p) => {
      if (auditShopFilter !== 'all' && p.shopId !== auditShopFilter) return false;
      if (auditStatusFilter !== 'all') {
        const s = p.imageMatchStatus || 'verified';
        if (s !== auditStatusFilter) return false;
      }
      if (auditSearch.trim()) {
        const q = auditSearch.toLowerCase().trim();
        const n = (p.productName || p.name || '').toLowerCase();
        const b = (p.brand || '').toLowerCase();
        const c = (p.category || '').toLowerCase();
        if (!n.includes(q) && !b.includes(q) && !c.includes(q)) return false;
      }
      return true;
    });
  }, [products, auditShopFilter, auditStatusFilter, auditSearch]);

  // Handle map click / marker placement
  const handleMapPositionChange = async (lat: number, lng: number) => {
    setForm((prev) => ({ ...prev, lat, lng }));
    try {
      const res = await reverseGeocode(lat, lng);
      if (res?.address) {
        setForm((prev) => ({
          ...prev,
          address: prev.address ? prev.address : res.address,
        }));
      }
    } catch (e) {
      console.warn('Reverse geocoding error:', e);
    }
  };

  // Search address by string using Google Maps Geocoder
  const handleSearchAddress = async () => {
    if (!addressSearchQuery.trim()) return;
    setGeocodingLoading(true);
    setError(null);
    try {
      const res = await forwardGeocode(addressSearchQuery);
      if (!res) {
        setError(`Could not locate address "${addressSearchQuery}". Please try adding landmark or city name.`);
        return;
      }
      setForm((prev) => ({
        ...prev,
        lat: res.lat,
        lng: res.lng,
        address: res.address || addressSearchQuery,
      }));
      setAddressSearchQuery('');
    } catch (err: any) {
      setError(err?.message || 'Address lookup failed.');
    } finally {
      setGeocodingLoading(false);
    }
  };

  const handleStartAdd = () => {
    setEditingShopId(null);
    setForm(initialFormData);
    setShowForm(true);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const handleStartEdit = (shop: Shop) => {
    setEditingShopId(shop.id);
    setForm({
      name: shop.name,
      category: shop.category,
      ownerName: shop.ownerName || '',
      phone: shop.phone || '',
      address: shop.address,
      lat: shop.location.lat,
      lng: shop.location.lng,
      imageUrl: shop.imageUrl || '',
      openingHours: shop.openingHours || '8:00 AM - 10:00 PM',
      description: shop.description || '',
      status: (shop.status === 'inactive' || shop.status === 'closed') ? 'inactive' : 'active',
      approvalStatus: shop.approvalStatus || 'approved',
      source: shop.source || (shop.createdByAdmin ? 'manual' : 'vendor'),
      googlePlaceId: shop.googlePlaceId || '',
    });
    setShowForm(true);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingShopId(null);
    setForm(initialFormData);
  };

  const handleSubmitShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Please enter a shop name.');
      return;
    }
    if (!form.address.trim()) {
      setError('Please provide the shop address.');
      return;
    }
    if (!form.lat || !form.lng) {
      setError('Please select the shop location on Google Maps.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingShopId) {
        await updateShop(editingShopId, {
          name: form.name.trim(),
          category: form.category,
          ownerName: form.ownerName.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          location: { lat: form.lat, lng: form.lng },
          imageUrl: form.imageUrl.trim() || undefined,
          openingHours: form.openingHours.trim(),
          description: form.description.trim(),
          status: form.status,
          approvalStatus: form.approvalStatus,
          source: form.source || 'manual',
          googlePlaceId: form.googlePlaceId ? form.googlePlaceId.trim() : undefined,
        });
        setSuccessMsg(`Shop "${form.name}" updated successfully!`);
      } else {
        await createShop({
          vendorId: profile?.uid || 'admin',
          name: form.name.trim(),
          category: form.category,
          ownerName: form.ownerName.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          location: { lat: form.lat, lng: form.lng },
          imageUrl: form.imageUrl.trim() || undefined,
          openingHours: form.openingHours.trim(),
          description: form.description.trim(),
          status: form.status,
          approvalStatus: 'approved',
          createdByAdmin: true,
          source: form.source || 'manual',
          googlePlaceId: form.googlePlaceId ? form.googlePlaceId.trim() : undefined,
        });
        setSuccessMsg(`New shop "${form.name}" added successfully!`);
      }

      setShowForm(false);
      setEditingShopId(null);
      setForm(initialFormData);
      await loadShops();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save shop.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (shop: Shop) => {
    const newStatus = (shop.status === 'active' || shop.status === 'open') ? 'inactive' : 'active';
    try {
      await updateShop(shop.id, { status: newStatus });
      setShops((prev) =>
        prev.map((s) => (s.id === shop.id ? { ...s, status: newStatus } : s))
      );
      setSuccessMsg(`Shop "${shop.name}" status changed to ${newStatus.toUpperCase()}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update shop status.');
    }
  };

  const handleApproveVendorShop = async (shop: Shop) => {
    try {
      await updateShop(shop.id, { approvalStatus: 'approved', status: 'active' });
      setShops((prev) =>
        prev.map((s) => (s.id === shop.id ? { ...s, approvalStatus: 'approved', status: 'active' } : s))
      );
      setSuccessMsg(`Vendor shop "${shop.name}" approved and activated!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to approve shop.');
    }
  };

  const handleDeleteShop = async (shop: Shop) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${shop.name}" and all associated products? This action cannot be undone.`
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      await deleteShop(shop.id);
      setShops((prev) => prev.filter((s) => s.id !== shop.id));
      setSuccessMsg(`Shop "${shop.name}" was permanently removed.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete shop.');
    } finally {
      setSaving(false);
    }
  };

  // Filtered shops
  const filteredShops = useMemo(() => {
    return shops.filter((s) => {
      // Status filter
      if (statusFilter === 'active') {
        if (s.status === 'inactive' || s.status === 'closed') return false;
      } else if (statusFilter === 'inactive') {
        if (s.status === 'active' || s.status === 'open') return false;
      } else if (statusFilter === 'pending') {
        if (s.approvalStatus !== 'pending') return false;
      }

      // Source filter (keeps Google Places listings separate from manual registrations)
      if (sourceFilter !== 'all') {
        const sSource = s.source || (s.createdByAdmin ? 'manual' : 'vendor');
        if (sSource !== sourceFilter) return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && s.category !== categoryFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesOwner = s.ownerName?.toLowerCase().includes(q) ?? false;
        const matchesAddr = s.address.toLowerCase().includes(q);
        const matchesCat = s.category.toLowerCase().includes(q);
        return matchesName || matchesOwner || matchesAddr || matchesCat;
      }

      return true;
    });
  }, [shops, statusFilter, sourceFilter, categoryFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = shops.length;
    const active = shops.filter((s) => s.status === 'active' || s.status === 'open').length;
    const inactive = shops.filter((s) => s.status === 'inactive' || s.status === 'closed').length;
    const pending = shops.filter((s) => s.approvalStatus === 'pending').length;
    const manual = shops.filter((s) => !s.source || s.source === 'manual').length;
    const googlePlaces = shops.filter((s) => s.source === 'google_places').length;
    return { total, active, inactive, pending, manual, googlePlaces };
  }, [shops]);

  return (
    <div className="page admin-dashboard">
      <div className="page-head">
        <div className="row between align-center" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0 }}>⚙️ Admin Shop Management</h1>
              <span className="badge badge-admin">Master Admin</span>
            </div>
            <p className="muted" style={{ margin: '6px 0 0' }}>
              Add, verify, configure, and monitor all local neighborhood shops across ApnaMart.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={showForm ? handleCancelForm : handleStartAdd}
          >
            {showForm ? '✕ Close Form' : '➕ Add New Local Shop'}
          </button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}
      {successMsg && <div className="alert success">{successMsg}</div>}

      {/* ADMIN TOP NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('shops')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            background: activeTab === 'shops' ? '#7c3aed' : '#f1f5f9',
            color: activeTab === 'shops' ? '#ffffff' : '#475569',
            transition: 'all 0.2s',
          }}
        >
          🏪 Local Shops ({stats.total})
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('audit');
            if (products.length === 0) loadProducts();
          }}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            background: activeTab === 'audit' ? '#7c3aed' : '#f1f5f9',
            color: activeTab === 'audit' ? '#ffffff' : '#475569',
            transition: 'all 0.2s',
          }}
        >
          📸 Product Image Audit ({products.length > 0 ? products.length : '260'} Products)
        </button>
      </div>

      {/* TAB 1: SHOPS MANAGEMENT */}
      {activeTab === 'shops' && (
        <>
          {/* STATS OVERVIEW CARDS */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-num">{stats.total}</div>
          <div className="admin-stat-label">Total Registered Shops</div>
        </div>
        <div className="admin-stat-card active">
          <div className="admin-stat-num">{stats.active}</div>
          <div className="admin-stat-label">Active & Discoverable</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num">{stats.manual}</div>
          <div className="admin-stat-label">✍️ Manually Registered</div>
        </div>
        <div className="admin-stat-card pending">
          <div className="admin-stat-num">{stats.googlePlaces}</div>
          <div className="admin-stat-label">🗺️ Google Places Imports</div>
        </div>
        <div className="admin-stat-card pending">
          <div className="admin-stat-num">{stats.pending}</div>
          <div className="admin-stat-label">Pending Vendor Approvals</div>
        </div>
      </div>

      {/* SHOP ADD / EDIT FORM */}
      {showForm && (
        <div className="card admin-form-card" style={{ marginBottom: '28px' }}>
          <div className="admin-form-header">
            <h3>{editingShopId ? '✏️ Edit Shop Details' : '🏪 Register New Local Shop'}</h3>
            <p className="muted small">
              Fill in the shop information and pinpoint its exact location on Google Maps. No latitude/longitude typing needed.
            </p>
          </div>

          <form onSubmit={handleSubmitShop} className="admin-shop-form">
            <div className="form-grid-2">
              <label>
                Shop Name *
                <input
                  className="input"
                  placeholder="e.g. Gupta Provision & Kirana Store"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>

              <label>
                Shop Category *
                <select
                  className="input"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as ShopCategory })}
                  required
                >
                  {SHOP_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Registration Source *
                <select
                  className="input"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value as ShopSource })}
                >
                  <option value="manual">✍️ Manually Registered Local Shop</option>
                  <option value="google_places">🗺️ Google Places Import / Listing</option>
                  <option value="vendor">🏪 Vendor Submitted</option>
                </select>
              </label>

              <label>
                Owner / Contact Name
                <input
                  className="input"
                  placeholder="e.g. Rajesh Gupta"
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                />
              </label>

              <label>
                Contact Phone Number
                <input
                  className="input"
                  placeholder="e.g. +91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </label>

              <label>
                Opening Hours
                <input
                  className="input"
                  placeholder="e.g. 7:00 AM - 10:30 PM"
                  value={form.openingHours}
                  onChange={(e) => setForm({ ...form, openingHours: e.target.value })}
                />
              </label>

              <label>
                Shop Status
                <select
                  className="input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
                >
                  <option value="active">Active (Visible to customers)</option>
                  <option value="inactive">Inactive (Hidden from customers)</option>
                </select>
              </label>
            </div>

            <label style={{ marginTop: '12px', display: 'block' }}>
              Shop Image URL <span className="muted">(Optional)</span>
              <input
                className="input"
                placeholder="https://example.com/shop-photo.jpg"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
              <span className="muted small" style={{ display: 'block', marginTop: '4px' }}>
                Quick Presets:{' '}
                <button
                  type="button"
                  className="btn-link-small"
                  onClick={() =>
                    setForm({
                      ...form,
                      imageUrl:
                        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
                    })
                  }
                >
                  Grocery
                </button>{' '}
                ·{' '}
                <button
                  type="button"
                  className="btn-link-small"
                  onClick={() =>
                    setForm({
                      ...form,
                      imageUrl:
                        'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=600&q=80',
                    })
                  }
                >
                  Pharmacy
                </button>{' '}
                ·{' '}
                <button
                  type="button"
                  className="btn-link-small"
                  onClick={() =>
                    setForm({
                      ...form,
                      imageUrl:
                        'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
                    })
                  }
                >
                  Bakery
                </button>{' '}
                ·{' '}
                <button
                  type="button"
                  className="btn-link-small"
                  onClick={() =>
                    setForm({
                      ...form,
                      imageUrl:
                        'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=600&q=80',
                    })
                  }
                >
                  Fruits & Veg
                </button>
              </span>
            </label>

            <label style={{ marginTop: '12px', display: 'block' }}>
              Shop Description
              <textarea
                className="input"
                rows={3}
                placeholder="Write a brief overview of what this shop offers (e.g. fresh farm groceries, organic dairy, delivery details)..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>

            {/* MAP & ADDRESS SECTION */}
            <div className="admin-map-section" style={{ marginTop: '16px' }}>
              <label style={{ fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                📍 Shop Physical Address & Google Maps Location *
              </label>

              <label style={{ marginBottom: '8px', display: 'block' }}>
                Full Street Address
                <input
                  className="input"
                  placeholder="e.g. Shop 14, Main Market, Sector 15, Rohini, New Delhi"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required
                />
              </label>

              <div className="manual-row" style={{ marginBottom: '10px' }}>
                <input
                  className="input"
                  placeholder="🔍 Or search landmark/locality to move map pin..."
                  value={addressSearchQuery}
                  onChange={(e) => setAddressSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchAddress();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleSearchAddress}
                  disabled={geocodingLoading || !addressSearchQuery.trim()}
                >
                  {geocodingLoading ? 'Searching…' : 'Locate on Map'}
                </button>
              </div>

              <div className="map-guidance-bar" style={{ marginBottom: '8px' }}>
                <span>
                  🗺️ <strong>Google Maps Location:</strong> Tap anywhere on the map or drag the pin to set the exact shop storefront location.
                </span>
              </div>

              <MapPicker
                position={{ lat: form.lat, lng: form.lng }}
                onPositionChange={handleMapPositionChange}
                interactive
                height={280}
              />
            </div>

            <div className="row end gap" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCancelForm}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ minWidth: '180px' }}
              >
                {saving ? 'Saving Shop…' : editingShopId ? '💾 Save Changes' : '✅ Add Shop to ApnaMart'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="card admin-filter-bar" style={{ marginBottom: '20px' }}>
        <div className="row between align-center" style={{ flexWrap: 'wrap', gap: '14px' }}>
          <div className="admin-search-wrap">
            <input
              className="input"
              placeholder="🔍 Search shops by name, category, owner, or address…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="row align-center gap" style={{ flexWrap: 'wrap' }}>
            {/* Status filters */}
            <div className="status-filter-pills">
              <button
                type="button"
                className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All ({stats.total})
              </button>
              <button
                type="button"
                className={`filter-pill ${statusFilter === 'active' ? 'active' : ''}`}
                onClick={() => setStatusFilter('active')}
              >
                Active ({stats.active})
              </button>
              <button
                type="button"
                className={`filter-pill ${statusFilter === 'inactive' ? 'active' : ''}`}
                onClick={() => setStatusFilter('inactive')}
              >
                Inactive ({stats.inactive})
              </button>
              <button
                type="button"
                className={`filter-pill ${statusFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setStatusFilter('pending')}
              >
                Pending ({stats.pending})
              </button>
            </div>

            {/* Source separation filters: keep Google Places separate from manual registrations */}
            <div className="status-filter-pills">
              <button
                type="button"
                className={`filter-pill ${sourceFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSourceFilter('all')}
              >
                All Sources
              </button>
              <button
                type="button"
                className={`filter-pill ${sourceFilter === 'manual' ? 'active' : ''}`}
                onClick={() => setSourceFilter('manual')}
                title="Only manually registered local shops"
              >
                ✍️ Registered ({stats.manual})
              </button>
              <button
                type="button"
                className={`filter-pill ${sourceFilter === 'google_places' ? 'active' : ''}`}
                onClick={() => setSourceFilter('google_places')}
                title="Google Places imports"
              >
                🗺️ Places ({stats.googlePlaces})
              </button>
            </div>

            <select
              className="input"
              style={{ width: 'auto', minWidth: '160px' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {SHOP_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SHOPS LISTING */}
      {loading ? (
        <Spinner label="Loading registered shops…" />
      ) : filteredShops.length === 0 ? (
        <div className="card empty-state">
          <h3>No matching shops found</h3>
          <p className="muted">
            {searchQuery || statusFilter !== 'all' || sourceFilter !== 'all' || categoryFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'No shops registered yet. Click "Add New Local Shop" above to add your first shop!'}
          </p>
        </div>
      ) : (
        <div className="admin-shop-list">
          {filteredShops.map((shop) => {
            const isActive = shop.status === 'active' || shop.status === 'open';
            const isPending = shop.approvalStatus === 'pending';
            const productsCount = shop.products?.length || 0;
            const isPlaces = shop.source === 'google_places';

            return (
              <div key={shop.id} className={`card admin-shop-item ${!isActive ? 'is-inactive' : ''}`}>
                <div className="admin-shop-item-grid">
                  {/* Shop Thumbnail */}
                  <div className="admin-shop-thumbnail">
                    {shop.imageUrl ? (
                      <img src={shop.imageUrl} alt={shop.name} />
                    ) : (
                      <div className="shop-img-fallback">🏪</div>
                    )}
                  </div>

                  {/* Shop Information */}
                  <div className="admin-shop-details">
                    <div className="row align-center gap" style={{ flexWrap: 'wrap', marginBottom: '4px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px' }}>{shop.name}</h3>
                      <span className="badge">{shop.category}</span>
                      <span className={`badge ${isActive ? 'badge-status-active' : 'badge-status-inactive'}`}>
                        {isActive ? '● Active' : '○ Inactive'}
                      </span>
                      {isPending && (
                        <span className="badge badge-pending">⏳ Pending Approval</span>
                      )}
                      <span className={`badge ${isPlaces ? 'badge-places' : 'badge-source'}`}>
                        {isPlaces
                          ? '🗺️ Google Places Import'
                          : shop.source === 'vendor'
                          ? '🏪 Vendor Registered'
                          : '✍️ Manually Registered'}
                      </span>
                    </div>

                    <p className="admin-shop-address">
                      📍 {shop.address}
                    </p>

                    <div className="row gap small muted" style={{ marginTop: '4px', flexWrap: 'wrap' }}>
                      {shop.ownerName && <span>👤 Owner: <strong>{shop.ownerName}</strong></span>}
                      {shop.phone && <span>📞 Phone: <strong>{shop.phone}</strong></span>}
                      {shop.openingHours && <span>🕒 Hours: <strong>{shop.openingHours}</strong></span>}
                      <span>📦 Products: <strong>{productsCount} listed</strong></span>
                    </div>

                    {shop.description && (
                      <p className="small muted" style={{ margin: '6px 0 0', color: '#475569' }}>
                        {shop.description}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="admin-shop-actions">
                    {isPending && (
                      <button
                        type="button"
                        className="btn btn-primary small"
                        onClick={() => handleApproveVendorShop(shop)}
                        title="Approve this vendor shop and make it live"
                      >
                        ✅ Approve Shop
                      </button>
                    )}

                    <button
                      type="button"
                      className={`btn small ${isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                      onClick={() => handleToggleStatus(shop)}
                      title={isActive ? 'Deactivate this shop' : 'Activate this shop'}
                    >
                      {isActive ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline small"
                      onClick={() => handleStartEdit(shop)}
                      title="Edit shop details"
                    >
                      ✏️ Edit
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-danger small"
                      onClick={() => handleDeleteShop(shop)}
                      title="Permanently remove shop"
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  )}

  {/* TAB 2: PRODUCT IMAGE AUDIT DASHBOARD */}
  {activeTab === 'audit' && (
    <div className="admin-image-audit-section">
      {/* Audit Header Banner */}
      <div style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '1px solid #ddd6fe', borderRadius: '12px', padding: '18px 24px' }}>
        <h2 style={{ margin: '0 0 6px', color: '#5b21b6', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📸</span> Product Image & Packaging Audit System
        </h2>
        <p className="muted small" style={{ margin: 0, color: '#6b21a8' }}>
          Comprehensive quality verification for all 260 products. Every item is mapped to genuine studio retail packshots with brand fidelity, variant differentiation, and zero generic placeholders.
        </p>
      </div>

      {/* AUDIT STATS OVERVIEW CARDS */}
      <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-num" style={{ color: '#6d28d9' }}>{auditStats.total}</div>
          <div className="admin-stat-label">Total Catalog Products</div>
        </div>
        <div className="admin-stat-card active">
          <div className="admin-stat-num" style={{ color: '#059669' }}>{auditStats.verified}</div>
          <div className="admin-stat-label">✅ Verified Authentic Images</div>
        </div>
        <div className="admin-stat-card pending">
          <div className="admin-stat-num" style={{ color: '#d97706' }}>{auditStats.needsReview}</div>
          <div className="admin-stat-label">⚠️ Needs Review</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num" style={{ color: '#2563eb' }}>{auditStats.placeholder}</div>
          <div className="admin-stat-label">📦 Placeholder Images</div>
        </div>
        <div className="admin-stat-card" style={{ borderColor: auditStats.broken > 0 ? '#ef4444' : undefined }}>
          <div className="admin-stat-num" style={{ color: auditStats.broken > 0 ? '#dc2626' : '#16a34a' }}>{auditStats.broken}</div>
          <div className="admin-stat-label">❌ Broken Image URLs</div>
        </div>
      </div>

      {/* AUDIT TOOLBAR FILTERS */}
      <div className="card admin-filter-bar" style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
        <div style={{ flex: '1 1 260px' }}>
          <input
            type="text"
            placeholder="🔍 Search products by name, brand, or category..."
            value={auditSearch}
            onChange={(e) => setAuditSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
        </div>
        <div>
          <select
            value={auditShopFilter}
            onChange={(e) => setAuditShopFilter(e.target.value as any)}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
          >
            <option value="all">🏬 All Shops (260 Products)</option>
            <option value="SHOP_01">🏪 SHOP_01: Apna Kirana (130)</option>
            <option value="SHOP_02">🏪 SHOP_02: Shri Krishna (130)</option>
          </select>
        </div>
        <div>
          <select
            value={auditStatusFilter}
            onChange={(e) => setAuditStatusFilter(e.target.value as any)}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
          >
            <option value="all">🔍 All Statuses</option>
            <option value="verified">✅ Verified Only</option>
            <option value="needs_review">⚠️ Needs Review</option>
            <option value="placeholder">📦 Placeholder</option>
          </select>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-outline small"
            onClick={loadProducts}
            title="Refresh product list from Firestore"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {loadingProducts ? (
        <Spinner label="Loading catalogue products for audit..." />
      ) : filteredAuditProducts.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          No products found matching your audit filter.
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px', width: '70px' }}>Preview</th>
                  <th style={{ padding: '12px 16px' }}>Product Details</th>
                  <th style={{ padding: '12px 16px' }}>Shop</th>
                  <th style={{ padding: '12px 16px' }}>Image Status</th>
                  <th style={{ padding: '12px 16px' }}>Match Type</th>
                  <th style={{ padding: '12px 16px' }}>Source / URL</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuditProducts.map((p) => {
                  const status = p.imageMatchStatus || 'verified';
                  const matchType = p.imageMatchType || 'exact_product';
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ width: '50px', height: '50px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          <img
                            src={p.imageUrl}
                            alt={p.productName || p.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://www.bbassets.com/media/uploads/p/l/40174323_7-parle-g-gluco-biscuits-800-g-pouch.jpg';
                            }}
                          />
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.productName || p.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {p.brand && <span>Brand: <strong>{p.brand}</strong> • </span>}
                          <span>Pack: <strong>{p.quantityOrPack || '1 pc'}</strong> • </span>
                          <span>MRP: ₹{p.mrp || p.price}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: p.shopId === 'SHOP_01' ? '#7c3aed' : '#2563eb' }}>
                          {p.shopId === 'SHOP_01' ? 'Apna Kirana (01)' : 'Shri Krishna (02)'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: status === 'verified' ? '#dcfce7' : status === 'needs_review' ? '#fef3c7' : '#dbeafe',
                            color: status === 'verified' ? '#15803d' : status === 'needs_review' ? '#b45309' : '#1d4ed8',
                          }}
                        >
                          {status === 'verified' ? '✓ VERIFIED' : status === 'needs_review' ? '⚠️ REVIEW' : '📦 PLACEHOLDER'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: '12px', color: '#475569' }}>
                        <code>{matchType}</code>
                      </td>
                      <td style={{ padding: '10px 16px', maxWidth: '200px' }}>
                        <a
                          href={p.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#7c3aed', textDecoration: 'none', fontSize: '11px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={p.imageUrl}
                        >
                          {p.imageUrl ? p.imageUrl.split('/').pop() : 'No URL'}
                        </a>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-outline small"
                          onClick={() => handleStartEditProduct(p)}
                          style={{ fontSize: '12px', padding: '4px 10px' }}
                        >
                          ✏️ Edit Image
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )}

  {/* EDIT PRODUCT IMAGE MODAL */}
  {editingProduct && (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: '#1e293b' }}>✏️ Edit Product Image & Verification</h3>
          <button
            type="button"
            onClick={() => setEditingProduct(null)}
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: '14px', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
          <div style={{ fontWeight: 700, color: '#1e293b' }}>{editingProduct.productName || editingProduct.name}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            Shop: {editingProduct.shopId} | Brand: {editingProduct.brand} | Pack: {editingProduct.quantityOrPack}
          </div>
        </div>

        {/* Live Image Preview */}
        <div style={{ textAlign: 'center', marginBottom: '16px', background: '#f1f5f9', padding: '12px', borderRadius: '10px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>Live Preview:</div>
          <img
            src={editImageUrl}
            alt="Preview"
            style={{ maxWidth: '140px', maxHeight: '140px', objectFit: 'contain', background: '#fff', borderRadius: '8px', padding: '6px', border: '1px solid #cbd5e1' }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://www.bbassets.com/media/uploads/p/l/40174323_7-parle-g-gluco-biscuits-800-g-pouch.jpg';
            }}
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
            Image CDN URL (BigBasket CDN / Direct Image Link)
          </label>
          <input
            type="url"
            value={editImageUrl}
            onChange={(e) => setEditImageUrl(e.target.value)}
            placeholder="https://www.bbassets.com/media/uploads/p/l/..."
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Image Match Status
            </label>
            <select
              value={editMatchStatus}
              onChange={(e) => setEditMatchStatus(e.target.value as any)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px' }}
            >
              <option value="verified">✅ Verified Match</option>
              <option value="needs_review">⚠️ Needs Review</option>
              <option value="placeholder">📦 Placeholder</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Image Match Type
            </label>
            <select
              value={editMatchType}
              onChange={(e) => setEditMatchType(e.target.value as any)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px' }}
            >
              <option value="exact_product">Exact Product Packshot</option>
              <option value="exact_variant">Exact Variant Packshot</option>
              <option value="category_fallback">Category Fallback</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setEditingProduct(null)}
            disabled={savingProduct}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveProductImage}
            disabled={savingProduct || !editImageUrl.trim()}
          >
            {savingProduct ? 'Saving to Firestore...' : '💾 Save to Firestore'}
          </button>
        </div>
      </div>
    </div>
  )}
    </div>
  );
}
