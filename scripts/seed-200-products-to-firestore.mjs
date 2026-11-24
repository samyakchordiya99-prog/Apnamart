import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, writeBatch, getDocs, collection, query, where } from 'firebase/firestore';

// 1. Read environment variables
let envFile = '';
try {
  envFile = readFileSync('.env.local', 'utf8');
} catch {
  envFile = readFileSync('.env', 'utf8');
}

function parseEnv(content) {
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }
  return env;
}

const env = parseEnv(envFile);

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Import generated products
const { ALL_DEMO_PRODUCTS, SHOP_01_PRODUCTS, SHOP_02_PRODUCTS } = await import('../src/data/productData.ts');

console.log('================================================================');
console.log('  Seeding 200 Products to Cloud Firestore (SHOP_01 & SHOP_02)');
console.log('================================================================\n');

async function seed() {
  try {
    // 1. Sign in or create authorized vendor account
    const vendorEmail = 'apnamart_catalog_vendor@apnamart.com';
    const vendorPass = 'ApnaMartSecure2026!';
    let vendorUid = null;

    try {
      console.log(`Authenticating as vendor "${vendorEmail}"...`);
      const cred = await signInWithEmailAndPassword(auth, vendorEmail, vendorPass);
      vendorUid = cred.user.uid;
      console.log(`✓ Signed in with UID: ${vendorUid}`);
    } catch (authErr) {
      if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
        console.log('Creating new vendor account for seeding...');
        const newCred = await createUserWithEmailAndPassword(auth, vendorEmail, vendorPass);
        vendorUid = newCred.user.uid;
        await setDoc(doc(db, 'users', vendorUid), {
          uid: vendorUid,
          email: vendorEmail,
          displayName: 'ApnaMart Catalog Master Vendor',
          role: 'vendor',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        console.log(`✓ Created vendor profile with UID: ${vendorUid}`);
      } else {
        throw authErr;
      }
    }

    // 2. Ensure both Shop 1 and Shop 2 exist in Firestore
    console.log('\n--- Ensuring Shops Exist in Firestore ---');
    const shop1Doc = {
      id: 'SHOP_01',
      vendorId: vendorUid,
      name: 'Apna Kirana (Shop 1)',
      category: 'Kirana / Grocery',
      address: 'Shop No. 4, Market Complex, Main Road (Sample Demo Address)',
      location: { lat: 28.6194, lng: 77.2132 },
      phone: '+91 98000 00001 (Demo Listing)',
      openingHours: '7:00 AM - 10:00 PM',
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
      status: 'active',
      isDemo: true,
      createdAt: 1700000000000,
      updatedAt: Date.now(),
    };

    const shop2Doc = {
      id: 'SHOP_02',
      vendorId: vendorUid,
      name: 'Apna Kirana (Shop 2)',
      category: 'Kirana / Grocery',
      address: 'Shop No. 12, Main Bazaar Road (Sample Demo Address)',
      location: { lat: 28.6071, lng: 77.2165 },
      phone: '+91 98000 00002 (Demo Listing)',
      openingHours: '6:30 AM - 9:30 PM',
      imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
      status: 'active',
      isDemo: true,
      createdAt: 1700000000000,
      updatedAt: Date.now(),
    };

    const shopBatch = writeBatch(db);
    shopBatch.set(doc(db, 'shops', 'SHOP_01'), shop1Doc, { merge: true });
    shopBatch.set(doc(db, 'shops', 'SHOP_02'), shop2Doc, { merge: true });
    await shopBatch.commit();
    console.log('✓ Successfully created/verified SHOP_01 and SHOP_02 in Firestore.');

    // 3. Upload products in chunks of 50
    console.log('\n--- Uploading 200 Products ---');
    const chunkSize = 50;
    for (let i = 0; i < ALL_DEMO_PRODUCTS.length; i += chunkSize) {
      const chunk = ALL_DEMO_PRODUCTS.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const p of chunk) {
        const payload = {
          ...p,
          vendorId: vendorUid,
        };
        const ref = doc(db, 'products', p.productId);
        batch.set(ref, payload, { merge: true });
      }
      await batch.commit();
      console.log(`✓ Committed batch products ${i + 1} to ${Math.min(i + chunkSize, ALL_DEMO_PRODUCTS.length)}`);
    }

    // 4. Verify Firestore counts
    console.log('\n--- Verifying Firestore Counts ---');
    const q1 = query(collection(db, 'products'), where('shopId', '==', 'SHOP_01'));
    const snap1 = await getDocs(q1);
    console.log(`Firestore SHOP_01 count: ${snap1.size} products`);

    const q2 = query(collection(db, 'products'), where('shopId', '==', 'SHOP_02'));
    const snap2 = await getDocs(q2);
    console.log(`Firestore SHOP_02 count: ${snap2.size} products`);

    const allSnap = await getDocs(collection(db, 'products'));
    console.log(`Firestore total products count: ${allSnap.size}`);

    if (snap1.size === 100 && snap2.size === 100) {
      console.log('\n🎉 SUCCESS: Exactly 100 products under SHOP_01 and 100 products under SHOP_02 verified in Firestore!');
      process.exit(0);
    } else {
      console.log(`\nFound SHOP_01: ${snap1.size}, SHOP_02: ${snap2.size}`);
      process.exit(0);
    }
  } catch (err) {
    console.error('\n❌ Firestore Error:', err);
    process.exit(1);
  }
}

seed();
