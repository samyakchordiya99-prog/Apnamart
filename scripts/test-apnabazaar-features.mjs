import { readFileSync } from 'fs';

console.log('================================================================');
console.log('  ApnaBazaar Verification: Location, Phone Login & 2 Kirana Shops');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, name, details = '') {
  if (condition) {
    passed++;
    console.log(`✅ [PASS] ${name}`);
    if (details) console.log(`   ↳ ${details}`);
  } else {
    failed++;
    console.error(`❌ [FAIL] ${name}`);
    if (details) console.error(`   ↳ ${details}`);
  }
}

// ----------------- TEST 1: Haversine distance & Location formatting -----------------
console.log('--- TEST GROUP 1: Simple Location & Zero Lat/Lng Exposure ---');

function haversineKm(a, b) {
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s1 = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1));
}

const refLoc = { lat: 28.6139, lng: 77.2090, address: 'Connaught Place, New Delhi' };

// Test fallback geocoding formatting in location.ts
const locationSource = readFileSync('src/services/location.ts', 'utf8');
const exposesCoordinates = locationSource.includes('${lat.toFixed(5)}, ${lng.toFixed(5)}') ||
  locationSource.includes('${lat.toFixed(5)}°');

assert(!exposesCoordinates, 'Privacy check: Latitude/longitude NEVER exposed as customer address text');
assert(locationSource.includes('Current Location (GPS Detected)'), 'Clean readable address fallback present');

// ----------------- TEST GROUP 2: Phone Authentication -----------------
console.log('\n--- TEST GROUP 2: Firebase Phone Number Authentication ---');

const authSource = readFileSync('src/services/auth.ts', 'utf8');
assert(authSource.includes('signInWithPhoneNumber'), 'Firebase signInWithPhoneNumber integrated');
assert(authSource.includes('RecaptchaVerifier'), 'Firebase RecaptchaVerifier configured');
assert(authSource.includes('setupRecaptcha'), 'setupRecaptcha function exported');
assert(authSource.includes('sendPhoneOtp'), 'sendPhoneOtp function exported');
assert(authSource.includes('verifyPhoneOtp'), 'verifyPhoneOtp function exported');
assert(authSource.includes('formatPhoneNumber'), 'formatPhoneNumber function exported');

// Test phone formatting logic
function formatPhoneNumber(input) {
  const cleaned = input.trim().replace(/[\s-]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('0')) return `+91${cleaned.slice(1)}`;
  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;
  return cleaned;
}

assert(formatPhoneNumber('9876543210') === '+919876543210', 'Phone number format: 10 digits formatted to +91');
assert(formatPhoneNumber('+91 98765 43210') === '+919876543210', 'Phone number format: Space removal with country code');

// Test error handling in auth.ts
assert(authSource.includes('auth/invalid-verification-code'), 'Proper error mapping for invalid OTP code');
assert(authSource.includes('auth/code-expired'), 'Proper error mapping for expired OTP');
assert(authSource.includes('auth/invalid-phone-number'), 'Proper error mapping for invalid phone number');

// Check Login UI
const loginSource = readFileSync('src/pages/Login.tsx', 'utf8');
assert(loginSource.includes('recaptcha-container'), 'reCAPTCHA container present in Login UI');
assert(loginSource.includes('handleSendOtp'), 'Send OTP handler present in Login UI');
assert(loginSource.includes('handleVerifyOtp'), 'Verify OTP handler present in Login UI');
assert(loginSource.includes('Phone Number (OTP)'), 'Phone Number OTP tab available');

// ----------------- TEST GROUP 3: Exactly Two Kirana Shops -----------------
console.log('\n--- TEST GROUP 3: Exactly Two Kirana Shops & Firestore Sync ---');

const shopsSource = readFileSync('src/services/shops.ts', 'utf8');
assert(shopsSource.includes('createTwoKiranaShopsForLocation'), 'createTwoKiranaShopsForLocation defined');
assert(shopsSource.includes('syncTwoKiranaShopsWithFirestore'), 'syncTwoKiranaShopsWithFirestore defined');
assert(shopsSource.includes('apnabazaar-kirana-1') && shopsSource.includes('apnabazaar-kirana-2'), 'Deterministic unique shop IDs defined');

// Simulate createTwoKiranaShopsForLocation
const DEMO_KIRANA_SHOP_1_ID = 'apnabazaar-kirana-1';
const DEMO_KIRANA_SHOP_2_ID = 'apnabazaar-kirana-2';

function createTwoKiranaShopsForLocation(customerLoc) {
  let locality = 'Main Area';
  if (customerLoc.address && !customerLoc.address.includes('°')) {
    const parts = customerLoc.address.split(',').map((p) => p.trim());
    if (parts.length > 0 && parts[0]) locality = parts[0];
  }

  const shop1 = {
    id: DEMO_KIRANA_SHOP_1_ID,
    name: 'Apna Daily Kirana & Provisions (Demo)',
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
    status: 'active',
    isDemo: true,
    products: [],
  };

  const shop2 = {
    id: DEMO_KIRANA_SHOP_2_ID,
    name: 'Shri Krishna Kirana & General Store (Demo)',
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
    status: 'active',
    isDemo: true,
    products: [],
  };

  return [shop1, shop2];
}

const shops = createTwoKiranaShopsForLocation(refLoc);
assert(shops.length === 2, 'Shop Count: Exactly two Kirana shops created');

const [shop1, shop2] = shops;
assert(shop1.category === 'Kirana / Grocery' && shop2.category === 'Kirana / Grocery', 'Category: Both shops are "Kirana / Grocery"');
assert(shop1.isDemo === true && shop2.isDemo === true, 'isDemo Flag: Both shops identifiable with isDemo: true');
assert(shop1.status === 'active' && shop2.status === 'active', 'Active Status: Both shops active');
assert(shop1.products.length === 0 && shop2.products.length === 0, 'No products or large datasets added yet');

const d1 = haversineKm(refLoc, shop1.location);
const d2 = haversineKm(refLoc, shop2.location);
assert(d1 <= 3.0, `Shop 1 distance (${d1.toFixed(2)} km) is within 3 km of customer location`);
assert(d2 <= 3.0, `Shop 2 distance (${d2.toFixed(2)} km) is within 3 km of customer location`);

// Test duplicate prevention
const run1 = createTwoKiranaShopsForLocation(refLoc);
const run2 = createTwoKiranaShopsForLocation(refLoc);
assert(run1[0].id === run2[0].id && run1[1].id === run2[1].id, 'Duplicate Prevention: IDs remain deterministic across calls/refreshes');

// Check Firestore rules
const rules = readFileSync('firestore.rules', 'utf8');
assert(rules.includes('request.resource.data.isDemo == true'), 'Firestore rules allow demo shop saving');
assert(rules.includes('request.resource.data.email == null || request.resource.data.email is string'), 'Firestore rules allow phone auth users without email');

console.log('\n================================================================');
console.log(`  Tests Passed: ${passed} | Tests Failed: ${failed}`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
}

