import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

console.log('================================================================');
console.log('  ApnaMart 200 Products Verification & Integrity Test Suite');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passed++;
    console.log(`✅ [PASS] ${testName}`);
    if (details) console.log(`       ↳ ${details}`);
  } else {
    failed++;
    console.error(`❌ [FAIL] ${testName}`);
    if (details) console.error(`       ↳ ${details}`);
  }
}

// 1. Check local catalog dataset
const { SHOP_01_PRODUCTS, SHOP_02_PRODUCTS, ALL_DEMO_PRODUCTS } = await import('../src/data/productData.ts');

console.log('--- TEST GROUP 1: Dataset Count & Unique ID Verification ---');
assert(SHOP_01_PRODUCTS.length >= 100, 'Shop 1 (`SHOP_01`) has 100+ products (expanded catalogue)', `Found: ${SHOP_01_PRODUCTS.length}`);
assert(SHOP_02_PRODUCTS.length >= 100, 'Shop 2 (`SHOP_02`) has 100+ products (expanded catalogue)', `Found: ${SHOP_02_PRODUCTS.length}`);
assert(ALL_DEMO_PRODUCTS.length >= 200, 'Total combined catalogue has 200+ products', `Found: ${ALL_DEMO_PRODUCTS.length}`);

// Unique IDs check
const idSet = new Set();
let hasDuplicates = false;
for (const p of ALL_DEMO_PRODUCTS) {
  if (idSet.has(p.productId)) {
    hasDuplicates = true;
    break;
  }
  idSet.add(p.productId);
}
assert(!hasDuplicates && idSet.size === ALL_DEMO_PRODUCTS.length, 'All product IDs are unique without duplicates', `Unique IDs: ${idSet.size}`);

// Verify Shop 1 IDs start with SHOP_01_ and Shop 2 with SHOP_02_
const s1IdsValid = SHOP_01_PRODUCTS.every(p => p.productId.startsWith('SHOP_01_') && p.shopId === 'SHOP_01');
const s2IdsValid = SHOP_02_PRODUCTS.every(p => p.productId.startsWith('SHOP_02_') && p.shopId === 'SHOP_02');
assert(s1IdsValid, 'All Shop 1 products have valid SHOP_01_ IDs and shopId="SHOP_01"');
assert(s2IdsValid, 'All Shop 2 products have valid SHOP_02_ IDs and shopId="SHOP_02"');

console.log('\n--- TEST GROUP 2: Required Fields & Pricing Integrity ---');
const requiredFields = [
  'productId', 'shopId', 'shopName', 'productName', 'category', 'brand',
  'description', 'quantityOrPack', 'mrp', 'discountPercent', 'sellingPrice',
  'stockQuantity', 'unit', 'imageUrl', 'isAvailable', 'isDemoData',
  'createdAt', 'updatedAt'
];

let allFieldsValid = true;
let fieldError = '';
for (const p of ALL_DEMO_PRODUCTS) {
  for (const f of requiredFields) {
    if (p[f] === undefined || p[f] === null || p[f] === '') {
      allFieldsValid = false;
      fieldError = `Product ${p.productId} missing or empty field "${f}"`;
      break;
    }
  }
  if (!allFieldsValid) break;
}
assert(allFieldsValid, 'Every product contains all 18 mandatory data fields', fieldError || 'All 18 fields verified');

// Pricing and discount calculations
let pricingValid = true;
let pricingError = '';
for (const p of ALL_DEMO_PRODUCTS) {
  const expectedPrice = p.discountPercent > 0
    ? Number((p.mrp * (1 - p.discountPercent / 100)).toFixed(2))
    : p.mrp;
  if (Math.abs(p.sellingPrice - expectedPrice) > 0.05) {
    pricingValid = false;
    pricingError = `Product ${p.productId} (${p.productName}): MRP=${p.mrp}, discount=${p.discountPercent}%, sellingPrice=${p.sellingPrice}, expected=${expectedPrice}`;
    break;
  }
}
assert(pricingValid, 'Selling price correctly matches MRP and discountPercent calculations', pricingError || '100% price calculations verified');

