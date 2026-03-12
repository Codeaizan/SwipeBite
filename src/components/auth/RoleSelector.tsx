"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Store } from 'lucide-react';

interface RoleSelectorProps {
  onSelectStudent: () => void;
  onSelectOwner: () => void;
}

export default function RoleSelector({ onSelectStudent, onSelectOwner }: RoleSelectorProps) {
  return (
    <div className="fixed inset-0 z-[200] bg-[#0f0f0f] flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="text-8xl mb-4">🍔</div>
        <h1 className="text-4xl font-bold mb-2 tracking-tight">SwipeBite</h1>
        <p className="text-[#888] text-lg mb-12 max-w-[280px] mx-auto">
          Discover & rate campus food with a swipe
        </p>

        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSelectStudent}
            className="w-full bg-gradient-to-r from-[#FF6B35] to-[#B42D42] p-5 rounded-2xl flex items-center gap-4 shadow-xl shadow-[#FF6B35]/10 text-left"
          >
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <GraduationCap size={28} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-lg text-white">I'm a Student</p>
              <p className="text-white/60 text-xs">Swipe, rate & discover food</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSelectOwner}
            className="w-full bg-[#1a1a1a] border border-white/10 p-5 rounded-2xl flex items-center gap-4 text-left hover:border-white/20 transition-colors"
          >
            <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
              <Store size={28} className="text-[#888]" />
            </div>
            <div>
              <p className="font-bold text-lg text-white">I'm a Kiosk Owner</p>
              <p className="text-[#888] text-xs">Manage menu & view feedback</p>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
