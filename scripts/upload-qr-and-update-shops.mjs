import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
const storage = getStorage(app);

const IMG_SHOP_01 = 'C:/Users/chord/.gemini/antigravity/brain/55af8271-b913-446d-b7c9-629ae17130f9/.user_uploaded/media_1795029117248_7da545b5.jpg';
const IMG_SHOP_02 = 'C:/Users/chord/.gemini/antigravity/brain/55af8271-b913-446d-b7c9-629ae17130f9/.user_uploaded/media_1795029136097_468892db.jpg';

async function main() {
  console.log('--- Signing in as vendor/admin ---');
  const cred = await signInWithEmailAndPassword(auth, 'apnamart_catalog_vendor@apnamart.com', 'ApnaMartSecure2026!');
  console.log('✓ Signed in as:', cred.user.email, cred.user.uid);

  // 1. Upload SHOP_01 QR
  console.log('Uploading SHOP_01 QR to Firebase Storage...');
  const buf1 = readFileSync(IMG_SHOP_01);
  const storageRef1 = ref(storage, 'payment-qr/SHOP_01/upi-qr.png');
  const snap1 = await uploadBytes(storageRef1, buf1, {
    contentType: 'image/png',
    customMetadata: {
      shopId: 'SHOP_01',
      bank: 'Central Bank of India - 2671',
      uploadedAt: new Date().toISOString(),
    },
  });
  const url1 = await getDownloadURL(snap1.ref);
  console.log('✓ SHOP_01 QR uploaded! URL:', url1);

  // 2. Upload SHOP_02 QR
  console.log('Uploading SHOP_02 QR to Firebase Storage...');
  const buf2 = readFileSync(IMG_SHOP_02);
  const storageRef2 = ref(storage, 'payment-qr/SHOP_02/upi-qr.png');
  const snap2 = await uploadBytes(storageRef2, buf2, {
    contentType: 'image/png',
    customMetadata: {
      shopId: 'SHOP_02',
      bank: 'State Bank of India - 4559',
      uploadedAt: new Date().toISOString(),
    },
  });
  const url2 = await getDownloadURL(snap2.ref);
  console.log('✓ SHOP_02 QR uploaded! URL:', url2);

  // 3. Update Firestore shops collection
  console.log('Updating Firestore shops collection...');
  const shop1DocRef = doc(db, 'shops', 'SHOP_01');
  const shop2DocRef = doc(db, 'shops', 'SHOP_02');

  const shop1Snap = await getDoc(shop1DocRef);
  const shop2Snap = await getDoc(shop2DocRef);

  const shop1Data = shop1Snap.exists() ? shop1Snap.data() : { id: 'SHOP_01', name: 'Apna Kirana & General Store' };
  const shop2Data = shop2Snap.exists() ? shop2Snap.data() : { id: 'SHOP_02', name: 'Shri Krishna Kirana & Provision Store' };

  await setDoc(shop1DocRef, {
    ...shop1Data,
    shopId: 'SHOP_01',
    paymentMethods: {
      upiEnabled: true,
      codEnabled: true,
      upiQrStoragePath: 'payment-qr/SHOP_01/upi-qr.png',
      upiQrUrl: url1,
      accountDetails: 'Central Bank of India - 2671',
      upiProvider: 'PhonePe',
    },
    updatedAt: Date.now(),
  }, { merge: true });
  console.log('✓ SHOP_01 document updated in Firestore with paymentMethods.');

  await setDoc(shop2DocRef, {
    ...shop2Data,
    shopId: 'SHOP_02',
    paymentMethods: {
      upiEnabled: true,
      codEnabled: true,
      upiQrStoragePath: 'payment-qr/SHOP_02/upi-qr.png',
      upiQrUrl: url2,
      accountDetails: 'State Bank of India - 4559',
      upiProvider: 'PhonePe',
    },
    updatedAt: Date.now(),
  }, { merge: true });
  console.log('✓ SHOP_02 document updated in Firestore with paymentMethods.');

  console.log('\n--- VERIFICATION ---');
  const check1 = (await getDoc(shop1DocRef)).data();
  const check2 = (await getDoc(shop2DocRef)).data();
  console.log('SHOP_01 paymentMethods:', JSON.stringify(check1.paymentMethods, null, 2));
  console.log('SHOP_02 paymentMethods:', JSON.stringify(check2.paymentMethods, null, 2));

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

