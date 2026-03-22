"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Share, PlusSquare } from 'lucide-react';
import { useInstallDetection } from '@/hooks/useInstallDetection';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export default function InstallSystem() {
  const { isIOS, isIOSSafari, isStandalone, isAlreadyInstalled, swipeCount, setInstalled } = useInstallDetection();
  const [showIosSheet, setShowIosSheet] = useState(false);
  const [showAndroidBanner, setShowAndroidBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isStandalone || isAlreadyInstalled) return;

    if (!isIOS) {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        if (swipeCount >= 5) setShowAndroidBanner(true);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    } else if (isIOSSafari && swipeCount >= 5) {
      setShowIosSheet(true);
    }
  }, [isStandalone, isAlreadyInstalled, isIOS, isIOSSafari, swipeCount]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (!isStandalone && !isAlreadyInstalled && isIOS && !isIOSSafari) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#0f0f0f] flex flex-col items-center justify-center p-8 text-center">
        <div className="text-[72px] mb-8">🧭</div>
        <h1 className="text-2xl font-bold mb-4">Open in Safari</h1>
        <p className="text-[#888] text-sm mb-8 max-w-[280px]">
          SwipeBite can only be installed through Safari on iPhone.
        </p>
        
        <div className="bg-[#1a1a1a] rounded-[24px] p-6 w-full text-left space-y-4 mb-8 border border-white/5">
          <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-[#FF6B35] text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
            <p className="text-sm">Copy the link below</p>
          </div>
          <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-[#FF6B35] text-white flex items-center justify-center text-xs font-bold shrink-0">2</div>
            <p className="text-sm">Open Safari on your iPhone 🧭</p>
          </div>
          <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-[#FF6B35] text-white flex items-center justify-center text-xs font-bold shrink-0">3</div>
            <p className="text-sm">Paste it in the Safari address bar</p>
          </div>
        </div>

        <div className="bg-[#2a2a2a] p-4 rounded-2xl w-full flex items-center justify-between gap-4">
          <p className="truncate text-xs text-[#888]">{window.location.href}</p>
          <button 
            onClick={handleCopy}
            className="bg-[#FF6B35] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shrink-0"
          >
            {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
          </button>
        </div>
        
        <p className="text-[#555] text-[10px] mt-8">Why Safari? Apple only allows home screen installation through Safari.</p>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showIosSheet && (
          <motion.div
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[150] bg-[#1a1a1a] rounded-t-[32px] p-8 pb-12 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-white/10 flex justify-center"
          >
            <div className="w-full max-w-[430px] flex flex-col items-center">
              <div className="w-12 h-1 bg-white/10 rounded-full mb-6" />
              <h2 className="text-xl font-bold mb-2">Install SwipeBite 📲</h2>
              <p className="text-[#888] text-sm mb-6 text-center">Use it like a real app — no App Store needed!</p>
              
              <div className="bg-[#2a2a2a] rounded-[24px] p-5 w-full space-y-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#FF6B35]/20 rounded-xl flex items-center justify-center text-[#FF6B35] shrink-0">
                    <Share size={20} />
                  </div>
                  <p className="text-xs">Tap the Share icon ↑ at the bottom of Safari</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#FF6B35]/20 rounded-xl flex items-center justify-center text-[#FF6B35] shrink-0">
                    <PlusSquare size={20} />
                  </div>
                  <p className="text-xs">Tap &apos;Add to Home Screen&apos;</p>
                </div>
              </div>

              <button 
                onClick={() => { setInstalled(); setShowIosSheet(false); }}
                className="w-full bg-[#FF6B35] text-white font-bold py-5 rounded-2xl mb-4"
              >
                ✅ I&apos;ve Added It!
              </button>
              <button 
                onClick={() => setShowIosSheet(false)}
                className="text-[#888] font-bold text-sm"
              >
                Remind Me Later
              </button>
            </div>
          </motion.div>
        )}

        {showAndroidBanner && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-24 left-4 right-4 z-[150] bg-[#1a1a1a] border-l-4 border-[#FF6B35] p-4 rounded-xl flex items-center justify-between shadow-2xl"
          >
            <p className="text-xs font-bold">📲 Add SwipeBite to your home screen!</p>
            <div className="flex gap-2">
              <button onClick={() => setShowAndroidBanner(false)} className="text-[10px] text-[#888] font-bold px-2">Not Now</button>
              <button 
                onClick={() => { deferredPrompt?.prompt(); setShowAndroidBanner(false); }}
                className="bg-[#FF6B35] text-white text-[10px] font-bold px-3 py-2 rounded-lg"
              >
                Add
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Pill Reminder */}
      {swipeCount >= 5 && !isAlreadyInstalled && !showIosSheet && !showAndroidBanner && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => isIOS ? setShowIosSheet(true) : setShowAndroidBanner(true)}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#FF6B35] text-white font-bold py-3 px-6 rounded-full shadow-2xl flex items-center gap-2 z-40 whitespace-nowrap"
        >
          <span>📲 Add to Home Screen</span>
        </motion.button>
      )}
    </>
  );
}
