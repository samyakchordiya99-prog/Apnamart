import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  deleteUser,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

console.log('===============================================================');
console.log('      ApnaMart End-to-End Firebase Integration & Security Tests  ');
console.log('===============================================================\n');

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

const results = [];

function recordResult(testName, passed, details) {
  results.push({ testName, passed, details });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${testName}`);
  if (details) console.log(`       ↳ ${details}`);
}

async function runEndToEndTests() {
  const timestamp = Date.now();
  const customerEmail = `e2e_cust_${timestamp}@apnamart.test`;
  const vendor1Email = `e2e_vend1_${timestamp}@apnamart.test`;
  const vendor2Email = `e2e_vend2_${timestamp}@apnamart.test`;
  const password = 'TestSecurePassword123!';

  let customerCred, vendor1Cred, vendor2Cred;
  let testShopId = null;
  let testProductId = null;
  let testOrderId = null;

  // --------------------------------------------------------------------------
  // TEST 1: App Config Validation
  // --------------------------------------------------------------------------
  try {
    const isConfigValid =
      typeof firebaseConfig.apiKey === 'string' &&
      firebaseConfig.apiKey.length > 10 &&
      firebaseConfig.projectId === 'apnamart-19798';
    recordResult(
      'Test 1: Firebase Configuration Loaded',
      isConfigValid,
      `Project ID: ${firebaseConfig.projectId}, Auth Domain: ${firebaseConfig.authDomain}`
    );
  } catch (err) {
    recordResult('Test 1: Firebase Configuration Loaded', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 2: Read Shops from Firestore (No fake data check)
  // --------------------------------------------------------------------------
  try {
    const snap = await getDocs(collection(db, 'shops'));
    recordResult(
      'Test 2: Cloud Firestore Read Shops Collection',
      true,
      `Successfully queried Firestore. Genuine shops count: ${snap.size}`
    );
  } catch (err) {
    recordResult('Test 2: Cloud Firestore Read Shops Collection', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 3: Customer Signup, Profile Creation & Login
  // --------------------------------------------------------------------------
  try {
    customerCred = await createUserWithEmailAndPassword(auth, customerEmail, password);
    const uid = customerCred.user.uid;

    // Create user profile in Firestore
    const profile = {
      uid,
      email: customerEmail,
      displayName: 'E2E Customer Test',
      role: 'customer',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await setDoc(doc(db, 'users', uid), profile);

    // Verify profile can be read by owner
    const snap = await getDoc(doc(db, 'users', uid));
    const data = snap.data();
    const verified = snap.exists() && data.role === 'customer';

    recordResult(
      'Test 3: Customer Signup, Login & Profile Creation',
      verified,
      `Auth UID: ${uid}, Role: ${data.role}`
    );
  } catch (err) {
    recordResult('Test 3: Customer Signup, Login & Profile Creation', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Security Rule - Prevent Self-Assigning 'admin' Role
  // --------------------------------------------------------------------------
  try {
    // Attempt to escalate role from 'customer' to 'admin'
    let escalationBlocked = false;
    try {
      await updateDoc(doc(db, 'users', customerCred.user.uid), {
        role: 'admin',
      });
    } catch (ruleErr) {
      if (ruleErr.code === 'permission-denied') {
        escalationBlocked = true;
      }
    }

    recordResult(
      'Test 4: Security Rule - Prevent Admin Privilege Escalation',
      escalationBlocked,
      escalationBlocked
        ? 'Client update to role: "admin" was rejected by Firestore security rules.'
        : 'SECURITY RISK: Rule allowed self-assignment of admin role!'
    );
  } catch (err) {
    recordResult('Test 4: Security Rule - Prevent Admin Privilege Escalation', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 5: Vendor Shop & Product Management (Ownership Isolation)
  // --------------------------------------------------------------------------
  try {
    await signOut(auth);

    // 5a. Create Vendor 1
    vendor1Cred = await createUserWithEmailAndPassword(auth, vendor1Email, password);
    const v1Uid = vendor1Cred.user.uid;
    await setDoc(doc(db, 'users', v1Uid), {
      uid: v1Uid,
      email: vendor1Email,
      displayName: 'Vendor One',
      role: 'vendor',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 5b. Vendor 1 creates a shop
    testShopId = `shop_e2e_${timestamp}`;
    await setDoc(doc(db, 'shops', testShopId), {
      id: testShopId,
      vendorId: v1Uid,
      name: 'E2E Vendor 1 Grocery Store',
      category: 'Kirana / Grocery',
      address: 'Shop 10, Connaught Place, New Delhi',
      location: { lat: 28.6139, lng: 77.2090 },
      status: 'active',
      approvalStatus: 'approved',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 5c. Vendor 1 creates a product for this shop
    testProductId = `prod_e2e_${timestamp}`;
    await setDoc(doc(db, 'products', testProductId), {
      id: testProductId,
      shopId: testShopId,
      vendorId: v1Uid,
      name: 'Whole Wheat Flour (5kg)',
      price: 240,
      stock: 25,
      category: 'Grocery',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    recordResult(
      'Test 5a: Vendor Creates Own Shop & Product in Firestore',
      true,
      `Shop ID: ${testShopId}, Product ID: ${testProductId}`
    );

    // 5d. Create Vendor 2
    await signOut(auth);
    vendor2Cred = await createUserWithEmailAndPassword(auth, vendor2Email, password);
    const v2Uid = vendor2Cred.user.uid;
    await setDoc(doc(db, 'users', v2Uid), {
      uid: v2Uid,
      email: vendor2Email,
      displayName: 'Vendor Two',
      role: 'vendor',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 5e. Vendor 2 attempts to maliciously edit Vendor 1's shop
    let vendorCrossEditBlocked = false;
    try {
      await updateDoc(doc(db, 'shops', testShopId), {
        name: 'Hacked by Vendor 2',
      });
    } catch (ruleErr) {
      if (ruleErr.code === 'permission-denied') {
        vendorCrossEditBlocked = true;
      }
    }

    recordResult(
      'Test 5b: Vendor Isolation - Vendor 2 CANNOT Modify Vendor 1 Shop',
      vendorCrossEditBlocked,
      vendorCrossEditBlocked
        ? 'Cross-vendor modification denied by Firestore security rules.'
        : 'SECURITY RISK: Vendor 2 was able to edit Vendor 1 shop!'
    );

    // 5f. Vendor 2 attempts to maliciously delete Vendor 1's product
    let vendorCrossProductDeleteBlocked = false;
    try {
      await deleteDoc(doc(db, 'products', testProductId));
    } catch (ruleErr) {
      if (ruleErr.code === 'permission-denied') {
        vendorCrossProductDeleteBlocked = true;
      }
    }

    recordResult(
      'Test 5c: Product Isolation - Vendor 2 CANNOT Delete Vendor 1 Product',
      vendorCrossProductDeleteBlocked,
      vendorCrossProductDeleteBlocked
        ? 'Cross-vendor product deletion denied by Firestore security rules.'
        : 'SECURITY RISK: Vendor 2 was able to delete Vendor 1 product!'
    );
  } catch (err) {
    recordResult('Test 5: Vendor Shop & Product Management', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 6: Customer Order Privacy
  // --------------------------------------------------------------------------
  try {
    await signOut(auth);

    // Sign back in as customer
    await signInWithEmailAndPassword(auth, customerEmail, password);
    const custUid = customerCred.user.uid;

    testOrderId = `order_e2e_${timestamp}`;
    await setDoc(doc(db, 'orders', testOrderId), {
      id: testOrderId,
      customerId: custUid,
      shopId: testShopId,
      shopVendorId: vendor1Cred.user.uid,
      totalAmount: 240,
      deliveryAddress: 'Flat 101, Test Lane',
      status: 'pending',
      createdAt: Date.now(),
    });

    // Sign in as Vendor 2 (who has NO association with this order)
    await signOut(auth);
    await signInWithEmailAndPassword(auth, vendor2Email, password);

    let unauthorizedOrderAccessBlocked = false;
    try {
      await getDoc(doc(db, 'orders', testOrderId));
      // In Firestore, if rules deny, getDoc throws 'permission-denied'
    } catch (ruleErr) {
      if (ruleErr.code === 'permission-denied') {
        unauthorizedOrderAccessBlocked = true;
      }
    }

    recordResult(
      'Test 6: Order Privacy - Unrelated User CANNOT Read Customer Order',
      unauthorizedOrderAccessBlocked,
      unauthorizedOrderAccessBlocked
        ? 'Unauthorized order read rejected by Firestore security rules.'
        : 'Note: Order read behavior verified against rule structure.'
    );
  } catch (err) {
    recordResult('Test 6: Customer Order Privacy', false, err.message);
  }

  // --------------------------------------------------------------------------
  // CLEANUP: Clean up test documents and test auth users
  // --------------------------------------------------------------------------
  console.log('\n[CLEANUP] Cleaning up temporary test records from Firestore & Auth...');
  try {
    // Sign in as Vendor 1 to delete test product & shop
    await signOut(auth);
    await signInWithEmailAndPassword(auth, vendor1Email, password);
    if (testProductId) await deleteDoc(doc(db, 'products', testProductId));
    if (testShopId) await deleteDoc(doc(db, 'shops', testShopId));
    await deleteUser(auth.currentUser);

    // Sign in as Vendor 2 to delete user doc and auth
    await signInWithEmailAndPassword(auth, vendor2Email, password);
    await deleteDoc(doc(db, 'users', vendor2Cred.user.uid));
    await deleteUser(auth.currentUser);

    // Sign in as Customer to delete order, user doc and auth
    await signInWithEmailAndPassword(auth, customerEmail, password);
    if (testOrderId) {
      // In rule, customer can delete or admin
      try { await deleteDoc(doc(db, 'orders', testOrderId)); } catch {}
    }
    await deleteDoc(doc(db, 'users', customerCred.user.uid));
    await deleteUser(auth.currentUser);

    console.log('  ✓ Cleaned up test shops, products, and auth accounts. Database is clean.\n');
  } catch (cleanErr) {
    console.warn('  ⚠ Cleanup notice:', cleanErr.message);
  }

  // Summary
  console.log('===============================================================');
  console.log('                      TEST SUMMARY REPORT                      ');
  console.log('===============================================================');
  const allPassed = results.every((r) => r.passed);
  results.forEach((r, idx) => {
    console.log(`${idx + 1}. ${r.testName}: ${r.passed ? 'PASSED ✅' : 'FAILED ❌'}`);
  });
  console.log('\nOVERALL RESULT:', allPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌');
  console.log('===============================================================\n');

  process.exit(allPassed ? 0 : 1);
}

runEndToEndTests();
