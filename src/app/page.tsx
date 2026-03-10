"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppContainer from '@/components/layout/AppContainer';
import BottomNav from '@/components/layout/BottomNav';
import Onboarding from '@/components/onboarding/Onboarding';
import SwipeView from '@/components/swipe/SwipeView';
import TrendingView from '@/components/trending/TrendingView';
import DashboardView from '@/components/dashboard/DashboardView';
import ProfileView from '@/components/profile/ProfileView';
import InstallSystem from '@/components/install/InstallSystem';
import { foodItems } from '@/data/foodItems';

type Tab = 'home' | 'trending' | 'dashboard' | 'profile';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [unseenCount, setUnseenCount] = useState(15);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const onboarded = localStorage.getItem('swipebite_onboarded');
    if (!onboarded) {
      setShowOnboarding(true);
    }

    const count = parseInt(localStorage.getItem('swipeCount') || '0');
    setUnseenCount(Math.max(0, 15 - count));
  }, []);

  const handleSwipeUpdate = (totalCount: number) => {
    setUnseenCount(Math.max(0, 15 - totalCount));
  };

  if (!isClient) return null;

  return (
    <AppContainer>
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      
      <InstallSystem />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 flex flex-col"
          >
            {activeTab === 'home' && <SwipeView onSwipeUpdate={handleSwipeUpdate} />}
            {activeTab === 'trending' && <TrendingView />}
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'profile' && <ProfileView />}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        unseenCount={unseenCount}
      />
    </AppContainer>
  );
}
