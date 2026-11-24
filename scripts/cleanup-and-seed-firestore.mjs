import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, writeBatch, getDocs, collection, query, where, deleteDoc } from 'firebase/firestore';

let envFile = '';
try { envFile = readFileSync('.env.local', 'utf8'); } catch { envFile = readFileSync('.env', 'utf8'); }
const env = {};
for (const line of envFile.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const idx = t.indexOf('=');
  if (idx !== -1) env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
}

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});

const auth = getAuth(app);
const db = getFirestore(app);

const { ALL_DEMO_PRODUCTS } = await import('../src/data/productData.ts');

async function main() {
  const cred = await signInWithEmailAndPassword(auth, 'apnamart_catalog_vendor@apnamart.com', 'ApnaMartSecure2026!');
  const vendorUid = cred.user.uid;
  console.log('✓ Signed in as vendor:', vendorUid);

  // 1. Find all obsolete documents in Firestore not in current ALL_DEMO_PRODUCTS
  const allProdsSnap = await getDocs(collection(db, 'products'));
  const currentIds = new Set(ALL_DEMO_PRODUCTS.map(p => p.productId));
  const toDelete = [];
  allProdsSnap.forEach(d => {
    if (!currentIds.has(d.id)) {
      toDelete.push(d.ref);
    }
  });

  console.log(`Found ${toDelete.length} old product documents to clean up...`);
  for (let i = 0; i < toDelete.length; i += 50) {
    const chunk = toDelete.slice(i, i + 50);
    const batch = writeBatch(db);
    chunk.forEach(ref => batch.delete(ref));
    await batch.commit();
  }
  console.log('✓ Cleaned up old product documents.');

  // 2. Ensure all current 243 products are present
  console.log(`Ensuring all ${ALL_DEMO_PRODUCTS.length} products are synced...`);
  for (let i = 0; i < ALL_DEMO_PRODUCTS.length; i += 50) {
    const chunk = ALL_DEMO_PRODUCTS.slice(i, i + 50);
    const batch = writeBatch(db);
    chunk.forEach(p => {
      const ref = doc(db, 'products', p.productId);
      batch.set(ref, { ...p, vendorId: vendorUid }, { merge: true });
    });
    await batch.commit();
  }
  console.log('✓ Finished product sync.');

  // 3. Count products per shop
  const snap1 = await getDocs(query(collection(db, 'products'), where('shopId', '==', 'SHOP_01')));
  const snap2 = await getDocs(query(collection(db, 'products'), where('shopId', '==', 'SHOP_02')));
  const allSnap = await getDocs(collection(db, 'products'));

  console.log(`\nFinal Firestore Counts:`);
  console.log(`SHOP_01: ${snap1.size} products`);
  console.log(`SHOP_02: ${snap2.size} products`);
  console.log(`Total Products: ${allSnap.size} products`);

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

