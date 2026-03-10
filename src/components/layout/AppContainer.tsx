"use client"

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black flex justify-center overflow-hidden">
      <div className="w-full max-w-[430px] bg-[#0f0f0f] relative flex flex-col h-screen overflow-hidden border-x border-white/5 shadow-2xl">
        {children}
      </div>
    </div>
  );
}
