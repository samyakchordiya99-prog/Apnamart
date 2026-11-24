import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { auth, getUserProfile, updateUserLocation, claimAdminPrivilege, getDemoUserProfile, isFirebaseConfigured } from '../services/auth';
import type { UserProfile, LocationData, Role } from '../types';

interface AuthContextValue {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  deliveryLocation: LocationData | null;
  saveDeliveryLocation: (location: Omit<LocationData, 'updatedAt'>) => Promise<LocationData>;
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (open: boolean) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginAsDemo: (role: Role) => void;
  loginWithProfile: (customProfile: UserProfile) => void;
  claimAdminAccess: (secretKey: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  deliveryLocation: null,
  saveDeliveryLocation: async () => ({} as LocationData),
  isLocationModalOpen: false,
  setIsLocationModalOpen: () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
  loginAsDemo: () => {},
  loginWithProfile: () => {},
  claimAdminAccess: async () => {},
});

const DEMO_STORAGE_KEY = 'apnabazaar_demo_user';

export function AuthProvider({ children }: { children: any }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem(DEMO_STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Initialize deliveryLocation from local cache
  const [deliveryLocation, setDeliveryLocationState] = useState<LocationData | null>(() => {
    try {
      const cached = localStorage.getItem('apnabazaar_delivery_location');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }
    return null;
  });

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      // If running without Firebase or in demo mode, check stored demo user
      try {
        const storedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
        if (storedDemo) {
          const p = JSON.parse(storedDemo) as UserProfile;
          setProfile(p);
          setUser({ uid: p.uid, email: p.email, displayName: p.displayName });
          if (p.location) setDeliveryLocationState(p.location);
        }
      } catch {
        // ignore
      }
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const p = await getUserProfile(u.uid);
        setProfile(p);
        if (p?.location) {
          setDeliveryLocationState(p.location);
          try {
            localStorage.setItem('apnabazaar_delivery_location', JSON.stringify(p.location));
          } catch {}
        }
      } else {
        // Fall back to demo user if present
        try {
          const storedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
          if (storedDemo) {
            const p = JSON.parse(storedDemo);
            setProfile(p);
            setUser({ uid: p.uid, email: p.email, displayName: p.displayName });
          } else {
            setProfile(null);
          }
        } catch {
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    if (isFirebaseConfigured && auth && user.uid && !user.uid.startsWith('demo-')) {
      const p = await getUserProfile(user.uid);
      setProfile(p);
      if (p?.location) {
        setDeliveryLocationState(p.location);
      }
    }
  };

  const loginAsDemo = (role: Role) => {
    const demoProfile = getDemoUserProfile(role);
    setProfile(demoProfile);
    setUser({
      uid: demoProfile.uid,
      email: demoProfile.email,
      displayName: demoProfile.displayName,
    });
    if (demoProfile.location) {
      setDeliveryLocationState(demoProfile.location);
      try {
        localStorage.setItem('apnabazaar_delivery_location', JSON.stringify(demoProfile.location));
      } catch {}
    }
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoProfile));
    } catch {}
  };

  const loginWithProfile = (customProfile: UserProfile) => {
    setProfile(customProfile);
    setUser({
      uid: customProfile.uid,
      email: customProfile.email,
      displayName: customProfile.displayName,
    });
    if (customProfile.location) {
      setDeliveryLocationState(customProfile.location);
      try {
        localStorage.setItem('apnabazaar_delivery_location', JSON.stringify(customProfile.location));
      } catch {}
    }
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(customProfile));
    } catch {}
  };

  const claimAdminAccess = async (secretKey: string) => {
    if (!user) throw new Error('You must be signed in to claim admin permissions.');
    await claimAdminPrivilege(user.uid, secretKey);
    const updated: UserProfile = profile
      ? { ...profile, role: 'admin' }
      : {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Admin',
          role: 'admin',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
    setProfile(updated);
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const saveDeliveryLocation = async (loc: Omit<LocationData, 'updatedAt'>) => {
    const uid = user ? user.uid : 'guest_or_demo';
    const saved = await updateUserLocation(uid, loc);
    setDeliveryLocationState(saved);
    if (user) {
      await refreshProfile();
    }
    return saved;
  };

  const signOut = async () => {
    try {
      localStorage.removeItem(DEMO_STORAGE_KEY);
    } catch {}
    setUser(null);
    setProfile(null);
    if (auth && isFirebaseConfigured) {
      await fbSignOut(auth);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        deliveryLocation,
        saveDeliveryLocation,
        isLocationModalOpen,
        setIsLocationModalOpen,
        signOut,
        refreshProfile,
        loginAsDemo,
        loginWithProfile,
        claimAdminAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
