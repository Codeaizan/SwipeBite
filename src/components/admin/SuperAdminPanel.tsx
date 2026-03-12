"use client"

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Plus, Trash2, Copy, Check, Store, Loader2, X,
  Heart, ArrowBigUpDash, TrendingUp, Users, Mail,
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut as fbSignOut } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

function generatePassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, b => chars[b % chars.length]).join('');
}

interface KioskDoc {
  id: string;
  name: string;
  location: string;
}

interface SwipeDoc {
  id: string;
  itemId: string;
  direction: string;
}

interface ItemDoc {
  id: string;
  name: string;
  kiosk: string;
}

export default function SuperAdminPanel({ onLogout }: { onLogout: () => void }) {
  const db = useFirestore();

  const kiosksQuery = useMemoFirebase(() => db ? collection(db, 'kiosks') : null, [db]);
  const itemsQuery = useMemoFirebase(() => db ? collection(db, 'items') : null, [db]);
  const swipesQuery = useMemoFirebase(() => db ? collection(db, 'swipes') : null, [db]);

  const { data: kiosks = [], loading: kiosksLoading } = useCollection<any>(kiosksQuery);
  const { data: items = [] } = useCollection<any>(itemsQuery);
  const { data: swipes = [] } = useCollection<any>(swipesQuery);

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
    await deleteDoc(doc(db, 'kiosks', kiosk.id));
    toast({ title: 'Kiosk removed', description: `${kiosk.name} has been deleted.` });
  };

  if (kiosksLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
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
                ✅ Kiosk "{createdCredentials.name}" created! Share these credentials:
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
                ⚠️ These credentials won't be shown again. Copy them now!
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
      </div>
    </div>
  );
}

/* ─── Add Kiosk Form ──────────────────────────────────────── */

function AddKioskForm({
  db,
  onCreated,
}: {
  db: any;
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
      const password = generatePassword();
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
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
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
