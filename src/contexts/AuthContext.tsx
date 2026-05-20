import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  quotaExceeded: boolean;
  triggerQuotaExceeded: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const triggerQuotaExceeded = () => {
    setQuotaExceeded(true);
  };

  const checkQuotaError = (err: any) => {
    const errMsg = err?.message || String(err);
    if (
      errMsg.toLowerCase().includes('quota') || 
      errMsg.toLowerCase().includes('exhausted') || 
      errMsg.toLowerCase().includes('limit exceeded') ||
      errMsg.toLowerCase().includes('resource-exhausted')
    ) {
      setQuotaExceeded(true);
    }
  };

  const fetchProfile = async (uid: string) => {
    const docRef = doc(db, 'users', uid);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Save to cache for offline/quota recovery
        try {
          localStorage.setItem(`profile_cache_${uid}`, JSON.stringify(data));
        } catch (e) {
          console.error('Error caching profile to localStorage:', e);
        }

        // Auto-promote emerson_sz / emerson_souza and josemarpires.kx@gmail.com to Admin and VIP
        const isEmerson = data.username === 'emerson_sz' || data.username === 'emerson_souza' || data.email === 'emersonsouza609e@gmail.com' || user?.email === 'emersonsouza609e@gmail.com';
        const isJosemar = data.email === 'josemarpires.kx@gmail.com' || user?.email === 'josemarpires.kx@gmail.com';
        
        if ((isEmerson || isJosemar) && (!data.isAdmin || !data.vipStatus?.isVip)) {
          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 10); // 10 years VIP
          
          await setDoc(docRef, {
            ...data,
            isAdmin: true,
            isVerified: true,
            vipStatus: {
              isVip: true,
              expiresAt: expiresAt.toISOString(),
              activeFrame: data.vipStatus?.activeFrame || '',
              activeEffect: data.vipStatus?.activeEffect || ''
            },
            updatedAt: serverTimestamp()
          }, { merge: true });
          
          // Refetch to get updated data
          const updatedSnap = await getDoc(docRef);
          const updatedData = updatedSnap.data();
          try {
            localStorage.setItem(`profile_cache_${uid}`, JSON.stringify(updatedData));
          } catch (e) {}
          setProfile(updatedData);
        } else {
          setProfile(data);
        }
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("Error fetching user profile from Firestore:", err);
      checkQuotaError(err);
      
      // Load fallback from cache to avoid logging the user out or crashing
      const cached = localStorage.getItem(`profile_cache_${uid}`);
      if (cached) {
        try {
          setProfile(JSON.parse(cached));
          console.log("Loaded cached profile fallback successfully.");
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    }
  };

  const refreshProfile = async () => {
    if (user) {
      try {
        await fetchProfile(user.uid);
      } catch (err) {
        console.error("Error refreshing profile:", err);
        checkQuotaError(err);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await fetchProfile(currentUser.uid);
        } catch (err) {
          console.error("Error fetching user profile on auth change:", err);
          checkQuotaError(err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, quotaExceeded, triggerQuotaExceeded, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
