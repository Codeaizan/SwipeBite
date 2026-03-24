'use client';

import { useMemo } from 'react';
import { collection, query, where, limit } from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { FoodItem } from '@/types/food-item';
import { SwipeDoc } from '@/types/firestore';
import { QUERY_LIMITS } from '@/lib/query-limits';

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

export type TimePeriod = 'daily' | 'weekly' | 'monthly';

export const CUISINE_CATEGORIES = [
  'All',
  'North Indian Curries',
  'South Indian',
  'Tandoor',
  'Street Food',
  'Asian',
  'Continental',
  'Desserts & Drinks',
] as const;

export type CuisineCategory = (typeof CUISINE_CATEGORIES)[number];

export const CUISINE_EMOJIS: Record<string, string> = {
  'North Indian Curries': '🍛',
  'South Indian': '🌶️',
  'Tandoor': '🔥',
  'Street Food': '🥙',
  'Asian': '🍜',
  'Continental': '🍝',
  'Desserts & Drinks': '🍮',
};

export const PRICE_FILTERS = [
  { label: 'All', max: Infinity },
  { label: 'Under ₹50', max: 50 },
  { label: 'Under ₹100', max: 100 },
  { label: 'Under ₹200', max: 200 },
] as const;

export type PriceFilter = (typeof PRICE_FILTERS)[number]['label'];

// ────────────────────────────────────────────
// Deterministic helpers
// ────────────────────────────────────────────

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function assignCuisine(item: FoodItem): string {
  if (item.cuisine) return item.cuisine;
  const cats = CUISINE_CATEGORIES.filter(c => c !== 'All');
  return cats[hashString(item.id) % cats.length];
}

function getRankMovement(itemId: string, period: 'weekly' | 'monthly'): number {
  const seed = hashString(itemId + period);
  const range = 9;
  return (seed % range) - 4;
}

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface RankedTrendItem extends FoodItem {
  cuisine: string;
  likes: number;
  wantToTry: number;
  totalSwipes: number;
  likeRate: number;
  rankMovement: number | null;
}

export interface CampusMood {
  cuisine: string;
  emoji: string;
  swipeCount: number;
}

export interface UseTrendsResult {
  rankedItems: RankedTrendItem[];
  campusMood: CampusMood | null;
  loading: boolean;
  hasAnyData: boolean;
}

// ────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────

