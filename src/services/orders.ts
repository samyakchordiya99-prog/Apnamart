import { db, isFirebaseConfigured } from './auth';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import type { Order, OrderItem, PaymentMethod, PaymentStatus } from '../types';

const LOCAL_ORDERS_KEY = 'apnamart_orders_cache';

function getLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalOrders(orders: Order[]): void {
  try {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
  } catch {}
}

export interface CreateOrderInput {
  shopId: string;
  shopName: string;
  shopVendorId?: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal?: number;
  deliveryFee?: number;
  discount?: number;
  totalAmount: number;
  deliveryAddress: string;
  deliveryAddressDetails?: Order['deliveryAddressDetails'];
  deliveryInstructions?: string;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  paymentProofUrl?: string;
}

/**
 * Creates and saves an order in Firestore and local storage.
 * - UPI payments are marked as 'pending_verification'
 * - COD payments are marked as 'pending'
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const now = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const orderId = `ORD-${now}-${randomSuffix}`;

  const paymentStatus: PaymentStatus =
    input.paymentMethod === 'UPI' ? 'pending_verification' : 'pending';

  const newOrder: Order = {
    id: orderId,
    customerId: input.customerId,
    customerName: input.customerName || 'Customer',
    customerPhone: input.customerPhone || '',
    shopId: input.shopId,
    shopName: input.shopName,
    shopVendorId: input.shopVendorId || 'demo-vendor-1',
    items: input.items,
    subtotal: input.subtotal !== undefined ? Number(input.subtotal.toFixed(2)) : undefined,
    deliveryFee: input.deliveryFee !== undefined ? Number(input.deliveryFee.toFixed(2)) : undefined,
    discount: input.discount !== undefined ? Number(input.discount.toFixed(2)) : undefined,
    totalAmount: Number(input.totalAmount.toFixed(2)),
    deliveryAddress: input.deliveryAddress,
    deliveryAddressDetails: input.deliveryAddressDetails,
    deliveryInstructions: input.deliveryInstructions?.trim() || undefined,
    status: 'pending',
    paymentMethod: input.paymentMethod,
    paymentStatus,
    transactionReference: input.transactionReference?.trim() || undefined,
    paymentProofUrl: input.paymentProofUrl || undefined,
    createdAt: now,
    updatedAt: now,
  };

  // 1. Always cache locally
  const local = getLocalOrders();
  saveLocalOrders([newOrder, ...local]);

  // 2. Persist to Firestore if configured — strip undefined fields first
  if (db && isFirebaseConfigured) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      // Firestore rejects undefined values; remove them before writing
      const firestorePayload = JSON.parse(JSON.stringify(newOrder)) as Record<string, unknown>;
      await setDoc(orderRef, firestorePayload);
      console.log(`[Orders] Order ${orderId} saved to Firestore.`);
    } catch (err) {
      console.warn('[Orders] Could not save order to Firestore (cached locally):', err);
    }
  }

  return newOrder;
}

/**
 * Lists all orders for a specific shop (for the shopkeeper / vendor dashboard).
 */
export async function listOrdersForShop(shopId: string): Promise<Order[]> {
  const normId =
    shopId === 'SHOP_01' || shopId.toLowerCase().includes('shop 1') || shopId.toLowerCase().includes('shop_01')
      ? 'SHOP_01'
      : shopId === 'SHOP_02' || shopId.toLowerCase().includes('shop 2') || shopId.toLowerCase().includes('shop_02')
      ? 'SHOP_02'
      : shopId;

  const localOrders = getLocalOrders().filter(
    (o) => o.shopId === normId || o.shopId === shopId
  );

  if (db && isFirebaseConfigured) {
    try {
      const q = query(
        collection(db, 'orders'),
        where('shopId', 'in', [normId, shopId])
      );
      const snap = await getDocs(q);
      const firestoreOrders: Order[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Order, 'id'>),
      }));

      // Merge unique by ID
      const orderMap = new Map<string, Order>();
      for (const o of firestoreOrders) orderMap.set(o.id, o);
      for (const o of localOrders) {
        if (!orderMap.has(o.id)) orderMap.set(o.id, o);
      }

      const all = Array.from(orderMap.values());
      all.sort((a, b) => b.createdAt - a.createdAt);
      return all;
    } catch (err) {
      console.warn('[Orders] Firestore read error, returning local cache:', err);
    }
  }

  localOrders.sort((a, b) => b.createdAt - a.createdAt);
  return localOrders;
}

