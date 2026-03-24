
'use client';

import { useState, useEffect, useRef } from 'react';
import { Query, onSnapshot, DocumentData, queryEqual } from 'firebase/firestore';

export function useCollection<T extends DocumentData = DocumentData>(query: Query<DocumentData> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const retryAttemptsRef = useRef(0);

  // Stabilize the query reference: only update when the query actually changes
  const queryRef = useRef(query);
  if (
    query !== queryRef.current &&
    !(query && queryRef.current && queryEqual(query, queryRef.current))
  ) {
    queryRef.current = query;
  }
  const stableQuery = queryRef.current;

  useEffect(() => {
    if (!stableQuery) {
      retryAttemptsRef.current = 0;
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = onSnapshot(
      stableQuery,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as unknown as T[];
        retryAttemptsRef.current = 0;
        setData(items);
        setLoading(false);
      },
      async (err) => {
        if (err.code === 'permission-denied') {
          console.warn('Firestore permission denied for query. The user may not have access to these documents yet.');
          if (retryAttemptsRef.current < 3) {
            retryAttemptsRef.current += 1;
            const delayMs = retryAttemptsRef.current * 400;
            retryTimer = setTimeout(() => {
              setRetryToken((prev) => prev + 1);
            }, delayMs);
          }
        } else {
          console.warn('Firestore query error:', err.code, err.message);
        }
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [stableQuery, retryToken]);

  return { data, loading, error };
}
