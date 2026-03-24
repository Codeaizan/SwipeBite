"use client"

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Plus, Trash2, Eye, EyeOff, Heart, ArrowBigUpDash,
  TrendingUp, Package, BarChart, Loader2, X, MessageSquarePlus, BarChart3, MessageSquare
} from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc, query, limit, where, orderBy } from 'firebase/firestore';
import { FoodItem } from '@/types/food-item';
import { KioskDoc, SwipeDoc, SuggestionDoc, PollDoc, FeedbackDoc } from '@/types/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn, toSafeImageUrl } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useDoc } from '@/firebase';
import { QUERY_LIMITS } from '@/lib/query-limits';
import { CUISINE_CATEGORIES } from '@/hooks/use-trends';

type KioskItem = FoodItem & { isAvailable?: boolean };

export default function AdminPanel({ kiosk, onLogout }: { kiosk: string; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'items' | 'analytics' | 'suggestions' | 'polls' | 'feedback'>('items');
  const db = useFirestore();

  const kioskDocId = kiosk.toLowerCase().replace(/\s+/g, '-');
  const kioskDocRef = useMemo(() => db ? doc(db, 'kiosks', kioskDocId) : null, [db, kioskDocId]);
  const { data: kioskDoc } = useDoc<KioskDoc>(kioskDocRef);
  const kioskLocation = kioskDoc?.location || '';

  const itemsQuery = useMemo(() => db ? query(collection(db, 'items'), where('kiosk', '==', kiosk), limit(QUERY_LIMITS.items)) : null, [db, kiosk]);
  const swipesQuery = useMemo(() => db ? query(collection(db, 'swipes'), orderBy('timestamp', 'desc'), limit(QUERY_LIMITS.swipes)) : null, [db]);

  const { data: kioskItems = [], loading: itemsLoading } = useCollection<KioskItem>(itemsQuery);
  const { data: allSwipes = [], loading: swipesLoading } = useCollection<SwipeDoc>(swipesQuery);

  const kioskSwipes = useMemo(() => {
    const kioskItemIds = new Set(kioskItems.map(i => i.id));
    return allSwipes.filter(s => kioskItemIds.has(s.itemId));
  }, [allSwipes, kioskItems]);

  const loading = itemsLoading || swipesLoading;

  return (
    <div className="min-h-[100dvh] bg-[#0f0f0f] text-white">
      <div className="max-w-2xl mx-auto p-6 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">{kiosk}</h1>
            <p className="text-[#888] text-sm">Owner Dashboard</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-[#888] hover:text-white transition-colors text-sm"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#1a1a1a] p-1 rounded-2xl mb-8 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('items')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm whitespace-nowrap",
              activeTab === 'items' ? "bg-[#2a2a2a] text-[#FF6B35]" : "text-[#888]"
            )}
          >
            <Package size={14} /> Items
          </button>
          <button
            onClick={() => setActiveTab('polls')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm whitespace-nowrap",
              activeTab === 'polls' ? "bg-[#2a2a2a] text-[#FF6B35]" : "text-[#888]"
            )}
          >
            <BarChart3 size={14} /> Polls
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm whitespace-nowrap",
              activeTab === 'suggestions' ? "bg-[#2a2a2a] text-[#FF6B35]" : "text-[#888]"
            )}
          >
            <MessageSquarePlus size={14} /> Tips
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm whitespace-nowrap",
              activeTab === 'feedback' ? "bg-[#2a2a2a] text-[#FF6B35]" : "text-[#888]"
            )}
          >
            <MessageSquare size={14} /> Feedback
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm whitespace-nowrap",
              activeTab === 'analytics' ? "bg-[#2a2a2a] text-[#FF6B35]" : "text-[#888]"
            )}
          >
            <BarChart size={14} /> Stats
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#FF6B35]" size={32} />
          </div>
        ) : activeTab === 'items' ? (
          <ItemsTab items={kioskItems} kiosk={kiosk} kioskLocation={kioskLocation} db={db} />
        ) : activeTab === 'suggestions' ? (
          <SuggestionsTab kiosk={kiosk} db={db} />
        ) : activeTab === 'polls' ? (
          <KioskPollsTab kiosk={kiosk} db={db} />
        ) : activeTab === 'feedback' ? (
          <FeedbackTab kiosk={kiosk} db={db} />
        ) : (
          <AnalyticsTab items={kioskItems} swipes={kioskSwipes} />
        )}
      </div>
    </div>
  );
}

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Items Tab Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

