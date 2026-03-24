"use client"

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Share2 } from 'lucide-react';
import { cn, toSafeImageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  useTrends,
  TimePeriod,
  CuisineCategory,
  PriceFilter,
  CUISINE_CATEGORIES,
  PRICE_FILTERS,
  RankedTrendItem,
  CampusMood,
} from '@/hooks/use-trends';

// ────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────

function TimePeriodTabs({
  value,
  onChange,
}: {
  value: TimePeriod;
  onChange: (v: TimePeriod) => void;
}) {
  const tabs: { key: TimePeriod; label: string }[] = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
  ];

  return (
    <div className="bg-white/5 rounded-2xl p-1 flex mb-4 flex-shrink-0">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            'flex-1 py-3 rounded-xl text-xs font-bold transition-all',
            value === t.key
              ? 'bg-[#1a1a1a] text-[#FF6B35] shadow-lg'
              : 'text-[#888]',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function FilterPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="relative">
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar pr-8">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 border whitespace-nowrap',
              value === opt
                ? 'bg-[#FF6B35] border-[#FF6B35] text-white'
                : 'bg-[#2a2a2a] border-transparent text-white',
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="absolute top-0 right-0 bottom-2 w-12 bg-gradient-to-l from-[#0f0f0f] to-transparent pointer-events-none" />
    </div>
  );
}

function CampusMoodCard({
  mood,
  timePeriod,
}: {
  mood: CampusMood;
  timePeriod: 'weekly' | 'monthly';
}) {
  const periodWord = timePeriod === 'weekly' ? 'week' : 'month';

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-[#1a1a1a] rounded-2xl p-4 mb-6 border-l-4 border-[#FF6B35] flex items-center gap-4"
    >
      <span className="text-4xl flex-shrink-0">{mood.emoji}</span>
      <div>
        <p className="font-bold text-sm text-white">
          This {periodWord} LPU is craving {mood.cuisine}
        </p>
        <p className="text-[#888] text-xs mt-1">
          {mood.swipeCount} swipes in this category
        </p>
      </div>
    </motion.div>
  );
}

function RankMovement({ movement }: { movement: number | null }) {
  if (movement === null) return null;

  // Rising Fast: moved up 4+
  if (movement >= 4) {
    return (
      <span className="bg-[#FF6B35] text-white text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1">
        🔥 Rising Fast
      </span>
    );
  }

  if (movement > 0) {
    return (
      <span className="text-[#22c55e] text-[11px] font-bold whitespace-nowrap">
        ▲{movement}
      </span>
    );
  }

  if (movement < 0) {
    return (
      <span className="text-[#ef4444] text-[11px] font-bold whitespace-nowrap">
        ▼{Math.abs(movement)}
      </span>
    );
  }

  return <span className="text-[#888] text-[11px] font-bold">—</span>;
}

function RankingItem({
  item,
  rank,
  index,
}: {
  item: RankedTrendItem;
  rank: number;
  index: number;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/5 flex items-center gap-3"
    >
      {/* Rank */}
      <span className="text-lg font-black text-white min-w-[24px] text-center">
        {rank}
      </span>

      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
        <Image
          src={toSafeImageUrl(item.imageUrl)}
          alt={item.name}
          width={48}
          height={48}
          unoptimized
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-bold text-sm text-white truncate">{item.name}</h3>
          <RankMovement movement={item.rankMovement} />
        </div>

        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[10px] text-[#888]">{item.kiosk}</span>
          <span className="bg-[#2a2a2a] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
            {item.cuisine}
          </span>
          <span className="text-[#FF6B35] text-[10px] font-bold">₹{item.price}</span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(item.likeRate)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-[#FF6B35]"
            />
          </div>
          <span className="text-[10px] font-bold text-[#FF6B35] flex-shrink-0">
            {Math.round(item.likeRate)}%
          </span>
          <span className="text-[10px] text-[#888] flex-shrink-0">
            {item.totalSwipes} swipes
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────
// Empty states
// ────────────────────────────────────────────

function EmptyFiltered() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-5xl mb-4">🍽️</span>
      <h3 className="text-xl font-bold mb-2">Nothing here yet</h3>
      <p className="text-[#888] text-sm">No swipes recorded for this combination yet</p>
    </div>
  );
}

function EmptyNoData() {
  const handleShare = async () => {
    const text = 'Check out SwipeBite — discover trending food on campus! 🔥';
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ text, url });
      } catch {
        // User cancelled
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-8">
      <span className="text-5xl mb-4">📊</span>
      <h3 className="text-xl font-bold mb-2">No trends yet</h3>
      <p className="text-[#888] text-sm mb-8">
        Share SwipeBite with friends to start seeing trends
      </p>
      <Button
        onClick={handleShare}
        className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 rounded-2xl px-8 py-6 text-base font-bold gap-2"
      >
        <Share2 size={18} />
        Share SwipeBite
      </Button>
    </div>
  );
}

