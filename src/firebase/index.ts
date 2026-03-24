'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore,
  initializeFirestore,
  memoryLocalCache
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './config';

export function initializeFirebase() {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  let db;
  try {
    // memoryLocalCache — no IndexedDB persistence
    // Fetches fresh from Firestore server every session
    // Prevents stale cached data being served to wrong users
    db = initializeFirestore(app, {
      localCache: memoryLocalCache()
    });
  } catch {
    db = getFirestore(app);
  }

  const auth = getAuth(app);
  return { app, db, auth };
}

export { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useUser } from './auth/use-user';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';