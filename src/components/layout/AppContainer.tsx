"use client"

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-black flex justify-center overflow-hidden">
      <div className="w-full max-w-[430px] bg-[#0f0f0f] relative flex flex-col h-[100dvh] overflow-y-auto border-x border-white/5 shadow-2xl">
        {children}
      </div>
    </div>
  );
}
