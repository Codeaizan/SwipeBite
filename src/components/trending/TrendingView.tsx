"use client"

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, ArrowBigUpDash, Heart } from 'lucide-react';
import { FoodItem } from '@/types/food-item';
import { KioskDoc, SwipeDoc } from '@/types/firestore';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, limit, where } from 'firebase/firestore';
import { QUERY_LIMITS } from '@/lib/query-limits';

interface RankedItem extends FoodItem {
  computedLikes: number;
  computedWantToTry: number;
  computedTotal: number;
  likeRate: number;
}

export default function TrendingView() {
  const [filter, setFilter] = useState('All');
  const [rankingMode, setRankingMode] = useState<'Loved' | 'Wanted'>('Loved');
  const [vegOnly, setVegOnly] = useState(false);
  const db = useFirestore();

  const itemsQuery = useMemo(() => db ? query(collection(db, 'items'), where('isAvailable', '==', true), limit(QUERY_LIMITS.items)) : null, [db]);
  const swipesQuery = useMemo(() => db ? query(collection(db, 'swipes'), limit(QUERY_LIMITS.trendingSwipes)) : null, [db]);
  const kiosksQuery = useMemo(() => db ? query(collection(db, 'kiosks'), limit(QUERY_LIMITS.kiosks)) : null, [db]);

  const { data: items = [], loading: itemsLoading } = useCollection<FoodItem>(itemsQuery);
  const { data: swipes = [], loading: swipesLoading } = useCollection<SwipeDoc>(swipesQuery);
  const { data: kiosks = [] } = useCollection<KioskDoc>(kiosksQuery);

  const kioskNames = useMemo(() => kiosks.map(k => k.name), [kiosks]);

  React.useEffect(() => {
    try {
      setVegOnly(localStorage.getItem('vegOnlyMode') === 'true');
    } catch {
      setVegOnly(false);
    }
  }, []);

  const rankedItems = useMemo<RankedItem[]>(() => {
    let filtered = items;
    if (filter !== 'All') filtered = items.filter(i => i.kiosk === filter);
    if (vegOnly) filtered = filtered.filter(i => i.isVeg);

    const computed = filtered.map(item => {
      const itemSwipes = swipes.filter(s => s.itemId === item.id);
      const computedLikes = itemSwipes.filter(s => s.direction === 'right').length;
      const computedWantToTry = itemSwipes.filter(s => s.direction === 'up').length;
      const computedTotal = itemSwipes.length;
      const likeRate = computedTotal > 0 ? (computedLikes / computedTotal) * 100 : 0;
      return { ...item, computedLikes, computedWantToTry, computedTotal, likeRate };
    });

    return computed.sort((a, b) =>
      rankingMode === 'Loved'
        ? b.likeRate - a.likeRate
        : b.computedWantToTry - a.computedWantToTry
    );
  }, [items, swipes, filter, rankingMode, vegOnly]);

  const maxWanted = useMemo(
    () => Math.max(1, ...rankedItems.map(i => i.computedWantToTry)),
    [rankedItems]
  );

  if (itemsLoading || swipesLoading) {
    return (
      <div className="flex-1 flex flex-col p-6 pb-24 space-y-4">
        <div className="h-8 w-40 bg-white/5 rounded-xl animate-pulse" />
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-8 w-20 bg-white/5 rounded-full animate-pulse" />)}
        </div>
        <div className="h-12 bg-white/5 rounded-2xl animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto pb-24 no-select">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Trending Now <Flame className="text-[#FF6B35]" />
        </h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
        {['All', ...kioskNames].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 border",
              filter === f ? "bg-[#FF6B35] border-[#FF6B35] text-white" : "bg-white/5 border-white/10 text-[#888]"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white/5 rounded-2xl p-1 flex mb-8">
        <button
          onClick={() => setRankingMode('Loved')}
          className={cn(
            "flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
            rankingMode === 'Loved' ? "bg-[#1a1a1a] text-[#FF6B35] shadow-lg" : "text-[#888]"
          )}
        >
          <Heart size={14} fill={rankingMode === 'Loved' ? "currentColor" : "none"} />
          Most Loved
        </button>
        <button
          onClick={() => setRankingMode('Wanted')}
          className={cn(
            "flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
            rankingMode === 'Wanted' ? "bg-[#1a1a1a] text-[#3B82F6] shadow-lg" : "text-[#888]"
          )}
        >
          <ArrowBigUpDash size={14} fill={rankingMode === 'Wanted' ? "currentColor" : "none"} />
          Most Wanted
        </button>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {rankedItems.length > 0 ? (
            rankedItems.map((item, index) => {
              const isHot = rankingMode === 'Loved' ? item.likeRate > 70 : item.computedWantToTry > 50;
              const barColor = rankingMode === 'Loved' ? "bg-[#FF6B35]" : "bg-[#3B82F6]";
              const accentColor = rankingMode === 'Loved' ? "text-[#FF6B35]" : "text-[#3B82F6]";
              const barWidth = rankingMode === 'Loved'
                ? `${Math.round(item.likeRate)}%`
                : `${Math.round((item.computedWantToTry / maxWanted) * 100)}%`;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/5 flex items-center gap-4"
                >
                  <div className="flex flex-col items-center justify-center min-w-[32px]">
                    <span className={cn("text-xl font-black italic", accentColor)}>#{index + 1}</span>
                  </div>

                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white truncate">{item.name}</h3>
                      {isHot && <Flame size={14} className={cn("flex-shrink-0", accentColor)} />}
                    </div>
                    <p className="text-[11px] text-[#888] uppercase tracking-wider mb-2">{item.location}</p>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className={accentColor}>
                          {rankingMode === 'Loved'
                            ? `${Math.round(item.likeRate)}% Like rate`
                            : `⏫ ${item.computedWantToTry} students want to try`}
                        </span>
                        {rankingMode === 'Loved' && (
                          <span className="text-[#888]">{item.computedTotal} votes</span>
                        )}
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: barWidth }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={cn("h-full", barColor)}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-5xl mb-4">👀</span>
              <h3 className="text-xl font-bold mb-2">Not enough swipes yet</h3>
              <p className="text-[#888]">Be the first to vote!</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

