
'use client';

import React, { useEffect, useState } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [firebase, setFirebase] = useState<ReturnType<typeof initializeFirebase> | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setFirebase(initializeFirebase());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Firebase failed to initialize.';
      setInitError(message);
    }
  }, []);

  if (initError) {
    return (
      <div className="fixed inset-0 bg-[#0f0f0f] flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Configuration Error</h1>
        <p className="text-[#888] max-w-md">{initError}</p>
      </div>
    );
  }

  if (!firebase) return null;

  return (
    <FirebaseProvider app={firebase.app} db={firebase.db} auth={firebase.auth}>
      <FirebaseErrorListener />
      {children}
    </FirebaseProvider>
  );
}