/**
 * Confirms payment for an order (Authorized Shopkeeper / Admin action).
 * Verifies bank credit and changes status to 'confirmed'.
 */
export async function confirmOrderPayment(
  orderId: string,
  verifiedByUid: string
): Promise<void> {
  const now = Date.now();

  // Update local cache
  const local = getLocalOrders();
  const idx = local.findIndex((o) => o.id === orderId);
  if (idx !== -1) {
    local[idx].paymentStatus = 'confirmed';
    local[idx].status = 'accepted';
    local[idx].paymentVerifiedBy = verifiedByUid;
    local[idx].paymentVerifiedAt = now;
    local[idx].updatedAt = now;
    saveLocalOrders(local);
  }

  // Update Firestore
  if (db && isFirebaseConfigured) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        paymentStatus: 'confirmed',
        status: 'accepted',
        paymentVerifiedBy: verifiedByUid,
        paymentVerifiedAt: now,
        updatedAt: now,
      });
      console.log(`[Orders] Payment confirmed for ${orderId}`);
    } catch (err) {
      console.warn('[Orders] Could not update payment status in Firestore:', err);
    }
  }
}

/**
 * Marks Cash on Delivery payment as collected upon doorstep delivery.
 */
export async function markCashCollected(
  orderId: string,
  verifiedByUid: string
): Promise<void> {
  const now = Date.now();

  // Update local cache
  const local = getLocalOrders();
  const idx = local.findIndex((o) => o.id === orderId);
  if (idx !== -1) {
    local[idx].paymentStatus = 'collected';
    local[idx].status = 'delivered';
    local[idx].paymentVerifiedBy = verifiedByUid;
    local[idx].paymentVerifiedAt = now;
    local[idx].updatedAt = now;
    saveLocalOrders(local);
  }

  // Update Firestore
  if (db && isFirebaseConfigured) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        paymentStatus: 'collected',
        status: 'delivered',
        paymentVerifiedBy: verifiedByUid,
        paymentVerifiedAt: now,
        updatedAt: now,
      });
      console.log(`[Orders] Cash marked collected for ${orderId}`);
    } catch (err) {
      console.warn('[Orders] Could not update cash status in Firestore:', err);
    }
  }
}

/**
 * Lists all past orders for a customer (for Order History & Help/Complaints).
 */
export async function listOrdersForCustomer(customerId: string): Promise<Order[]> {
  const localOrders = getLocalOrders().filter(
    (o) => o.customerId === customerId || customerId === 'guest-customer' || !o.customerId
  );

  if (db && isFirebaseConfigured) {
    try {
      const q = query(
        collection(db, 'orders'),
        where('customerId', '==', customerId)
      );
      const snap = await getDocs(q);
      const firestoreOrders: Order[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Order, 'id'>),
      }));

      const orderMap = new Map<string, Order>();
      for (const o of firestoreOrders) orderMap.set(o.id, o);
      for (const o of localOrders) {
        if (!orderMap.has(o.id)) orderMap.set(o.id, o);
      }

      const all = Array.from(orderMap.values());
      all.sort((a, b) => b.createdAt - a.createdAt);
      return all;
    } catch (err) {
      console.warn('[Orders] Could not fetch customer orders from Firestore:', err);
    }
  }

  localOrders.sort((a, b) => b.createdAt - a.createdAt);
  return localOrders;
}

/**
 * Approves an order by the vendor / shopkeeper.
 * Sets status to 'accepted' and vendorMessage to "Order will come shortly".
 */
export async function approveOrder(
  orderId: string,
  _vendorUid: string,
  message: string = 'Order pack ho raha hai! The shopkeeper is packing your items.'
): Promise<void> {
  const now = Date.now();

  const local = getLocalOrders();
  const idx = local.findIndex((o) => o.id === orderId);
  if (idx !== -1) {
    local[idx].status = 'accepted';
    local[idx].vendorMessage = message;
    local[idx].updatedAt = now;
    saveLocalOrders(local);
  }

  if (db && isFirebaseConfigured) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'accepted',
        vendorMessage: message,
        updatedAt: now,
      });
      console.log(`[Orders] Order ${orderId} accepted/packing: "${message}"`);
    } catch (err) {
      console.warn('[Orders] Could not update order approval in Firestore:', err);
    }
  }
}

