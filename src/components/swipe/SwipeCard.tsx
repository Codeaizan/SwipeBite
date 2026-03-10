"use client"

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Share2 } from 'lucide-react';
import { FoodItem } from '@/data/foodItems';
import { Badge } from '@/components/ui/badge';

const TinderCard = dynamic(() => import('react-tinder-card'), { ssr: false });

interface SwipeCardProps {
  item: FoodItem;
  onSwipe: (dir: string) => void;
  isActive: boolean;
  index: number;
}

export default function SwipeCard({ item, onSwipe, isActive, index }: SwipeCardProps) {
  const share = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Try ${item.name} at ${item.kiosk} on SwipeBite! 🔥`;
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({ text, url });
      } catch (err) {
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      // Toast would be nice but rules say toast only for errors
    }
  };

  const scale = 1 - (index * 0.05);
  const translateY = index * 20;

  return (
    <TinderCard
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
      onSwipe={onSwipe}
      preventSwipe={['up', 'down']}
      swipeRequirementType="position"
      swipeThreshold={100}
    >
      <div 
        className="relative w-full h-[600px] bg-[#1a1a1a] rounded-[32px] overflow-hidden shadow-2xl border border-white/5 transition-transform duration-300"
        style={{
          transform: `scale(${isActive ? 1 : scale}) translateY(${isActive ? 0 : translateY}px)`,
          zIndex: 100 - index,
          opacity: isActive ? 1 : 0.6
        }}
      >
        <div className="relative w-full h-[65%] overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent opacity-60" />
          
          <Badge className="absolute top-6 left-6 bg-[#FF6B35] border-none text-white font-bold text-lg px-3 py-1 rounded-xl">
            ₹{item.price}
          </Badge>
          
          <div className="absolute top-6 right-6 flex flex-col gap-3 items-end">
            <div className={`w-3 h-3 rounded-full shadow-lg ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
            <button 
              onClick={share}
              className="bg-black/40 backdrop-blur-md p-3 rounded-full text-white border border-white/10 hover:bg-black/60 transition-colors"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>

        <div className="p-8 flex flex-col justify-between h-[35%]">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">{item.name}</h2>
            <p className="text-[#888] text-lg font-medium">{item.location}</p>
          </div>
          
          <div className="border-t border-white/5 pt-4 flex items-center gap-2">
            <span className="text-xl">❤️</span>
            <span className="text-white/80 font-medium">
              <span className="font-bold text-white">{item.likes}</span> students liked this
            </span>
          </div>
        </div>
      </div>
    </TinderCard>
  );
}
