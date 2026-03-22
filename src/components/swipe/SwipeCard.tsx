"use client"

import React from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Share2, MapPin } from 'lucide-react';
import { FoodItem } from '@/types/food-item';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

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
      } catch {
        // User cancelled share sheet; no action required.
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast({ title: 'Link copied', description: 'Share link copied to clipboard.' });
      } catch {
        toast({
          variant: 'destructive',
          title: 'Share failed',
          description: 'Unable to copy share link on this device.',
        });
      }
    }
  };

  const scale = 1 - (index * 0.05);
  const translateY = index * 20;

  return (
    <TinderCard
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
      onSwipe={onSwipe}
      preventSwipe={['down']}
      swipeRequirementType="position"
      swipeThreshold={80}
    >
      <div 
        className="relative w-full h-[600px] bg-[#1a1a1a] rounded-[32px] overflow-hidden shadow-2xl border border-white/5 transition-transform duration-300 group"
        style={{
          transform: `scale(${isActive ? 1 : scale}) translateY(${isActive ? 0 : translateY}px)`,
          zIndex: 100 - index,
          opacity: isActive ? 1 : 0.6
        }}
      >
        <div className="relative w-full h-[65%] overflow-hidden">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent opacity-60" />
          
          <Badge className="absolute top-6 left-6 bg-[#FF6B35] border-none text-white font-bold text-lg px-3 py-1 rounded-xl">
            ₹{item.price}
          </Badge>
          
          <div className="absolute top-6 right-6 flex flex-col gap-3 items-end">
            <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border ${
              item.isVeg
                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                : 'bg-red-500/20 border-red-500/30 text-red-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
              {item.isVeg ? 'VEG' : 'NON-VEG'}
            </div>
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
            <h2 className="text-3xl font-bold text-white mb-2">{item.name}</h2>
            <div className="flex items-center gap-2 text-[#888]">
              <MapPin size={14} className="text-[#FF6B35]" />
              <span className="text-sm font-medium">{item.kiosk}</span>
              <span className="text-white/20">·</span>
              <span className="text-sm">{item.location}</span>
            </div>
          </div>
          
          <div className="border-t border-white/5 pt-4 flex items-center justify-between">
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-[10px] text-[#888] uppercase font-bold tracking-wider">Swipe Left</p>
                <p className="text-xs text-[#888] mt-0.5">👎 Nope</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[#3B82F6] uppercase font-bold tracking-wider">Swipe Up</p>
                <p className="text-xs text-[#3B82F6] mt-0.5">⏫ Try Later</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[#FF6B35] uppercase font-bold tracking-wider">Swipe Right</p>
                <p className="text-xs text-[#FF6B35] mt-0.5">❤️ Love It</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TinderCard>
  );
}
