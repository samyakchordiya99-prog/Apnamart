import { auth, db, isFirebaseConfigured } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import type { Role, UserProfile, LocationData } from '../types';

export { auth, db, isFirebaseConfigured };

const DEMO_USERS_MAP: Record<Role, UserProfile> = {
  customer: {
    uid: 'demo-customer-1',
    email: 'customer@apnabazaar.com',
    displayName: 'Priya Sharma (Customer)',
    role: 'customer',
    phone: '+91 98765 11223',
    location: {
      lat: 28.6139,
      lng: 77.2090,
      address: 'Connaught Place, New Delhi',
      flat: 'Flat 402, Metro View',
      landmark: 'Near Shivaji Stadium Metro Station',
      accuracy: 20,
      isApproximate: false,
      updatedAt: Date.now(),
    },
    createdAt: Date.now() - 604800000,
    updatedAt: Date.now(),
  },
  vendor: {
    uid: 'demo-vendor-1',
    email: 'vendor@apnabazaar.com',
    displayName: 'Ramesh Sharma (Vendor)',
    role: 'vendor',
    phone: '+91 98765 43210',
    createdAt: Date.now() - 604800000,
    updatedAt: Date.now(),
  },
  admin: {
    uid: 'demo-admin-1',
    email: 'admin@apnabazaar.com',
    displayName: 'Master Administrator',
    role: 'admin',
    phone: '+91 99999 00000',
    createdAt: Date.now() - 604800000,
    updatedAt: Date.now(),
  },
};

export function getDemoUserProfile(role: Role): UserProfile {
  return DEMO_USERS_MAP[role];
}

export function formatAuthError(err: any): string {
  if (!err) return 'An unexpected error occurred.';
  const code = err?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'The email address is invalid. Please check and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account exists with this email address.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Please log in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed before completing.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/operation-not-allowed':
      return 'Phone sign-in is not enabled in Firebase Authentication. Please enable Phone provider in Firebase Console > Authentication > Sign-in method.';
    case 'auth/invalid-phone-number':
      return 'The phone number is not valid. Please enter a valid 10-digit number with country code (e.g. +91 98765 43210).';
    case 'auth/missing-phone-number':
      return 'Please enter your mobile phone number.';
    case 'auth/quota-exceeded':
      return 'SMS quota exceeded for this Firebase project. You can add test phone numbers in Firebase Console > Authentication for testing.';
    case 'auth/invalid-verification-code':
      return 'Invalid OTP code. Please check the 6-digit code and try again.';
    case 'auth/code-expired':
      return 'The OTP has expired. Please click Resend OTP to request a new code.';
    case 'auth/captcha-check-failed':
      return 'reCAPTCHA verification failed. Please try again or refresh the page.';
    case 'auth/app-not-authorized':
      return 'This domain is not authorized for Firebase Authentication. Please add localhost/domain to Authorized Domains in Firebase Console.';
    case 'auth/billing-not-enabled':
      return 'Firebase Phone Authentication requires SMS quota setup or test phone numbers configured in Firebase Console.';
    default:
      return err?.message?.replace(/^Firebase:\s*/, '') || 'Authentication failed. Please try again.';
  }
}

export function ensureFirebase() {
  if (!auth || !db) {
    throw new Error('Firebase is not configured. Add your keys to .env.local (see .env.example).');
  }
  return { auth, db };
}

// User signup allows only 'customer' or 'vendor'
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
  role: 'customer' | 'vendor'
) {
  if (role !== 'customer' && role !== 'vendor') {
    throw new Error('Public registration only permits Customer or Vendor account creation.');
  }

  const { auth, db } = ensureFirebase();
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    const now = Date.now();
    const profile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: displayName || cred.user.email || '',
      role,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, 'users', cred.user.uid), profile);
    return { user: cred.user, profile };
  } catch (err: any) {
    throw new Error(formatAuthError(err));
  }
}

export async function signInWithEmail(email: string, password: string) {
  const { auth, db } = ensureFirebase();
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    const profile = snap.exists() ? (snap.data() as UserProfile) : null;
    if (!profile) {
      const now = Date.now();
      const p: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || cred.user.email || '',
        role: 'customer',
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(doc(db, 'users', cred.user.uid), p);
      return { user: cred.user, profile: p };
    }
    return { user: cred.user, profile };
  } catch (err: any) {
    throw new Error(formatAuthError(err));
  }
}

export async function signInWithGoogle() {
  const { auth, db } = ensureFirebase();
  try {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    let profile: UserProfile;
    if (snap.exists()) {
      profile = snap.data() as UserProfile;
    } else {
      const now = Date.now();
      profile = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || cred.user.email || '',
        role: 'customer',
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(doc(db, 'users', cred.user.uid), profile);
    }
    return { user: cred.user, profile };
  } catch (err: any) {
    throw new Error(formatAuthError(err));
  }
}

