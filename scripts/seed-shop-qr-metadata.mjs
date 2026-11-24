import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

let envFile = '';
try { envFile = readFileSync('.env.local', 'utf8'); } catch { envFile = readFileSync('.env', 'utf8'); }
const env = {};
for (const line of envFile.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const idx = t.indexOf('=');
  if (idx !== -1) env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
}

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

async function main() {
  console.log('--- Signing in as vendor ---');
  await signInWithEmailAndPassword(auth, 'apnamart_catalog_vendor@apnamart.com', 'ApnaMartSecure2026!');
  console.log('✓ Signed in.');

  const shop1Ref = doc(db, 'shops', 'SHOP_01');
  const shop2Ref = doc(db, 'shops', 'SHOP_02');

  const s1 = await getDoc(shop1Ref);
  const s2 = await getDoc(shop2Ref);

  await setDoc(shop1Ref, {
    ...(s1.exists() ? s1.data() : {}),
    id: 'SHOP_01',
    shopId: 'SHOP_01',
    name: 'Apna Kirana & General Store',
    paymentMethods: {
      upiEnabled: true,
      codEnabled: true,
      upiQrStoragePath: 'payment-qr/SHOP_01/upi-qr.png',
      upiQrUrl: '/payment-qr/SHOP_01/upi-qr.png',
      accountDetails: 'Central Bank of India - 2671',
      upiProvider: 'PhonePe',
      merchantName: 'Apna Kirana & General Store',
    },
    updatedAt: Date.now(),
  }, { merge: true });
  console.log('✓ Set paymentMethods on shops/SHOP_01');

  await setDoc(shop2Ref, {
    ...(s2.exists() ? s2.data() : {}),
    id: 'SHOP_02',
    shopId: 'SHOP_02',
    name: 'Shri Krishna Kirana & Provision Store',
    paymentMethods: {
      upiEnabled: true,
      codEnabled: true,
      upiQrStoragePath: 'payment-qr/SHOP_02/upi-qr.png',
      upiQrUrl: '/payment-qr/SHOP_02/upi-qr.png',
      accountDetails: 'State Bank of India - 4559',
      upiProvider: 'PhonePe',
      merchantName: 'Shri Krishna Kirana & Provision Store',
    },
    updatedAt: Date.now(),
  }, { merge: true });
  console.log('✓ Set paymentMethods on shops/SHOP_02');

  const v1 = (await getDoc(shop1Ref)).data();
  const v2 = (await getDoc(shop2Ref)).data();
  console.log('SHOP_01 in Firestore:', JSON.stringify(v1.paymentMethods, null, 2));
  console.log('SHOP_02 in Firestore:', JSON.stringify(v2.paymentMethods, null, 2));

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

