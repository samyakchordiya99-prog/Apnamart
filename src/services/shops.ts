import { db, isFirebaseConfigured } from './auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import type { Shop, Product } from '../types';
import { getDemoProductsForShop, ALL_DEMO_PRODUCTS } from '../data/productData';

export const DEMO_KIRANA_SHOP_1_ID = 'SHOP_01';
export const DEMO_KIRANA_SHOP_2_ID = 'SHOP_02';

// Generates exactly two Kirana shops around the customer's selected location (prefer within 3km)
export function createTwoKiranaShopsForLocation(customerLoc: {
  lat: number;
  lng: number;
  address: string;
}): Shop[] {
  let locality = 'Main Area';
  if (customerLoc.address && !customerLoc.address.includes('°')) {
    const parts = customerLoc.address.split(',').map((p) => p.trim());
    if (parts.length > 0 && parts[0]) {
      locality = parts[0];
    }
  }

  const shop1: Shop = {
    id: DEMO_KIRANA_SHOP_1_ID,
    shopId: DEMO_KIRANA_SHOP_1_ID,
    vendorId: 'demo-kirana-vendor-1',
    name: 'Apna Kirana & General Store',
    category: 'Kirana / Grocery',
    ownerName: 'Rameshwar Prasad (Demo Owner)',
    phone: '+91 98000 00001 (Demo Listing)',
    address: `Shop No. 4, Market Complex, near ${locality} (Sample Demo Address)`,
    location: {
      lat: customerLoc.lat + 0.0055,
      lng: customerLoc.lng + 0.0042,
    },
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    openingHours: '7:00 AM - 10:00 PM',
    description: 'Fictional neighborhood Kirana store for college demonstration. Daily pulses, spices, flour, grains, and kitchen provisions.',
    status: 'active',
    approvalStatus: 'approved',
    createdByAdmin: true,
    source: 'manual',
    isDemo: true,
    products: [],
    paymentMethods: {
      upiEnabled: true,
      codEnabled: true,
      upiQrStoragePath: 'payment-qr/SHOP_01/upi-qr.png',
      upiQrUrl: '/payment-qr/SHOP_01/upi-qr.png',
      accountDetails: 'Central Bank of India - 2671',
      upiProvider: 'PhonePe',
      merchantName: 'Apna Kirana & General Store',
    },
    createdAt: 1700000000000,
    updatedAt: Date.now(),
  };

  const shop2: Shop = {
    id: DEMO_KIRANA_SHOP_2_ID,
    shopId: DEMO_KIRANA_SHOP_2_ID,
    vendorId: 'demo-kirana-vendor-2',
    name: 'Shri Krishna Kirana & Provision Store',
    category: 'Kirana / Grocery',
    ownerName: 'Mohan Lal (Demo Owner)',
    phone: '+91 98000 00002 (Demo Listing)',
    address: `Shop No. 12, Main Bazaar Road, near ${locality} (Sample Demo Address)`,
    location: {
      lat: customerLoc.lat - 0.0068,
      lng: customerLoc.lng + 0.0075,
    },
    imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
    openingHours: '6:30 AM - 9:30 PM',
    description: 'Fictional neighborhood Kirana store for college demonstration. Packed grains, dairy items, oils, and household provisions.',
    status: 'active',
    approvalStatus: 'approved',
    createdByAdmin: true,
    source: 'manual',
    isDemo: true,
    products: [],
    paymentMethods: {
      upiEnabled: true,
      codEnabled: true,
      upiQrStoragePath: 'payment-qr/SHOP_02/upi-qr.png',
      upiQrUrl: '/payment-qr/SHOP_02/upi-qr.png',
      accountDetails: 'State Bank of India - 4559',
      upiProvider: 'PhonePe',
      merchantName: 'Shri Krishna Kirana & Provision Store',
    },
    createdAt: 1700000000000,
    updatedAt: Date.now(),
  };

  return [shop1, shop2];
}