function ItemsTab({ items, kiosk, kioskLocation, db }: { items: KioskItem[]; kiosk: string; kioskLocation: string; db: ReturnType<typeof useFirestore> }) {
  const [showForm, setShowForm] = useState(false);

  const toggleAvailability = async (item: FoodItem) => {
    if (!db) return;
    await updateDoc(doc(db, 'items', item.id), { isAvailable: !item.isAvailable });
  };

  const deleteItem = async (item: FoodItem) => {
    if (!db) return;
    await deleteDoc(doc(db, 'items', item.id));
    toast({ title: 'Item deleted', description: `${item.name} removed.` });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-lg">{items.length} items</h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 rounded-xl font-bold text-sm gap-2"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Add Item'}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <AddItemForm kiosk={kiosk} kioskLocation={kioskLocation} db={db} onDone={() => setShowForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {items.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <span className="text-5xl mb-4">Ã°Å¸â€œâ€¹</span>
          <h3 className="font-bold text-lg mb-2">No items yet</h3>
          <p className="text-[#888] text-sm">Add food items to your kiosk menu.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <motion.div
              key={item.id}
              layout
              className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/5 flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                <Image
                  src={toSafeImageUrl(item.imageUrl)}
                  width={56}
                  height={56}
                  unoptimized
                  className="w-full h-full object-cover"
                  alt={item.name}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm truncate">{item.name}</h3>
                <p className="text-[10px] text-[#888]">Ã¢â€šÂ¹{item.price} Ã‚Â· {item.isVeg ? 'Ã°Å¸Å¸Â¢ Veg' : 'Ã°Å¸â€Â´ Non-Veg'}</p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => toggleAvailability(item)}
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                    item.isAvailable
                      ? "bg-green-500/10 text-green-500"
                      : "bg-red-500/10 text-red-500"
                  )}
                  title={item.isAvailable ? 'Available - click to hide' : 'Hidden - click to show'}
                >
                  {item.isAvailable ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => deleteItem(item)}
                  className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Add Item Form Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

const FOOD_CATEGORIES = CUISINE_CATEGORIES.filter(c => c !== 'All');