export async function sendReset(email: string) {
  const { auth } = ensureFirebase();
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (err: any) {
    throw new Error(formatAuthError(err));
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const { db } = ensureFirebase();
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch (err) {
    console.error('Failed to get user profile', err);
    return null;
  }
}

// Function to securely claim admin access using the project secret key
export async function claimAdminPrivilege(uid: string, secretKey: string): Promise<boolean> {
  const expectedSecret = (import.meta.env.VITE_ADMIN_SECRET as string) || 'apnabazaar-admin-key-2025';
  if (secretKey.trim() !== expectedSecret) {
    throw new Error('Invalid Admin Secret Key. Authorization denied.');
  }

  if (isFirebaseConfigured && db && uid) {
    await setDoc(doc(db, 'users', uid), { role: 'admin', updatedAt: Date.now() }, { merge: true });
    return true;
  }
  return true;
}

export async function updateUserLocation(
  uid: string,
  location: {
    lat: number;
    lng: number;
    address: string;
    flat?: string;
    landmark?: string;
    accuracy?: number;
    timestamp?: number;
    isApproximate?: boolean;
  }
): Promise<LocationData> {
  const payload: LocationData = {
    lat: location.lat,
    lng: location.lng,
    address: location.address,
    flat: location.flat || '',
    landmark: location.landmark || '',
    ...(typeof location.accuracy === 'number' ? { accuracy: location.accuracy } : {}),
    isApproximate: location.isApproximate ?? false,
    timestamp: location.timestamp ?? Date.now(),
    updatedAt: Date.now(),
  };

  try {
    localStorage.setItem('apnabazaar_delivery_location', JSON.stringify(payload));
  } catch (err) {
    console.warn('Could not cache delivery location to localStorage:', err);
  }

  if (isFirebaseConfigured && auth && db && uid) {
    try {
      await setDoc(doc(db, 'users', uid), { location: payload, updatedAt: Date.now() }, { merge: true });
    } catch (err) {
      console.warn('Firebase updateUserLocation warning:', err);
    }
  }

  return payload;
}

// ----------------- PHONE NUMBER AUTHENTICATION (OTP) -----------------

export function formatPhoneNumber(input: string): string {
  const cleaned = input.trim().replace(/[\s-]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  if (cleaned.startsWith('0')) {
    return `+91${cleaned.slice(1)}`;
  }
  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  return cleaned;
}

export function setupRecaptcha(
  containerId: string,
  size: 'invisible' | 'normal' = 'invisible'
): RecaptchaVerifier {
  const { auth } = ensureFirebase();
  // Clear any existing instance on window if present
  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch {}
  }
  const verifier = new RecaptchaVerifier(auth, containerId, {
    size,
    callback: () => {
      console.log('[Recaptcha] reCAPTCHA challenge resolved successfully.');
    },
    'expired-callback': () => {
      console.warn('[Recaptcha] reCAPTCHA challenge expired, please retry.');
    },
  });
  (window as any).recaptchaVerifier = verifier;
  return verifier;
}

export async function sendPhoneOtp(
  phoneNumber: string,
  appVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  const { auth } = ensureFirebase();
  const formatted = formatPhoneNumber(phoneNumber);
  if (!formatted || formatted.length < 10) {
    throw new Error('Please enter a valid mobile number (e.g. +91 98765 43210).');
  }
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, formatted, appVerifier);
    return confirmationResult;
  } catch (err: any) {
    throw new Error(formatAuthError(err));
  }
}

export async function verifyPhoneOtp(
  confirmationResult: ConfirmationResult,
  otpCode: string
): Promise<{ user: any; profile: UserProfile }> {
  const { db } = ensureFirebase();
  const cleanOtp = otpCode.trim();
  if (!cleanOtp || cleanOtp.length < 6) {
    throw new Error('Please enter the 6-digit OTP code received on your phone.');
  }

  try {
    const cred = await confirmationResult.confirm(cleanOtp);
    const user = cred.user;
    const snap = await getDoc(doc(db, 'users', user.uid));
    let profile: UserProfile;

    if (snap.exists()) {
      profile = snap.data() as UserProfile;
    } else {
      const now = Date.now();
      profile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.phoneNumber || 'Customer',
        phone: user.phoneNumber || undefined,
        role: 'customer',
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(doc(db, 'users', user.uid), profile);
    }

    return { user, profile };
  } catch (err: any) {
    throw new Error(formatAuthError(err));
  }
}
