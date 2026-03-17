import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Settings, Hammer } from 'lucide-react';

interface MaintenancePopupProps {
  enabled?: boolean;
}

export const MaintenancePopup: React.FC<MaintenancePopupProps> = ({ enabled = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (enabled) {
      setIsVisible(true);
      
      // Auto close after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [enabled]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center border border-white/20 relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-rose-500 to-purple-600"></div>
            
            {/* Animation Container */}
            <div className="h-32 relative flex items-center justify-center mb-6">
              {/* Rotating Gear 1 (Big) */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute right-8 top-0 text-slate-100 dark:text-slate-700"
              >
                <Settings size={100} strokeWidth={1} />
              </motion.div>

              {/* Rotating Gear 2 (Small) */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                className="absolute left-10 bottom-2 text-slate-200 dark:text-slate-600"
              >
                <Settings size={60} strokeWidth={1.5} />
              </motion.div>

              {/* Main Icon with animation */}
              <div className="relative z-10 w-20 h-20 bg-gradient-to-tr from-orange-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 transform rotate-3 border-4 border-white dark:border-slate-800">
                <motion.div
                  animate={{ rotate: [0, -20, 0, -20, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Wrench size={40} className="text-white" />
                </motion.div>
              </div>

              {/* Hammer hitting */}
              <motion.div
                className="absolute -right-4 top-12 text-slate-400 dark:text-slate-500 z-20"
                initial={{ rotate: 0, x: 0 }}
                animate={{ rotate: [0, 45, 0], x: [0, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Hammer size={40} className="drop-shadow-sm" />
              </motion.div>
            </div>

            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">কাজ চলছে...</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed">
              অ্যাপস এর রক্ষণাবেক্ষণ কাজ চলছে।<br/>সাময়িক অসুবিধার জন্য দুঃখিত।
            </p>

            {/* Progress Bar */}
            <div className="relative w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-rose-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "linear" }}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
               <p className="text-[10px] text-slate-400 font-mono">SYSTEM UPDATING...</p>
               <p className="text-[10px] text-orange-500 font-bold font-mono animate-pulse">100%</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
