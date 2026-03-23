
"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import AppContainer from '@/components/layout/AppContainer';
import BottomNav from '@/components/layout/BottomNav';
import Onboarding from '@/components/onboarding/Onboarding';
import SwipeView from '@/components/swipe/SwipeView';
import TrendingView from '@/components/trending/TrendingView';
import DashboardView from '@/components/dashboard/DashboardView';
import ProfileView from '@/components/profile/ProfileView';
import InstallSystem from '@/components/install/InstallSystem';
import PollBanner from '@/components/poll/PollBanner';
import RoleSelector from '@/components/auth/RoleSelector';
import LoginScreen from '@/components/auth/LoginScreen';
import OwnerLogin from '@/components/auth/OwnerLogin';
import AdminPanel from '@/components/admin/AdminPanel';
import SuperAdminPanel from '@/components/admin/SuperAdminPanel';
import { useAuth } from '@/firebase';
import { useUserRole } from '@/hooks/use-user-role';
import { signOut } from 'firebase/auth';

type Tab = 'home' | 'trending' | 'dashboard' | 'profile';
type SelectedRole = 'none' | 'student' | 'owner';

export default function Home() {
  const auth = useAuth();
  const { roleData, loading, user } = useUserRole();
  const [selectedRole, setSelectedRole] = useState<SelectedRole>('none');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const onboarded = localStorage.getItem('swipebite_onboarded');
      if (!onboarded) {
        setShowOnboarding(true);
      }
    } catch {
      setShowOnboarding(true);
    }
  }, []);

  const handleSwipeUpdate = (totalSwiped: number) => {
    setUnseenCount(prev => Math.max(0, prev - 1));
  };

  const handleBack = () => {
    // Sign out if they were mid-auth and go back to role selector
    if (user) {
      auth && signOut(auth);
    }
    setSelectedRole('none');
  };

  if (!isClient || loading) {
    return (
      <div className="fixed inset-0 bg-[#0f0f0f] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FF6B35]" size={32} />
      </div>
    );
  }

  // ── Not authenticated ──
  if (!user) {
    if (selectedRole === 'student') {
      return <LoginScreen onBack={() => setSelectedRole('none')} />;
    }
    if (selectedRole === 'owner') {
      return <OwnerLogin onBack={() => setSelectedRole('none')} />;
    }
    return (
      <RoleSelector
        onSelectStudent={() => setSelectedRole('student')}
        onSelectOwner={() => setSelectedRole('owner')}
      />
    );
  }

  // ── Authenticated but no role doc (shouldn't happen normally) ──
  if (!roleData) {
    return (
      <div className="fixed inset-0 bg-[#0f0f0f] flex flex-col items-center justify-center p-8 text-center">
        <p className="text-[#888] mb-4">Account not recognized.</p>
        <button
          onClick={handleBack}
          className="text-[#FF6B35] font-bold hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  // ── Super Admin ──
  if (roleData.role === 'superAdmin') {
    return <SuperAdminPanel onLogout={handleBack} />;
  }

  // ── Kiosk Owner ──
  if (roleData.role === 'kioskOwner') {
    return (
      <AdminPanel
        kiosk={roleData.kioskName || ''}
        onLogout={handleBack}
      />
    );
  }

  // ── Student ──
  return (
    <AppContainer>
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      
      <InstallSystem />

      <main className="flex-1 flex flex-col overflow-y-auto min-h-0 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 flex flex-col min-h-0"
          >
            {activeTab === 'home' && (
              <>
                <PollBanner />
                <SwipeView onSwipeUpdate={handleSwipeUpdate} />
              </>
            )}
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
