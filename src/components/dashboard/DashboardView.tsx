
"use client"

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, TrendingUp, AlertCircle, Share2, TrendingDown, ArrowBigUpDash, Heart, UserMinus, Database } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { foodItems } from '@/data/foodItems';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export default function DashboardView() {
  const db = useFirestore();
  const { data: items = [], loading: itemsLoading } = useCollection<any>(db ? collection(db, 'items') : null);
  const { data: swipes = [], loading: swipesLoading } = useCollection<any>(db ? collection(db, 'swipes') : null);

  const handleSeed = async () => {
    if (!db) return;
    try {
      const promises = foodItems.map(item => 
        addDoc(collection(db, 'items'), {
          ...item,
          isAvailable: true,
          id: item.id // Ensure we keep original IDs for mock relation
        })
      );
      await Promise.all(promises);
      toast({ title: "Database Seeded!", description: "15 items added to Firestore." });
    } catch (e) {
      toast({ variant: "destructive", title: "Seeding failed", description: "Check console for details." });
    }
  };

  if (itemsLoading || swipesLoading) return null;

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col p-8 items-center justify-center text-center">
        <div className="text-7xl mb-6">🏜️</div>
        <h2 className="text-2xl font-bold mb-2">Database Empty</h2>
        <p className="text-[#888] mb-8">Seed initial data to start tracking kiosk performance.</p>
        <Button onClick={handleSeed} className="bg-[#FF6B35] text-white font-bold py-6 px-8 rounded-2xl flex items-center gap-2">
          <Database size={20} />
          Seed Database
        </Button>
      </div>
    );
  }

  // Aggregate metrics from real Firestore swipes
  const itemStats = items.map(item => {
    const itemSwipes = swipes.filter((s: any) => s.itemId === item.id);
    const likes = itemSwipes.filter((s: any) => s.direction === 'right').length;
    const wants = itemSwipes.filter((s: any) => s.direction === 'up').length;
    const total = itemSwipes.length;
    return { ...item, likes, wantToTry: wants, totalSwipes: total };
  });

  const topItems = [...itemStats].sort((a, b) => (b.likes / (b.totalSwipes || 1)) - (a.likes / (a.totalSwipes || 1))).slice(0, 4);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto pb-24">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        Kiosk Analytics <BarChart className="text-[#FF6B35]" />
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
      </div>

      <div className="bg-[#1a1a1a] p-6 rounded-[32px] border border-white/5 mb-8">
        <h3 className="font-bold mb-6 flex items-center gap-2">
          Real-time Performance <TrendingUp className="text-green-500" size={18} />
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
    </div>
  );
}