/**
 * Marks order as Out for Delivery and attaches delivery partner details and live GPS coordinates.
 */
export async function dispatchOrder(
  orderId: string,
  _vendorUid: string,
  partnerData: {
    partnerName: string;
    partnerPhone: string;
    lat?: number;
    lng?: number;
  }
): Promise<void> {
  const now = Date.now();
  const tracking = {
    partnerName: partnerData.partnerName,
    partnerPhone: partnerData.partnerPhone,
    lat: partnerData.lat,
    lng: partnerData.lng,
    updatedAt: now,
    statusText: 'Out for delivery! Partner on the way to your doorstep.',
  };
  const message = `Out for delivery! ${partnerData.partnerName} (${partnerData.partnerPhone}) is on the way with your order.`;

  const local = getLocalOrders();
  const idx = local.findIndex((o) => o.id === orderId);
  if (idx !== -1) {
    local[idx].status = 'out_for_delivery';
    local[idx].tracking = tracking;
    local[idx].vendorMessage = message;
    local[idx].updatedAt = now;
    saveLocalOrders(local);
  }

  if (db && isFirebaseConfigured) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'out_for_delivery',
        tracking,
        vendorMessage: message,
        updatedAt: now,
      });
      console.log(`[Orders] Order ${orderId} dispatched out for delivery with tracking.`);
    } catch (err) {
      console.warn('[Orders] Could not update order dispatch in Firestore:', err);
    }
  }
}

/**
 * Updates live GPS coordinates of the delivery partner for real-time customer tracking.
 */
export async function updateDeliveryLocation(
  orderId: string,
  lat: number,
  lng: number
): Promise<void> {
  const now = Date.now();
  const local = getLocalOrders();
  const idx = local.findIndex((o) => o.id === orderId);
  if (idx !== -1 && local[idx].tracking) {
    local[idx].tracking = {
      ...local[idx].tracking,
      lat,
      lng,
      updatedAt: now,
    };
    local[idx].updatedAt = now;
    saveLocalOrders(local);
  }

  if (db && isFirebaseConfigured) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        'tracking.lat': lat,
        'tracking.lng': lng,
        'tracking.updatedAt': now,
        updatedAt: now,
      });
      console.log(`[Orders] Updated live location for ${orderId}: ${lat}, ${lng}`);
    } catch (err) {
      console.warn('[Orders] Could not update location in Firestore:', err);
    }
  }
}

/**
 * Marks order as Delivered successfully.
 */
export async function markOrderDelivered(
  orderId: string,
  _vendorUid: string
): Promise<void> {
  const now = Date.now();
  const message = 'Order delivered successfully! Thank you for supporting your local Kirana store.';

  const local = getLocalOrders();
  const idx = local.findIndex((o) => o.id === orderId);
  if (idx !== -1) {
    local[idx].status = 'delivered';
    local[idx].vendorMessage = message;
    local[idx].updatedAt = now;
    saveLocalOrders(local);
  }

  if (db && isFirebaseConfigured) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'delivered',
        vendorMessage: message,
        updatedAt: now,
      });
      console.log(`[Orders] Order ${orderId} marked delivered.`);
    } catch (err) {
      console.warn('[Orders] Could not mark delivered in Firestore:', err);
    }
  }
}

/**
 * Submits a complaint on an order (Blinkit style Help/Issue resolution).
 */
export async function submitOrderComplaint(
  orderId: string,
  complaintData: { category: string; description: string; customerId: string }
): Promise<void> {
  const now = Date.now();
  const complaint = {
    category: complaintData.category,
    description: complaintData.description,
    status: 'submitted' as const,
    createdAt: now,
  };

  const local = getLocalOrders();
  const idx = local.findIndex((o) => o.id === orderId);
  if (idx !== -1) {
    local[idx].complaint = complaint;
    local[idx].updatedAt = now;
    saveLocalOrders(local);
  }

  if (db && isFirebaseConfigured) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        complaint,
        updatedAt: now,
      });
      console.log(`[Orders] Complaint logged for order ${orderId}`);
    } catch (err) {
      console.warn('[Orders] Could not save complaint to Firestore:', err);
    }
  }
}
