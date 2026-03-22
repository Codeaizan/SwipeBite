
"use client"

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, TrendingUp, ArrowBigUpDash, Heart } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { FoodItem } from '@/types/food-item';
import { SwipeDoc } from '@/types/firestore';
import { QUERY_LIMITS } from '@/lib/query-limits';

export default function DashboardView() {
  const db = useFirestore();
  const itemsQuery = useMemo(() => db ? query(collection(db, 'items'), limit(QUERY_LIMITS.items)) : null, [db]);
  const swipesQuery = useMemo(() => db ? query(collection(db, 'swipes'), limit(QUERY_LIMITS.dashboardSwipes)) : null, [db]);

  const { data: items = [], loading: itemsLoading } = useCollection<FoodItem>(itemsQuery);
  const { data: swipes = [], loading: swipesLoading } = useCollection<SwipeDoc>(swipesQuery);

  if (itemsLoading || swipesLoading) {
    return (
      <div className="flex-1 flex flex-col p-6 pb-24 space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-white/5 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-white/5 rounded-[24px]" />
          ))}
        </div>
        <div className="h-72 bg-white/5 rounded-[32px]" />
      </div>
    );
  }

  // Aggregate metrics from real Firestore swipes
  const itemStats = items.map(item => {
    const itemSwipes = swipes.filter((s) => s.itemId === item.id);
    const likes = itemSwipes.filter((s) => s.direction === 'right').length;
    const wants = itemSwipes.filter((s) => s.direction === 'up').length;
    const total = itemSwipes.length;
    return { ...item, likes, wantToTry: wants, totalSwipes: total };
  });

  const topItems = [...itemStats].sort((a, b) => (b.likes / (b.totalSwipes || 1)) - (a.likes / (a.totalSwipes || 1))).slice(0, 4);
  const totalLikes = swipes.filter((s) => s.direction === 'right').length;
  const totalPasses = swipes.filter((s) => s.direction === 'left').length;

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto pb-24">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        Campus Analytics <BarChart className="text-[#FF6B35]" />
      </h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#1a1a1a] p-5 rounded-[24px] border border-white/5">
          <p className="text-[10px] font-bold text-[#888] uppercase mb-1">Total Swipes</p>
          <p className="text-2xl font-black text-white">{swipes.length}</p>
        </div>
        <div className="bg-[#1a1a1a] p-5 rounded-[24px] border border-white/5">
          <p className="text-[10px] font-bold text-[#888] uppercase mb-1">Active Items</p>
          <p className="text-2xl font-black text-[#FF6B35]">{items.length}</p>
        </div>
        <div className="bg-[#1a1a1a] p-5 rounded-[24px] border border-white/5">
          <p className="text-[10px] font-bold text-[#888] uppercase mb-1">❤️ Likes</p>
          <p className="text-2xl font-black text-[#FF6B35]">{totalLikes}</p>
        </div>
        <div className="bg-[#1a1a1a] p-5 rounded-[24px] border border-white/5">
          <p className="text-[10px] font-bold text-[#888] uppercase mb-1">👎 Passes</p>
          <p className="text-2xl font-black text-[#888]">{totalPasses}</p>
        </div>
      </div>

      {topItems.length > 0 && (
        <div className="bg-[#1a1a1a] p-6 rounded-[32px] border border-white/5 mb-8">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            Top Rated <TrendingUp className="text-green-500" size={18} />
          </h3>
          <div className="space-y-6">
            {topItems.map((item) => {
              const likeRate = item.totalSwipes > 0 ? Math.round((item.likes / item.totalSwipes) * 100) : 0;
              return (
                <div key={item.id} className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="font-bold text-sm truncate max-w-[140px]">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#FF6B35]">
                        <Heart size={10} fill="currentColor" /> {likeRate}%
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#3B82F6]">
                        <ArrowBigUpDash size={10} fill="currentColor" /> {item.wantToTry}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${likeRate}%` }}
                      className="h-full bg-gradient-to-r from-[#FF6B35] to-[#B42D42]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
          <div className="text-7xl mb-6">📋</div>
          <h2 className="text-2xl font-bold mb-2">No Items Yet</h2>
          <p className="text-[#888]">Kiosk owners need to add menu items first.</p>
        </div>
      )}
    </div>
  );
}
