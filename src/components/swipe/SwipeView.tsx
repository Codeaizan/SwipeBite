
"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, RotateCcw, ArrowBigUpDash, MessageSquarePlus, Send, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, where, addDoc, serverTimestamp, limit, orderBy } from 'firebase/firestore';
import SwipeCard from './SwipeCard';
import { Button } from '@/components/ui/button';
import { FoodItem } from '@/types/food-item';
import { SwipeDoc, GlobalConfigDoc, SuggestionDoc } from '@/types/firestore';
import { toast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { QUERY_LIMITS } from '@/lib/query-limits';

export default function SwipeView({ onSwipeUpdate }: { onSwipeUpdate: (count: number) => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const [localSwipedIds, setLocalSwipedIds] = useState<Set<string>>(new Set());
  const [showSwipeUpHint, setShowSwipeUpHint] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestionText, setSuggestionText] = useState('');
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);

  const { data: configRows } = useCollection<GlobalConfigDoc>(useMemo(() => {
    return db ? query(collection(db, 'config')) : null;
  }, [db]));
  const charLimit = configRows?.find(c => c.id === 'globals')?.suggestionCharLimit || 150;

  // Rate Limiting Logic
  const userSuggestionsQuery = useMemo(() => {
    return (db && user) ? query(
      collection(db, 'suggestions'), 
      where('userId', '==', user.uid), 
      orderBy('createdAt', 'desc'), 
      limit(1)
    ) : null;
  }, [db, user]);
  
  const { data: latestSuggestions } = useCollection<SuggestionDoc>(userSuggestionsQuery);

  const canSuggest = useMemo(() => {
    if (!latestSuggestions || latestSuggestions.length === 0) return true;
    const last = latestSuggestions[0];
    if (!last.createdAt) return false; // Pending write
    const stamp = last.createdAt as any;
    const lastTime = typeof stamp.toMillis === 'function'
      ? stamp.toMillis()
      : typeof stamp.seconds === 'number'
        ? stamp.seconds * 1000
        : typeof stamp.toDate === 'function'
          ? stamp.toDate().getTime()
          : new Date(stamp).getTime();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    return (Date.now() - lastTime) >= SEVEN_DAYS;
  }, [latestSuggestions]);

  const handleSuggestionClick = useCallback(() => {
    setShowSuggestionModal(true);
  }, []);

  const submitSuggestion = async () => {
    if (!user || !db || !suggestionText.trim()) return;
    setSubmittingSuggestion(true);
    try {
      await addDoc(collection(db, 'suggestions'), {
        text: suggestionText.trim(),
        userId: user.uid,
        createdAt: serverTimestamp(),
        status: 'pending',
        forwardedTo: []
      });
      setShowSuggestionModal(false);
      setSuggestionText('');
      toast({ title: 'Suggestion Sent! 🚀', description: 'Thanks for your feedback!' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send suggestion.' });
    } finally {
      setSubmittingSuggestion(false);
    }
  };

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
      orderBy('timestamp', 'desc'),
      limit(QUERY_LIMITS.userSwipes)
    );
  }, [db, user]);

  const { data: allItems = [], loading: itemsLoading } = useCollection<FoodItem>(itemsQuery);
  const { data: userSwipes = [], loading: swipesLoading } = useCollection<SwipeDoc>(userSwipesQuery);

  const [vegOnly, setVegOnly] = useState(false);

  useEffect(() => {
    try {
      setVegOnly(localStorage.getItem('vegOnlyMode') === 'true');
    } catch {
      setVegOnly(false);
    }
  }, []);

  // Filter out already-swiped items (Firestore + local tracking for instant feedback)
  const items = useMemo(() => {
    const swipedIds = new Set(userSwipes.map(s => s.itemId));
    return allItems.filter(item => {
      if (swipedIds.has(item.id) || localSwipedIds.has(item.id)) return false;
      if (vegOnly && !item.isVeg) return false;
      return true;
    });
  }, [allItems, userSwipes, localSwipedIds, vegOnly]);

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
        <div className="w-full h-full bg-[#1a1a1a] rounded-[32px] animate-pulse overflow-hidden">
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
    <div className="flex-1 flex flex-col relative overflow-hidden px-6 pt-6 pb-[68px]">
      <AnimatePresence>
        {showSwipeUpHint && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-4 left-0 right-0 z-50 flex justify-center"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="bg-gradient-to-r from-[#FF6B35]/90 to-[#B42D42]/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 shadow-[0_0_20px_rgba(255,107,53,0.3)]"
            >
              <p className="text-white text-xs font-bold tracking-wide shadow-sm">
                ✨ Swipe UP to Try Later!
              </p>
            </motion.div>
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
                onSuggest={handleSuggestionClick}
                showSuggestButton={canSuggest}
              />
            )).reverse()
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex items-center justify-center p-6"
            >
              <div className="bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 rounded-[40px] p-10 w-full text-center shadow-2xl relative overflow-hidden">
                {/* Background glow orb */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#FF6B35]/20 rounded-full blur-[50px] pointer-events-none" />
                
                <motion.div 
                  className="text-7xl mb-6 relative z-10"
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  🚀
                </motion.div>
                <h2 className="text-3xl font-black mb-3 text-white tracking-tight relative z-10">You beat the app!</h2>
                <p className="text-[#888] font-medium mb-10 text-sm relative z-10">Check back later for fresh bites 🔥</p>
                <Button 
                  onClick={() => setLocalSwipedIds(new Set())}
                  className="bg-white text-black hover:bg-[#ccc] rounded-2xl w-full py-7 text-lg font-bold gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,0.1)] relative z-10"
                >
                  <RotateCcw size={22} className="stroke-[3]" />
                  Refresh Stack
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {activeItems.length > 0 && (
        <div className="flex justify-center items-center gap-6 mt-2 mb-0">
          <button 
            onClick={() => handleSwipe('left', activeItems[0])}
            className="w-16 h-16 rounded-full bg-[#1a1a1a]/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-[#888] hover:bg-white/10 transition-all hover:scale-110 active:scale-95 shadow-[0_4px_20px_rgba(0,0,0,0.3)] group"
          >
            <X size={32} strokeWidth={3} className="group-hover:text-white transition-colors" />
          </button>
          
          <button 
            onClick={() => handleSwipe('up', activeItems[0])}
            className="w-14 h-14 rounded-full bg-[#3B82F6]/20 backdrop-blur-xl border border-[#3B82F6]/40 flex items-center justify-center text-[#3B82F6] transition-all hover:scale-110 active:scale-95 shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
          >
            <ArrowBigUpDash size={28} fill="currentColor" />
          </button>

          <button 
            onClick={() => handleSwipe('right', activeItems[0])}
            className="w-16 h-16 rounded-full bg-[#FF6B35]/20 backdrop-blur-xl border border-[#FF6B35]/40 flex items-center justify-center text-[#FF6B35] transition-all hover:scale-110 active:scale-95 shadow-[0_0_20px_rgba(255,107,53,0.25)] hover:shadow-[0_0_40px_rgba(255,107,53,0.4)]"
          >
            <Heart size={32} fill="currentColor" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {showSuggestionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSuggestionModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#1a1a1a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden mb-safe"
            >
              <div className="absolute top-0 right-0 p-4">
                <button onClick={() => setShowSuggestionModal(false)} className="text-[#888] hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="mb-6 mt-2">
                <div className="w-12 h-12 rounded-full bg-[#FF6B35]/20 flex items-center justify-center text-[#FF6B35] mb-4">
                  <MessageSquarePlus size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Campus Food Reqs 🍕</h3>
                <p className="text-sm text-[#888]">Suggest a specific dish or cuisine you want Kiosk Owners to start cooking!</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    value={suggestionText}
                    onChange={e => setSuggestionText(e.target.value.slice(0, charLimit))}
                    placeholder="E.g. We need more vegan options on Tuesdays!"
                    className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder:text-[#555] resize-none focus:outline-none focus:border-[#FF6B35]/50 transition-colors"
                  />
                  <div className={`absolute bottom-3 right-4 text-xs font-medium ${
                    suggestionText.length >= charLimit ? 'text-red-400' : 'text-[#555]'
                  }`}>
                    {suggestionText.length}/{charLimit}
                  </div>
                </div>

                <Button 
                  onClick={submitSuggestion}
                  disabled={!suggestionText.trim() || submittingSuggestion}
                  className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white rounded-xl py-6 font-bold text-base gap-2"
                >
                  {submittingSuggestion ? <Loader2 className="animate-spin" size={18} /> : (
                    <>
                      <Send size={18} />
                      Send Suggestion
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