// ────────────────────────────────────────────
// Section header per period
// ────────────────────────────────────────────

function sectionHeader(period: TimePeriod): string {
  switch (period) {
    case 'daily': return "Today's Top Picks 🍽️";
    case 'weekly': return "This Week's Rankings 📈";
    case 'monthly': return "This Month's Rankings 🗓️";
  }
}

// ────────────────────────────────────────────
// Loading skeleton
// ────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="flex-1 flex flex-col p-6 pb-24 space-y-4">
      <div className="h-12 bg-white/5 rounded-2xl animate-pulse" />
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 w-24 bg-white/5 rounded-full animate-pulse flex-shrink-0" />
        ))}
      </div>
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 w-20 bg-white/5 rounded-full animate-pulse flex-shrink-0" />
        ))}
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

// ────────────────────────────────────────────
// Main Trends Screen
// ────────────────────────────────────────────

export default function TrendingView() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('daily');
  const [cuisineFilter, setCuisineFilter] = useState<CuisineCategory>('All');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('All');

  const { rankedItems, campusMood, loading, hasAnyData } = useTrends(
    timePeriod,
    cuisineFilter,
    priceFilter,
  );

  const priceLabels = PRICE_FILTERS.map(p => p.label);

  const handlePriceChange = useCallback((v: string) => {
    setPriceFilter(v as PriceFilter);
  }, []);

  const handleCuisineChange = useCallback((v: string) => {
    setCuisineFilter(v as CuisineCategory);
  }, []);

  if (loading) return <LoadingSkeleton />;

  // No data at all
  if (!hasAnyData) {
    return (
      <div className="flex-1 flex flex-col p-6 overflow-y-auto pb-24 no-select">
        <div className="flex items-center gap-2 mb-6">
          <h1 className="text-2xl font-bold">Trends</h1>
          <Flame className="text-[#FF6B35]" />
        </div>
        <EmptyNoData />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto pb-24 no-select">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">Trends</h1>
        <Flame className="text-[#FF6B35]" />
      </div>

      {/* Layer 1: Time Period */}
      <TimePeriodTabs value={timePeriod} onChange={setTimePeriod} />

      {/* Layer 2: Cuisine Filter */}
      <div className="flex-shrink-0">
        <FilterPills
          options={CUISINE_CATEGORIES}
          value={cuisineFilter}
          onChange={handleCuisineChange}
        />
      </div>

      {/* Layer 3: Price Filter */}
      <div className="mt-2 mb-6 flex-shrink-0">
        <FilterPills
          options={priceLabels}
          value={priceFilter}
          onChange={handlePriceChange}
        />
      </div>

      {/* Campus Mood Card (weekly/monthly only) */}
      <AnimatePresence mode="wait">
        {campusMood && timePeriod !== 'daily' && (
          <CampusMoodCard
            key={timePeriod}
            mood={campusMood}
            timePeriod={timePeriod as 'weekly' | 'monthly'}
          />
        )}
      </AnimatePresence>

      {/* Section Header */}
      <h2 className="text-base font-bold mb-4 text-white">
        {sectionHeader(timePeriod)}
      </h2>

      {/* Rankings List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {rankedItems.length > 0 ? (
            rankedItems.map((item, index) => (
              <RankingItem
                key={item.id}
                item={item}
                rank={index + 1}
                index={index}
              />
            ))
          ) : (
            <EmptyFiltered />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
