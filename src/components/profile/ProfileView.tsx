"use client"

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Heart, History, Leaf, Info } from 'lucide-react';
import { FoodItem } from '@/data/foodItems';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function ProfileView() {
  const [vegOnly, setVegOnly] = useState(false);
  const [likedItems, setLikedItems] = useState<FoodItem[]>([]);
  const [stats, setStats] = useState({ total: 0, liked: 0, rate: 0 });

  useEffect(() => {
    const savedVeg = localStorage.getItem('vegOnlyMode') === 'true';
    setVegOnly(savedVeg);

    const liked = JSON.parse(localStorage.getItem('likedItems') || '[]');
    setLikedItems(liked);

    const total = parseInt(localStorage.getItem('swipeCount') || '0');
    const rate = total > 0 ? Math.round((liked.length / total) * 100) : 0;
    setStats({ total, liked: liked.length, rate });
  }, []);

  const toggleVeg = (checked: boolean) => {
    setVegOnly(checked);
    localStorage.setItem('vegOnlyMode', checked.toString());
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto pb-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <button className="text-[#888]"><Settings size={24} /></button>
      </div>

      <div className="bg-gradient-to-br from-[#FF6B35] to-[#B42D42] p-8 rounded-[40px] shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex justify-around text-center">
          <div>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Swipes</p>
            <p className="text-2xl font-black">{stats.total}</p>
          </div>
          <div className="w-px h-10 bg-white/20 self-center" />
          <div>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Liked</p>
            <p className="text-2xl font-black">{stats.liked}</p>
          </div>
          <div className="w-px h-10 bg-white/20 self-center" />
          <div>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Rate</p>
            <p className="text-2xl font-black">{stats.rate}%</p>
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

      <div className="flex items-center gap-2 mb-4">
        <Heart size={18} className="text-[#FF6B35]" />
        <h3 className="font-bold">Swipe History</h3>
      </div>

      {likedItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {likedItems.map((item, idx) => (
            <motion.div
              key={`${item.id}-${idx}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/5"
            >
              <div className="h-24 w-full relative">
                <img src={item.imageUrl} className="w-full h-full object-cover opacity-80" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
              </div>
              <div className="p-3">
                <p className="text-xs font-bold truncate">{item.name}</p>
                <p className="text-[10px] text-[#888]">{item.kiosk}</p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-20 bg-[#1a1a1a] rounded-[32px] border border-dashed border-white/10 text-center px-8">
          <Heart size={48} className="text-white/10 mb-4" />
          <h4 className="font-bold mb-2">You haven't liked anything yet</h4>
          <p className="text-[12px] text-[#888]">Start swiping to build your history!</p>
        </div>
      )}
    </div>
  );
}
