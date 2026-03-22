'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase';
import { UserDoc } from '@/types/firestore';

export interface UserRoleData extends Omit<UserDoc, 'id'> {}

export function useUserRole() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const [roleData, setRoleData] = useState<UserRoleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user || !db) {
      setRoleData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchRole = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (cancelled) return;

        if (userDoc.exists()) {
          setRoleData(userDoc.data() as UserRoleData);
        } else {
          // Auto-create student role for Google-authenticated users
          const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
          if (isGoogle) {
            const data: UserRoleData = { role: 'student', email: user.email || undefined };
            await setDoc(doc(db, 'users', user.uid), {
              ...data,
              displayName: user.displayName,
              createdAt: serverTimestamp(),
            });
            if (!cancelled) setRoleData(data);
          } else {
            // Email/password user without a role doc — shouldn't happen
            // (Super admin creates the doc when creating the account)
            if (!cancelled) setRoleData(null);
          }
        }
      } catch {
        if (!cancelled) setRoleData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    fetchRole();

    return () => { cancelled = true; };
  }, [user, db, authLoading]);

  return { roleData, loading: authLoading || loading, user };
}
