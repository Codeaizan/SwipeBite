"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { Home, TrendingUp, BarChart2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'home' | 'trending' | 'dashboard' | 'profile';

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  unseenCount: number;
}

export default function BottomNav({ activeTab, setActiveTab, unseenCount }: BottomNavProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'trending', icon: TrendingUp, label: 'Trending' },
    { id: 'dashboard', icon: BarChart2, label: 'Stats' },
    { id: 'profile', icon: User, label: 'Profile' },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0f0f0f]/80 backdrop-blur-lg border-t border-white/10 z-50 flex justify-center pb-safe">
      <div className="w-full max-w-[430px] flex justify-around items-center py-1.5 relative px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                "flex flex-col items-center gap-1 relative z-10 py-1 transition-colors duration-300 w-16",
                isActive ? "text-[#FF6B35]" : "text-muted"
              )}
            >
              <div className="relative">
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {tab.id === 'home' && unseenCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#FF6B35] text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                    {unseenCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium tracking-wide uppercase">{tab.label}</span>
              
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute -bottom-1 w-8 h-[3px] bg-[#FF6B35] rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
