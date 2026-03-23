"use client"

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Plus, Trash2, Copy, Check, Store, Loader2, X,
  Heart, Users, MessageSquarePlus, Settings as SettingsIcon,
  BarChart3, Send, StopCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc, serverTimestamp, query, limit, getDocs, where, writeBatch, orderBy } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut as fbSignOut } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { KioskDoc, SwipeDoc, GlobalConfigDoc, SuggestionDoc, PollDoc } from '@/types/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { QUERY_LIMITS } from '@/lib/query-limits';
import { generateStrongPassword } from '@/lib/security';

interface ItemDoc {
  id: string;
  name: string;
  kiosk: string;
}

export default function SuperAdminPanel({ onLogout }: { onLogout: () => void }) {
  const db = useFirestore();

  const kiosksQuery = useMemo(() => db ? query(collection(db, 'kiosks'), limit(QUERY_LIMITS.kiosks)) : null, [db]);
  const itemsQuery = useMemo(() => db ? query(collection(db, 'items'), limit(QUERY_LIMITS.items)) : null, [db]);
  const swipesQuery = useMemo(() => db ? query(collection(db, 'swipes'), limit(QUERY_LIMITS.swipes)) : null, [db]);

  const { data: kiosks = [], loading: kiosksLoading } = useCollection<KioskDoc>(kiosksQuery);
  const { data: items = [] } = useCollection<ItemDoc>(itemsQuery);
  const { data: swipes = [] } = useCollection<SwipeDoc>(swipesQuery);

  const [activeTab, setActiveTab] = useState<'kiosks' | 'suggestions' | 'polls' | 'settings'>('kiosks');
  const [showForm, setShowForm] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ name: string; email: string; password: string } | null>(null);

  const kioskStats = useMemo(() => {
    return kiosks.map(k => {
      const kioskItems = items.filter(i => i.kiosk === k.name);
      const kioskItemIds = new Set(kioskItems.map(i => i.id));
      const kioskSwipes = swipes.filter(s => kioskItemIds.has(s.itemId));
      return {
        ...k,
        itemCount: kioskItems.length,
        swipeCount: kioskSwipes.length,
        likeCount: kioskSwipes.filter(s => s.direction === 'right').length,
      };
    });
  }, [kiosks, items, swipes]);

  const handleDelete = async (kiosk: KioskDoc) => {
    if (!db) return;

    try {
      const batch = writeBatch(db);

      // 1. Delete the kiosk document
      batch.delete(doc(db, 'kiosks', kiosk.id));

      // 2. Delete the owner's user document
      if (kiosk.ownerUid) {
        batch.delete(doc(db, 'users', kiosk.ownerUid));
      }

      // 3. Find and delete all items belonging to this kiosk
      const kioskItems = items.filter(i => i.kiosk === kiosk.name);
      const kioskItemIds = new Set(kioskItems.map(i => i.id));
      kioskItems.forEach(item => {
        batch.delete(doc(db, 'items', item.id));
      });

      // 4. Find and delete all swipes on this kiosk's items
      const kioskSwipeDocs = swipes.filter(s => kioskItemIds.has(s.itemId));
      kioskSwipeDocs.forEach(swipe => {
        batch.delete(doc(db, 'swipes', swipe.id));
      });

      await batch.commit();
      toast({ title: 'Kiosk removed', description: `${kiosk.name} and all associated data deleted.` });
    } catch {
      toast({ variant: 'destructive', title: 'Delete failed', description: 'Could not fully remove the kiosk. Try again.' });
    }
  };

  if (kiosksLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#0f0f0f] flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0f0f0f] text-white">
      <div className="max-w-2xl mx-auto p-6 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Super Admin</h1>
            <p className="text-[#888] text-sm">Manage kiosks & credentials</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-[#888] hover:text-white transition-colors text-sm"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#1a1a1a] rounded-xl p-1 mb-8 border border-white/5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('kiosks')}
            className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex justify-center items-center gap-2 whitespace-nowrap", activeTab === 'kiosks' ? "bg-white/10 text-white" : "text-[#888] hover:text-white")}
          >
            <Store size={14} /> Kiosks
          </button>
          <button
            onClick={() => setActiveTab('polls')}
            className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex justify-center items-center gap-2 whitespace-nowrap", activeTab === 'polls' ? "bg-white/10 text-white" : "text-[#888] hover:text-white")}
          >
            <BarChart3 size={14} /> Polls
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex justify-center items-center gap-2 whitespace-nowrap", activeTab === 'suggestions' ? "bg-white/10 text-white" : "text-[#888] hover:text-white")}
          >
            <MessageSquarePlus size={14} /> Tips
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex justify-center items-center gap-2 whitespace-nowrap", activeTab === 'settings' ? "bg-white/10 text-white" : "text-[#888] hover:text-white")}
          >
            <SettingsIcon size={14} /> Settings
          </button>
        </div>

        {activeTab === 'kiosks' && (
          <>
            {/* Overview */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/5 text-center">
            <p className="text-[10px] font-bold text-[#888] uppercase mb-1">Kiosks</p>
            <p className="text-2xl font-black text-purple-400">{kiosks.length}</p>
          </div>
          <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/5 text-center">
            <p className="text-[10px] font-bold text-[#888] uppercase mb-1">Items</p>
            <p className="text-2xl font-black text-[#FF6B35]">{items.length}</p>
          </div>
          <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/5 text-center">
            <p className="text-[10px] font-bold text-[#888] uppercase mb-1">Swipes</p>
            <p className="text-2xl font-black text-white">{swipes.length}</p>
          </div>
        </div>

        {/* Credential Alert */}
        <AnimatePresence>
          {createdCredentials && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl mb-6 relative"
            >
              <button
                onClick={() => setCreatedCredentials(null)}
                className="absolute top-3 right-3 text-green-400 hover:text-white"
              >
                <X size={16} />
              </button>
              <p className="text-green-400 font-bold text-sm mb-3">
                ✅ Kiosk &quot;{createdCredentials.name}&quot; created! Share these credentials:
              </p>
              <div className="bg-black/30 rounded-xl p-4 font-mono text-sm space-y-2">
                <p><span className="text-[#888]">Kiosk:</span> {createdCredentials.name}</p>
                <div className="flex items-center justify-between">
                  <p><span className="text-[#888]">Email:</span> {createdCredentials.email}</p>
                  <CopyButton text={createdCredentials.email} />
                </div>
                <div className="flex items-center justify-between">
                  <p><span className="text-[#888]">Password:</span> {createdCredentials.password}</p>
                  <CopyButton text={createdCredentials.password} />
                </div>
              </div>
              <p className="text-[#888] text-[10px] mt-3">
                ⚠️ These credentials won&apos;t be shown again. Copy them now!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Kiosk */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Registered Kiosks</h2>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-sm gap-2"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'Add Kiosk'}
          </Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <AddKioskForm
                db={db}
                onCreated={(name, email, password) => {
                  setCreatedCredentials({ name, email, password });
                  setShowForm(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Kiosk List */}
        {kioskStats.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center bg-[#1a1a1a] rounded-2xl border border-dashed border-white/10">
            <Store className="text-[#888] mb-4" size={40} />
            <h3 className="font-bold text-lg mb-2">No kiosks yet</h3>
            <p className="text-[#888] text-sm">Create your first kiosk to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {kioskStats.map(kiosk => (
              <motion.div
                key={kiosk.id}
                layout
                className="bg-[#1a1a1a] p-5 rounded-2xl border border-white/5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold">{kiosk.name}</h3>
                    <p className="text-[11px] text-[#888]">{kiosk.location}</p>
                    {kiosk.ownerEmail && (
                      <p className="text-[11px] text-[#FF6B35] mt-0.5">{kiosk.ownerEmail}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(kiosk)}
                    className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex gap-4 text-[11px]">
                  <span className="flex items-center gap-1 text-[#888]">
                    <Store size={12} /> {kiosk.itemCount} items
                  </span>
                  <span className="flex items-center gap-1 text-[#888]">
                    <Users size={12} /> {kiosk.swipeCount} swipes
                  </span>
                  <span className="flex items-center gap-1 text-[#FF6B35]">
                    <Heart size={12} fill="currentColor" /> {kiosk.likeCount} likes
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
          </>
        )}

        {activeTab === 'polls' && <SuperPollsTab db={db} kiosks={kiosks} />}
        {activeTab === 'suggestions' && <SuperSuggestionsTab db={db} kiosks={kiosks} />}
        {activeTab === 'settings' && <SuperSettingsTab db={db} />}
      </div>
    </div>
  );
}

/* ─── Add Kiosk Form ──────────────────────────────────────── */

function AddKioskForm({
  db,
  onCreated,
}: {
  db: ReturnType<typeof useFirestore>;
  onCreated: (name: string, email: string, password: string) => void;
}) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !name.trim() || !location.trim() || !ownerEmail.trim()) return;
    setError('');
    setSaving(true);

    try {
      const password = generateStrongPassword();
      const kioskId = name.trim().toLowerCase().replace(/\s+/g, '-');

      // Create Firebase Auth account using a secondary app (doesn't sign out current user)
      const tempApp = initializeApp(firebaseConfig, `temp-${Date.now()}`);
      let ownerUid: string;
      try {
        const tempAuth = getAuth(tempApp);
        const cred = await createUserWithEmailAndPassword(tempAuth, ownerEmail.trim(), password);
        ownerUid = cred.user.uid;
        await fbSignOut(tempAuth);
      } finally {
        await deleteApp(tempApp);
      }

      // Create kiosk document
      await setDoc(doc(db, 'kiosks', kioskId), {
        name: name.trim(),
        location: location.trim(),
        ownerUid,
        ownerEmail: ownerEmail.trim(),
        createdAt: serverTimestamp(),
      });

      // Create user role document for the owner
      await setDoc(doc(db, 'users', ownerUid), {
        email: ownerEmail.trim(),
        displayName: name.trim() + ' Owner',
        role: 'kioskOwner',
        kioskId,
        kioskName: name.trim(),
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Kiosk created!', description: `${name.trim()} is ready with owner account.` });
      onCreated(name.trim(), ownerEmail.trim(), password);
    } catch (err: unknown) {
      const code = (err as { code?: string } | null)?.code;
      if (code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else {
        setError('Failed to create kiosk. Try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 space-y-4 mb-4">
      <div>
        <label className="text-xs font-bold text-[#888] uppercase tracking-wider mb-1 block">Kiosk Name</label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Kiosk D"
          className="bg-[#0f0f0f] border-white/10 rounded-xl h-11 text-white"
          required
        />
      </div>
      <div>
        <label className="text-xs font-bold text-[#888] uppercase tracking-wider mb-1 block">Location</label>
        <Input
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="e.g. Library Block"
          className="bg-[#0f0f0f] border-white/10 rounded-xl h-11 text-white"
          required
        />
      </div>
      <div>
        <label className="text-xs font-bold text-[#888] uppercase tracking-wider mb-1 block">Owner Email</label>
        <Input
          type="email"
          value={ownerEmail}
          onChange={e => setOwnerEmail(e.target.value)}
          placeholder="owner@example.com"
          className="bg-[#0f0f0f] border-white/10 rounded-xl h-11 text-white"
          required
        />
      </div>
      {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
      <p className="text-[11px] text-[#888]">
        A password will be auto-generated. Share the email + password with the kiosk owner.
      </p>
      <Button
        type="submit"
        disabled={saving || !name.trim() || !location.trim() || !ownerEmail.trim()}
        className="w-full bg-purple-600 hover:bg-purple-700 font-bold rounded-xl py-5"
      >
        {saving ? <Loader2 className="animate-spin" size={18} /> : 'Create Kiosk & Owner Account'}
      </Button>
    </form>
  );
}

/* ─── Copy Button ─────────────────────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
        copied ? "bg-green-500/20 text-green-400" : "bg-white/5 text-[#888] hover:text-white"
      )}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

/* ─── Tabs ────────────────────────────────────────────── */

function SuperSuggestionsTab({ db, kiosks }: { db: ReturnType<typeof useFirestore>, kiosks: KioskDoc[] }) {
  const suggestionsQuery = useMemo(() => db ? query(collection(db, 'suggestions')) : null, [db]);
  const { data: suggestions = [], loading } = useCollection<SuggestionDoc>(suggestionsQuery);

  const [forwardingTo, setForwardingTo] = useState<Record<string, string[]>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const handleForward = async (suggestion: SuggestionDoc) => {
    if (!db) return;
    const targetKioskNames = forwardingTo[suggestion.id] || [];
    if (targetKioskNames.length === 0) {
      toast({ variant: 'destructive', title: 'Select a kiosk', description: 'Please select at least one kiosk to forward this suggestion to.' });
      return;
    }
    setProcessing(suggestion.id);
    try {
      await setDoc(doc(db, 'suggestions', suggestion.id), {
        forwardedTo: Array.from(new Set([...(suggestion.forwardedTo || []), ...targetKioskNames])),
        status: 'forwarded'
      }, { merge: true });
      toast({ title: 'Forwarded!', description: `Forwarded to ${targetKioskNames.length} kiosks.` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to forward suggestion.' });
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (suggestion: SuggestionDoc) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'suggestions', suggestion.id));
      toast({ title: 'Deleted', description: 'Suggestion removed.' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete.' });
    }
  };

  if (loading) return <div className="py-10 text-center text-[#888]"><Loader2 className="animate-spin inline" /></div>;

  const pending = suggestions.filter(s => s.status === 'pending');
  const forwarded = suggestions.filter(s => s.status === 'forwarded');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-bold text-lg mb-4 text-[#FF6B35]">Pending Review ({pending.length})</h2>
        {pending.length === 0 ? (
           <p className="text-[#888] text-sm italic">No pending suggestions.</p>
        ) : (
          <div className="space-y-3">
            {pending.map(s => (
              <div key={s.id} className="bg-[#1a1a1a] p-5 rounded-2xl border border-white/5 space-y-4">
                <p className="text-white text-sm">{s.text}</p>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    {kiosks.map(k => {
                      const isSelected = (forwardingTo[s.id] || []).includes(k.name);
                      return (
                        <button
                          key={k.id}
                          onClick={() => {
                            const current = forwardingTo[s.id] || [];
                            const next = isSelected ? current.filter(name => name !== k.name) : [...current, k.name];
                            setForwardingTo({ ...forwardingTo, [s.id]: next });
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                            isSelected 
                              ? "bg-[#3B82F6]/20 border-[#3B82F6]/50 text-[#3B82F6]" 
                              : "bg-black/40 border-white/10 text-[#888] hover:bg-white/5 hover:text-white"
                          )}
                        >
                          {k.name}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button onClick={() => handleForward(s)} disabled={processing === s.id || !(forwardingTo[s.id]?.length > 0)} className="bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white font-bold h-10 px-4 rounded-xl">
                      {processing === s.id ? <Loader2 size={16} className="animate-spin" /> : 'Forward to Selected'}
                    </Button>
                    <button onClick={() => handleDelete(s)} className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500/20">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-bold text-lg mb-4 text-[#888]">Forwarded ({forwarded.length})</h2>
        <div className="space-y-3 opacity-60">
           {forwarded.map(s => (
             <div key={s.id} className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/5 flex justify-between items-center gap-4">
                <p className="text-white text-sm line-clamp-2 flex-1">{s.text}</p>
                <div className="text-[10px] text-[#FF6B35] font-bold px-2 py-1 bg-[#FF6B35]/10 rounded-lg whitespace-nowrap text-right max-w-[40%] truncate">
                  {s.forwardedTo?.slice(-1)[0]} {s.forwardedTo?.length > 1 && `+${s.forwardedTo.length - 1}`}
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}

function SuperSettingsTab({ db }: { db: ReturnType<typeof useFirestore> }) {
  const [charLimit, setCharLimit] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const configQuery = useMemo(() => db ? query(collection(db, 'config'), limit(1)) : null, [db]);
  const { data: configs } = useCollection<GlobalConfigDoc>(configQuery);
  const globalConfig = configs?.find(c => c.id === 'globals');

  React.useEffect(() => {
    if (globalConfig?.suggestionCharLimit) {
      setCharLimit(globalConfig.suggestionCharLimit.toString());
    }
  }, [globalConfig]);

  const handleSave = async () => {
    if (!db) return;
    setLoading(true);
    try {
      await setDoc(doc(db, 'config', 'globals'), { suggestionCharLimit: parseInt(charLimit) }, { merge: true });
      toast({ title: 'Saved', description: 'Global settings updated successfully.' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update settings.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 space-y-6">
      <h2 className="font-bold text-lg mb-4">Global Features</h2>
      <div>
        <label className="text-xs font-bold text-[#888] uppercase tracking-wider mb-2 block">Student Suggestion Character Limit</label>
        <Input 
          type="number" 
          value={charLimit} 
          onChange={e => setCharLimit(e.target.value)} 
          placeholder="150"
          className="bg-[#0f0f0f] border-white/10 rounded-xl h-11 text-white mb-3" 
        />
        <p className="text-xs text-[#555]">This limits how long a student&apos;s request can be.</p>
      </div>
      <Button onClick={handleSave} disabled={loading || !charLimit} className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 font-bold rounded-xl py-5">
        {loading ? <Loader2 size={18} className="animate-spin" /> : 'Save Settings'}
      </Button>
    </div>
  );
}

/* ─── Polls Tab ──────────────────────────────────────────── */

function SuperPollsTab({ db, kiosks }: { db: ReturnType<typeof useFirestore>, kiosks: KioskDoc[] }) {
  const pollsQuery = useMemo(() => db ? query(collection(db, 'polls'), orderBy('createdAt', 'desc'), limit(QUERY_LIMITS.polls)) : null, [db]);
  const { data: polls = [], loading } = useCollection<PollDoc>(pollsQuery);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedPoll, setExpandedPoll] = useState<string | null>(null);
  const [distributingPoll, setDistributingPoll] = useState<string | null>(null);
  const [selectedKiosks, setSelectedKiosks] = useState<Record<string, string[]>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [creating, setCreating] = useState(false);

  const activePolls = polls.filter(p => p.status === 'active');
  const endedPolls = polls.filter(p => p.status === 'ended');

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    const trimmedQ = question.trim();
    const trimmedOpts = options.map(o => o.trim()).filter(o => o.length > 0);
    if (!trimmedQ || trimmedOpts.length < 2) {
      toast({ variant: 'destructive', title: 'Invalid poll', description: 'Provide a question and at least 2 options.' });
      return;
    }
    if (activePolls.length > 0) {
      toast({ variant: 'destructive', title: 'Active poll exists', description: 'End the current active poll before creating a new one.' });
      return;
    }
    setCreating(true);
    try {
      const pollId = `poll_${Date.now()}`;
      await setDoc(doc(db, 'polls', pollId), {
        question: trimmedQ,
        options: trimmedOpts,
        status: 'active',
        totalVotes: 0,
        optionVotes: trimmedOpts.map(() => 0),
        distributedTo: [],
        createdAt: serverTimestamp(),
      });
      toast({ title: '🗳️ Poll created!', description: 'Students can now vote on the home page.' });
      setQuestion('');
      setOptions(['', '']);
      setShowCreateForm(false);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create poll.' });
    } finally {
      setCreating(false);
    }
  };

  const handleEndPoll = async (pollId: string) => {
    if (!db) return;
    setProcessing(pollId);
    try {
      await updateDoc(doc(db, 'polls', pollId), {
        status: 'ended',
        endedAt: serverTimestamp(),
      });
      toast({ title: 'Poll ended', description: 'Students can no longer vote on this poll.' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to end poll.' });
    } finally {
      setProcessing(null);
    }
  };

  const handleDistribute = async (poll: PollDoc) => {
    if (!db) return;
    const targets = selectedKiosks[poll.id] || [];
    if (targets.length === 0) {
      toast({ variant: 'destructive', title: 'Select kiosks', description: 'Pick at least one kiosk.' });
      return;
    }
    setProcessing(poll.id);
    try {
      await updateDoc(doc(db, 'polls', poll.id), {
        distributedTo: Array.from(new Set([...(poll.distributedTo || []), ...targets])),
      });
      toast({ title: '📤 Distributed!', description: `Sent to ${targets.length} kiosk(s).` });
      setDistributingPoll(null);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to distribute poll data.' });
    } finally {
      setProcessing(null);
    }
  };

  const handleRevoke = async (poll: PollDoc, kioskName: string) => {
    if (!db) return;
    setProcessing(poll.id);
    try {
      await updateDoc(doc(db, 'polls', poll.id), {
        distributedTo: (poll.distributedTo || []).filter(n => n !== kioskName),
      });
      toast({ title: '🔄 Revoked', description: `Removed ${kioskName} from this poll.` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to revoke distribution.' });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="py-10 text-center text-[#888]"><Loader2 className="animate-spin inline" /></div>;

  return (
    <div className="space-y-6">
      {/* Create Poll */}
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-lg">Polls</h2>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={activePolls.length > 0 && !showCreateForm}
          className="bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-sm gap-2"
        >
          {showCreateForm ? <X size={16} /> : <Plus size={16} />}
          {showCreateForm ? 'Cancel' : 'New Poll'}
        </Button>
      </div>

      {activePolls.length > 0 && !showCreateForm && (
        <p className="text-[11px] text-[#888] -mt-4">End the active poll before creating a new one.</p>
      )}

      <AnimatePresence>
        {showCreateForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleCreatePoll}
            className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 space-y-4"
          >
            <div>
              <label className="text-xs font-bold text-[#888] uppercase tracking-wider mb-1 block">Question</label>
              <Input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="What's your favorite campus food?"
                className="bg-[#0f0f0f] border-white/10 rounded-xl h-11 text-white"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#888] uppercase tracking-wider mb-2 block">Options</label>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={opt}
                      onChange={e => {
                        const next = [...options];
                        next[idx] = e.target.value;
                        setOptions(next);
                      }}
                      placeholder={`Option ${idx + 1}`}
                      className="bg-[#0f0f0f] border-white/10 rounded-xl h-11 text-white flex-1"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                        className="w-11 h-11 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setOptions([...options, ''])}
                className="mt-2 text-xs text-purple-400 font-bold hover:text-purple-300"
              >
                + Add option
              </button>
            </div>
            <Button
              type="submit"
              disabled={creating}
              className="w-full bg-purple-600 hover:bg-purple-700 font-bold rounded-xl py-5"
            >
              {creating ? <Loader2 className="animate-spin" size={18} /> : 'Publish Poll'}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Active Polls */}
      {activePolls.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Active
          </h3>
          {activePolls.map(poll => (
            <PollCard
              key={poll.id}
              poll={poll}
              expanded={expandedPoll === poll.id}
              onToggle={() => setExpandedPoll(expandedPoll === poll.id ? null : poll.id)}
              onEnd={() => handleEndPoll(poll.id)}
              processing={processing === poll.id}
              kiosks={kiosks}
              distributingPoll={distributingPoll}
              setDistributingPoll={setDistributingPoll}
              selectedKiosks={selectedKiosks}
              setSelectedKiosks={setSelectedKiosks}
              onDistribute={() => handleDistribute(poll)}
              onRevoke={(kioskName) => handleRevoke(poll, kioskName)}
            />
          ))}
        </div>
      )}

      {/* Ended Polls */}
      {endedPolls.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-[#888] mb-3">Ended ({endedPolls.length})</h3>
          <div className="space-y-3">
            {endedPolls.map(poll => (
              <PollCard
                key={poll.id}
                poll={poll}
                expanded={expandedPoll === poll.id}
                onToggle={() => setExpandedPoll(expandedPoll === poll.id ? null : poll.id)}
                processing={processing === poll.id}
                kiosks={kiosks}
                distributingPoll={distributingPoll}
                setDistributingPoll={setDistributingPoll}
                selectedKiosks={selectedKiosks}
                setSelectedKiosks={setSelectedKiosks}
                onDistribute={() => handleDistribute(poll)}
              />
            ))}
          </div>
        </div>
      )}

      {polls.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center bg-[#1a1a1a] rounded-2xl border border-dashed border-white/10">
          <BarChart3 className="text-[#888] mb-4" size={40} />
          <h3 className="font-bold text-lg mb-2">No polls yet</h3>
          <p className="text-[#888] text-sm">Create your first poll to start collecting data.</p>
        </div>
      )}
    </div>
  );
}

/* ─── Poll Card ──────────────────────────────────────────── */

function PollCard({
  poll,
  expanded,
  onToggle,
  onEnd,
  processing,
  kiosks,
  distributingPoll,
  setDistributingPoll,
  selectedKiosks,
  setSelectedKiosks,
  onDistribute,
  onRevoke,
}: {
  poll: PollDoc;
  expanded: boolean;
  onToggle: () => void;
  onEnd?: () => void;
  processing: boolean;
  kiosks: KioskDoc[];
  distributingPoll: string | null;
  setDistributingPoll: (id: string | null) => void;
  selectedKiosks: Record<string, string[]>;
  setSelectedKiosks: (v: Record<string, string[]>) => void;
  onDistribute: () => void;
  onRevoke?: (kioskName: string) => void;
}) {
  const isActive = poll.status === 'active';
  const maxVotes = Math.max(...(poll.optionVotes || []), 1);

  return (
    <motion.div layout className="bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden mb-3">
      {/* Header */}
      <button onClick={onToggle} className="w-full text-left p-5 flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="font-bold text-white text-sm leading-snug">{poll.question}</h4>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-[#888]">
            <span>{poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{poll.options.length} options</span>
            {poll.distributedTo?.length > 0 && (
              <>
                <span>·</span>
                <span className="text-purple-400">Sent to {poll.distributedTo.length} kiosk(s)</span>
              </>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-[#888] mt-1" /> : <ChevronDown size={16} className="text-[#888] mt-1" />}
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 pb-5"
          >
            {/* Results */}
            <div className="space-y-3 mb-5">
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
                        className="h-full bg-gradient-to-r from-purple-500 to-[#FF6B35] rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              {isActive && onEnd && (
                <Button
                  onClick={onEnd}
                  disabled={processing}
                  className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 font-bold rounded-xl text-xs gap-2"
                >
                  {processing ? <Loader2 size={14} className="animate-spin" /> : <StopCircle size={14} />}
                  End Poll
                </Button>
              )}
              <Button
                onClick={() => setDistributingPoll(distributingPoll === poll.id ? null : poll.id)}
                className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 font-bold rounded-xl text-xs gap-2"
              >
                <Send size={14} /> Send to Kiosks
              </Button>
            </div>

            {/* Kiosk Distribution */}
            <AnimatePresence>
              {distributingPoll === poll.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 pt-4 border-t border-white/5"
                >
                  <p className="text-xs text-[#888] mb-3">Select kiosks to receive this poll&apos;s data. Tap a sent kiosk to revoke:</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {kiosks.map(k => {
                      const isSelected = (selectedKiosks[poll.id] || []).includes(k.name);
                      const alreadySent = poll.distributedTo?.includes(k.name);
                      return (
                        <button
                          key={k.id}
                          onClick={() => {
                            if (alreadySent && onRevoke) {
                              onRevoke(k.name);
                              return;
                            }
                            const current = selectedKiosks[poll.id] || [];
                            const next = isSelected ? current.filter(n => n !== k.name) : [...current, k.name];
                            setSelectedKiosks({ ...selectedKiosks, [poll.id]: next });
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                            alreadySent
                              ? "bg-green-500/10 border-green-500/30 text-green-500 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
                              : isSelected
                                ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                                : "bg-black/40 border-white/10 text-[#888] hover:bg-white/5 hover:text-white"
                          )}
                        >
                          {alreadySent ? `✕ ${k.name}` : k.name}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    onClick={onDistribute}
                    disabled={processing || !(selectedKiosks[poll.id]?.length > 0)}
                    className="w-full bg-purple-600 hover:bg-purple-700 font-bold rounded-xl py-4 text-sm"
                  >
                    {processing ? <Loader2 size={16} className="animate-spin" /> : 'Distribute to Selected'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