export function useTrends(
  timePeriod: TimePeriod,
  cuisineFilter: CuisineCategory,
  priceFilter: PriceFilter,
): UseTrendsResult {
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();

  // ─── FIX 1: Query construction only depends on db, not user ───
  // Removing 'user' from deps prevents the query object from being
  // recreated on every auth state change, which was causing the
  // useCollection queryEqual check to block listener restarts.
  const itemsQuery = useMemo(
    () => db
      ? query(collection(db, 'items'), where('isAvailable', '==', true), limit(QUERY_LIMITS.items))
      : null,
    [db], // ← removed 'user'
  );

  const swipesQuery = useMemo(
    () => db
      ? query(collection(db, 'swipes'), limit(QUERY_LIMITS.trendingSwipes))
      : null,
    [db], // ← removed 'user'
  );

  // ─── FIX 2: Auth guard moved here, not inside query construction ───
  // Pass null to useCollection until auth is fully resolved.
  // This prevents the permission-denied error that killed the listener
  // before Fix 1 stabilized the query reference.
  const { data: itemsData = [], loading: itemsLoading } = useCollection<FoodItem>(
    !authLoading && user ? itemsQuery : null
  );
  const { data: swipes = [], loading: swipesLoading } = useCollection<SwipeDoc>(
    !authLoading && user ? swipesQuery : null
  );

  if (process.env.NODE_ENV === 'development') {
    console.log('[useTrends] Swipes data:', {
      swipesCount: swipes.length,
      itemsCount: itemsData.length,
      loading: swipesLoading,
    });
  }

  const items = useMemo(() => {
    try {
      if (typeof window !== 'undefined') {
        const vegOnly = localStorage.getItem('vegOnlyMode') === 'true';
        if (vegOnly) return itemsData.filter(i => i.isVeg);
      }
    } catch {
      // ignore
    }
    return itemsData;
  }, [itemsData]);

  const loading = authLoading || itemsLoading || swipesLoading;
  const hasAnyData = itemsData.length > 0 && swipes.length > 0;

  const now = Date.now();
  const periodMs = useMemo(() => {
    switch (timePeriod) {
      case 'daily': return 24 * 60 * 60 * 1000;
      case 'weekly': return 7 * 24 * 60 * 60 * 1000;
      case 'monthly': return 30 * 24 * 60 * 60 * 1000;
    }
  }, [timePeriod]);

  const allRankedItems = useMemo<RankedTrendItem[]>(() => {
    if (!hasAnyData) return [];

    return items.map(item => {
      const cuisine = assignCuisine(item);
      const itemSwipes = swipes.filter(s => {
        if (s.itemId !== item.id) return false;
        if (!s.timestamp) return true;

        let ts = 0;
        try {
          const stamp = s.timestamp as any;
          if (typeof stamp.toMillis === 'function') {
            ts = stamp.toMillis();
          } else if (typeof stamp.seconds === 'number') {
            ts = stamp.seconds * 1000;
          } else if (typeof stamp.toDate === 'function') {
            ts = stamp.toDate().getTime();
          } else {
            ts = new Date(stamp).getTime();
          }
        } catch {
          return true;
        }

        if (isNaN(ts) || ts === 0) return true;
        return (now - ts) <= periodMs;
      });

      const totalSwipes = itemSwipes.length;
      const likes = itemSwipes.filter(s => s.direction === 'right').length;
      const wantToTry = itemSwipes.filter(s => s.direction === 'up').length;
      const likeRate = totalSwipes > 0 ? (likes / totalSwipes) * 100 : 0;

      if (process.env.NODE_ENV === 'development' && totalSwipes > 0) {
        console.log(`[useTrends] Item "${item.name}": ${totalSwipes} swipes (${likes} likes, ${wantToTry} try-laters)`, itemSwipes);
      }

      const rankMovement =
        timePeriod === 'daily' ? null : getRankMovement(item.id, timePeriod);

      return {
        ...item,
        cuisine,
        likes,
        wantToTry,
        totalSwipes,
        likeRate,
        rankMovement,
      };
    }).sort((a, b) => b.likeRate - a.likeRate);
  }, [items, swipes, timePeriod, periodMs, hasAnyData, now]);

  const rankedItems = useMemo<RankedTrendItem[]>(() => {
    let filtered = allRankedItems;

    if (cuisineFilter !== 'All') {
      filtered = filtered.filter(i => i.cuisine === cuisineFilter);
    }

    const priceConfig = PRICE_FILTERS.find(p => p.label === priceFilter);
    if (priceConfig && priceConfig.max !== Infinity) {
      filtered = filtered.filter(i => i.price < priceConfig.max);
    }

    return filtered;
  }, [allRankedItems, cuisineFilter, priceFilter]);

  const campusMood = useMemo<CampusMood | null>(() => {
    if (timePeriod === 'daily' || !hasAnyData) return null;

    const cuisineCounts: Record<string, number> = {};
    for (const item of allRankedItems) {
      cuisineCounts[item.cuisine] = (cuisineCounts[item.cuisine] || 0) + item.totalSwipes;
    }

    let topCuisine = '';
    let topCount = 0;
    for (const [cuisine, count] of Object.entries(cuisineCounts)) {
      if (count > topCount) {
        topCuisine = cuisine;
        topCount = count;
      }
    }

    if (!topCuisine) return null;

    return {
      cuisine: topCuisine,
      emoji: CUISINE_EMOJIS[topCuisine] || '🍽️',
      swipeCount: topCount,
    };
  }, [timePeriod, allRankedItems, hasAnyData]);

  return { rankedItems, campusMood, loading, hasAnyData };
}
