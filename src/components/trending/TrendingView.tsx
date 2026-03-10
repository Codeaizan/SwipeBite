"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Flame, ArrowUp, ArrowDown, ArrowBigUpDash, Heart } from 'lucide-react';
import { foodItems, FoodItem } from '@/data/foodItems';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function TrendingView() {
  const [filter, setFilter] = useState<'All' | 'Kiosk A' | 'Kiosk B' | 'Kiosk C'>('All');
  const [rankingMode, setRankingMode] = useState<'Loved' | 'Wanted'>('Loved');
  const [displayItems, setDisplayItems] = useState<FoodItem[]>([]);

  useEffect(() => {
    let filtered = foodItems;
    if (filter !== 'All') {
      filtered = foodItems.filter(i => i.kiosk === filter);
    }
    
    const vegMode = localStorage.getItem('vegOnlyMode') === 'true';
    if (vegMode) filtered = filtered.filter(i => i.isVeg);

    const sorted = [...filtered].sort((a, b) => {
      if (rankingMode === 'Loved') {
        return (b.likes / b.totalSwipes) - (a.likes / a.totalSwipes);
      } else {
        return b.wantToTry - a.wantToTry;
      }
    });
    
    setDisplayItems(sorted);
  }, [filter, rankingMode]);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto pb-24 no-select">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Trending Now <Flame className="text-[#FF6B35]" />
        </h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
        {['All', 'Kiosk A', 'Kiosk B', 'Kiosk C'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
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
          {displayItems.length > 0 ? (
            displayItems.map((item, index) => {
              const likeRate = (item.likes / item.totalSwipes) * 100;
              const isHot = rankingMode === 'Loved' ? likeRate > 70 : item.wantToTry > 50;
              const barColor = rankingMode === 'Loved' ? "bg-[#FF6B35]" : "bg-[#3B82F6]";
              const accentColor = rankingMode === 'Loved' ? "text-[#FF6B35]" : "text-[#3B82F6]";
              
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/5 flex items-center gap-4 group"
                >
                  <div className="flex flex-col items-center justify-center min-w-[40px]">
                    <span className={cn("text-xl font-black italic", accentColor)}>#{index + 1}</span>
                    <div className={cn(
                      "flex items-center text-[10px] font-bold mt-1",
                      item.rankChange > 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {item.rankChange > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                      {Math.abs(item.rankChange)}
                    </div>
                  </div>

                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
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
                            ? `${Math.round(likeRate)}% Like rate` 
                            : `⏫ ${item.wantToTry} students want to try`}
                        </span>
                        {rankingMode === 'Loved' && <span className="text-[#888]">{item.totalSwipes} votes</span>}
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: rankingMode === 'Loved' ? `${likeRate}%` : `${Math.min(100, (item.wantToTry/100)*100)}%` }}
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
