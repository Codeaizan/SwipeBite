"use client"

import { useState, useEffect } from 'react';

export function useInstallDetection() {
  const [isIOS, setIsIOS] = useState(false);
  const [isIOSSafari, setIsIOSSafari] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);
  const [swipeCount, setSwipeCount] = useState(0);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    const iosSafari = ios && /safari/i.test(ua) && !/crios|fxios|opios|mercury|instagram|fban/i.test(ua);

    const standalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    
    setIsIOS(ios);
    setIsIOSSafari(iosSafari);
    setIsStandalone(standalone);
    
    try {
      const installed = localStorage.getItem('swipebite_installed') === 'true';
      setIsAlreadyInstalled(installed);

      const count = parseInt(localStorage.getItem('swipeCount') || '0', 10);
      setSwipeCount(Number.isNaN(count) ? 0 : count);
    } catch {
      setIsAlreadyInstalled(false);
      setSwipeCount(0);
    }
  }, []);

  const setInstalled = () => {
    try {
      localStorage.setItem('swipebite_installed', 'true');
    } catch {
      // Ignore storage failures in privacy-restricted contexts.
    }
    setIsAlreadyInstalled(true);
  };

  return { isIOS, isIOSSafari, isStandalone, isAlreadyInstalled, swipeCount, setInstalled };
}
