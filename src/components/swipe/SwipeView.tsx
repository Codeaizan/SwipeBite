
"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, RotateCcw, ArrowBigUpDash } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, where, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import SwipeCard from './SwipeCard';
import { Button } from '@/components/ui/button';
import { FoodItem } from '@/types/food-item';
import { SwipeDoc } from '@/types/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { QUERY_LIMITS } from '@/lib/query-limits';

export default function SwipeView({ onSwipeUpdate }: { onSwipeUpdate: (count: number) => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const [localSwipedIds, setLocalSwipedIds] = useState<Set<string>>(new Set());
  const [showSwipeUpHint, setShowSwipeUpHint] = useState(false);

  const itemsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'items'),
      where('isAvailable', '==', true),
      limit(QUERY_LIMITS.items)
    );
  }, [db]);

  // Fetch user's existing swipes to filter out already-swiped items
  const userSwipesQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'swipes'),
      where('userId', '==', user.uid),
      limit(QUERY_LIMITS.userSwipes)
    );
  }, [db, user]);

  const { data: allItems = [], loading: itemsLoading } = useCollection<FoodItem>(itemsQuery);
  const { data: userSwipes = [], loading: swipesLoading } = useCollection<SwipeDoc>(userSwipesQuery);

  // Filter out already-swiped items (Firestore + local tracking for instant feedback)
  const items = useMemo(() => {
    const swipedIds = new Set(userSwipes.map(s => s.itemId));
    return allItems.filter(item => !swipedIds.has(item.id) && !localSwipedIds.has(item.id));
  }, [allItems, userSwipes, localSwipedIds]);

  const loading = itemsLoading || swipesLoading;

  useEffect(() => {
    let hintShown = false;
    try {
      hintShown = localStorage.getItem('swipeUpHintShown') === 'true';
    } catch {
      hintShown = false;
    }

    if (!hintShown) {
      setShowSwipeUpHint(true);
      setTimeout(() => {
        setShowSwipeUpHint(false);
        try {
          localStorage.setItem('swipeUpHintShown', 'true');
        } catch {
          // Ignore storage failures in privacy-restricted contexts.
        }
      }, 4000);
    }
  }, []);

  const handleSwipe = useCallback((direction: string, item: FoodItem) => {
    if (!user || !db) return;
    if (navigator.vibrate) navigator.vibrate(50);

    // Immediately hide the card locally
    setLocalSwipedIds(prev => new Set(prev).add(item.id));

    const totalSwiped = userSwipes.length + localSwipedIds.size + 1;
    onSwipeUpdate(totalSwiped);

    // Persist swipe to Firestore
    const swipeData = {
      userId: user.uid,
      itemId: item.id,
      direction,
      timestamp: serverTimestamp(),
    };

    addDoc(collection(db, 'swipes'), swipeData).catch(async () => {
      // Revert the optimistic update so the card reappears
      setLocalSwipedIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
      onSwipeUpdate(userSwipes.length + localSwipedIds.size);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'swipes',
        operation: 'create',
        requestResourceData: swipeData
      }));
    });

    if (direction === 'right') {
      if (item.isSpecial) {
        confetti({
          particleCount: 150, spread: 70, origin: { y: 0.6 },
          colors: ['#FF6B35', '#ffffff', '#B42D42']
        });
      }
    }
  }, [user, db, onSwipeUpdate, userSwipes.length, localSwipedIds]);

  if (loading) {
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

  const activeItems = items.slice(0, 3);

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden px-6 pt-10 pb-24">
      <AnimatePresence>
        {showSwipeUpHint && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-4 left-0 right-0 z-50 flex justify-center"
          >
            <p className="text-[#888] text-xs font-medium bg-black/40 backdrop-blur px-4 py-2 rounded-full border border-white/10">
              💡 Swipe up if you haven&apos;t tried it yet!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

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
              <h2 className="text-2xl font-bold mb-2">You&apos;ve seen it all!</h2>
              <p className="text-[#888] mb-8">Come back later for new items</p>
              <Button 
                onClick={() => setLocalSwipedIds(new Set())}
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
        <div className="flex justify-center items-center gap-4 mt-8 mb-4">
          <button 
            onClick={() => handleSwipe('left', activeItems[0])}
            className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#888] hover:bg-white/10 transition-colors"
          >
            <X size={28} strokeWidth={3} />
          </button>
          
          <button 
            onClick={() => handleSwipe('up', activeItems[0])}
            className="w-16 h-16 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6] hover:bg-[#3B82F6]/20 transition-colors shadow-lg shadow-[#3B82F6]/5"
          >
            <ArrowBigUpDash size={32} fill="currentColor" />
          </button>

          <button 
            onClick={() => handleSwipe('right', activeItems[0])}
            className="w-14 h-14 rounded-full bg-[#FF6B35]/10 border border-[#FF6B35]/20 flex items-center justify-center text-[#FF6B35] hover:bg-[#FF6B35]/20 transition-colors"
          >
            <Heart size={28} fill="currentColor" />
          </button>
        </div>
      )}
    </div>
  );
}
