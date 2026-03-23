
"use client"

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';

export default function LoginScreen({ onBack }: { onBack?: () => void }) {
  const auth = useAuth();

  const handleSignIn = () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#0f0f0f] flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#888] hover:text-white transition-colors text-sm mb-8"
          >
            <ArrowLeft size={16} /> Back
          </button>
        )}

        <div className="text-8xl mb-6">🍔</div>
        <h1 className="text-4xl font-bold mb-4 tracking-tight">SwipeBite</h1>
        <p className="text-[#888] text-lg mb-12 max-w-[280px] mx-auto">
          Discover trending food at LPU kiosks. Sign in to start swiping!
        </p>

        <Button
          onClick={handleSignIn}
          className="w-full max-w-xs bg-white text-black hover:bg-white/90 font-bold py-7 text-lg rounded-2xl flex items-center justify-center gap-3 shadow-xl mx-auto"
        >
          <Image src="/google-logo.svg" alt="Google" className="w-6 h-6" width={24} height={24} />
          Continue with Google
        </Button>
      </motion.div>
    </div>
  );
}
