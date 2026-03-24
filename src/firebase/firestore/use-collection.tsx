'use client';

import { useState, useEffect, useRef } from 'react';
import { Query, onSnapshot, DocumentData, queryEqual } from 'firebase/firestore';

export function useCollection<T extends DocumentData = DocumentData>(
  query: Query<DocumentData> | null
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null); // ← ref not local var

  const queryRef = useRef(query);
  const hadErrorRef = useRef(false);

  if (
    query !== queryRef.current &&
    !(
      query &&
      queryRef.current &&
      !hadErrorRef.current &&
      queryEqual(query, queryRef.current)
    )
  ) {
    queryRef.current = query;
    hadErrorRef.current = false;
  }
  const stableQuery = queryRef.current;

  useEffect(() => {
    // Always clear pending retry and existing listener on re-run
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (!stableQuery) {
      hadErrorRef.current = false;
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    function startListener() {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      // Store in ref so cleanup always finds it
      unsubscribeRef.current = onSnapshot(
        stableQuery!,
        (snapshot) => {
          hadErrorRef.current = false;
          const items = snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          })) as unknown as T[];
          setData(items);
          setLoading(false);
        },
        (err) => {
          if (err.code === 'permission-denied') {
            // Silently retry — auth token hasn't propagated yet
            hadErrorRef.current = true;
            retryTimeoutRef.current = setTimeout(() => {
              retryTimeoutRef.current = null;
              hadErrorRef.current = false;
              startListener();
            }, 600);
          } else {
            hadErrorRef.current = true;
            console.warn('Firestore query error:', err.code, err.message);
            setError(err);
            setLoading(false);
          }
        }
      );
    }

    startListener();

    // Cleanup always catches the listener via ref
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [stableQuery]);

  return { data, loading, error };
}
