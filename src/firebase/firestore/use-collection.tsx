
'use client';

import { useState, useEffect, useRef } from 'react';
import { Query, onSnapshot, DocumentData, queryEqual } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T extends DocumentData = DocumentData>(query: Query<DocumentData> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    const unsubscribe = onSnapshot(
      stableQuery,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as unknown as T[];
        setData(items);
        setLoading(false);
      },
      async (err) => {
        if (err.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: 'unknown',
            operation: 'list',
            code: err.code,
          });
          errorEmitter.emit('permission-error', permissionError);
        } else {
          console.warn('Firestore query error:', err.code, err.message);
        }
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [stableQuery]);

  return { data, loading, error };
}