// Verify discount variations: 0%, 5%, 10%, 15%, 20%
const discountsFound = new Set(ALL_DEMO_PRODUCTS.map(p => p.discountPercent));
assert(
  discountsFound.has(0) && discountsFound.has(5) && discountsFound.has(10) && discountsFound.has(15) && discountsFound.has(20),
  'Discounts include 0% (normal MRP), 5%, 10%, 15%, and 20%',
  `Discounts present: ${Array.from(discountsFound).sort((a,b)=>a-b).join('%, ')}%`
);

console.log('\n--- TEST GROUP 3: 15 Blinkit Quick-Commerce Categories ---');
const EXPECTED_CATEGORIES = [
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
];

const s1Cats = new Set(SHOP_01_PRODUCTS.map(p => p.category));
const s2Cats = new Set(SHOP_02_PRODUCTS.map(p => p.category));
const allCatsCoveredS1 = EXPECTED_CATEGORIES.every(c => s1Cats.has(c));
const allCatsCoveredS2 = EXPECTED_CATEGORIES.every(c => s2Cats.has(c));
assert(allCatsCoveredS1, 'Shop 1 catalogue covers all 15 Blinkit categories');
assert(allCatsCoveredS2, 'Shop 2 catalogue covers all 15 Blinkit categories');

console.log('\n--- TEST GROUP 4: Preservation of Initial 25 Products from PDF ---');
// Check key items from PDF (with fuzzy/substring matching)
const expectedS1PDF = ['Aashirvaad', 'Basmati Rice', 'Toor Dal', 'Sunflower Oil', 'Milk', 'Thums Up', 'Lay\'s Classic', 'Parle-G', 'Noodles', 'Surf Excel', 'Colgate'];
const expectedS2PDF = ['Chakki Fresh', 'Basmati Rice', 'Chana Dal', 'Saffola', 'Milk', 'Pepsi', 'Lay\'s', 'Marie Gold', 'Noodles', 'Rin', 'Dove'];

const s1PDFPreserved = expectedS1PDF.every(term => SHOP_01_PRODUCTS.some(p => p.productName.toLowerCase().includes(term.toLowerCase())));
const s2PDFPreserved = expectedS2PDF.every(term => SHOP_02_PRODUCTS.some(p => p.productName.toLowerCase().includes(term.toLowerCase())));

assert(s1PDFPreserved, 'Shop 1 preserves initial key product categories from PDF');
assert(s2PDFPreserved, 'Shop 2 preserves initial key product categories from PDF');

console.log('\n--- TEST GROUP 5: Live Cloud Firestore Verification ---');
try {
  let envFile = '';
  try { envFile = readFileSync('.env.local', 'utf8'); } catch { envFile = readFileSync('.env', 'utf8'); }
  const env = {};
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }

  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  });
  const db = getFirestore(app);

  const q1 = query(collection(db, 'products'), where('shopId', '==', 'SHOP_01'));
  const snap1 = await getDocs(q1);
  assert(snap1.size >= 100, `Live Firestore: 100+ products under "SHOP_01" (Found: ${snap1.size})`);

  const q2 = query(collection(db, 'products'), where('shopId', '==', 'SHOP_02'));
  const snap2 = await getDocs(q2);
  assert(snap2.size >= 100, `Live Firestore: 100+ products under "SHOP_02" (Found: ${snap2.size})`);

  const allSnap = await getDocs(collection(db, 'products'));
  assert(allSnap.size >= 200, `Live Firestore: 200+ products in "products" collection (Found: ${allSnap.size})`);

} catch (err) {
  assert(false, 'Live Cloud Firestore Verification', err.message);
}

console.log('\n================================================================');
console.log(`  Verification Complete: ${passed} Passed | ${failed} Failed`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
