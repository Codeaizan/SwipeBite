"use client"

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, TrendingUp, AlertCircle, Share2, TrendingDown } from 'lucide-react';
import { foodItems, FoodItem } from '@/data/foodItems';
import { cn } from '@/lib/utils';

export default function DashboardView() {
  const [swipeCount, setSwipeCount] = useState(0);

  useEffect(() => {
    setSwipeCount(parseInt(localStorage.getItem('swipeCount') || '0'));
  }, []);

  const topItems = [...foodItems]
    .sort((a, b) => (b.likes / b.totalSwipes) - (a.likes / a.totalSwipes))
    .slice(0, 5);

  const lowItems = [...foodItems]
    .sort((a, b) => (a.likes / a.totalSwipes) - (b.likes / b.totalSwipes))
    .slice(0, 3);

  if (swipeCount < 5) {
    return (
      <div className="flex-1 flex flex-col p-8 items-center justify-center text-center">
        <div className="text-7xl mb-6">📲</div>
        <h2 className="text-2xl font-bold mb-2">No data yet</h2>
        <p className="text-[#888] mb-8">Share the app with friends to gather votes</p>
        <button className="bg-[#FF6B35] text-white font-bold py-4 px-8 rounded-2xl flex items-center gap-2">
          <Share2 size={20} />
          Share SwipeBite
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto pb-24">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        Kiosk Analytics <BarChart className="text-[#FF6B35]" />
      </h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#1a1a1a] p-5 rounded-[24px] border border-white/5">
          <p className="text-[12px] font-bold text-[#888] uppercase mb-1">Total Swipes</p>
          <p className="text-3xl font-black text-white">{swipeCount}</p>
        </div>
        <div className="bg-[#1a1a1a] p-5 rounded-[24px] border border-white/5">
          <p className="text-[12px] font-bold text-[#888] uppercase mb-1">Avg Like Rate</p>
          <p className="text-3xl font-black text-[#FF6B35]">64%</p>
        </div>
      </div>

      <div className="bg-[#1a1a1a] p-6 rounded-[32px] border border-white/5 mb-8">
        <h3 className="font-bold mb-6 flex items-center gap-2">
          Top Performance <TrendingUp className="text-green-500" size={18} />
        </h3>
        <div className="space-y-4">
          {topItems.map((item, idx) => {
            const rate = Math.round((item.likes / item.totalSwipes) * 100);
            return (
              <div key={item.id} className="space-y-1">
                <div className="flex justify-between text-xs font-bold px-1">
                  <span className="truncate max-w-[150px]">{item.name}</span>
                  <span className="text-[#FF6B35]">{rate}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${rate}%` }}
                    className="h-full bg-gradient-to-r from-[#FF6B35] to-[#B42D42]"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-[32px]">
        <h3 className="font-bold mb-4 flex items-center gap-2 text-red-400">
          Needs Improvement <AlertCircle size={18} />
        </h3>
        <div className="space-y-3">
          {lowItems.map(item => (
            <div key={item.id} className="bg-black/20 p-4 rounded-2xl flex items-center justify-between border border-white/5">
              <div>
                <p className="font-bold text-sm">{item.name}</p>
                <p className="text-[10px] text-[#888]">{item.location}</p>
              </div>
              <div className="flex items-center gap-1 text-red-400 font-bold text-sm">
                <TrendingDown size={14} />
                {Math.round((item.likes / item.totalSwipes) * 100)}%
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-red-400/60 mt-4 text-center italic">Consider improving these items based on feedback</p>
      </div>
    </div>
  );
}