// Exactly two demo Kirana shops (default reference: Connaught Place, New Delhi)
export const SAMPLE_SHOPS: Shop[] = createTwoKiranaShopsForLocation({
  lat: 28.6139,
  lng: 77.2090,
  address: 'Connaught Place, New Delhi',
});

const LOCAL_SHOPS_KEY = 'apnabazaar_custom_shops';
const LOCAL_PRODUCTS_KEY = 'apnabazaar_custom_products';
const LOCAL_TWO_KIRANA_KEY = 'apnabazaar_demo_two_kirana_shops';
const LOCAL_SHOP_OVERRIDES_KEY = 'apnabazaar_shop_overrides';
const LOCAL_PRODUCT_OVERRIDES_KEY = 'apnabazaar_product_overrides';
const LOCAL_DELETED_PRODUCT_IDS_KEY = 'apnabazaar_deleted_product_ids';

/**
 * Removes undefined fields recursively so Firestore setDoc never throws
 * "Unsupported field value: undefined"
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        cleaned[key] = cleanFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

export function getLocalShopOverrides(): Record<string, Partial<Shop>> {
  try {
    const raw = localStorage.getItem(LOCAL_SHOP_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setLocalShopOverride(shopId: string, override: Partial<Shop>) {
  try {
    const all = getLocalShopOverrides();
    all[shopId] = { ...(all[shopId] || {}), ...override };
    localStorage.setItem(LOCAL_SHOP_OVERRIDES_KEY, JSON.stringify(all));
  } catch {}
}

export function getLocalProductOverrides(): Record<string, Partial<Product>> {
  try {
    const raw = localStorage.getItem(LOCAL_PRODUCT_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setLocalProductOverride(productId: string, override: Partial<Product>) {
  try {
    const all = getLocalProductOverrides();
    all[productId] = { ...(all[productId] || {}), ...override };
    localStorage.setItem(LOCAL_PRODUCT_OVERRIDES_KEY, JSON.stringify(all));
  } catch {}
}

export function getLocalDeletedProductIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_PRODUCT_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addLocalDeletedProductId(productId: string) {
  try {
    const list = getLocalDeletedProductIds();
    if (!list.includes(productId)) {
      list.push(productId);
      localStorage.setItem(LOCAL_DELETED_PRODUCT_IDS_KEY, JSON.stringify(list));
    }
  } catch {}
}

export function applyShopOverrides(shops: Shop[]): Shop[] {
  const overrides = getLocalShopOverrides();
  return shops.map((s) => {
    const ov = overrides[s.id];
    const updated = ov ? { ...s, ...ov } : { ...s };
    if (s.id === 'SHOP_01' || s.id === 'SHOP_02') {
      updated.approvalStatus = 'approved';
    }
    return updated;
  });
}

export function applyProductOverrides(products: Product[]): Product[] {
  const overrides = getLocalProductOverrides();
  const deleted = getLocalDeletedProductIds();
  const filtered = deleted.length > 0 ? products.filter((p) => !deleted.includes(p.id)) : products;

  return filtered.map((p) => {
    const ov = overrides[p.id];
    if (!ov) return p;
    const stockVal =
      ov.availableStock !== undefined
        ? ov.availableStock
        : ov.stock !== undefined
        ? ov.stock
        : p.availableStock;
    const priceVal =
      ov.price !== undefined
        ? ov.price
        : ov.sellingPrice !== undefined
        ? ov.sellingPrice
        : p.price;
    return {
      ...p,
      ...ov,
      price: priceVal,
      sellingPrice: priceVal,
      stock: stockVal,
      availableStock: stockVal,
      stockQuantity: stockVal,
    };
  });
}

function getLocalTwoKiranaShops(): Shop[] {
  try {
    const raw = localStorage.getItem(LOCAL_TWO_KIRANA_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalTwoKiranaShops(shops: Shop[]) {
  try {
    localStorage.setItem(LOCAL_TWO_KIRANA_KEY, JSON.stringify(shops));
  } catch {}
}

function getLocalCustomShops(): Shop[] {
  try {
    const raw = localStorage.getItem(LOCAL_SHOPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalCustomShops(shops: Shop[]) {
  try {
    localStorage.setItem(LOCAL_SHOPS_KEY, JSON.stringify(shops));
  } catch (e) {
    console.warn('Could not write shops to localStorage', e);
  }
}

function getLocalCustomProducts(): Product[] {
  try {
    const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalCustomProducts(products: Product[]) {
  try {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {
    console.warn('Could not write products to localStorage', e);
  }
}

// ----------------- SHOPS API -----------------

// Synchronize and persist exactly two Kirana shops in Cloud Firestore for the customer's reference location
export async function syncTwoKiranaShopsWithFirestore(customerLoc: {
  lat: number;
  lng: number;
  address: string;
}): Promise<Shop[]> {
  const demoShops = createTwoKiranaShopsForLocation(customerLoc);

  // 1. Always cache locally so offline / unauthenticated reads succeed seamlessly
  setLocalTwoKiranaShops(demoShops);

  // 2. If Firebase is connected, save both records to Cloud Firestore
  if (db && isFirebaseConfigured) {
    try {
      // Save shop 1 with unique ID (avoids duplicates)
      await setDoc(doc(db, 'shops', demoShops[0].id), demoShops[0], { merge: true });
      // Save shop 2 with unique ID (avoids duplicates)
      await setDoc(doc(db, 'shops', demoShops[1].id), demoShops[1], { merge: true });
      console.log('[Firestore] Successfully synced 2 Kirana shops into "shops" collection.');

      // Read back from Firestore to verify persistence
      const snap = await getDocs(collection(db, 'shops'));
      const firestoreShops = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Shop, 'id'>) }))
        .filter((s) => s.id === 'SHOP_01' || s.id === 'SHOP_02' || s.id === DEMO_KIRANA_SHOP_1_ID || s.id === DEMO_KIRANA_SHOP_2_ID || s.isDemo);

      if (firestoreShops.length >= 2) {
        const selected = firestoreShops.slice(0, 2);
        for (const s of selected) {
          s.products = await listProductsForShop(s.id);
        }
        return selected;
      }
    } catch (err) {
      console.warn('[Firestore] Could not save shops to Firestore (falling back to local cache):', err);
    }
  }

  for (const s of demoShops) {
    s.products = await listProductsForShop(s.id);
  }
  return demoShops;
}

export async function listAllShops(): Promise<Shop[]> {
  let result: Shop[] = [];

  if (db && isFirebaseConfigured) {
    try {
      const snap = await getDocs(collection(db, 'shops'));
      if (!snap.empty) {
        const shops = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Shop, 'id'>),
        }));

        const demoShops = shops.filter(
          (s) => s.id === 'SHOP_01' || s.id === 'SHOP_02' || s.id === 'apnabazaar-kirana-1' || s.id === 'apnabazaar-kirana-2' || s.isDemo
        );

        if (demoShops.length > 0) {
          result = demoShops.slice(0, 2);
        } else if (shops.length > 0) {
          result = shops.slice(0, 2);
        }
      }
    } catch (err) {
      console.warn('Failed to query shops from Firestore, falling back to local demo shops:', err);
    }
  }

  if (result.length === 0) {
    const cached = getLocalTwoKiranaShops();
    if (cached.length > 0) {
      result = cached.slice(0, 2);
    } else {
      result = [...SAMPLE_SHOPS];
    }
  }

  // Apply any persistent shop overrides & ensure demo shops are approved
  result = applyShopOverrides(result);

  // Load products for each shop
  for (const shop of result) {
    try {
      shop.products = await listProductsForShop(shop.id);
    } catch {
      shop.products = getDemoProductsForShop(shop.id);
    }
  }

  return result;
}

export async function listShopsForVendor(vendorId: string, targetShopId?: string): Promise<Shop[]> {
  const storedTarget = targetShopId || (typeof window !== 'undefined' ? localStorage.getItem('apnabazaar_active_vendor_shop_id') : null) || undefined;

  let allShops: Shop[] = [];
  if (!db || !isFirebaseConfigured) {
    const custom = getLocalCustomShops();
    allShops = [...SAMPLE_SHOPS, ...custom];
  } else {
    try {
      const q = query(collection(db, 'shops'), where('vendorId', '==', vendorId));
      const snap = await getDocs(q);
      let shops = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Shop, 'id'>),
      }));

      // If vendor owns no custom shops yet (e.g. demo mode or admin), provide demo shops
      if (shops.length === 0) {
        const allShopsSnap = await getDocs(collection(db, 'shops'));
        shops = allShopsSnap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Shop, 'id'>) }))
          .filter((s) => s.id === 'SHOP_01' || s.id === 'SHOP_02');

        if (shops.length === 0) {
          shops = [...SAMPLE_SHOPS];
        }
      }
      allShops = shops;
    } catch (err) {
      console.warn('Failed to query vendor shops from Firestore, falling back to demo shops:', err);
      allShops = [...SAMPLE_SHOPS];
    }
  }

  // Apply persistent shop overrides
  allShops = applyShopOverrides(allShops);

  // Strict isolation: whichever shop was called / selected, only that shop is accessible!
  const isShop1 =
    storedTarget === 'SHOP_01' ||
    vendorId === 'demo-kirana-vendor-1' ||
    vendorId === 'SHOP_01' ||
    vendorId.toLowerCase().includes('shop_01') ||
    vendorId.toLowerCase().includes('apna-kirana') ||
    vendorId.toLowerCase().includes('apnakirana');

  const isShop2 =
    storedTarget === 'SHOP_02' ||
    vendorId === 'demo-kirana-vendor-2' ||
    vendorId === 'SHOP_02' ||
    vendorId.toLowerCase().includes('shop_02') ||
    vendorId.toLowerCase().includes('krishna');

  let filtered = allShops;
  if (isShop1 && !isShop2) {
    filtered = allShops.filter((s) => s.id === 'SHOP_01' || s.id === DEMO_KIRANA_SHOP_1_ID);
  } else if (isShop2 && !isShop1) {
    filtered = allShops.filter((s) => s.id === 'SHOP_02' || s.id === DEMO_KIRANA_SHOP_2_ID);
  } else if (storedTarget) {
    filtered = allShops.filter((s) => s.id === storedTarget);
  }

  if (filtered.length === 0) {
    filtered = allShops.length > 0 ? [allShops[0]] : [...SAMPLE_SHOPS];
  }

  for (const shop of filtered) {
    shop.products = await listProductsForShop(shop.id);
  }

  return filtered;
}

export async function createShop(
  data: Omit<Shop, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Shop> {
  const now = Date.now();
  const id = `shop_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const shop: Shop = {
    ...data,
    id,
    status: data.status || 'active',
    approvalStatus: data.approvalStatus || (data.createdByAdmin ? 'approved' : 'pending'),
    source: data.source || (data.createdByAdmin ? 'manual' : 'vendor'),
    createdAt: now,
    updatedAt: now,
  };

  const custom = getLocalCustomShops();
  custom.unshift(shop);
  setLocalCustomShops(custom);

  if (db && isFirebaseConfigured) {
    try {
      const cleanDoc = cleanFirestoreData({ ...shop, isDemo: true });
      const ref = doc(collection(db, 'shops'), id);
      await setDoc(ref, cleanDoc, { merge: true });
      console.log(`[Firestore] Successfully created shop ${id} in Firebase!`);
    } catch (err: any) {
      console.warn('[Firestore] Could not sync new shop to Firestore (saved locally):', err?.message || err);
    }
  }

  return shop;
}

export async function updateShop(
  id: string,
  data: Partial<Omit<Shop, 'id' | 'createdAt'>>
): Promise<void> {
  const now = Date.now();

  // 1. Always update local storage & persistent override
  setLocalShopOverride(id, data);

  const custom = getLocalCustomShops();
  const idx = custom.findIndex((s) => s.id === id);
  if (idx !== -1) {
    custom[idx] = { ...custom[idx], ...data, updatedAt: now };
    setLocalCustomShops(custom);
  }

  const sampleIdx = SAMPLE_SHOPS.findIndex((s) => s.id === id);
  if (sampleIdx !== -1) {
    SAMPLE_SHOPS[sampleIdx] = { ...SAMPLE_SHOPS[sampleIdx], ...data, updatedAt: now };
  }

  const cachedTwo = getLocalTwoKiranaShops();
  const twoIdx = cachedTwo.findIndex((s) => s.id === id);
  if (twoIdx !== -1) {
    cachedTwo[twoIdx] = { ...cachedTwo[twoIdx], ...data, updatedAt: now };
    setLocalTwoKiranaShops(cachedTwo);
  } else if (sampleIdx !== -1) {
    setLocalTwoKiranaShops([...SAMPLE_SHOPS]);
  }

  // 2. Write full sanitized document to Firebase Firestore
  if (db && isFirebaseConfigured) {
    try {
      const existing = (sampleIdx !== -1 ? SAMPLE_SHOPS[sampleIdx] : (idx !== -1 ? custom[idx] : {})) as any;
      const fullShop = cleanFirestoreData({
        ...existing,
        ...data,
        id,
        updatedAt: now,
        isDemo: true,
      });
      await setDoc(doc(db, 'shops', id), fullShop, { merge: true });
      console.log(`[Firestore] Successfully saved shop ${id} to Firebase!`);
    } catch (err: any) {
      console.warn('[Firestore] Could not sync shop update to Firestore (saved locally):', err?.message || err);
    }
  }
}

export async function deleteShop(id: string): Promise<void> {
  const custom = getLocalCustomShops().filter((s) => s.id !== id);
  setLocalCustomShops(custom);

  const prods = getLocalCustomProducts().filter((p) => p.shopId !== id);
  setLocalCustomProducts(prods);

  if (db && isFirebaseConfigured) {
    try {
      // Delete products under this shop first
      const shopProds = await listProductsForShop(id);
      for (const p of shopProds) {
        await deleteDoc(doc(db, 'products', p.id)).catch(() => {});
      }
      await deleteDoc(doc(db, 'shops', id));
      console.log(`[Firestore] Successfully deleted shop ${id} from Firebase!`);
    } catch (e: any) {
      console.warn('[Firestore] Could not delete shop from Firestore (removed locally):', e?.message || e);
    }
  }
}

// ----------------- PRODUCTS API -----------------

export async function listProductsForShop(shopId: string): Promise<Product[]> {
  // Normalize shop ID for backward compatibility
  const normalizedShopId =
    shopId === 'apnabazaar-kirana-1' || shopId === DEMO_KIRANA_SHOP_1_ID
      ? 'SHOP_01'
      : shopId === 'apnabazaar-kirana-2' || shopId === DEMO_KIRANA_SHOP_2_ID
      ? 'SHOP_02'
      : shopId;

  let baseProducts: Product[] = [];

  if (db && isFirebaseConfigured) {
    try {
      const q = query(
        collection(db, 'products'),
        where('shopId', 'in', [shopId, normalizedShopId])
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        baseProducts = snap.docs.map((d) => {
          const data = d.data() as any;
          const mrp = typeof data.mrp === 'number' ? data.mrp : data.price || 0;
          const discountPercent = typeof data.discountPercent === 'number' ? data.discountPercent : 0;
          const sellingPrice =
            typeof data.sellingPrice === 'number'
              ? data.sellingPrice
              : typeof data.price === 'number'
              ? data.price
              : mrp;
          const stockQuantity =
            typeof data.stockQuantity === 'number'
              ? data.stockQuantity
              : typeof data.availableStock === 'number'
              ? data.availableStock
              : typeof data.stock === 'number'
              ? data.stock
              : 15;
          const isAvailable = stockQuantity > 0;

          return {
            id: d.id,
            productId: data.productId || d.id,
            shopId: normalizedShopId,
            shopName: data.shopName || (normalizedShopId === 'SHOP_01' ? 'Apna Kirana (Shop 1)' : 'Apna Kirana (Shop 2)'),
            vendorId: data.vendorId || 'demo-vendor-1',
            name: data.productName || data.name || 'Grocery Item',
            productName: data.productName || data.name || 'Grocery Item',
            category: data.category || 'General',
            brand: data.brand || 'Local Kirana',
            description: data.description || '',
            quantityOrPack: data.quantityOrPack || '1 pc',
            mrp,
            discountPercent,
            sellingPrice,
            price: sellingPrice,
            stockQuantity,
            stock: stockQuantity,
            availableStock: stockQuantity,
            unit: data.unit || 'piece',
            imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80',
            imageSource: data.imageSource || 'bigbasket_cdn',
            imageMatchStatus: data.imageMatchStatus || 'verified',
            imageMatchType: data.imageMatchType || 'exact_product',
            isAvailable,
            isDemoData: true,
            availabilityStatus: isAvailable ? 'in_stock' : 'out_of_stock',
            createdAt: data.createdAt || Date.now(),
            updatedAt: data.updatedAt || Date.now(),
          } as Product;
        });
      }
    } catch (err) {
      console.warn('Failed to query products from Firestore, falling back to local dataset:', err);
    }
  }

  // Fallback to local demo dataset if no products from Firestore
  if (baseProducts.length === 0) {
    baseProducts = getDemoProductsForShop(normalizedShopId);
  }

  // Include custom products created by the user for this shop
  const customProds = getLocalCustomProducts().filter((p) => p.shopId === normalizedShopId);
  for (const cp of customProds) {
    if (!baseProducts.some((bp) => bp.id === cp.id)) {
      baseProducts.unshift(cp);
    }
  }

  // Apply persistent product overrides and remove deleted items
  return applyProductOverrides(baseProducts);
}

export async function listAllProducts(): Promise<Product[]> {
  let all: Product[] = [];

  if (db && isFirebaseConfigured) {
    try {
      const snap = await getDocs(collection(db, 'products'));
      if (!snap.empty) {
        all = snap.docs.map((d) => {
          const data = d.data() as any;
          const mrp = typeof data.mrp === 'number' ? data.mrp : data.price || 0;
          const discountPercent = typeof data.discountPercent === 'number' ? data.discountPercent : 0;
          const sellingPrice =
            typeof data.sellingPrice === 'number'
              ? data.sellingPrice
              : typeof data.price === 'number'
              ? data.price
              : mrp;
          const stockQuantity =
            typeof data.stockQuantity === 'number'
              ? data.stockQuantity
              : typeof data.availableStock === 'number'
              ? data.availableStock
              : typeof data.stock === 'number'
              ? data.stock
              : 15;
          const isAvailable = stockQuantity > 0;

          return {
            id: d.id,
            productId: data.productId || d.id,
            shopId: data.shopId || 'SHOP_01',
            shopName:
              data.shopName ||
              (data.shopId === 'SHOP_02'
                ? 'Shri Krishna Kirana & Provision Store'
                : 'Apna Kirana & General Store'),
            vendorId: data.vendorId || 'demo-vendor-1',
            name: data.productName || data.name || 'Grocery Item',
            productName: data.productName || data.name || 'Grocery Item',
            category: data.category || 'General',
            brand: data.brand || 'Local Kirana',
            description: data.description || '',
            quantityOrPack: data.quantityOrPack || '1 pc',
            mrp,
            discountPercent,
            sellingPrice,
            price: sellingPrice,
            stockQuantity,
            stock: stockQuantity,
            availableStock: stockQuantity,
            unit: data.unit || 'piece',
            imageUrl: data.imageUrl || '',
            imageSource: data.imageSource || 'bigbasket_cdn',
            imageMatchStatus: data.imageMatchStatus || 'verified',
            imageMatchType: data.imageMatchType || 'exact_product',
            isAvailable,
            isDemoData: true,
            availabilityStatus: isAvailable ? 'in_stock' : 'out_of_stock',
            createdAt: data.createdAt || Date.now(),
            updatedAt: data.updatedAt || Date.now(),
          } as Product;
        });
      }
    } catch (err) {
      console.warn('Failed to query all products from Firestore:', err);
    }
  }

  if (all.length === 0) {
    all = [...ALL_DEMO_PRODUCTS];
  }

  const customProds = getLocalCustomProducts();
  for (const cp of customProds) {
    if (!all.some((p) => p.id === cp.id)) {
      all.unshift(cp);
    }
  }

  return applyProductOverrides(all);
}

export async function createProduct(
  data: Omit<Product, 'id' | 'createdAt'>
): Promise<Product> {
  const now = Date.now();
  const id = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const stock = data.availableStock !== undefined ? data.availableStock : (data.stock || 0);
  const availabilityStatus = data.availabilityStatus || (stock > 0 ? 'in_stock' : 'out_of_stock');
  const unit = data.unit || 'piece';

  const product: Product = {
    ...data,
    id,
    stock,
    availableStock: stock,
    unit,
    availabilityStatus,
    createdAt: now,
    updatedAt: now,
    isDemoData: true,
  };

  const custom = getLocalCustomProducts();
  custom.unshift(product);
  setLocalCustomProducts(custom);

  if (db && isFirebaseConfigured) {
    try {
      const cleanDoc = cleanFirestoreData(product);
      const ref = doc(collection(db, 'products'), id);
      await setDoc(ref, cleanDoc, { merge: true });
      console.log(`[Firestore] Successfully created product ${id} in Firebase!`);
    } catch (err: any) {
      console.warn('[Firestore] Could not sync new product to Firestore (saved locally):', err?.message || err);
    }
  }

  return product;
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, 'id' | 'createdAt'>>
): Promise<void> {
  const now = Date.now();
  const updatePayload: any = { ...data, updatedAt: now };

  if (data.availableStock !== undefined) {
    updatePayload.stock = data.availableStock;
    if (data.availabilityStatus === undefined) {
      updatePayload.availabilityStatus = data.availableStock > 0 ? 'in_stock' : 'out_of_stock';
    }
  } else if (data.stock !== undefined) {
    updatePayload.availableStock = data.stock;
    if (data.availabilityStatus === undefined) {
      updatePayload.availabilityStatus = data.stock > 0 ? 'in_stock' : 'out_of_stock';
    }
  }

  // 1. Always save product override locally so catalog updates persist across refreshes!
  setLocalProductOverride(id, updatePayload);

  // 2. Update custom products if present
  const custom = getLocalCustomProducts();
  const idx = custom.findIndex((p) => p.id === id);
  if (idx !== -1) {
    custom[idx] = { ...custom[idx], ...updatePayload };
    setLocalCustomProducts(custom);
  }

  // 3. Update in memory ALL_DEMO_PRODUCTS if present
  const demoIdx = ALL_DEMO_PRODUCTS.findIndex((p) => p.id === id);
  if (demoIdx !== -1) {
    ALL_DEMO_PRODUCTS[demoIdx] = { ...ALL_DEMO_PRODUCTS[demoIdx], ...updatePayload };
  }

  // 4. Construct FULL product document and save to Firebase Firestore
  if (db && isFirebaseConfigured) {
    try {
      const existingProduct =
        (demoIdx !== -1 ? ALL_DEMO_PRODUCTS[demoIdx] : null) ||
        (idx !== -1 ? custom[idx] : null) ||
        {};

      const fullProduct = cleanFirestoreData({
        ...existingProduct,
        ...updatePayload,
        id,
        isDemoData: true,
        updatedAt: now,
      });

      await setDoc(doc(db, 'products', id), fullProduct, { merge: true });
      console.log(`[Firestore] Successfully saved product ${id} to Firebase!`);
    } catch (err: any) {
      console.warn('[Firestore] Could not sync product update to Firestore (saved locally):', err?.message || err);
    }
  }
}

export async function deleteProduct(id: string): Promise<void> {
  // 1. Remove from local custom products
  const custom = getLocalCustomProducts().filter((p) => p.id !== id);
  setLocalCustomProducts(custom);

  // 2. Add to deleted IDs list locally
  addLocalDeletedProductId(id);

  // 3. Remove from in-memory ALL_DEMO_PRODUCTS
  const demoIdx = ALL_DEMO_PRODUCTS.findIndex((p) => p.id === id);
  if (demoIdx !== -1) {
    ALL_DEMO_PRODUCTS.splice(demoIdx, 1);
  }

  // 4. Delete from Firestore collection 'products' and record in 'deleted_products'
  if (db && isFirebaseConfigured) {
    try {
      await deleteDoc(doc(db, 'products', id));
      await setDoc(
        doc(db, 'deleted_products', id),
        { id, deletedAt: Date.now(), deleted: true },
        { merge: true }
      ).catch(() => {});
      console.log(`[Firestore] Successfully deleted product ${id} from Firebase!`);
    } catch (err: any) {
      console.warn('[Firestore] Could not sync product deletion to Firestore (removed locally):', err?.message || err);
    }
  }
}

export async function getShopById(shopId: string): Promise<Shop | null> {
  const normId =
    shopId === 'SHOP_01' || shopId === DEMO_KIRANA_SHOP_1_ID
      ? 'SHOP_01'
      : shopId === 'SHOP_02' || shopId === DEMO_KIRANA_SHOP_2_ID
      ? 'SHOP_02'
      : shopId;

  let foundShop: Shop | null = null;

  if (db && isFirebaseConfigured) {
    try {
      const snap = await getDoc(doc(db, 'shops', normId));
      if (snap.exists()) {
        foundShop = { id: snap.id, ...(snap.data() as Omit<Shop, 'id'>) };
      }
    } catch (e) {
      console.warn('[Shops] Could not fetch shop from Firestore:', e);
    }
  }

  // Check local cache / sample shops
  if (!foundShop) {
    const local = getLocalTwoKiranaShops();
    const found = local.find((s) => s.id === normId);
    if (found) foundShop = { ...found };
  }

  if (!foundShop) {
    const sample = SAMPLE_SHOPS.find((s) => s.id === normId);
    if (sample) foundShop = { ...sample };
  }

  if (!foundShop) {
    const custom = getLocalCustomShops().find((s) => s.id === normId);
    if (custom) foundShop = { ...custom };
  }

  if (foundShop) {
    const overrides = getLocalShopOverrides();
    if (overrides[normId]) {
      foundShop = { ...foundShop, ...overrides[normId] };
    }
    if (normId === 'SHOP_01' || normId === 'SHOP_02') {
      foundShop.approvalStatus = 'approved';
    }
  }

  return foundShop;
}

export async function updateShopPaymentMethods(
  shopId: string,
  methods: Partial<import('../types').ShopPaymentMethods>
): Promise<void> {
  const normId =
    shopId === 'SHOP_01' || shopId === DEMO_KIRANA_SHOP_1_ID
      ? 'SHOP_01'
      : shopId === 'SHOP_02' || shopId === DEMO_KIRANA_SHOP_2_ID
      ? 'SHOP_02'
      : shopId;

  if (db && isFirebaseConfigured) {
    try {
      const ref = doc(db, 'shops', normId);
      await setDoc(ref, { paymentMethods: methods, updatedAt: Date.now() }, { merge: true });
    } catch (e) {
      console.warn('[Shops] Could not update paymentMethods in Firestore:', e);
    }
  }

  // Also update local cache
  const local = getLocalTwoKiranaShops();
  const idx = local.findIndex((s) => s.id === normId);
  if (idx !== -1) {
    local[idx].paymentMethods = { ...local[idx].paymentMethods, ...methods } as any;
    setLocalTwoKiranaShops(local);
  }
}

