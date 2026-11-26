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

  // 1. If Firebase is connected, check existing shops first to preserve vendor updates!
  if (db && isFirebaseConfigured) {
    try {
      const s1Snap = await getDoc(doc(db, 'shops', demoShops[0].id)).catch(() => null);
      const s2Snap = await getDoc(doc(db, 'shops', demoShops[1].id)).catch(() => null);

      const s1Data = s1Snap?.exists() ? (s1Snap.data() as Partial<Shop>) : null;
      const s2Data = s2Snap?.exists() ? (s2Snap.data() as Partial<Shop>) : null;

      // Merge vendor-customized data with customer's location
      const shop1: Shop = {
        ...demoShops[0],
        ...(s1Data || {}),
        id: demoShops[0].id,
        location: demoShops[0].location,
        approvalStatus: 'approved',
      };

      const shop2: Shop = {
        ...demoShops[1],
        ...(s2Data || {}),
        id: demoShops[1].id,
        location: demoShops[1].location,
        approvalStatus: 'approved',
      };

      // Persist to Firestore: create if missing, or update location if existing
      if (!s1Snap?.exists()) {
        await setDoc(doc(db, 'shops', demoShops[0].id), cleanFirestoreData(shop1), { merge: true });
      } else {
        await setDoc(doc(db, 'shops', demoShops[0].id), { location: demoShops[0].location }, { merge: true });
      }

      if (!s2Snap?.exists()) {
        await setDoc(doc(db, 'shops', demoShops[1].id), cleanFirestoreData(shop2), { merge: true });
      } else {
        await setDoc(doc(db, 'shops', demoShops[1].id), { location: demoShops[1].location }, { merge: true });
      }

      let selected = applyShopOverrides([shop1, shop2]);
      setLocalTwoKiranaShops(selected);

      for (const s of selected) {
        s.products = await listProductsForShop(s.id);
      }
      return selected;
    } catch (err) {
      console.warn('[Firestore] Could not save shops to Firestore (falling back to local cache):', err);
    }
  }

  let localResult = applyShopOverrides(demoShops);
  setLocalTwoKiranaShops(localResult);
  for (const s of localResult) {
    s.products = await listProductsForShop(s.id);
  }
  return localResult;
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

        const s1 = shops.find((s) => s.id === 'SHOP_01' || s.id === DEMO_KIRANA_SHOP_1_ID);
        const s2 = shops.find((s) => s.id === 'SHOP_02' || s.id === DEMO_KIRANA_SHOP_2_ID);
        const paired: Shop[] = [];
        if (s1) paired.push(s1);
        if (s2) paired.push(s2);
        for (const s of shops) {
          if (!paired.some((p) => p.id === s.id)) paired.push(s);
        }

        if (paired.length > 0) {
          result = paired.slice(0, 2);
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

  // 1. Start with the full catalogue dataset (baseline for products NOT yet edited by vendor)
  const demoList = getDemoProductsForShop(normalizedShopId);
  const productMap = new Map<string, Product>();
  for (const item of demoList) {
    productMap.set(item.id, { ...item });
  }

  // 2. Fetch Firestore products — Firestore WINS over demo defaults (vendor edits are authoritative)
  if (db && isFirebaseConfigured) {
    try {
      const q = query(
        collection(db, 'products'),
        where('shopId', 'in', [shopId, normalizedShopId])
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        for (const d of snap.docs) {
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

          // Existing demo product is used ONLY as a fallback for fields missing in Firestore doc
          const existing = productMap.get(d.id);
          const mergedProd: Product = {
            // Start from existing demo (for fields like brand, imageUrl if not overridden)
            ...(existing || {}),
            // Then apply everything from Firestore — Firestore fields always win
            ...data,
            id: d.id,
            productId: data.productId || d.id,
            shopId: normalizedShopId,
            shopName: data.shopName || (normalizedShopId === 'SHOP_01' ? 'Apna Kirana & General Store' : 'Shri Krishna Kirana & Provision Store'),
            vendorId: data.vendorId || existing?.vendorId || 'demo-vendor-1',
            name: data.productName || data.name || existing?.name || 'Grocery Item',
            productName: data.productName || data.name || existing?.name || 'Grocery Item',
            category: data.category || existing?.category || 'General',
            brand: data.brand || existing?.brand || 'Local Kirana',
            description: data.description !== undefined ? data.description : (existing?.description || ''),
            quantityOrPack: data.quantityOrPack || existing?.quantityOrPack || '1 pc',
            mrp,
            discountPercent,
            sellingPrice,
            price: sellingPrice,
            stockQuantity,
            stock: stockQuantity,
            availableStock: stockQuantity,
            unit: data.unit || existing?.unit || 'piece',
            // imageUrl from Firestore wins if present, else keep the demo SVG/URL
            imageUrl: data.imageUrl || existing?.imageUrl || '',
            imageSource: data.imageSource || existing?.imageSource || 'bigbasket_cdn',
            imageMatchStatus: data.imageMatchStatus || existing?.imageMatchStatus || 'verified',
            imageMatchType: data.imageMatchType || existing?.imageMatchType || 'exact_product',
            isAvailable,
            isDemoData: true,
            availabilityStatus: isAvailable ? 'in_stock' : 'out_of_stock',
            createdAt: data.createdAt || existing?.createdAt || Date.now(),
            updatedAt: data.updatedAt || Date.now(),
          };

          productMap.set(d.id, mergedProd);
        }
      }
    } catch (err) {
      console.warn('Failed to query products from Firestore, falling back to local dataset:', err);
    }

    // Check Firestore for tombstoned / deleted products
    try {
      const delSnap = await getDocs(collection(db, 'deleted_products')).catch(() => null);
      if (delSnap && !delSnap.empty) {
        for (const doc of delSnap.docs) {
          addLocalDeletedProductId(doc.id);
          productMap.delete(doc.id);
        }
      }
    } catch {}
  }

  // 3. Include custom products created by the user for this shop (vendor-added new products)
  const customProds = getLocalCustomProducts().filter((p) => p.shopId === normalizedShopId);
  for (const cp of customProds) {
    if (!productMap.has(cp.id)) {
      productMap.set(cp.id, cp);
    }
  }

  // 4. Remove any locally deleted products
  const deletedIds = getLocalDeletedProductIds();
  for (const delId of deletedIds) {
    productMap.delete(delId);
  }
  productMap.delete('SHOP_01_PROD_004');
  productMap.delete('SHOP_01_PROD_007');

  // 5. Convert map to array — preserve pristine catalog order from demoList
  const demoOrderMap = new Map<string, number>();
  demoList.forEach((item, idx) => {
    demoOrderMap.set(item.id, idx);
    demoOrderMap.set(item.productId || item.id, idx);
  });

  const result = Array.from(productMap.values())
    .sort((a, b) => {
      const aKey = a.productId || a.id;
      const bKey = b.productId || b.id;
      const aOrder = demoOrderMap.has(aKey) ? demoOrderMap.get(aKey)! : 999999;
      const bOrder = demoOrderMap.has(bKey) ? demoOrderMap.get(bKey)! : 999999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });

  return applyProductOverrides(result);
}

