import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

export const PullToRefresh: React.FC<{ children: React.ReactNode; isEnabled?: boolean }> = ({ children, isEnabled = true }) => {
  const [pullY, setPullY] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Use refs for mutable values in event handlers
  const startYRef = useRef(0);
  const isHoldingRef = useRef(false);
  const pullYRef = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      console.log('PullToRefresh touchstart, isEnabled:', isEnabled);
      if (!isEnabled) return;
      // Only allow pull to refresh if we are at the very top of the page
      if (window.scrollY <= 0) {
        startYRef.current = e.touches[0].clientY;
      } else {
        startYRef.current = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isEnabled || startYRef.current === 0) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;

      // Only handle pull down at the top
      if (diff > 0 && window.scrollY <= 0) {
        const newPullY = Math.min(diff * 0.4, 100); // Resistance and max pull
        pullYRef.current = newPullY;
        setPullY(newPullY);
        
        // Threshold to start timer
        if (newPullY > 50 && !isHoldingRef.current) {
          isHoldingRef.current = true;
          setIsHolding(true);
        } else if (newPullY < 50 && isHoldingRef.current) {
          isHoldingRef.current = false;
          setIsHolding(false);
          setProgress(0);
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isEnabled) return;
      startYRef.current = 0;
      pullYRef.current = 0;
      isHoldingRef.current = false;
      setPullY(0);
      setIsHolding(false);
      setProgress(0);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isEnabled]);

  // Timer logic for 1.50 seconds hold
  useEffect(() => {
    if (isHolding) {
      const startTime = Date.now();
      const duration = 1500; // 1.50 seconds as requested

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / duration) * 100, 100);
        setProgress(newProgress);

        if (newProgress >= 100) {
          clearInterval(interval);
          // Vibrate if supported
          if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(50);
          }
          window.location.reload();
        }
      }, 16);

      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [isHolding]);

  return (
    <div className="relative">
      {/* Loading Indicator Overlay */}
      <AnimatePresence>
        {pullY > 20 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: pullY - 40 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-0 right-0 flex justify-center pointer-events-none z-[100] max-w-md mx-auto"
          >
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full px-4 py-2 shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <div className="relative w-5 h-5 flex items-center justify-center">
                {/* Background Circle */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  {/* Progress Circle */}
                  <motion.circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray="100"
                    strokeDashoffset={100 - progress}
                    strokeLinecap="round"
                    className="text-indigo-600 dark:text-indigo-400"
                  />
                </svg>
                <RefreshCw size={10} className={`text-indigo-600 dark:text-indigo-400 ${progress >= 100 ? 'animate-spin' : ''}`} />
              </div>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {progress >= 100 ? 'রিলোড হচ্ছে...' : 'রিফ্রেশ করতে ধরে রাখুন'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content with Transform */}
      <motion.div
        animate={{ y: pullY }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
};
