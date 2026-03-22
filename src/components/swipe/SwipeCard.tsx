"use client"

import React from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Share2, MapPin, MessageSquarePlus } from 'lucide-react';
import { FoodItem } from '@/types/food-item';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

const TinderCard = dynamic(() => import('react-tinder-card'), { ssr: false });

interface SwipeCardProps {
  item: FoodItem;
  onSwipe: (dir: string) => void;
  isActive: boolean;
  index: number;
  onSuggest?: () => void;
  showSuggestButton?: boolean;
}

export default function SwipeCard({ item, onSwipe, isActive, index, onSuggest, showSuggestButton }: SwipeCardProps) {
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

  // Fallback for badly formatted URLs already in the DB
  const safeImageUrl = (() => {
    try {
      new URL(item.imageUrl);
      return item.imageUrl;
    } catch {
      if (item.imageUrl?.startsWith('/')) return item.imageUrl;
      return 'https://placehold.co/400x600/1a1a1a/666?text=No+Image';
    }
  })();

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
        className="relative w-full h-full bg-[#1a1a1a] rounded-[32px] overflow-hidden shadow-2xl border border-white/5 transition-transform duration-300 group"
        style={{
          transform: `scale(${isActive ? 1 : scale}) translateY(${isActive ? 0 : translateY}px)`,
          zIndex: 100 - index,
          opacity: isActive ? 1 : 0.6
        }}
      >
        {/* Background Image Container */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={safeImageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            className="w-full h-full object-cover"
          />
          {/* Gradient from bottom (dark) to top (transparent) */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/60 to-transparent" />
        </div>

        {/* Foreground Content (Overlays on top of the absolute image) */}
        <div className="relative w-full h-full flex flex-col justify-between p-6">
          
          {/* Top Info */}
          <div className="flex justify-between items-start">
            <Badge className="bg-[#FF6B35] border-none text-white font-bold text-[16px] px-3 py-1.5 rounded-xl shadow-lg">
              ₹{item.price}
            </Badge>
            
            <div className="flex flex-col gap-3 items-end">
              <div className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border backdrop-blur-sm ${
                item.isVeg
                  ? 'bg-green-500/30 border-green-500/40 text-green-400'
                  : 'bg-red-500/30 border-red-500/40 text-red-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                {item.isVeg ? 'VEG' : 'NON-VEG'}
              </div>
              <div className="flex gap-2">
                {showSuggestButton && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onSuggest?.(); }}
                    disabled={!isActive}
                    className="bg-black/40 backdrop-blur-md p-3 rounded-full text-[#FF6B35] border border-white/10 hover:bg-black/60 transition-colors shadow-lg disabled:opacity-50"
                  >
                    <MessageSquarePlus size={20} />
                  </button>
                )}
                <button 
                  onClick={share}
                  disabled={!isActive}
                  className="bg-black/40 backdrop-blur-md p-3 rounded-full text-white border border-white/10 hover:bg-black/60 transition-colors shadow-lg disabled:opacity-50"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="pb-2">
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight drop-shadow-md">{item.name}</h2>
            <div className="flex items-center gap-2 text-[#ccc] drop-shadow-sm">
              <MapPin size={16} className="text-[#FF6B35]" />
              <span className="text-sm font-semibold">{item.kiosk}</span>
              <span className="text-white/20">·</span>
              <span className="text-sm">{item.location}</span>
            </div>
          </div>
        </div>
      </div>
    </TinderCard>
  );
}