export async function listAllProducts(): Promise<Product[]> {
  const map = new Map<string, Product>();
  const demoOrderMap = new Map<string, number>();
  ALL_DEMO_PRODUCTS.forEach((p, idx) => {
    map.set(p.id, { ...p });
    demoOrderMap.set(p.id, idx);
    demoOrderMap.set(p.productId || p.id, idx);
  });

  if (db && isFirebaseConfigured) {
    try {
      const snap = await getDocs(collection(db, 'products'));
      if (!snap.empty) {
        for (const d of snap.docs) {
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

          const existing = map.get(d.id);
          const mergedProd: Product = {
            ...(existing || {}),
            ...data,
            id: d.id,
            productId: data.productId || d.id,
            shopId: data.shopId || 'SHOP_01',
            shopName:
              data.shopName ||
              (data.shopId === 'SHOP_02'
                ? 'Shri Krishna Kirana & Provision Store'
                : 'Apna Kirana & General Store'),
            vendorId: data.vendorId || existing?.vendorId || 'demo-vendor-1',
            name: data.productName || data.name || existing?.name || 'Grocery Item',
            productName: data.productName || data.name || existing?.name || 'Grocery Item',
            category: data.category || existing?.category || 'General',
            brand: data.brand || existing?.brand || 'Local Kirana',
            description: data.description !== undefined ? data.description : (existing?.description || ''),
            quantityOrPack: data.quantityOrPack || existing?.quantityOrPack || '1 pc',
            mrp,
            discountPercent,
            sellingPrice,
            price: sellingPrice,
            stockQuantity,
            stock: stockQuantity,
            availableStock: stockQuantity,
            unit: data.unit || existing?.unit || 'piece',
            imageUrl: data.imageUrl || existing?.imageUrl || '',
            imageSource: data.imageSource || existing?.imageSource || 'bigbasket_cdn',
            imageMatchStatus: data.imageMatchStatus || existing?.imageMatchStatus || 'verified',
            imageMatchType: data.imageMatchType || existing?.imageMatchType || 'exact_product',
            isAvailable,
            isDemoData: true,
            availabilityStatus: isAvailable ? 'in_stock' : 'out_of_stock',
            createdAt: data.createdAt || existing?.createdAt || Date.now(),
            updatedAt: data.updatedAt || Date.now(),
          };

          map.set(d.id, mergedProd);
        }
      }
    } catch (err) {
      console.warn('Failed to query all products from Firestore:', err);
    }

    try {
      const delSnap = await getDocs(collection(db, 'deleted_products')).catch(() => null);
      if (delSnap && !delSnap.empty) {
        for (const doc of delSnap.docs) {
          addLocalDeletedProductId(doc.id);
          map.delete(doc.id);
        }
      }
    } catch {}
  }

  const customProds = getLocalCustomProducts();
  for (const cp of customProds) {
    if (!map.has(cp.id)) {
      map.set(cp.id, cp);
    }
  }

  const deletedIds = getLocalDeletedProductIds();
  for (const delId of deletedIds) {
    map.delete(delId);
  }
  map.delete('SHOP_01_PROD_004');
  map.delete('SHOP_01_PROD_007');

  const allResult = Array.from(map.values()).sort((a, b) => {
    const aKey = a.productId || a.id;
    const bKey = b.productId || b.id;
    const aOrder = demoOrderMap.has(aKey) ? demoOrderMap.get(aKey)! : 999999;
    const bOrder = demoOrderMap.has(bKey) ? demoOrderMap.get(bKey)! : 999999;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  return applyProductOverrides(allResult);
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
    updatePayload.stockQuantity = data.availableStock;
    if (data.availabilityStatus === undefined) {
      updatePayload.availabilityStatus = data.availableStock > 0 ? 'in_stock' : 'out_of_stock';
      updatePayload.isAvailable = data.availableStock > 0;
    }
  } else if (data.stock !== undefined) {
    updatePayload.availableStock = data.stock;
    updatePayload.stockQuantity = data.stock;
    if (data.availabilityStatus === undefined) {
      updatePayload.availabilityStatus = data.stock > 0 ? 'in_stock' : 'out_of_stock';
      updatePayload.isAvailable = data.stock > 0;
    }
  }

  if (data.price !== undefined) {
    updatePayload.sellingPrice = data.price;
    updatePayload.mrp = data.price;
  }
  if (data.sellingPrice !== undefined) {
    updatePayload.price = data.sellingPrice;
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

  // 3. Find the original product from demo set for a full write
  const demoIdx = ALL_DEMO_PRODUCTS.findIndex((p) => p.id === id);
  const originalDemo = demoIdx !== -1 ? ALL_DEMO_PRODUCTS[demoIdx] : null;

  // 4. Update in-memory ALL_DEMO_PRODUCTS so this session reflects the change
  if (demoIdx !== -1) {
    ALL_DEMO_PRODUCTS[demoIdx] = { ...ALL_DEMO_PRODUCTS[demoIdx], ...updatePayload };
  }

  // 5. Write COMPLETE product document to Firebase Firestore (not just diff)
  if (db && isFirebaseConfigured) {
    try {
      // Build a full product document by merging the original baseline with updates
      const baseProduct: any = originalDemo
        ? { ...originalDemo }
        : idx !== -1
        ? { ...custom[idx] }
        : { id };

      const fullProduct = cleanFirestoreData({
        ...baseProduct,
        ...updatePayload,
        id,
        productId: id,
        isDemoData: true,
        updatedAt: now,
      });

      await setDoc(doc(db, 'products', id), fullProduct, { merge: true });
      console.log(`[Firestore] ✅ Saved product ${id} permanently to Firebase!`);
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
    try {
      foundShop.products = await listProductsForShop(normId);
    } catch {}
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

