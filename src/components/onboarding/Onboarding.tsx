"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const screens = [
  {
    id: 1,
    emoji: '🍔',
    title: 'Discover Campus Food',
    description: 'Swipe right on food you want to try',
  },
  {
    id: 2,
    emoji: '🔥',
    title: "See What's Trending",
    description: 'Real-time rankings powered by student votes',
  },
  {
    id: 3,
    emoji: '✅',
    title: 'Help Kiosks Improve',
    description: 'Your swipes shape what gets served next',
  },
];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [current, setCurrent] = useState(0);

  const handleNext = () => {
    if (current === screens.length - 1) {
      localStorage.setItem('swipebite_onboarded', 'true');
      onComplete();
    } else {
      setCurrent(current + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0f0f0f] flex flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col items-center justify-center p-8 text-center"
        >
          <div className="text-[72px] mb-8">{screens[current].emoji}</div>
          <h1 className="text-3xl font-bold mb-4 tracking-tight">{screens[current].title}</h1>
          <p className="text-[#888] text-lg max-w-[280px]">{screens[current].description}</p>
        </motion.div>
      </AnimatePresence>

      <div className="p-8 pb-12 flex flex-col items-center gap-6">
        <div className="flex gap-2">
          {screens.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? 'w-8 bg-[#FF6B35]' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>
        
        <Button
          onClick={handleNext}
          className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white font-bold py-7 text-lg rounded-2xl"
        >
          {current === screens.length - 1 ? "Let's Go 🚀" : "Next"}
        </Button>
        
        <button
          onClick={() => {
            localStorage.setItem('swipebite_onboarded', 'true');
            onComplete();
          }}
          className="text-[#888] font-medium"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
