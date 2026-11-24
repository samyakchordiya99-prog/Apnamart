import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, getDocs, collection, query, where, setDoc } from 'firebase/firestore';

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

async function main() {
  const cred = await signInWithEmailAndPassword(auth, 'apnamart_catalog_vendor@apnamart.com', 'ApnaMartSecure2026!');
  const vendorUid = cred.user.uid;
  console.log('✓ Authenticated as vendor:', vendorUid);

  // 1. Ensure the 2 shops are stored in Firestore
  const shop1Data = {
    id: 'SHOP_01',
    name: 'Apna Kirana & General Store',
    category: 'Kirana & General Store',
    address: 'Shop No. 4, Ground Floor, Central Market, Near SBI Bank',
    phone: '+91 98765 43210',
    openingHours: '7:00 AM - 10:30 PM',
    rating: 4.8,
    totalReviews: 342,
    isDemo: true,
    isActive: true,
    vendorId: vendorUid,
    updatedAt: Date.now()
  };

  const shop2Data = {
    id: 'SHOP_02',
    name: 'Shri Krishna Kirana & Provision Store',
    category: 'Kirana & Provisions',
    address: 'Shop No. 12, Main Bazaar Road, Opposite City Hospital',
    phone: '+91 98123 45678',
    openingHours: '6:30 AM - 11:00 PM',
    rating: 4.7,
    totalReviews: 289,
    isDemo: true,
    isActive: true,
    vendorId: vendorUid,
    updatedAt: Date.now()
  };

  await setDoc(doc(db, 'shops', 'SHOP_01'), shop1Data, { merge: true });
  await setDoc(doc(db, 'shops', 'SHOP_02'), shop2Data, { merge: true });
  console.log('✓ Both shops (SHOP_01 & SHOP_02) saved to Firestore "shops" collection.');

  // 2. Query products from Firestore
  const snap1 = await getDocs(query(collection(db, 'products'), where('shopId', '==', 'SHOP_01')));
  const snap2 = await getDocs(query(collection(db, 'products'), where('shopId', '==', 'SHOP_02')));
  const allProds = await getDocs(collection(db, 'products'));

  console.log(`\n=== FIRESTORE DATABASE STATUS ===`);
  console.log(`Shops: 2 shops stored in Firestore`);
  console.log(`Products in SHOP_01: ${snap1.size}`);
  console.log(`Products in SHOP_02: ${snap2.size}`);
  console.log(`Total Products in Firestore: ${allProds.size}`);

  // Sample check on image URLs from Firestore
  let unsplashCount = 0;
  let packshotCount = 0;
  allProds.forEach(d => {
    const data = d.data();
    if (data.imageUrl && data.imageUrl.includes('unsplash.com')) {
      unsplashCount++;
    } else {
      packshotCount++;
    }
  });

  console.log(`\nImage Verification directly from Firestore:`);
  console.log(`✓ Products with Real Packshots: ${packshotCount}`);
  console.log(`✓ Products with Unsplash: ${unsplashCount}`);

  // Print 5 random products from Firestore to show the actual data
  console.log('\nSample Products currently live in Firebase Firestore:');
  const sampleDocs = allProds.docs.slice(0, 5);
  for (const docSnap of sampleDocs) {
    const p = docSnap.data();
    console.log(`- [${p.productId}] ${p.productName} | ₹${p.sellingPrice} (MRP ₹${p.mrp}, ${p.discountPercent}% OFF) | Img: ${p.imageUrl.slice(0, 65)}...`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

