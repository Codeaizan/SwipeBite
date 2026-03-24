'use client';

import { useState, useEffect } from 'react';
import { User, onIdTokenChanged, getRedirectResult } from 'firebase/auth';
import { useAuth } from '../provider';

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setUser(null);
      setLoading(false);
      return;
    }

    getRedirectResult(auth).catch(() => {});

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Force token to be sent to Firebase servers before allowing queries
          await firebaseUser.getIdToken(true);
        } catch {
          // If token refresh fails, still proceed with existing token
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return { user, loading };
}