function AddItemForm({ kiosk, kioskLocation, db, onDone }: { kiosk: string; kioskLocation: string; db: ReturnType<typeof useFirestore>; onDone: () => void }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [cuisine, setCuisine] = useState<string>(FOOD_CATEGORIES[0]);
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !name.trim() || !price) return;
    setSaving(true);

    let finalImageUrl = imageUrl.trim();
    if (finalImageUrl) {
      try {
        new URL(finalImageUrl);
      } catch {
        toast({ variant: 'destructive', title: 'Invalid Image URL', description: 'Please enter a valid web link starting with http:// or https://' });
        setSaving(false);
        return;
      }
    } else {
      finalImageUrl = 'https://placehold.co/400x600/1a1a1a/666?text=Food';
    }

    const id = `${kiosk.replace(/\s+/g, '').toLowerCase()}_${Date.now()}`;
    await setDoc(doc(db, 'items', id), {
      name: name.trim(),
      kiosk,
      location: kioskLocation || kiosk,
      price: parseInt(price),
      isVeg,
      cuisine,
      imageUrl: finalImageUrl,
      isAvailable: true,
    });

    toast({ title: 'Item added!', description: `${name.trim()} added to ${kiosk}.` });
    setSaving(false);
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 space-y-4 mb-2">
      <div>
        <label className="text-xs font-bold text-[#888] uppercase tracking-wider mb-1 block">Name</label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Paneer Tikka"
          className="bg-[#0f0f0f] border-white/10 rounded-xl h-11 text-white" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-[#888] uppercase tracking-wider mb-1 block">Price (Ã¢â€šÂ¹)</label>
          <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="80" min="1"
            className="bg-[#0f0f0f] border-white/10 rounded-xl h-11 text-white" required />
        </div>
        <div className="flex items-end">
          <div className="flex items-center gap-3 h-11">
            <Switch checked={isVeg} onCheckedChange={setIsVeg} />
            <span className="text-sm font-bold">{isVeg ? 'Ã°Å¸Å¸Â¢ Veg' : 'Ã°Å¸â€Â´ Non-Veg'}</span>
          </div>
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-[#888] uppercase tracking-wider mb-1 block">Category</label>
        <select
          value={cuisine}
          onChange={e => setCuisine(e.target.value)}
          className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl h-11 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 appearance-none cursor-pointer"
        >
          {FOOD_CATEGORIES.map(cat => (
            <option key={cat} value={cat} className="bg-[#1a1a1a] text-white">{cat}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-bold text-[#888] uppercase tracking-wider mb-1 block">Image URL (optional)</label>
        <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..."
          className="bg-[#0f0f0f] border-white/10 rounded-xl h-11 text-white" />
      </div>
      <Button type="submit" disabled={saving || !name.trim() || !price}
        className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 font-bold rounded-xl py-5">
        {saving ? <Loader2 className="animate-spin" size={18} /> : 'Add Item'}
      </Button>
    </form>
  );
}

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Analytics Tab Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

function AnalyticsTab({ items, swipes }: { items: FoodItem[]; swipes: SwipeDoc[] }) {
  const totalSwipes = swipes.length;
  const totalLikes = swipes.filter(s => s.direction === 'right').length;
  const totalWants = swipes.filter(s => s.direction === 'up').length;
  const totalPasses = swipes.filter(s => s.direction === 'left').length;

  const itemStats = useMemo(() => {
    return items.map(item => {
      const itemSwipes = swipes.filter(s => s.itemId === item.id);
      const likes = itemSwipes.filter(s => s.direction === 'right').length;
      const wants = itemSwipes.filter(s => s.direction === 'up').length;
      const total = itemSwipes.length;
      const likeRate = total > 0 ? Math.round((likes / total) * 100) : 0;
      return { ...item, likes, wants, total, likeRate };
    }).sort((a, b) => b.likeRate - a.likeRate);
  }, [items, swipes]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Swipes" value={totalSwipes} />
        <StatCard label="Likes" value={totalLikes} color="text-[#FF6B35]" />
        <StatCard label="Want to Try" value={totalWants} color="text-[#3B82F6]" />
        <StatCard label="Disliked" value={totalPasses} color="text-[#888]" />
      </div>

      {/* Per-item Breakdown */}
      <div className="bg-[#1a1a1a] p-6 rounded-[32px] border border-white/5">
        <h3 className="font-bold mb-6 flex items-center gap-2">
          Item Performance <TrendingUp className="text-green-500" size={18} />
        </h3>

        {itemStats.length === 0 ? (
          <p className="text-[#888] text-sm text-center py-8">No items to show.</p>
        ) : (
          <div className="space-y-5">
            {itemStats.map(item => (
              <div key={item.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm truncate max-w-[160px]">{item.name}</span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#FF6B35]">
                      <Heart size={10} fill="currentColor" /> {item.likeRate}%
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#3B82F6]">
                      <ArrowBigUpDash size={10} fill="currentColor" /> {item.wants}
                    </span>
                    <span className="text-[10px] text-[#888]">{item.total} votes</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.likeRate}%` }}
                    className="h-full bg-gradient-to-r from-[#FF6B35] to-[#B42D42]"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-[#1a1a1a] p-5 rounded-[24px] border border-white/5">
      <p className="text-[10px] font-bold text-[#888] uppercase mb-1">{label}</p>
      <p className={cn("text-2xl font-black", color || "text-white")}>{value}</p>
    </div>
  );
}

/* â”€â”€â”€ Suggestions Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function SuggestionsTab({ kiosk, db }: { kiosk: string; db: ReturnType<typeof useFirestore> }) {
  const q = useMemo(() => db ? query(collection(db, 'suggestions'), where('forwardedTo', 'array-contains', kiosk)) : null, [db, kiosk]);
  const { data: suggestions = [], loading } = useCollection<SuggestionDoc>(q);

  if (loading) return <div className="py-10 text-center text-[#888]"><Loader2 className="animate-spin inline" /></div>;

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-lg">{suggestions.length} Forwarded Suggestions</h2>
      {suggestions.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center bg-[#1a1a1a] rounded-2xl border border-dashed border-white/10">
          <MessageSquarePlus className="text-[#888] mb-4" size={40} />
          <h3 className="font-bold text-lg mb-2">Inbox Empty</h3>
          <p className="text-[#888] text-sm">No campus suggestions forwarded to your kiosk yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s) => (
            <div key={s.id} className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#FF6B35]/20 relative overflow-hidden shadow-lg">
               <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#FF6B35]/10 to-transparent pointer-events-none" />
               <p className="text-white text-base relative z-10 leading-relaxed italic">&quot;{s.text}&quot;</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* â”€â”€â”€ Kiosk Polls Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function KioskPollsTab({ kiosk, db }: { kiosk: string; db: ReturnType<typeof useFirestore> }) {
  const pollsQuery = useMemo(
    () => db ? query(collection(db, 'polls'), where('distributedTo', 'array-contains', kiosk), limit(QUERY_LIMITS.polls)) : null,
    [db, kiosk]
  );
  const { data: rawPolls = [], loading } = useCollection<PollDoc>(pollsQuery);
  const polls = useMemo(() => [...rawPolls].sort((a, b) => {
    const aTime = a.createdAt ? (a.createdAt as any)?.seconds || 0 : 0;
    const bTime = b.createdAt ? (b.createdAt as any)?.seconds || 0 : 0;
    return bTime - aTime;
  }), [rawPolls]);

  if (loading) return <div className="py-10 text-center text-[#888]"><Loader2 className="animate-spin inline" /></div>;

  if (polls.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center bg-[#1a1a1a] rounded-2xl border border-dashed border-white/10">
        <BarChart3 className="text-[#888] mb-4" size={40} />
        <h3 className="font-bold text-lg mb-2">No polls shared yet</h3>
        <p className="text-[#888] text-sm">The super admin hasn&apos;t distributed any poll data to your kiosk yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-lg">Poll Results</h2>
      {polls.map(poll => {
        const maxVotes = Math.max(...(poll.optionVotes || []), 1);
        return (
          <div key={poll.id} className="bg-[#1a1a1a] p-5 rounded-2xl border border-white/5">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-bold text-white text-sm leading-snug flex-1">{poll.question}</h3>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-md ml-2",
                poll.status === 'active' ? "bg-green-500/20 text-green-400" : "bg-white/10 text-[#888]"
              )}>
                {poll.status === 'active' ? 'LIVE' : 'ENDED'}
              </span>
            </div>
            <p className="text-[11px] text-[#888] mb-4">{poll.totalVotes} total vote{poll.totalVotes !== 1 ? 's' : ''}</p>

            <div className="space-y-3">
              {poll.options.map((opt, idx) => {
                const votes = poll.optionVotes?.[idx] || 0;
                const pct = poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0;
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white font-semibold">{opt}</span>
                      <span className="text-[#888]">{votes} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(votes / maxVotes) * 100}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-[#FF6B35] to-orange-400 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Feedback Tab ───────────────────────────────────────── */

function FeedbackTab({ kiosk, db }: { kiosk: string; db: ReturnType<typeof useFirestore> }) {
  const [selectedType, setSelectedType] = useState<'All' | 'liked' | 'disliked'>('All');

  const feedbackQuery = useMemo(() => {
    return db ? query(
      collection(db, 'feedback'),
      where('kioskName', '==', kiosk),
      orderBy('createdAt', 'desc'),
      limit(QUERY_LIMITS.feedback)
    ) : null;
  }, [db, kiosk]);

  const { data: allFeedback = [], loading } = useCollection<FeedbackDoc>(feedbackQuery);

  const filtered = useMemo(() => {
    if (selectedType === 'All') return allFeedback;
    return allFeedback.filter(fb => fb.type === selectedType);
  }, [allFeedback, selectedType]);

  const totalLikes = allFeedback.filter(f => f.type === 'liked').length;
  const totalDislikes = allFeedback.filter(f => f.type === 'disliked').length;

  if (loading) return <div className="py-10 text-center text-[#888]"><Loader2 className="animate-spin inline" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-lg">Customer Feedback ({filtered.length})</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 text-center shadow-lg">
          <p className="text-xs text-[#888] font-bold uppercase mb-1">Total Likes</p>
          <p className="text-2xl font-black text-[#FF6B35]">{totalLikes}</p>
        </div>
        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 text-center shadow-lg">
          <p className="text-xs text-[#888] font-bold uppercase mb-1">Total Dislikes</p>
          <p className="text-2xl font-black text-red-500">{totalDislikes}</p>
        </div>
      </div>

      <div>
        <label className="text-xs text-[#888] mb-1.5 block font-bold">Filter by Type</label>
        <select 
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as any)}
          className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl h-11 px-3 text-sm focus:outline-none"
        >
          <option value="All">All Types</option>
          <option value="liked">👍 Liked Only</option>
          <option value="disliked">👎 Disliked Only</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 bg-[#1a1a1a] rounded-2xl border border-white/5 text-[#888]">
          <MessageSquare size={32} className="mx-auto mb-3 opacity-50" />
          <p>No feedback found yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(fb => (
            <div key={fb.id} className="bg-[#1a1a1a] p-5 rounded-2xl border border-white/5 shadow-md">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-sm tracking-tight">{fb.itemName}</h3>
                </div>
                <div className={cn(
                  "px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap",
                  fb.type === 'liked' ? "bg-[#FF6B35]/20 text-[#FF6B35]" : "bg-red-500/20 text-red-500"
                )}>
                  {fb.type === 'liked' ? '👍 Liked' : '👎 Disliked'}
                </div>
              </div>
              <p className="text-sm text-white/90 italic leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
                &quot;{fb.reason}&quot;
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
