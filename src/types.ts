export type Role = 'customer' | 'vendor' | 'admin';

export const SHOP_CATEGORIES = [
  'Kirana / Grocery',
  'Bakery',
  'Dairy',
  'Fruits and Vegetables',
  'Medical Store',
  'Stationery',
  'Snacks and Beverages',
  'Other Local Shops',
] as const;

export type ShopCategory = (typeof SHOP_CATEGORIES)[number] | string;

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
  flat?: string;
  landmark?: string;
  accuracy?: number;
  isApproximate?: boolean;
  timestamp?: number;
  updatedAt: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  role: Role;
  phone?: string;
  location?: LocationData | null;
  createdAt: number;
  updatedAt: number;
}

export type ProductAvailability = 'in_stock' | 'out_of_stock' | 'discontinued';

export const PRODUCT_UNITS = [
  'piece',
  'kg',
  'g',
  'litre',
  'ml',
  'pack',
  'box',
  'bottle',
  'dozen',
] as const;

export type ProductUnit = (typeof PRODUCT_UNITS)[number] | string;

export const BLINKIT_CATEGORIES = [
  'Fruits & Vegetables',
  'Dairy, Bread & Eggs',
  'Cold Drinks & Juices',
  'Chips, Namkeen & Snacks',
  'Chocolates & Sweets',
  'Biscuits & Bakery',
  'Atta, Rice & Dal',
  'Oil, Ghee & Masala',
  'Instant Food & Breakfast',
  'Tea & Coffee',
  'Personal Care',
  'Cleaning & Household',
  'Baby Care',
  'Frozen & Ready-to-Eat',
  'Pooja & Daily Essentials',
] as const;

export type BlinkitCategory = (typeof BLINKIT_CATEGORIES)[number];

export interface Product {
  id: string;
  productId?: string;
  shopId: string;
  shopName?: string;
  vendorId?: string;
  name: string;
  productName?: string;
  category: string;
  brand?: string;
  description?: string;
  quantityOrPack?: string;
  mrp?: number;
  discountPercent?: number;
  sellingPrice?: number;
  price: number;
  stockQuantity?: number;
  stock: number;
  availableStock: number;
  unit?: ProductUnit;
  imageUrl?: string;
  imageSource?: 'bigbasket_cdn' | 'brand_official' | 'category_placeholder' | string;
  imageMatchStatus?: 'verified' | 'needs_review' | 'placeholder';
  imageMatchType?: 'exact_product' | 'exact_variant' | 'category_fallback';
  isAvailable?: boolean;
  isDemoData?: boolean;
  availabilityStatus?: ProductAvailability;
  createdAt: number;
  updatedAt?: number;
}

export type ShopSource = 'manual' | 'google_places' | 'vendor';

export interface ShopPaymentMethods {
  upiEnabled: boolean;
  codEnabled: boolean;
  upiQrStoragePath?: string;
  upiQrUrl?: string;
  accountDetails?: string;
  upiProvider?: string;
  merchantName?: string;
  upiId?: string;
}

export interface Shop {
  id: string;
  shopId?: string;
  vendorId: string;
  name: string;
  category: ShopCategory;
  ownerName?: string;
  phone?: string;
  address: string;
  location: { lat: number; lng: number };
  imageUrl?: string;
  openingHours?: string;
  description?: string;
  status: 'active' | 'inactive' | 'open' | 'closed';
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  createdByAdmin?: boolean;
  source?: ShopSource;
  googlePlaceId?: string;
  products?: Product[];
  paymentMethods?: ShopPaymentMethods;
  isDemo?: boolean;
  createdAt: number;
  updatedAt: number;
}

export type PaymentMethod = 'UPI' | 'COD';
export type PaymentStatus =
  | 'pending'
  | 'pending_verification'
  | 'confirmed'
  | 'collected'
  | 'failed';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface OrderComplaint {
  category: string;
  description: string;
  status: 'submitted' | 'under_review' | 'resolved';
  createdAt: number;
}

export interface DeliveryTracking {
  partnerName?: string;
  partnerPhone?: string;
  lat?: number;
  lng?: number;
  updatedAt?: number;
  statusText?: string;
}

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'packing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  shopId: string;
  shopName?: string;
  shopVendorId?: string;
  items: OrderItem[];
  subtotal?: number;
  deliveryFee?: number;
  discount?: number;
  totalAmount: number;
  deliveryAddress: string;
  deliveryAddressDetails?: {
    flat?: string;
    street?: string;
    landmark?: string;
    fullAddress: string;
    city?: string;
    pincode?: string;
  };
  deliveryInstructions?: string;
  status: OrderStatus;
  tracking?: DeliveryTracking;
  vendorMessage?: string;
  complaint?: OrderComplaint;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionReference?: string;
  paymentProofUrl?: string;
  paymentVerifiedBy?: string;
  paymentVerifiedAt?: number;
  createdAt: number;
  updatedAt?: number;
}

export interface VendorProfile {
  id: string;
  uid: string;
  businessName: string;
  category: string;
  createdAt: number;
  updatedAt: number;
}


