"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Heart, ArrowBigUpDash, Leaf, Info } from 'lucide-react';
import { FoodItem } from '@/data/foodItems';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function ProfileView() {
  const [vegOnly, setVegOnly] = useState(false);
  const [likedItems, setLikedItems] = useState<FoodItem[]>([]);
  const [wantToTryItems, setWantToTryItems] = useState<FoodItem[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'liked' | 'wantToTry'>('liked');
  const [stats, setStats] = useState({ total: 0, liked: 0, wantToTry: 0, passed: 0 });

  useEffect(() => {
    const savedVeg = localStorage.getItem('vegOnlyMode') === 'true';
    setVegOnly(savedVeg);

    const liked = JSON.parse(localStorage.getItem('likedItems') || '[]');
    setLikedItems(liked);

    const wantToTry = JSON.parse(localStorage.getItem('wantToTryItems') || '[]');
    setWantToTryItems(wantToTry);

    const total = parseInt(localStorage.getItem('swipeCount') || '0');
    const passed = Math.max(0, total - liked.length - wantToTry.length);
    
    setStats({ 
      total, 
      liked: liked.length, 
      wantToTry: wantToTry.length,
      passed
    });
  }, []);

  const toggleVeg = (checked: boolean) => {
    setVegOnly(checked);
    localStorage.setItem('vegOnlyMode', checked.toString());
  };

  const currentDisplayItems = activeSubTab === 'liked' ? likedItems : wantToTryItems;

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto pb-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <button className="text-[#888]"><Settings size={24} /></button>
      </div>

      <div className="bg-gradient-to-br from-[#FF6B35] to-[#B42D42] p-6 rounded-[32px] shadow-2xl mb-8 relative overflow-hidden">
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
            <p className="text-white/60 text-[8px] font-bold uppercase tracking-widest mb-1">⏫ Want</p>
            <p className="text-lg font-black">{stats.wantToTry}</p>
          </div>
          <div>
            <p className="text-white/60 text-[8px] font-bold uppercase tracking-widest mb-1">👎 Pass</p>
            <p className="text-lg font-black">{stats.passed}</p>
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] p-6 rounded-[32px] border border-white/5 mb-8">
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

      <div className="flex bg-[#1a1a1a] p-1 rounded-2xl mb-6">
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
          onClick={() => setActiveSubTab('wantToTry')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-xs",
            activeSubTab === 'wantToTry' ? "bg-[#2a2a2a] text-[#3B82F6]" : "text-[#888]"
          )}
        >
          <ArrowBigUpDash size={14} fill={activeSubTab === 'wantToTry' ? "currentColor" : "none"} />
          Want to Try
        </button>
      </div>

      <AnimatePresence mode="wait">
        {currentDisplayItems.length > 0 ? (
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-2 gap-4"
          >
            {currentDisplayItems.map((item, idx) => (
              <motion.div
                key={`${item.id}-${idx}`}
                className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/5 relative"
              >
                <div className="h-24 w-full relative">
                  <img src={item.imageUrl} className="w-full h-full object-cover opacity-80" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
                  <div className={cn(
                    "absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center text-white",
                    activeSubTab === 'liked' ? "bg-[#FF6B35]" : "bg-[#3B82F6]"
                  )}>
                    {activeSubTab === 'liked' ? <Heart size={12} fill="currentColor" /> : <ArrowBigUpDash size={12} fill="currentColor" />}
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold truncate">{item.name}</p>
                  <p className="text-[10px] text-[#888]">{item.kiosk}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key={`${activeSubTab}-empty`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center py-20 bg-[#1a1a1a] rounded-[32px] border border-dashed border-white/10 text-center px-8"
          >
            <div className="text-4xl mb-4">{activeSubTab === 'liked' ? '❤️' : '⏫'}</div>
            <h4 className="font-bold mb-2">Nothing here yet</h4>
            <p className="text-[12px] text-[#888]">
              {activeSubTab === 'liked' 
                ? "Start swiping right to build your liked history!" 
                : "Swipe up on items you want to try someday!"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
