"use client"

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, collection, query, where, limit, getDocs } from 'firebase/firestore';

interface OwnerLoginProps {
  onBack: () => void;
}

export default function OwnerLogin({ onBack }: OwnerLoginProps) {
  const auth = useAuth();
  const allowSetup = process.env.NEXT_PUBLIC_ENABLE_SUPERADMIN_SETUP === 'true';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setError('');
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const db = getFirestore(auth.app);
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));

      if (!userDoc.exists()) {
        await auth.signOut();
        setError('Account not recognized. Contact the admin for credentials.');
        return;
      }

      const role = userDoc.data()?.role;
      if (role !== 'kioskOwner' && role !== 'superAdmin') {
        await auth.signOut();
        setError('This account does not have owner access.');
        return;
      }
      // Auth state change will be picked up by useUser → page.tsx handles routing
    } catch (err: unknown) {
      const code = (err as { code?: string } | null)?.code;
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (code === 'auth/wrong-password') {
        setError('Wrong password.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Try again later.');
      } else {
        setError('Sign in failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!auth || !email) {
      setError('Enter your email address first.');
      return;
    }
    setError('');
    setResetSent(false);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch {
      setError('Could not send reset email. Check the address and try again.');
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setError('');

    if (!allowSetup) {
      setError('Admin setup is disabled. Ask an existing super admin for access.');
      return;
    }

    // Validate the token server-side (token is NOT in client bundle)
    try {
      const res = await fetch('/api/validate-setup-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: setupToken.trim() }),
      });
      const data = await res.json();
      if (!data.valid) {
        setError(data.error || 'Invalid setup token.');
        return;
      }
    } catch {
      setError('Could not validate setup token. Try again.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const db = getFirestore(auth.app);
      const existingSuperAdminSnapshot = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'superAdmin'), limit(1))
      );
      if (!existingSuperAdminSnapshot.empty) {
        setError('A super admin already exists. Sign in instead.');
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        email: cred.user.email,
        displayName: 'Super Admin',
        role: 'superAdmin',
        createdAt: serverTimestamp(),
      });
      // Auth state picks up automatically
    } catch (err: unknown) {
      const code = (err as { code?: string } | null)?.code;
      if (code === 'auth/email-already-in-use') {
        setError('This email is already registered. Sign in instead.');
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else if (code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else {
        setError('Setup failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#0f0f0f] flex flex-col items-center justify-center p-8">
      <motion.form
        onSubmit={isSetup ? handleSetup : handleSignIn}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm space-y-6"
      >
        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-[#888] hover:text-white transition-colors text-sm -mb-2"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-[#FF6B35]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="text-[#FF6B35]" size={32} />
          </div>
          <h1 className="text-2xl font-bold">
            {isSetup ? 'Set Up Admin Account' : 'Owner Login'}
          </h1>
          <p className="text-[#888] text-sm mt-2">
            {isSetup
              ? 'Create your super admin account'
              : 'Sign in with your credentials'}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#888] uppercase tracking-wider mb-2 block">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]" />
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-[#1a1a1a] border-white/10 h-12 rounded-xl text-white placeholder:text-[#555] pl-11"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#888] uppercase tracking-wider mb-2 block">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]" />
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                className="bg-[#1a1a1a] border-white/10 h-12 rounded-xl text-white placeholder:text-[#555] pl-11"
                required
              />
            </div>
          </div>

          {isSetup && (
            <div>
              <label className="text-xs font-bold text-[#888] uppercase tracking-wider mb-2 block">Setup Token</label>
              <Input
                type="password"
                value={setupToken}
                onChange={e => setSetupToken(e.target.value)}
                placeholder="Enter setup token"
                className="bg-[#1a1a1a] border-white/10 h-12 rounded-xl text-white placeholder:text-[#555]"
                required
              />
            </div>
          )}
        </div>

        {!isSetup && (
          <button
            type="button"
            onClick={handleForgotPassword}
            className="w-full text-right text-[#888] hover:text-[#FF6B35] transition-colors text-xs -mt-2"
          >
            Forgot Password?
          </button>
        )}

        {resetSent && (
          <p className="text-green-400 text-sm text-center font-medium">
            ✅ Password reset email sent! Check your inbox.
          </p>
        )}

        {error && (
          <p className="text-red-500 text-sm text-center font-medium">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 font-bold py-6 text-lg rounded-2xl"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : isSetup ? (
            'Create Admin Account'
          ) : (
            'Sign In'
          )}
        </Button>

        {!isSetup && allowSetup && (
          <button
            type="button"
            onClick={() => { setIsSetup(true); setError(''); }}
            className="w-full text-center text-[#888] hover:text-white transition-colors text-xs py-2"
          >
            First time? Set up admin account {'->'}
          </button>
        )}

        {isSetup && (
          <button
            type="button"
            onClick={() => { setIsSetup(false); setError(''); }}
            className="w-full text-center text-[#888] hover:text-white transition-colors text-xs py-2"
          >
            Already have an account? Sign in {'->'}
          </button>
        )}

        {!allowSetup && !isSetup && (
          <p className="text-center text-[11px] text-[#777]">
            Super admin setup is disabled in this environment.
          </p>
        )}
      </motion.form>
    </div>
  );
}
