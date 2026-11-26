import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  listShopsForVendor,
  createShop,
  updateShop,
  deleteShop,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../services/shops';
import {
  listOrdersForShop,
  confirmOrderPayment,
  markCashCollected,
  approveOrder,
  dispatchOrder,
  updateDeliveryLocation,
  markOrderDelivered,
} from '../services/orders';
import { forwardGeocode, reverseGeocode } from '../services/location';
import { MapPicker } from '../components/MapPicker';
import { Spinner } from '../components/Spinner';
import {
  SHOP_CATEGORIES,
  PRODUCT_UNITS,
  type Shop,
  type ShopCategory,
  type Product,
  type ProductAvailability,
  type ProductUnit,
  type Order,
} from '../types';

export function VendorDashboard() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const urlShopId = searchParams.get('shopId') || searchParams.get('shop');

  // Strict shop resolution: whichever shop was called / selected
  const effectiveShopId =
    urlShopId === 'SHOP_01' || urlShopId === 'SHOP_02'
      ? urlShopId
      : profile?.shopId
      ? profile.shopId
      : profile?.uid === 'demo-kirana-vendor-2' || profile?.displayName?.toLowerCase().includes('krishna')
      ? 'SHOP_02'
      : profile?.uid === 'demo-kirana-vendor-1' || profile?.displayName?.toLowerCase().includes('apna kirana')
      ? 'SHOP_01'
      : typeof window !== 'undefined'
      ? localStorage.getItem('apnabazaar_active_vendor_shop_id')
      : null;

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Shop form state
  const initialShopForm = {
    name: '',
    category: SHOP_CATEGORIES[0] as ShopCategory,
    ownerName: profile?.displayName || '',
    phone: profile?.phone || '',
    address: '',
    lat: 28.6139,
    lng: 77.2090,
    imageUrl: '',
    openingHours: '8:00 AM - 9:30 PM',
    description: '',
    status: 'active' as 'active' | 'inactive',
  };

  const [form, setForm] = useState(initialShopForm);
  const [isEditingShop, setIsEditingShop] = useState(false);
  const [editingShopId, setEditingShopId] = useState<string | null>(null);
  const [showShopForm, setShowShopForm] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // Active shop for managing products
  const [activeShop, setActiveShop] = useState<Shop | null>(null);
  // Separate shop access isolation (SHOP_01 vs SHOP_02 selector)
  const [selectedVendorShopId, setSelectedVendorShopId] = useState<string | null>(null);

  // Product form state
  const initialProductForm = {
    name: '',
    price: '',
    availableStock: '10',
    unit: 'piece' as ProductUnit,
    availabilityStatus: 'in_stock' as ProductAvailability,
    category: '',
    imageUrl: '',
    description: '',
  };
  const [productForm, setProductForm] = useState(initialProductForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);

  // Orders & Payment Verification State
  const [ordersByShop, setOrdersByShop] = useState<Record<string, Order[]>>({});
  const [loadingOrders, setLoadingOrders] = useState<Record<string, boolean>>({});
  const [shopActiveTab, setShopActiveTab] = useState<Record<string, 'orders' | 'inventory' | 'payment_qr'>>({});
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);
  const [zoomProofUrl, setZoomProofUrl] = useState<string | null>(null);

  // Dispatch & Live Location State
  const [dispatchingOrder, setDispatchingOrder] = useState<Order | null>(null);
  const [deliveryPartnerName, setDeliveryPartnerName] = useState('Ramesh (Kirana Delivery)');
  const [deliveryPartnerPhone, setDeliveryPartnerPhone] = useState('+91 98112 23344');
  const [isSharingLocation, setIsSharingLocation] = useState(false);

  const loadOrdersForShop = useCallback(async (shopId: string) => {
    setLoadingOrders((prev) => ({ ...prev, [shopId]: true }));
    try {
      const list = await listOrdersForShop(shopId);
      setOrdersByShop((prev) => ({ ...prev, [shopId]: list }));
    } catch (err) {
      console.warn('Could not load orders for shop', shopId, err);
    } finally {
      setLoadingOrders((prev) => ({ ...prev, [shopId]: false }));
    }
  }, []);

  const handleConfirmPayment = async (order: Order) => {
    setVerifyingOrderId(order.id);
    setError(null);
    try {
      await confirmOrderPayment(order.id, profile?.uid || 'vendor');
      setSuccessMsg(`✅ Verified bank credit! Payment confirmed for order ${order.id}.`);
      await loadOrdersForShop(order.shopId);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      setError(e?.message || 'Failed to confirm payment.');
    } finally {
      setVerifyingOrderId(null);
    }
  };

  const handleMarkCashCollected = async (order: Order) => {
    setVerifyingOrderId(order.id);
    setError(null);
    try {
      await markCashCollected(order.id, profile?.uid || 'vendor');
      setSuccessMsg(`💵 Cash collected marked successfully for order ${order.id}.`);
      await loadOrdersForShop(order.shopId);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      setError(e?.message || 'Failed to mark cash collected.');
    } finally {
      setVerifyingOrderId(null);
    }
  };

  const handleApproveOrder = async (order: Order) => {
    setVerifyingOrderId(order.id);
    setError(null);
    try {
      await approveOrder(
        order.id,
        profile?.uid || 'vendor',
        'Order pack ho raha hai! The shopkeeper is packing your fresh items.'
      );
      setSuccessMsg(`📦 Order ${order.id} accepted! Customer notified: "Order pack ho raha hai"`);
      await loadOrdersForShop(order.shopId);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      setError(e?.message || 'Failed to accept order.');
    } finally {
      setVerifyingOrderId(null);
    }
  };

  const handleConfirmDispatch = async () => {
    if (!dispatchingOrder) return;
    setVerifyingOrderId(dispatchingOrder.id);
    setIsSharingLocation(true);
    setError(null);

    let lat = activeShop?.location.lat || 28.6139;
    let lng = activeShop?.location.lng || 77.2090;

    // Try live browser geolocation if available
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
            { timeout: 3000 }
          );
        });
      } catch {}
    }

    try {
      await dispatchOrder(dispatchingOrder.id, profile?.uid || 'vendor', {
        partnerName: deliveryPartnerName.trim() || 'Ramesh (Kirana Delivery)',
        partnerPhone: deliveryPartnerPhone.trim() || '+91 98000 00000',
        lat,
        lng,
      });
      setSuccessMsg(`🚀 Order ${dispatchingOrder.id} dispatched! Status: "Out for Delivery" with live tracking.`);
      await loadOrdersForShop(dispatchingOrder.shopId);
      setDispatchingOrder(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      setError(e?.message || 'Failed to dispatch order.');
    } finally {
      setIsSharingLocation(false);
      setVerifyingOrderId(null);
    }
  };

  const handleUpdateLiveLocation = async (order: Order) => {
    setVerifyingOrderId(order.id);
    let lat = order.tracking?.lat || activeShop?.location.lat || 28.6139;
    let lng = order.tracking?.lng || activeShop?.location.lng || 77.2090;

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
              resolve();
            },
            () => {
              lat += 0.001;
              lng += 0.001;
              resolve();
            },
            { timeout: 3000 }
          );
        });
      } catch {
        lat += 0.001;
        lng += 0.001;
      }
    } else {
      lat += 0.001;
      lng += 0.001;
    }

    try {
      await updateDeliveryLocation(order.id, lat, lng);
      setSuccessMsg(`📍 Live GPS updated for Order ${order.id}! Customer sees new location.`);
      await loadOrdersForShop(order.shopId);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setError(e?.message || 'Failed to update location.');
    } finally {
      setVerifyingOrderId(null);
    }
  };

  const handleMarkDelivered = async (order: Order) => {
    setVerifyingOrderId(order.id);
    try {
      await markOrderDelivered(order.id, profile?.uid || 'vendor');
      setSuccessMsg(`🎉 Order ${order.id} marked DELIVERED successfully!`);
      await loadOrdersForShop(order.shopId);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      setError(e?.message || 'Failed to mark order as delivered.');
    } finally {
      setVerifyingOrderId(null);
    }
  };

  const loadVendorData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const data = await listShopsForVendor(profile.uid, effectiveShopId || undefined);
      setShops(data);
      if (data.length > 0) {
        const matched = effectiveShopId ? data.find((s) => s.id === effectiveShopId) : null;
        const initial = matched || data[0];
        setActiveShop(initial);
        setSelectedVendorShopId(initial.id);
        // Load orders for all vendor shops
        for (const s of data) {
          loadOrdersForShop(s.id);
        }
      } else {
        setShowShopForm(true);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load your vendor shop.');
    } finally {
      setLoading(false);
    }
  }, [profile, loadOrdersForShop, effectiveShopId]);

  useEffect(() => {
    loadVendorData();
  }, [loadVendorData]);

  // Handle map position selection
  const handleMapPosition = async (lat: number, lng: number) => {
    setForm((prev) => ({ ...prev, lat, lng }));
    try {
      const res = await reverseGeocode(lat, lng);
      if (res?.address) {
        setForm((prev) => ({ ...prev, address: prev.address || res.address }));
      }
    } catch (e) {
      console.warn('Geocoding error:', e);
    }
  };

  // Search address by text
  const handleSearchAddress = async () => {
    if (!addressSearchQuery.trim()) return;
    setIsSearchingAddress(true);
    setError(null);
    try {
      const res = await forwardGeocode(addressSearchQuery);
      if (!res) {
        setError(`Location "${addressSearchQuery}" could not be found. Please enter a more specific landmark.`);
        return;
      }
      setForm((prev) => ({
        ...prev,
        lat: res.lat,
        lng: res.lng,
        address: res.address || addressSearchQuery,
      }));
      setAddressSearchQuery('');
    } catch (e: any) {
      setError(e?.message || 'Geocoding search failed.');
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleStartEditShop = (shop: Shop) => {
    setEditingShopId(shop.id);
    setIsEditingShop(true);
    setForm({
      name: shop.name || '',
      category: shop.category || SHOP_CATEGORIES[0],
      ownerName: shop.ownerName || '',
      phone: shop.phone || '',
      address: shop.address || '',
      lat: shop.location?.lat ?? 28.6139,
      lng: shop.location?.lng ?? 77.2090,
      imageUrl: shop.imageUrl || '',
      openingHours: shop.openingHours || '8:00 AM - 9:30 PM',
      description: shop.description || '',
      status: (shop.status === 'inactive' || shop.status === 'closed') ? 'inactive' : 'active',
    });
    setShowShopForm(true);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  async function handleSaveShop(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    if (!form.name.trim() || !form.address.trim()) {
      setError('Please provide your shop name and address.');
      return;
    }
    if (!form.lat || !form.lng) {
      setError('Please locate your shop on the map.');
      return;
    }

    setError(null);
    try {
      if (isEditingShop && editingShopId) {
        const updatePayload = {
          name: form.name.trim(),
          category: form.category,
          ownerName: form.ownerName.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          location: { lat: form.lat, lng: form.lng },
          imageUrl: form.imageUrl.trim() || '',
          openingHours: form.openingHours.trim(),
          description: form.description.trim(),
          status: form.status,
        };
        await updateShop(editingShopId, updatePayload);
        // Instant in-place state update
        setShops((prev) =>
          prev.map((s) => (s.id === editingShopId ? { ...s, ...updatePayload } : s))
        );
        if (activeShop?.id === editingShopId) {
          setActiveShop((prev) => (prev ? { ...prev, ...updatePayload } : prev));
        }
        setSuccessMsg('Your shop details were updated successfully in Firebase & store!');
      } else {
        const created = await createShop({
          vendorId: profile.uid,
          name: form.name.trim(),
          category: form.category,
          ownerName: form.ownerName.trim() || profile.displayName,
          phone: form.phone.trim(),
          address: form.address.trim(),
          location: { lat: form.lat, lng: form.lng },
          imageUrl: form.imageUrl.trim() || '',
          openingHours: form.openingHours.trim(),
          description: form.description.trim(),
          status: form.status,
          approvalStatus: 'approved',
          createdByAdmin: false,
        });
        setShops((prev) => [created, ...prev]);
        setActiveShop(created);
        setSuccessMsg('Shop registered successfully in Firebase!');
      }

      setShowShopForm(false);
      setIsEditingShop(false);
      setEditingShopId(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      setError(e?.message || 'Shop save failed.');
    }
  }

  async function handleDeleteShop(id: string) {
    if (!confirm('Are you sure you want to delete this shop and all its listed products? This cannot be undone.')) {
      return;
    }
    try {
      await deleteShop(id);
      setShops((prev) => prev.filter((s) => s.id !== id));
      if (activeShop?.id === id) {
        setActiveShop(null);
      }
      setSuccessMsg('Shop removed successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setError(e?.message || 'Delete failed.');
    }
  }

  // Product actions
  const handleStartAddProduct = () => {
    setEditingProductId(null);
    setProductForm(initialProductForm);
    setShowProductForm(true);
    if (activeShop) {
      setTimeout(() => {
        const el = document.getElementById(`product-form-${activeShop.id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
  };

  const handleStartEditProduct = (shop: Shop, p: Product) => {
    setActiveShop(shop);
    setEditingProductId(p.id);
    const stockVal = p.availableStock !== undefined ? p.availableStock : (p.stock || 0);
    setProductForm({
      name: p.name || '',
      price: String(p.price || ''),
      availableStock: String(stockVal),
      unit: (p.unit || 'piece') as ProductUnit,
      availabilityStatus: (p.availabilityStatus || (stockVal > 0 ? 'in_stock' : 'out_of_stock')) as ProductAvailability,
      category: p.category || '',
      imageUrl: p.imageUrl || '',
      description: p.description || '',
    });
    setShopActiveTab((prev) => ({ ...prev, [shop.id]: 'inventory' }));
    setShowProductForm(true);
    setTimeout(() => {
      const el = document.getElementById(`product-form-${shop.id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !activeShop) return;
    if (!productForm.name.trim() || !productForm.price) {
      setError('Please provide the product name and price.');
      return;
    }

    const price = parseFloat(productForm.price);
    const stock = parseInt(productForm.availableStock || '0', 10);
    if (isNaN(price) || price < 0) {
      setError('Please enter a valid price.');
      return;
    }
    const safeStock = isNaN(stock) ? 0 : Math.max(0, stock);

    setError(null);
    try {
      const prodPayload = {
        name: productForm.name.trim(),
        price,
        sellingPrice: price,
        stock: safeStock,
        availableStock: safeStock,
        stockQuantity: safeStock,
        unit: productForm.unit,
        availabilityStatus: productForm.availabilityStatus,
        category: productForm.category.trim() || 'General',
        imageUrl: productForm.imageUrl.trim() || '',
        description: productForm.description.trim(),
      };

      if (editingProductId) {
        await updateProduct(editingProductId, prodPayload);
        // Instant in-place state update without destroying DOM or resetting tab!
        setShops((prev) =>
          prev.map((s) => {
            if (s.id !== activeShop.id) return s;
            return {
              ...s,
              products: (s.products || []).map((p) =>
                p.id === editingProductId ? { ...p, ...prodPayload } : p
              ),
            };
          })
        );
        setSuccessMsg(`Product "${productForm.name}" updated in Firebase & store!`);
      } else {
        const createdProd = await createProduct({
          shopId: activeShop.id,
          vendorId: profile.uid,
          ...prodPayload,
        });
        setShops((prev) =>
          prev.map((s) => {
            if (s.id !== activeShop.id) return s;
            return {
              ...s,
              products: [createdProd, ...(s.products || [])],
            };
          })
        );
        setSuccessMsg(`Product "${productForm.name}" added to inventory & Firebase!`);
      }

      setShowProductForm(false);
      setEditingProductId(null);
      setProductForm(initialProductForm);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setError(e?.message || 'Failed to save product.');
    }
  };

  const handleDeleteProduct = async (shopId: string, productId: string, productName: string) => {
    if (!confirm(`Remove "${productName}" from your shop inventory?`)) return;
    try {
      await deleteProduct(productId);
      // Instant in-place removal
      setShops((prev) =>
        prev.map((s) => {
          if (s.id !== shopId) return s;
          return {
            ...s,
            products: (s.products || []).filter((p) => p.id !== productId),
          };
        })
      );
      setSuccessMsg(`Product "${productName}" removed from Firebase & inventory.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setError(e?.message || 'Failed to delete product.');
    }
  };

  return (
    <div className="page vendor-dashboard">
      <div className="page-head">
        <div className="row between align-center" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0 }}>🏪 Vendor Hub & Shop Management</h1>
              <span className="badge badge-status">Vendor Portal</span>
            </div>
            <p className="muted" style={{ margin: '6px 0 0' }}>
              Manage your local shop profile, storefront location, and product inventory.
            </p>
          </div>

          {shops.length > 0 && !showShopForm && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setIsEditingShop(false);
                setForm(initialShopForm);
                setShowShopForm(true);
              }}
            >
              ➕ Register Another Shop
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}
      {successMsg && <div className="alert success">{successMsg}</div>}

      {/* SHOP REGISTRATION / EDIT FORM */}
      {showShopForm && (
        <div className="card vendor-shop-form-card" style={{ marginBottom: '28px' }}>
          <div className="row between align-center" style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>
              {isEditingShop ? '✏️ Edit Shop Information' : '🏪 Register Your Local Shop'}
            </h3>
            {shops.length > 0 && (
              <button
                type="button"
                className="btn btn-outline small"
                onClick={() => {
                  setShowShopForm(false);
                  setIsEditingShop(false);
                }}
              >
                ✕ Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSaveShop}>
            <div className="form-grid-2">
              <label>
                Shop Name *
                <input
                  className="input"
                  placeholder="e.g. Verma Fresh Kirana & Dairy"
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
                Owner / Manager Name
                <input
                  className="input"
                  placeholder="e.g. Ramesh Verma"
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
                  placeholder="e.g. 7:30 AM - 10:00 PM"
                  value={form.openingHours}
                  onChange={(e) => setForm({ ...form, openingHours: e.target.value })}
                />
              </label>

              <label>
                Operational Status
                <select
                  className="input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
                >
                  <option value="active">Active (Open for orders)</option>
                  <option value="inactive">Temporarily Inactive (Closed)</option>
                </select>
              </label>
            </div>

            <label style={{ marginTop: '12px', display: 'block' }}>
              Shop Image URL <span className="muted">(Optional)</span>
              <input
                className="input"
                placeholder="https://example.com/your-shop.jpg"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
            </label>

            <label style={{ marginTop: '12px', display: 'block' }}>
              Shop Description
              <textarea
                className="input"
                rows={3}
                placeholder="Briefly describe what your shop sells, specialties, and home delivery highlights..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>

            {/* MAP & ADDRESS */}
            <div style={{ marginTop: '16px' }}>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                📍 Shop Physical Address & Google Maps Location *
              </label>

              <input
                className="input"
                style={{ marginBottom: '10px' }}
                placeholder="Full storefront address (Shop #, Street, Colony, City, Pincode)..."
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
              />

              <div className="manual-row" style={{ marginBottom: '10px' }}>
                <input
                  className="input"
                  placeholder="🔍 Or search your colony / landmark to center the map..."
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
                  disabled={isSearchingAddress || !addressSearchQuery.trim()}
                >
                  {isSearchingAddress ? 'Searching…' : 'Locate'}
                </button>
              </div>

              <div className="map-guidance-bar" style={{ marginBottom: '8px' }}>
                <span>
                  🗺️ <strong>Map Adjustment:</strong> Tap on the map to place your shop marker accurately.
                </span>
              </div>

              <MapPicker
                position={{ lat: form.lat, lng: form.lng }}
                onPositionChange={handleMapPosition}
                interactive
                height={260}
              />
            </div>

            <div className="row end gap" style={{ marginTop: '20px' }}>
              {shops.length > 0 && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowShopForm(false)}
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="btn btn-primary" style={{ minWidth: '180px' }}>
                {isEditingShop ? '💾 Save Shop Changes' : '✅ Submit Shop for Verification'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VENDOR'S REGISTERED SHOPS */}
      {loading ? (
        <Spinner label="Loading vendor dashboard…" />
      ) : shops.length === 0 ? (
        <div className="card empty-state">
          <h3>No Shop Registered Yet</h3>
          <p className="muted">
            Please register your local shop above to start adding products and receiving customer orders!
          </p>
        </div>
      ) : !selectedVendorShopId && shops.length > 1 ? (
        /* SHOP SELECTION PORTAL (SEPARATE ACCESS FOR SHOP_01 AND SHOP_02) */
        <div style={{ marginBottom: '30px' }}>
          <div
            style={{
              background: '#faf5ff',
              border: '2px solid #ddd6fe',
              borderRadius: '16px',
              padding: '28px',
              textAlign: 'center',
              marginBottom: '24px',
            }}
          >
            <div style={{ fontSize: '38px', marginBottom: '8px' }}>🏪</div>
            <h2 style={{ margin: '0 0 6px', color: '#1e1b4b', fontSize: '22px' }}>
              Select Which Shop to Manage
            </h2>
            <p className="muted" style={{ margin: '0 0 24px', fontSize: '14px' }}>
              Click on your store below to access its dedicated portal, accept customer orders, edit prices, and manage inventory.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', textAlign: 'left' }}>
              {shops.map((shop) => {
                const isShop1 = shop.id === 'SHOP_01' || shop.id.includes('1');
                const ordersCount = ordersByShop[shop.id]?.length || 0;
                const pendingOrders = ordersByShop[shop.id]?.filter((o) => o.status === 'pending').length || 0;
                const bank = isShop1 ? 'Central Bank of India - 2671' : 'State Bank of India - 4559';

                return (
                  <div
                    key={shop.id}
                    className="card"
                    onClick={() => {
                      setSelectedVendorShopId(shop.id);
                      setActiveShop(shop);
                    }}
                    style={{
                      cursor: 'pointer',
                      border: '2px solid #c4b5fd',
                      borderRadius: '14px',
                      padding: '22px',
                      background: '#ffffff',
                      boxShadow: '0 4px 16px rgba(124, 58, 237, 0.08)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span className="badge" style={{ background: '#ede9fe', color: '#6d28d9', fontWeight: 800 }}>
                        {shop.id}
                      </span>
                      {pendingOrders > 0 && (
                        <span className="badge" style={{ background: '#ef4444', color: '#ffffff', fontWeight: 800 }}>
                          🔥 {pendingOrders} Pending Order{pendingOrders > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <h3 style={{ margin: '0 0 6px', fontSize: '18px', color: '#1e1b4b' }}>
                      {shop.name}
                    </h3>
                    <p className="muted small" style={{ margin: '0 0 14px' }}>
                      📍 {shop.address}
                    </p>

                    <div style={{ fontSize: '13px', color: '#475569', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <div>🏦 Account: <strong>{bank}</strong></div>
                      <div>📦 Products: <strong>{shop.products?.length || 0} items</strong></div>
                      <div>🧾 Total Orders: <strong>{ordersCount}</strong></div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '10px', fontWeight: 700, borderRadius: '8px' }}
                    >
                      Login & Manage {shop.name} →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="vendor-shops-container">
          {selectedVendorShopId && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#faf5ff',
                padding: '12px 18px',
                borderRadius: '10px',
                border: '1.5px solid #ddd6fe',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>🏪</span>
                <div>
                  <span style={{ fontSize: '11.5px', color: '#6b21a8', fontWeight: 700, textTransform: 'uppercase' }}>
                    Active Vendor Store
                  </span>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: '#1e1b4b' }}>
                    {activeShop?.name} ({selectedVendorShopId})
                  </div>
                </div>
              </div>

              {profile?.role === 'admin' && shops.length > 1 && (
                <button
                  type="button"
                  className="btn btn-outline small"
                  onClick={() => setSelectedVendorShopId(null)}
                  style={{ borderColor: '#7c3aed', color: '#7c3aed', fontWeight: 700 }}
                >
                  🔄 Switch / Back to Store Select
                </button>
              )}
            </div>
          )}

          {(selectedVendorShopId ? shops.filter((s) => s.id === selectedVendorShopId) : shops).map((shop) => {
            const isApproved = shop.id === 'SHOP_01' || shop.id === 'SHOP_02' || shop.approvalStatus === 'approved';
            const isShopActive = shop.status === 'active' || shop.status === 'open';
            const isSelected = activeShop?.id === shop.id;

            return (
              <div
                key={shop.id}
                className={`card vendor-shop-card ${isSelected ? 'active-shop-focus' : ''}`}
                style={{ marginBottom: '24px' }}
              >
                {/* Pending Approval Banner */}
                {!isApproved && (
                  <div
                    className="alert info"
                    style={{
                      marginBottom: '14px',
                      background: '#fffbeb',
                      borderColor: '#fde68a',
                      color: '#92400e',
                    }}
                  >
                    <div>
                      <strong>⏳ Verification Pending:</strong> Your shop has been submitted to ApnaBazaar
                      administrators. It will appear to nearby customers once approved. You can add your products in the meantime!
                    </div>
                  </div>
                )}

                <div className="row between align-center" style={{ flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="vendor-shop-logo">
                      {shop.imageUrl ? (
                        <img src={shop.imageUrl} alt={shop.name} />
                      ) : (
                        <span>🏪</span>
                      )}
                    </div>
                    <div>
                      <div className="row align-center gap" style={{ flexWrap: 'wrap' }}>
                        <h2 style={{ margin: 0, fontSize: '20px' }}>{shop.name}</h2>
                        <span className="badge">{shop.category}</span>
                        <span
                          className={`badge ${
                            isShopActive ? 'badge-status-active' : 'badge-status-inactive'
                          }`}
                        >
                          {isShopActive ? 'Open' : 'Closed'}
                        </span>
                        <span
                          className={`badge ${
                            isApproved ? 'badge-status-active' : 'badge-pending'
                          }`}
                        >
                          {isApproved ? 'Verified' : 'Pending Approval'}
                        </span>
                      </div>
                      <p className="muted small" style={{ margin: '4px 0 0' }}>
                        📍 {shop.address}
                      </p>
                    </div>
                  </div>

                  <div className="row gap">
                    <button
                      type="button"
                      className="btn btn-outline small"
                      onClick={() => handleStartEditShop(shop)}
                    >
                      ✏️ Edit Shop
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger small"
                      onClick={() => handleDeleteShop(shop.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>

                <div className="row gap small muted" style={{ marginTop: '12px', flexWrap: 'wrap' }}>
                  {shop.ownerName && <span>Owner: <strong>{shop.ownerName}</strong></span>}
                  {shop.phone && <span>Phone: <strong>{shop.phone}</strong></span>}
                  {shop.openingHours && <span>Hours: <strong>{shop.openingHours}</strong></span>}
                </div>

                {shop.description && (
                  <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#475569' }}>
                    {shop.description}
                  </p>
                )}

                {/* VENDOR SHOP TABS BAR */}
                {(() => {
                  const currentTab = shopActiveTab[shop.id] || 'orders';
                  const currentOrders = ordersByShop[shop.id] || [];
                  const pendingUpiCount = currentOrders.filter(
                    (o) => o.paymentMethod === 'UPI' && o.paymentStatus === 'pending_verification'
                  ).length;
                  const pendingCodCount = currentOrders.filter(
                    (o) => o.paymentMethod === 'COD' && o.paymentStatus === 'pending'
                  ).length;
                  const qrUrl =
                    shop.paymentMethods?.upiQrUrl ||
                    (shop.id === 'SHOP_01'
                      ? '/payment-qr/SHOP_01/upi-qr.png'
                      : '/payment-qr/SHOP_02/upi-qr.png');
                  const bankLabel =
                    shop.paymentMethods?.accountDetails ||
                    (shop.id === 'SHOP_01'
                      ? 'Central Bank of India - 2671'
                      : 'State Bank of India - 4559');

                  return (
                    <div style={{ marginTop: '20px' }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          borderBottom: '2px solid #ede9fe',
                          paddingBottom: '2px',
                          marginBottom: '18px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setShopActiveTab((prev) => ({ ...prev, [shop.id]: 'orders' }))
                          }
                          style={{
                            padding: '10px 16px',
                            borderRadius: '8px 8px 0 0',
                            border: 'none',
                            background: currentTab === 'orders' ? 'var(--purple)' : 'transparent',
                            color: currentTab === 'orders' ? '#ffffff' : '#64748b',
                            fontWeight: 700,
                            fontSize: '13.5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span>💳 Orders & Payment Verification</span>
                          <span
                            style={{
                              background: currentTab === 'orders' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                              color: currentTab === 'orders' ? '#ffffff' : '#475569',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '12px',
                            }}
                          >
                            {currentOrders.length}
                          </span>
                          {pendingUpiCount > 0 && (
                            <span
                              style={{
                                background: '#ef4444',
                                color: '#ffffff',
                                padding: '2px 7px',
                                borderRadius: '999px',
                                fontSize: '11px',
                                fontWeight: 800,
                              }}
                            >
                              {pendingUpiCount} UPI Pending
                            </span>
                          )}
                          {pendingCodCount > 0 && (
                            <span
                              style={{
                                background: '#0284c7',
                                color: '#ffffff',
                                padding: '2px 7px',
                                borderRadius: '999px',
                                fontSize: '11px',
                                fontWeight: 800,
                              }}
                            >
                              {pendingCodCount} COD Pending
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setShopActiveTab((prev) => ({ ...prev, [shop.id]: 'inventory' }))
                          }
                          style={{
                            padding: '10px 16px',
                            borderRadius: '8px 8px 0 0',
                            border: 'none',
                            background: currentTab === 'inventory' ? 'var(--purple)' : 'transparent',
                            color: currentTab === 'inventory' ? '#ffffff' : '#64748b',
                            fontWeight: 700,
                            fontSize: '13.5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span>📦 Products & Inventory</span>
                          <span
                            style={{
                              background: currentTab === 'inventory' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                              color: currentTab === 'inventory' ? '#ffffff' : '#475569',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '12px',
                            }}
                          >
                            {shop.products?.length || 0}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setShopActiveTab((prev) => ({ ...prev, [shop.id]: 'payment_qr' }))
                          }
                          style={{
                            padding: '10px 16px',
                            borderRadius: '8px 8px 0 0',
                            border: 'none',
                            background: currentTab === 'payment_qr' ? 'var(--purple)' : 'transparent',
                            color: currentTab === 'payment_qr' ? '#ffffff' : '#64748b',
                            fontWeight: 700,
                            fontSize: '13.5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span>📱 UPI QR & Bank Settings</span>
                          <span
                            style={{
                              background: '#dcfce7',
                              color: '#166534',
                              padding: '2px 7px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: 700,
                            }}
                          >
                            Active
                          </span>
                        </button>
                      </div>

                      {/* TAB 1: ORDERS & PAYMENT VERIFICATION */}
                      {currentTab === 'orders' && (
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '14px',
                              flexWrap: 'wrap',
                              gap: '10px',
                            }}
                          >
                            <div>
                              <h3 style={{ margin: 0, fontSize: '17px', color: '#1e1b4b' }}>
                                Customer Orders & Payment Verification
                              </h3>
                              <span className="muted small">
                                Verify bank credit for UPI transactions and mark cash collections for {shop.name}.
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <button
                                type="button"
                                className="btn btn-outline small"
                                onClick={() => loadOrdersForShop(shop.id)}
                                title="Refresh Orders"
                              >
                                🔄 Refresh Orders
                              </button>
                            </div>
                          </div>

                          {/* Security Alert Banner */}
                          <div
                            className="alert info"
                            style={{
                              background: '#fffbeb',
                              borderColor: '#fde68a',
                              color: '#92400e',
                              fontSize: '13px',
                              marginBottom: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                            }}
                          >
                            <span style={{ fontSize: '20px' }}>🛡️</span>
                            <div>
                              <strong>Security Rule for Shopkeepers:</strong> Never rely on customer screenshots alone as proof of payment. Always verify that the exact order amount has been credited to your <strong>{bankLabel}</strong> bank account before confirming!
                            </div>
                          </div>

                          {loadingOrders[shop.id] && (
                            <Spinner label="Loading customer orders from Firestore…" />
                          )}

                          {!loadingOrders[shop.id] && currentOrders.length === 0 && (
                            <div
                              className="card"
                              style={{
                                textAlign: 'center',
                                padding: '36px 20px',
                                background: '#f8fafc',
                                border: '1.5px dashed #cbd5e1',
                              }}
                            >
                              <div style={{ fontSize: '42px', marginBottom: '8px' }}>🧾</div>
                              <h4 style={{ margin: '0 0 6px', color: '#334155' }}>No orders placed yet</h4>
                              <p className="muted small" style={{ margin: 0, maxWidth: '420px', marginInline: 'auto' }}>
                                When customers scan your dedicated QR code ({bankLabel}) or choose Cash on Delivery at checkout, their orders and UTR references will appear here for verification.
                              </p>
                            </div>
                          )}

                          {!loadingOrders[shop.id] && currentOrders.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              {currentOrders.map((order) => {
                                const isUpi = order.paymentMethod === 'UPI';
                                const isPendingUpi =
                                  isUpi && order.paymentStatus === 'pending_verification';
                                const isConfirmed = order.paymentStatus === 'confirmed';
                                const isCodPending =
                                  !isUpi && order.paymentStatus === 'pending';
                                const isCashCollected = order.paymentStatus === 'collected';

                                return (
                                  <div
                                    key={order.id}
                                    className="card"
                                    style={{
                                      border: isPendingUpi
                                        ? '2px solid #f59e0b'
                                        : isConfirmed || isCashCollected
                                        ? '1.5px solid #bbf7d0'
                                        : '1.5px solid #e2e8f0',
                                      background: isPendingUpi ? '#fffdfa' : '#ffffff',
                                      padding: '16px',
                                      boxShadow: isPendingUpi
                                        ? '0 4px 12px rgba(245, 158, 11, 0.1)'
                                        : 'none',
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        flexWrap: 'wrap',
                                        gap: '10px',
                                        marginBottom: '12px',
                                        borderBottom: '1px solid #f1f5f9',
                                        paddingBottom: '10px',
                                      }}
                                    >
                                      <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                          <h4 style={{ margin: 0, fontSize: '16px', color: '#1e1b4b' }}>
                                            {order.customerName || 'Customer'}
                                          </h4>
                                          {order.customerPhone && (
                                            <span className="muted small">📞 {order.customerPhone}</span>
                                          )}
                                          <span className="badge small" style={{ fontFamily: 'monospace' }}>
                                            ID: {order.id}
                                          </span>
                                        </div>
                                        <span className="muted small" style={{ display: 'block', marginTop: '3px' }}>
                                          🕒 Placed at: {new Date(order.createdAt).toLocaleString()} · Shop: <strong>{order.shopId}</strong>
                                        </span>
                                      </div>

                                      <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--purple)' }}>
                                          ₹{order.totalAmount.toFixed(2)}
                                        </div>
                                        <div style={{ marginTop: '4px', display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                          {isUpi ? (
                                            <span
                                              className="badge"
                                              style={{ background: '#ede9fe', color: '#6b21a8', border: '1px solid #ddd6fe' }}
                                            >
                                              📱 UPI Payment
                                            </span>
                                          ) : (
                                            <span
                                              className="badge"
                                              style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}
                                            >
                                              💵 Cash on Delivery
                                            </span>
                                          )}

                                          {isPendingUpi && (
                                            <span
                                              className="badge"
                                              style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', fontWeight: 700 }}
                                            >
                                              ⏳ Pending Verification
                                            </span>
                                          )}
                                          {isConfirmed && (
                                            <span
                                              className="badge"
                                              style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', fontWeight: 700 }}
                                            >
                                              ✅ Bank Credit Verified
                                            </span>
                                          )}
                                          {isCodPending && (
                                            <span
                                              className="badge"
                                              style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
                                            >
                                              📦 Pending Cash
                                            </span>
                                          )}
                                          {isCashCollected && (
                                            <span
                                              className="badge"
                                              style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', fontWeight: 700 }}
                                            >
                                              💵 Cash Collected
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* PAYMENT DETAILS & VERIFICATION SECTION */}
                                    <div
                                      style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                        gap: '14px',
                                        background: '#f8fafc',
                                        padding: '12px 14px',
                                        borderRadius: '8px',
                                        marginBottom: '12px',
                                        fontSize: '13px',
                                      }}
                                    >
                                      <div>
                                        <div style={{ color: '#64748b', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase' }}>
                                          Payment Verification Details
                                        </div>
                                        {isUpi ? (
                                          <div style={{ marginTop: '6px' }}>
                                            <div style={{ marginBottom: '4px' }}>
                                              UPI UTR / Ref No:
                                              <code
                                                style={{
                                                  marginLeft: '6px',
                                                  background: '#ffffff',
                                                  border: '1px solid #cbd5e1',
                                                  padding: '2px 8px',
                                                  borderRadius: '4px',
                                                  fontWeight: 700,
                                                  color: '#1e1b4b',
                                                  fontSize: '13.5px',
                                                }}
                                              >
                                                {order.transactionReference || 'Not provided'}
                                              </code>
                                            </div>
                                            <div style={{ color: '#475569' }}>
                                              Credited To Account: <strong>{bankLabel}</strong>
                                            </div>
                                            {order.paymentVerifiedAt && (
                                              <div style={{ color: '#166534', marginTop: '4px' }}>
                                                Verified on: {new Date(order.paymentVerifiedAt).toLocaleString()}
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div style={{ marginTop: '6px', color: '#475569' }}>
                                            Doorstep Cash Payment: <strong>₹{order.totalAmount.toFixed(2)}</strong>
                                            {order.paymentVerifiedAt && (
                                              <div style={{ color: '#166534', marginTop: '4px' }}>
                                                Collected on: {new Date(order.paymentVerifiedAt).toLocaleString()}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {/* Delivery & Proof */}
                                      <div>
                                        <div style={{ color: '#64748b', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase' }}>
                                          Delivery Address & Proof
                                        </div>
                                        <div style={{ marginTop: '4px', color: '#334155' }}>
                                          📍 {order.deliveryAddress}
                                        </div>

                                        {order.paymentProofUrl && (
                                          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <img
                                              src={order.paymentProofUrl}
                                              alt="Customer Payment Screenshot"
                                              style={{
                                                width: '40px',
                                                height: '40px',
                                                objectFit: 'cover',
                                                borderRadius: '4px',
                                                border: '1px solid #cbd5e1',
                                                cursor: 'pointer',
                                              }}
                                              onClick={() => setZoomProofUrl(order.paymentProofUrl || null)}
                                            />
                                            <button
                                              type="button"
                                              className="btn btn-outline small"
                                              style={{ fontSize: '11.5px', padding: '3px 8px' }}
                                              onClick={() => setZoomProofUrl(order.paymentProofUrl || null)}
                                            >
                                              🔍 View Screenshot
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* ORDER ITEMS MINI LIST */}
                                    <div style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '12px' }}>
                                      <strong>Items ({order.items?.length || 0}):</strong>{' '}
                                      {order.items?.map((it) => `${it.name} (x${it.quantity})`).join(', ') || 'No items'}
                                    </div>

                                    {/* AUTHORIZED ACTION BUTTONS */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                      {/* 1. Pending -> Accept & Pack */}
                                      {order.status === 'pending' && (
                                        <button
                                          type="button"
                                          className="btn btn-primary"
                                          disabled={verifyingOrderId === order.id}
                                          onClick={() => handleApproveOrder(order)}
                                          style={{
                                            background: '#7c3aed',
                                            borderColor: '#7c3aed',
                                            padding: '8px 18px',
                                            fontSize: '13.5px',
                                            fontWeight: 700,
                                          }}
                                        >
                                          {verifyingOrderId === order.id ? 'Accepting…' : '📦 Accept & Pack Order'}
                                        </button>
                                      )}

                                      {/* 2. Accepted / Packing -> Ready for Delivery */}
                                      {order.status === 'accepted' && (
                                        <button
                                          type="button"
                                          className="btn btn-primary"
                                          disabled={verifyingOrderId === order.id}
                                          onClick={() => setDispatchingOrder(order)}
                                          style={{
                                            background: '#059669',
                                            borderColor: '#059669',
                                            padding: '8px 18px',
                                            fontSize: '13.5px',
                                            fontWeight: 700,
                                          }}
                                        >
                                          🚚 Ready for Delivery (Send Delivery Boy)
                                        </button>
                                      )}

                                      {/* 3. Out for Delivery -> Update Location & Mark Delivered */}
                                      {order.status === 'out_for_delivery' && (
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                          <span
                                            className="badge"
                                            style={{
                                              background: '#ecfdf5',
                                              color: '#065f46',
                                              border: '1px solid #a7f3d0',
                                              padding: '6px 12px',
                                              fontWeight: 700,
                                              fontSize: '12.5px',
                                            }}
                                          >
                                            🚚 On the Way ({order.tracking?.partnerName || 'Delivery Partner'})
                                          </span>
                                          <button
                                            type="button"
                                            className="btn btn-outline small"
                                            disabled={verifyingOrderId === order.id}
                                            onClick={() => handleUpdateLiveLocation(order)}
                                            style={{ borderColor: '#059669', color: '#059669', fontWeight: 700 }}
                                            title="Send updated GPS coordinates to customer"
                                          >
                                            📍 Update Live Location
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-primary"
                                            disabled={verifyingOrderId === order.id}
                                            onClick={() => handleMarkDelivered(order)}
                                            style={{
                                              background: '#16a34a',
                                              borderColor: '#16a34a',
                                              padding: '7px 16px',
                                              fontSize: '13px',
                                              fontWeight: 700,
                                            }}
                                          >
                                            ✅ Mark Delivered
                                          </button>
                                        </div>
                                      )}

                                      {/* 4. Delivered */}
                                      {order.status === 'delivered' && (
                                        <span
                                          className="badge"
                                          style={{
                                            background: '#dcfce7',
                                            color: '#166534',
                                            padding: '6px 14px',
                                            fontWeight: 700,
                                            fontSize: '12.5px',
                                          }}
                                        >
                                          🎉 Delivered to Customer Doorstep
                                        </span>
                                      )}

                                      {isPendingUpi && (
                                        <button
                                          type="button"
                                          className="btn btn-primary"
                                          disabled={verifyingOrderId === order.id}
                                          onClick={() => handleConfirmPayment(order)}
                                          style={{
                                            background: '#16a34a',
                                            borderColor: '#16a34a',
                                            padding: '8px 18px',
                                            fontSize: '13.5px',
                                            fontWeight: 700,
                                          }}
                                        >
                                          {verifyingOrderId === order.id
                                            ? 'Confirming…'
                                            : '✅ Confirm Bank Credit & Payment'}
                                        </button>
                                      )}

                                      {isCodPending && (
                                        <button
                                          type="button"
                                          className="btn btn-primary"
                                          disabled={verifyingOrderId === order.id}
                                          onClick={() => handleMarkCashCollected(order)}
                                          style={{
                                            background: '#0284c7',
                                            borderColor: '#0284c7',
                                            padding: '8px 18px',
                                            fontSize: '13.5px',
                                            fontWeight: 700,
                                          }}
                                        >
                                          {verifyingOrderId === order.id
                                            ? 'Updating…'
                                            : '💵 Mark Cash as Collected'}
                                        </button>
                                      )}

                                      {(isConfirmed || isCashCollected) && (
                                        <span
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            color: '#166534',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                          }}
                                        >
                                          ✓ Authorized & Verified by Shopkeeper
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB 3: UPI QR CODE & BANK SETTINGS */}
                      {currentTab === 'payment_qr' && (
                        <div className="card" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe', padding: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                              <h3 style={{ margin: 0, fontSize: '18px', color: '#1e1b4b' }}>
                                📱 Shop UPI QR & Bank Account Configuration
                              </h3>
                              <p className="muted small" style={{ margin: '4px 0 0' }}>
                                Dedicated PhonePe UPI QR code exclusively assigned to {shop.name} ({shop.id}).
                              </p>
                            </div>
                            <span className="badge badge-status-active">
                              Exclusively Mapped to {shop.id}
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                              gap: '24px',
                              alignItems: 'center',
                            }}
                          >
                            {/* QR CODE PREVIEW CARD */}
                            <div style={{ textAlign: 'center' }}>
                              <div
                                style={{
                                  display: 'inline-block',
                                  background: '#ffffff',
                                  padding: '16px',
                                  borderRadius: '16px',
                                  boxShadow: '0 4px 16px rgba(124, 58, 237, 0.14)',
                                  border: '2px solid #ede9fe',
                                  maxWidth: '240px',
                                }}
                              >
                                <img
                                  src={qrUrl}
                                  alt={`${shop.name} QR Code`}
                                  style={{
                                    width: '100%',
                                    height: 'auto',
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
                                    fontWeight: 700,
                                    color: '#475569',
                                  }}
                                >
                                  {bankLabel}
                                </div>
                              </div>
                            </div>

                            {/* METADATA DETAILS */}
                            <div>
                              <div
                                className="card"
                                style={{
                                  background: '#ffffff',
                                  border: '1px solid #e2e8f0',
                                  padding: '16px',
                                  marginBottom: '16px',
                                  fontSize: '13.5px',
                                }}
                              >
                                <div style={{ marginBottom: '10px' }}>
                                  <span className="muted">Shop Identifier:</span>
                                  <strong style={{ marginLeft: '6px', color: 'var(--purple-dark)' }}>
                                    {shop.id}
                                  </strong>
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                  <span className="muted">Designated Bank Account:</span>
                                  <strong style={{ marginLeft: '6px', color: '#166534' }}>
                                    {bankLabel}
                                  </strong>
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                  <span className="muted">Payment Gateway Provider:</span>
                                  <strong style={{ marginLeft: '6px' }}>
                                    {shop.paymentMethods?.upiProvider || 'PhonePe'}
                                  </strong>
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                  <span className="muted">Firebase Storage Path:</span>
                                  <code
                                    style={{
                                      marginLeft: '6px',
                                      background: '#f1f5f9',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    {shop.paymentMethods?.upiQrStoragePath || `payment-qr/${shop.id}/upi-qr.png`}
                                  </code>
                                </div>
                                <div>
                                  <span className="muted">Payment Status:</span>
                                  <span
                                    className="badge badge-status-active"
                                    style={{ marginLeft: '6px' }}
                                  >
                                    UPI & COD Enabled
                                  </span>
                                </div>
                              </div>

                              <div
                                className="alert info"
                                style={{
                                  background: '#f0fdf4',
                                  borderColor: '#bbf7d0',
                                  color: '#166534',
                                  fontSize: '12.5px',
                                }}
                              >
                                🔒 <strong>Zero Interchange Protection:</strong> During checkout, customers who pick <strong>{shop.name}</strong> will strictly see only this QR code. The other shop's QR is never displayed.
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 2: PRODUCTS & INVENTORY - handled below in dedicated section */}
                    </div>
                  );
                })()}

                {/* PRODUCT MANAGEMENT FOR INVENTORY TAB */}
                {(() => {
                  const currentTab = shopActiveTab[shop.id] || 'orders';
                  if (currentTab !== 'inventory') return null;

                  return (
                    <div className="vendor-products-section">
                      <div className="row between align-center" style={{ marginBottom: '14px' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '17px' }}>
                            📦 Products & Inventory ({shop.products?.length || 0})
                          </h3>
                          <span className="muted small">
                            Manage products, stock availability, and retail prices.
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary small"
                          onClick={() => {
                            setActiveShop(shop);
                            handleStartAddProduct();
                          }}
                        >
                          ➕ Add Product
                        </button>
                      </div>

                  {/* PRODUCT FORM */}
                  {showProductForm && activeShop?.id === shop.id && (
                    <div
                      id={`product-form-${shop.id}`}
                      className="card product-form-box"
                      style={{
                        marginBottom: '16px',
                        border: '2px solid #7c3aed',
                        background: '#faf5ff',
                        boxShadow: '0 4px 16px rgba(124, 58, 237, 0.1)',
                      }}
                    >
                      <div className="row between align-center" style={{ marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, color: '#1e1b4b' }}>
                          {editingProductId ? '✏️ Edit Product Details' : '➕ Add New Product to Inventory'}
                        </h4>
                        <button
                          type="button"
                          className="btn-close-modal"
                          onClick={() => {
                            setShowProductForm(false);
                            setEditingProductId(null);
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      <form onSubmit={handleSaveProduct}>
                        <div className="form-grid-4">
                          <label>
                            Product Name *
                            <input
                              className="input"
                              placeholder="e.g. Amul Taaza Milk"
                              value={productForm.name}
                              onChange={(e) =>
                                setProductForm({ ...productForm, name: e.target.value })
                              }
                              required
                            />
                          </label>

                          <label>
                            Price (₹) *
                            <input
                              className="input"
                              type="number"
                              step="0.01"
                              placeholder="65"
                              value={productForm.price}
                              onChange={(e) =>
                                setProductForm({ ...productForm, price: e.target.value })
                              }
                              required
                            />
                          </label>

                          <label>
                            Available Stock *
                            <input
                              className="input"
                              type="number"
                              min="0"
                              placeholder="50"
                              value={productForm.availableStock}
                              onChange={(e) =>
                                setProductForm({ ...productForm, availableStock: e.target.value })
                              }
                              required
                            />
                          </label>

                          <label>
                            Unit *
                            <select
                              className="input"
                              value={productForm.unit}
                              onChange={(e) =>
                                setProductForm({ ...productForm, unit: e.target.value as ProductUnit })
                              }
                            >
                              {PRODUCT_UNITS.map((u) => (
                                <option key={u} value={u}>
                                  per {u}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <div className="form-grid-3" style={{ marginTop: '12px' }}>
                          <label>
                            Availability Status *
                            <select
                              className="input"
                              value={productForm.availabilityStatus}
                              onChange={(e) =>
                                setProductForm({
                                  ...productForm,
                                  availabilityStatus: e.target.value as ProductAvailability,
                                })
                              }
                            >
                              <option value="in_stock">🟢 In Stock</option>
                              <option value="out_of_stock">🔴 Out of Stock</option>
                              <option value="discontinued">⚪ Discontinued</option>
                            </select>
                          </label>

                          <label>
                            Product Category
                            <input
                              className="input"
                              placeholder="e.g. Dairy, Beverages, Bakery"
                              value={productForm.category}
                              onChange={(e) =>
                                setProductForm({ ...productForm, category: e.target.value })
                              }
                            />
                          </label>

                          <label>
                            Product Image URL <span className="muted">(Optional)</span>
                            <input
                              className="input"
                              placeholder="https://example.com/product.jpg"
                              value={productForm.imageUrl}
                              onChange={(e) =>
                                setProductForm({ ...productForm, imageUrl: e.target.value })
                              }
                            />
                          </label>
                        </div>

                        <label style={{ marginTop: '12px', display: 'block' }}>
                          Product Description <span className="muted">(Optional)</span>
                          <input
                            className="input"
                            placeholder="Unit size, brand details, or packaging info..."
                            value={productForm.description}
                            onChange={(e) =>
                              setProductForm({ ...productForm, description: e.target.value })
                            }
                          />
                        </label>

                        <div className="row end gap" style={{ marginTop: '14px' }}>
                          <button
                            type="button"
                            className="btn btn-outline small"
                            onClick={() => {
                              setShowProductForm(false);
                              setEditingProductId(null);
                            }}
                          >
                            Cancel
                          </button>
                          <button type="submit" className="btn btn-primary small">
                            {editingProductId ? '💾 Save Product' : '➕ Add to Inventory'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* PRODUCTS LIST */}
                  {(!shop.products || shop.products.length === 0) ? (
                    <div className="empty-products-notice">
                      <span>No products listed yet. Click "Add Product" to create your first item.</span>
                    </div>
                  ) : (
                    <div className="vendor-products-grid">
                      {shop.products.map((p) => {
                        const stockVal = p.availableStock !== undefined ? p.availableStock : (p.stock || 0);
                        const isDiscontinued = p.availabilityStatus === 'discontinued';
                        const isOutOfStock = p.availabilityStatus === 'out_of_stock' || stockVal <= 0;
                        const statusBadge = isDiscontinued
                          ? { text: 'Discontinued', cls: 'badge-status-inactive' }
                          : isOutOfStock
                          ? { text: 'Out of Stock', cls: 'badge-status-inactive' }
                          : { text: `In Stock: ${stockVal} ${p.unit || 'piece'}`, cls: 'badge-status-active' };

                        return (
                          <div key={p.id} className="vendor-product-card">
                            {p.imageUrl && (
                              <div className="vendor-product-thumb">
                                <img src={p.imageUrl} alt={p.name} />
                              </div>
                            )}
                            <div className="row between align-center">
                              <span className="badge small">{p.category || 'General'}</span>
                              <span className="product-card-price">
                                ₹{p.price}{' '}
                                <span className="product-unit-small">/ {p.unit || 'piece'}</span>
                              </span>
                            </div>

                            <h4 className="vendor-product-title">{p.name}</h4>
                            {p.description && (
                              <p className="vendor-product-desc">{p.description}</p>
                            )}

                            <div className="row between align-center" style={{ marginTop: '10px' }}>
                              <span className={`badge ${statusBadge.cls} small`}>
                                {statusBadge.text}
                              </span>

                              <div className="row gap" style={{ gap: '6px' }}>
                                <button
                                  type="button"
                                  className="btn-icon-small"
                                  onClick={() => handleStartEditProduct(shop, p)}
                                  title="Edit Product"
                                >
                                  ✏️
                                </button>
                                <button
                                  type="button"
                                  className="btn-icon-small danger"
                                  onClick={() => handleDeleteProduct(shop.id, p.id, p.name)}
                                  title="Delete Product"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  )}

  {/* FULLSCREEN PAYMENT PROOF SCREENSHOT MODAL */}
  {/* DISPATCH & LIVE LOCATION MODAL */}
      {dispatchingOrder && (
        <div className="blinkit-modal-backdrop" onClick={() => setDispatchingOrder(null)}>
          <div
            className="blinkit-modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px', padding: '24px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#1e1b4b' }}>
                  🚚 Send Delivery Partner & Share Location
                </h3>
                <p className="muted small" style={{ margin: '4px 0 0' }}>
                  Order ID: <strong>{dispatchingOrder.id}</strong>
                </p>
              </div>
              <button type="button" className="btn-close-modal" onClick={() => setDispatchingOrder(null)}>✕</button>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', border: '1px solid #e2e8f0' }}>
              <div>👤 Customer: <strong>{dispatchingOrder.customerName}</strong> ({dispatchingOrder.customerPhone || 'No phone'})</div>
              <div style={{ marginTop: '4px' }}>📍 Destination: <strong>{dispatchingOrder.deliveryAddress}</strong></div>
              <div style={{ marginTop: '4px' }}>💰 Amount to Collect: <strong style={{ color: 'var(--purple)' }}>₹{dispatchingOrder.totalAmount.toFixed(2)} ({dispatchingOrder.paymentMethod})</strong></div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Delivery Person / Partner Name *
              </label>
              <input
                className="input"
                type="text"
                value={deliveryPartnerName}
                onChange={(e) => setDeliveryPartnerName(e.target.value)}
                placeholder="e.g. Ramesh Kumar (Kirana Delivery)"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Delivery Person Contact Phone *
              </label>
              <input
                className="input"
                type="tel"
                value={deliveryPartnerPhone}
                onChange={(e) => setDeliveryPartnerPhone(e.target.value)}
                placeholder="e.g. +91 98112 23344"
              />
            </div>

            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '10px 12px', fontSize: '12.5px', color: '#065f46', marginBottom: '18px' }}>
              📍 <strong>Live GPS Connectivity:</strong> Transmits store GPS coordinates to the customer portal so they can track the delivery boy in real-time.
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setDispatchingOrder(null)}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmDispatch}
                disabled={isSharingLocation}
                style={{ background: '#059669', borderColor: '#059669', fontWeight: 700 }}
              >
                {isSharingLocation ? 'Transmitting Location…' : '🚀 Send Delivery Boy & Share Location'}
              </button>
            </div>
          </div>
        </div>
      )}

      {zoomProofUrl && (
    <div
      className="blinkit-modal-backdrop"
      onClick={() => setZoomProofUrl(null)}
      style={{ zIndex: 9999 }}
    >
      <div
        className="blinkit-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', padding: '20px', textAlign: 'center' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h4 style={{ margin: 0, fontSize: '16px', color: '#1e1b4b' }}>
            Customer Payment Screenshot
          </h4>
          <button
            type="button"
            className="btn-close-modal"
            onClick={() => setZoomProofUrl(null)}
            style={{ fontSize: '18px', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
          <img
            src={zoomProofUrl}
            alt="Enlarged Proof"
            style={{ width: '100%', height: 'auto', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }}
          />
        </div>

        <p className="muted small" style={{ marginTop: '10px', color: '#92400e' }}>
          ⚠️ Security Reminder: Always check your bank statement/SMS for actual credit before confirming.
        </p>
      </div>
    </div>
  )}
</div>
  );
}
