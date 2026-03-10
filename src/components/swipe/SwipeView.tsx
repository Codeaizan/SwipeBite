"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { foodItems, FoodItem } from '@/data/foodItems';
import SwipeCard from './SwipeCard';
import { Button } from '@/components/ui/button';

export default function SwipeView({ onSwipeUpdate }: { onSwipeUpdate: (count: number) => void }) {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hintShown, setHintShown] = useState(false);

  useEffect(() => {
    // Check veg mode
    const vegMode = localStorage.getItem('vegOnlyMode') === 'true';
    const initialItems = vegMode ? foodItems.filter(i => i.isVeg) : foodItems;
    
    // Shuffle or sort? Let's just use original
    setItems([...initialItems]);
    
    // Check onboarding/hints
    setHintShown(localStorage.getItem('swipeHintShown') === 'true');
    
    // Simulation of data loading
    const timer = setTimeout(() => setIsInitializing(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleSwipe = useCallback((direction: string, item: FoodItem) => {
    if (navigator.vibrate) navigator.vibrate(50);
    
    const count = parseInt(localStorage.getItem('swipeCount') || '0') + 1;
    localStorage.setItem('swipeCount', count.toString());
    onSwipeUpdate(count);

    if (direction === 'right') {
      const liked = JSON.parse(localStorage.getItem('likedItems') || '[]');
      if (!liked.find((i: FoodItem) => i.id === item.id)) {
        liked.push(item);
        localStorage.setItem('likedItems', JSON.stringify(liked));
      }
      
      // Check if top trending (mocked logic: item 1, 4, 7 are "hot")
      if (['1', '4', '7'].includes(item.id)) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF6B35', '#ffffff', '#B42D42']
        });
      }
    }

    setCurrentIndex(prev => prev + 1);
  }, [onSwipeUpdate]);

  const reset = () => {
    setCurrentIndex(0);
  };

  if (isInitializing) {
    return (
      <div className="flex-1 flex flex-col p-6 items-center justify-center">
        <div className="w-full h-[600px] bg-[#1a1a1a] rounded-[32px] animate-pulse overflow-hidden">
          <div className="h-[65%] bg-white/5" />
          <div className="p-8 space-y-4">
            <div className="h-8 w-2/3 bg-white/5 rounded-lg" />
            <div className="h-4 w-1/2 bg-white/5 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const activeItems = items.slice(currentIndex, currentIndex + 3);

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden px-6 pt-10 pb-24">
      <div className="flex-1 relative">
        <AnimatePresence>
          {activeItems.length > 0 ? (
            activeItems.map((item, idx) => (
              <SwipeCard
                key={item.id}
                item={item}
                isActive={idx === 0}
                index={idx}
                onSwipe={(dir) => handleSwipe(dir, item)}
              />
            )).reverse()
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex flex-col items-center justify-center text-center p-8"
            >
              <div className="text-7xl mb-6">🍽️</div>
              <h2 className="text-2xl font-bold mb-2">You've seen it all!</h2>
              <p className="text-[#888] mb-8">Come back after lunch for new items</p>
              <Button 
                onClick={reset}
                className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 rounded-2xl px-8 py-6 text-lg font-bold gap-2"
              >
                <RotateCcw size={20} />
                Start Over
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {activeItems.length > 0 && (
        <div className="flex justify-center gap-6 mt-8 mb-4">
          <button 
            onClick={() => handleSwipe('left', activeItems[0])}
            className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#888] hover:bg-white/10 transition-colors"
          >
            <X size={32} strokeWidth={3} />
          </button>
          <button 
            onClick={() => handleSwipe('right', activeItems[0])}
            className="w-16 h-16 rounded-full bg-[#FF6B35]/10 border border-[#FF6B35]/20 flex items-center justify-center text-[#FF6B35] hover:bg-[#FF6B35]/20 transition-colors"
          >
            <Heart size={32} fill="currentColor" />
          </button>
        </div>
      )}
    </div>
  );
}
