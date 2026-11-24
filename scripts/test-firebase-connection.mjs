import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

console.log('====================================================');
console.log('     ApnaMart Firebase Diagnostics & Verification    ');
console.log('====================================================\n');

// 1. Read environment variables
let envFile = '';
try {
  envFile = readFileSync('.env.local', 'utf8');
} catch {
  try {
    envFile = readFileSync('.env', 'utf8');
  } catch (e) {
    console.error('❌ Neither .env.local nor .env could be read:', e.message);
    process.exit(1);
  }
}

function parseEnv(content) {
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

const env = parseEnv(envFile);

console.log('[1/4] Environment Configuration:');
console.log('  • Project ID      :', env.VITE_FIREBASE_PROJECT_ID || '(missing)');
console.log('  • Auth Domain     :', env.VITE_FIREBASE_AUTH_DOMAIN || '(missing)');
console.log('  • Storage Bucket  :', env.VITE_FIREBASE_STORAGE_BUCKET || '(missing)');
console.log('  • API Key         :', env.VITE_FIREBASE_API_KEY ? 'Present (' + env.VITE_FIREBASE_API_KEY.slice(0, 10) + '...)' : '(missing)');
console.log('  • App ID          :', env.VITE_FIREBASE_APP_ID ? 'Present (' + env.VITE_FIREBASE_APP_ID.slice(0, 14) + '...)' : '(missing)');

if (!env.VITE_FIREBASE_API_KEY || !env.VITE_FIREBASE_PROJECT_ID) {
  console.error('\n❌ Missing required Firebase config keys in .env / .env.local');
  process.exit(1);
}

// 2. Initialize Firebase Web SDK
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('\n[2/4] Firebase Web SDK:');
  console.log('  ✓ Initialized client SDK successfully without errors.');
} catch (err) {
  console.error('\n❌ Firebase SDK initialization failed:', err.message);
  process.exit(1);
}

// 3. Probe Firebase Authentication Endpoint (Google Identity Toolkit)
console.log('\n[3/4] Testing Firebase Authentication Endpoint:');
const testEmail = process.argv[2];
const testPassword = process.argv[3];

async function runDiagnostics() {
  try {
    if (testEmail && testPassword) {
      console.log(`  • Attempting authenticated sign-in as "${testEmail}"...`);
      await signInWithEmailAndPassword(auth, testEmail, testPassword);
      console.log('  ✓ Authentication SUCCESS: Signed in as user:', auth.currentUser.uid);
    } else {
      // Diagnostic auth probe: verify API key + project registration against Google Identity Toolkit
      try {
        await signInWithEmailAndPassword(auth, 'diagnostic-probe@apnamart.invalid', 'ProbeCheck123!');
      } catch (authErr) {
        if (
          authErr.code === 'auth/invalid-credential' ||
          authErr.code === 'auth/user-not-found' ||
          authErr.code === 'auth/wrong-password'
        ) {
          console.log(`  ✓ Auth Service REACHABLE & ACTIVE: Google Identity Toolkit acknowledged request (${authErr.code}).`);
        } else if (authErr.code === 'auth/api-key-not-valid') {
          console.error(`  ❌ Invalid API Key: ${authErr.message}`);
          process.exit(1);
        } else {
          console.log(`  ℹ Auth Service responded with: ${authErr.code}`);
        }
      }
    }
  } catch (e) {
    console.warn('  ⚠ Auth probe warning:', e.message);
  }

  // 4. Test Cloud Firestore Connectivity
  console.log('\n[4/4] Testing Cloud Firestore ("shops" collection):');
  const isAuth = auth.currentUser !== null;
  console.log(`  • Client Auth State: ${isAuth ? `Authenticated (UID: ${auth.currentUser.uid})` : 'Unauthenticated (Guest)'}`);

  try {
    const snap = await getDocs(collection(db, 'shops'));
    console.log(`  ✓ Cloud Firestore Connection: SUCCESS`);
    console.log(`  ✓ Read access confirmed. Existing genuine shops count: ${snap.size}`);
    console.log('\n====================================================');
    console.log('🎉 Verification Status: FIREBASE CONNECTION VERIFIED');
    console.log('====================================================');
    process.exit(0);
  } catch (fsErr) {
    console.log(`  • Response received: ${fsErr.message} (code: ${fsErr.code || 'unknown'})`);

    if (fsErr.code === 'permission-denied') {
      console.log('\n----------------------------------------------------');
      console.log('🔍 ANALYSIS OF PERMISSION DENIAL:');
      console.log('----------------------------------------------------');
      console.log('1. Physical network connection to Cloud Firestore: REACHABLE & WORKING.');
      console.log('2. The request was evaluated and blocked by your Firebase Security Rules.');
      console.log('3. Reason: The script made an unauthenticated query (guest).');
      console.log('   In Firebase Console, default rules reject all unauthenticated requests:');
      console.log('     "allow read, write: if false;"');
      console.log('4. ACTION REQUIRED TO RESOLVE:');
      console.log('   Open Firebase Console -> Firestore Database -> Rules tab.');
      console.log('   Paste the content of "firestore.rules" from this project and click "Publish".');
      console.log('   "firestore.rules" enables public read for shops/products so customers');
      console.log('   can discover nearby shops, while keeping user data and write permissions strictly secured.');
      console.log('----------------------------------------------------');
      process.exit(0); // Informative diagnostic complete
    } else {
      console.error('❌ Unexpected Firestore network error:', fsErr.message);
      process.exit(1);
    }
  }
}

runDiagnostics();
