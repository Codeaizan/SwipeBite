"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ThumbsDown, Leaf, LogOut, X, Loader2, MessageSquare, Send } from 'lucide-react';
import { FoodItem } from '@/types/food-item';
import { SwipeDoc, FeedbackDoc } from '@/types/firestore';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn, toSafeImageUrl } from '@/lib/utils';
import { useUser, useFirestore, useAuth, useCollection } from '@/firebase';
import { collection, query, where, limit, doc, setDoc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { QUERY_LIMITS } from '@/lib/query-limits';
import { toast } from '@/hooks/use-toast';

export default function ProfileView() {
  const [vegOnly, setVegOnly] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'liked' | 'disliked'>('liked');
  const [feedbackItem, setFeedbackItem] = useState<FoodItem | null>(null);
  const [feedbackReason, setFeedbackReason] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [existingFeedbackId, setExistingFeedbackId] = useState<string | null>(null);
  const feedbackTimestamps = useRef<number[]>([]);

  const { user } = useUser();
  const db = useFirestore();
  const auth = useAuth();

  const swipesQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'swipes'), where('userId', '==', user.uid), limit(QUERY_LIMITS.userSwipes));
  }, [db, user]);

  const itemsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'items'), limit(QUERY_LIMITS.items));
  }, [db, user]);

  const feedbackQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'feedback'), where('userId', '==', user.uid), limit(QUERY_LIMITS.feedback));
  }, [db, user]);

  const { data: swipes = [], loading: swipesLoading } = useCollection<SwipeDoc>(swipesQuery);
  const { data: items = [], loading: itemsLoading } = useCollection<FoodItem>(itemsQuery);
  const { data: userFeedback = [] } = useCollection<FeedbackDoc>(feedbackQuery);

  const sortedSwipes = useMemo(() => {
    const toMs = (value: unknown) => {
      const stamp = value as any;
      if (!stamp) return 0;
      if (typeof stamp.toMillis === 'function') return stamp.toMillis();
      if (typeof stamp.seconds === 'number') return stamp.seconds * 1000;
      if (typeof stamp.toDate === 'function') return stamp.toDate().getTime();
      const t = new Date(stamp).getTime();
      return Number.isFinite(t) ? t : 0;
    };
    return [...swipes].sort((a, b) => toMs(b.timestamp) - toMs(a.timestamp));
  }, [swipes]);

  useEffect(() => {
    try { setVegOnly(localStorage.getItem('vegOnlyMode') === 'true'); } catch { setVegOnly(false); }
  }, []);

  const toggleVeg = (checked: boolean) => {
    setVegOnly(checked);
    try { localStorage.setItem('vegOnlyMode', checked.toString()); } catch { /* ignore */ }
  };

  const itemsMap = useMemo(() => {
    const map = new Map<string, FoodItem>();
    items.forEach(item => map.set(item.id, item));
    return map;
  }, [items]);

  const feedbackMap = useMemo(() => {
    const map = new Map<string, FeedbackDoc>();
    userFeedback.forEach(fb => map.set(fb.itemId, fb));
    return map;
  }, [userFeedback]);

  const likedItems = useMemo(() => {
    const seen = new Set<string>();
    return sortedSwipes
      .filter(s => s.direction === 'right' && !seen.has(s.itemId) && !!seen.add(s.itemId))
      .map(s => itemsMap.get(s.itemId))
      .filter(item => {
        if (!item) return false;
        if (vegOnly && !item.isVeg) return false;
        return true;
      }) as FoodItem[];
  }, [sortedSwipes, itemsMap, vegOnly]);

  const dislikedItems = useMemo(() => {
    const seen = new Set<string>();
    return sortedSwipes
      .filter(s => s.direction === 'left' && !seen.has(s.itemId) && !!seen.add(s.itemId))
      .map(s => itemsMap.get(s.itemId))
      .filter(item => {
        if (!item) return false;
        if (vegOnly && !item.isVeg) return false;
        return true;
      }) as FoodItem[];
  }, [sortedSwipes, itemsMap, vegOnly]);

  const stats = useMemo(() => ({
    total: swipes.length,
    liked: swipes.filter(s => s.direction === 'right').length,
    disliked: swipes.filter(s => s.direction === 'left').length,
    wantToTry: swipes.filter(s => s.direction === 'up').length,
  }), [swipes]);

  const currentDisplayItems = activeSubTab === 'liked' ? likedItems : dislikedItems;
  const loading = swipesLoading || itemsLoading;

  const openFeedbackModal = useCallback((item: FoodItem) => {
    const existing = feedbackMap.get(item.id);
    setFeedbackItem(item);
    setFeedbackReason(existing?.reason || '');
    setExistingFeedbackId(existing?.id || null);
  }, [feedbackMap]);

  const isRateLimited = () => {
    const now = Date.now();
    feedbackTimestamps.current = feedbackTimestamps.current.filter(t => now - t < 60000);
    return feedbackTimestamps.current.length >= 5;
  };

  const submitFeedback = async () => {
    if (!db || !user || !feedbackItem) return;
    const reason = feedbackReason.trim();
    if (reason.length < 5) {
      toast({ variant: 'destructive', title: 'Too short', description: 'Reason must be at least 5 characters.' });
      return;
    }
    if (isRateLimited()) {
      toast({ variant: 'destructive', title: 'Slow down', description: 'Max 5 feedback per minute. Try again shortly.' });
      return;
    }

    setSubmittingFeedback(true);
    const feedbackType = activeSubTab;
    try {
      if (existingFeedbackId) {
        await updateDoc(doc(db, 'feedback', existingFeedbackId), {
          reason,
          type: feedbackType,
          createdAt: serverTimestamp(),
        });
      } else {
        const feedbackId = `fb_${user.uid}_${feedbackItem.id}`;
        await setDoc(doc(db, 'feedback', feedbackId), {
          userId: user.uid,
          itemId: feedbackItem.id,
          itemName: feedbackItem.name,
          kioskName: feedbackItem.kiosk,
          type: feedbackType,
          reason,
          createdAt: serverTimestamp(),
        });
      }
      feedbackTimestamps.current.push(Date.now());
      toast({ title: '✅ Feedback submitted!', description: existingFeedbackId ? 'Your reason has been updated.' : 'Thanks for your feedback!' });
      setFeedbackItem(null);
      setFeedbackReason('');
      setExistingFeedbackId(null);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit feedback.' });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col p-6 pb-24 space-y-4 animate-pulse">
        <div className="h-8 w-40 bg-white/5 rounded-xl" />
        <div className="h-28 bg-white/5 rounded-[32px]" />
        <div className="h-20 bg-white/5 rounded-[32px]" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 bg-white/5 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto pb-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <button
          onClick={() => auth && signOut(auth)}
          className="flex items-center gap-2 text-[#888] hover:text-white transition-colors text-sm"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* Stats */}
      <div className="shrink-0 bg-gradient-to-br from-[#FF6B35] to-[#B42D42] p-6 rounded-[32px] shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10 grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-white/60 text-[8px] font-bold uppercase tracking-widest mb-1">Total</p>
            <p className="text-lg font-black">{stats.total}</p>
          </div>
          <div>
            <p className="text-white/60 text-[8px] font-bold uppercase tracking-widest mb-1">❤️ Liked</p>
            <p className="text-lg font-black">{stats.liked}</p>
          </div>
          <div>
            <p className="text-white/60 text-[8px] font-bold uppercase tracking-widest mb-1">👎 Disliked</p>
            <p className="text-lg font-black">{stats.disliked}</p>
          </div>
          <div>
            <p className="text-white/60 text-[8px] font-bold uppercase tracking-widest mb-1">⏫ Try</p>
            <p className="text-lg font-black">{stats.wantToTry}</p>
          </div>
        </div>
      </div>

      {/* Veg Only */}
      <div className="shrink-0 bg-[#1a1a1a] p-6 rounded-[32px] border border-white/5 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
              <Leaf size={20} />
            </div>
            <div>
              <p className="font-bold text-sm">Veg Only Mode</p>
              <p className="text-[10px] text-[#888]">Filter all non-veg food items</p>
            </div>
          </div>
          <Switch checked={vegOnly} onCheckedChange={toggleVeg} />
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex bg-[#1a1a1a] p-1 rounded-2xl mb-6">
        <button
          onClick={() => setActiveSubTab('liked')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-xs",
            activeSubTab === 'liked' ? "bg-[#2a2a2a] text-[#FF6B35]" : "text-[#888]"
          )}
        >
          <Heart size={14} fill={activeSubTab === 'liked' ? "currentColor" : "none"} />
          Liked
        </button>
        <button
          onClick={() => setActiveSubTab('disliked')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-xs",
            activeSubTab === 'disliked' ? "bg-[#2a2a2a] text-red-400" : "text-[#888]"
          )}
        >
          <ThumbsDown size={14} fill={activeSubTab === 'disliked' ? "currentColor" : "none"} />
          Disliked
        </button>
      </div>

      {/* Item Grid */}
      <AnimatePresence mode="wait">
        {currentDisplayItems.length > 0 ? (
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-2 gap-4"
          >
            {currentDisplayItems.map((item, idx) => {
              const hasFeedback = feedbackMap.has(item.id);
              return (
                <motion.div
                  key={`${item.id}-${idx}`}
                  className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/5 relative cursor-pointer group"
                  onClick={() => openFeedbackModal(item)}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="h-24 w-full relative">
                    <Image src={toSafeImageUrl(item.imageUrl)} alt={item.name} fill
                      sizes="(max-width: 768px) 50vw, 240px"
                      unoptimized
                      className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
                    <div className={cn(
                      "absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center text-white",
                      activeSubTab === 'liked' ? "bg-[#FF6B35]" : "bg-red-500"
                    )}>
                      {activeSubTab === 'liked' ? <Heart size={12} fill="currentColor" /> : <ThumbsDown size={12} fill="currentColor" />}
                    </div>
                    {hasFeedback && (
                      <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-green-500/80 flex items-center justify-center">
                        <MessageSquare size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold truncate">{item.name}</p>
                    <p className="text-[10px] text-[#888]">{item.kiosk}</p>
                    {hasFeedback && (
                      <p className="text-[9px] text-green-400 mt-1 truncate italic">&quot;{feedbackMap.get(item.id)!.reason}&quot;</p>
                    )}
                  </div>
                  {/* Tap hint overlay */}
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white/60 bg-black/50 px-2 py-1 rounded-lg">Tap to add reason</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key={`${activeSubTab}-empty`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center py-20 bg-[#1a1a1a] rounded-[32px] border border-dashed border-white/10 text-center px-8"
          >
            <div className="text-4xl mb-4">{activeSubTab === 'liked' ? '❤️' : '👎'}</div>
            <h4 className="font-bold mb-2">Nothing here yet</h4>
            <p className="text-[12px] text-[#888]">
              {activeSubTab === 'liked'
                ? "Start swiping right to build your liked history!"
                : "Swipe left on items you don't like."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Reason Modal */}
      <AnimatePresence>
        {feedbackItem && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { setFeedbackItem(null); setFeedbackReason(''); }}
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
                <button onClick={() => { setFeedbackItem(null); setFeedbackReason(''); }} className="text-[#888] hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6 mt-2">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mb-4",
                  activeSubTab === 'liked' ? "bg-[#FF6B35]/20 text-[#FF6B35]" : "bg-red-500/20 text-red-400"
                )}>
                  {activeSubTab === 'liked' ? <Heart size={24} fill="currentColor" /> : <ThumbsDown size={24} fill="currentColor" />}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {activeSubTab === 'liked' ? 'Why did you like this?' : 'Why did you dislike this?'}
                </h3>
                <p className="text-sm text-[#888]">{feedbackItem.name} — {feedbackItem.kiosk}</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    value={feedbackReason}
                    onChange={e => setFeedbackReason(e.target.value.slice(0, 300))}
                    placeholder="e.g. The flavors were amazing! / Too spicy for me..."
                    className="w-full h-28 bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder:text-[#555] resize-none focus:outline-none focus:border-[#FF6B35]/50 transition-colors text-sm"
                  />
                  <div className={`absolute bottom-3 right-4 text-xs font-medium ${feedbackReason.length >= 300 ? 'text-red-400' : feedbackReason.length < 5 ? 'text-yellow-500' : 'text-[#555]'}`}>
                    {feedbackReason.length}/300
                  </div>
                </div>
                {feedbackReason.trim().length > 0 && feedbackReason.trim().length < 5 && (
                  <p className="text-yellow-500 text-xs">Minimum 5 characters required</p>
                )}
                <Button
                  onClick={submitFeedback}
                  disabled={feedbackReason.trim().length < 5 || submittingFeedback}
                  className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white rounded-xl py-6 font-bold text-base gap-2 disabled:opacity-40"
                >
                  {submittingFeedback ? <Loader2 className="animate-spin" size={18} /> : (
                    <>
                      <Send size={18} />
                      {existingFeedbackId ? 'Update Feedback' : 'Submit Feedback'}
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
