import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BOTTOM_NAV_ITEMS, VIEW_TO_PATH } from '../constants';
import { ViewState } from '../types';

interface BottomNavProps {
  currentView: ViewState;
}

type NavItem = typeof BOTTOM_NAV_ITEMS[number];

interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
}

const NavButton = React.memo(({ item, isActive }: NavButtonProps) => {
  const navigate = useNavigate();
  const isHome = item.id === 'home';

  return (
    <button
      onClick={() => navigate(VIEW_TO_PATH[item.view] || '/')}
      className="relative flex flex-col items-center justify-end w-16 h-full group outline-none"
    >
      {isHome ? (
        // Floating Home Button - High End Style
        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
           <motion.div
            whileTap={{ scale: 0.98 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`relative p-4 rounded-full shadow-[0_10px_25px_-5px_rgba(76,29,149,0.3)] transition-all duration-500 ${
              isActive 
                ? 'bg-gradient-to-br from-[#4C1D95] to-[#6D28D9] text-white ring-[6px] ring-white dark:ring-slate-900 shadow-[0_15px_35px_-5px_rgba(76,29,149,0.4)]' 
                : 'bg-white dark:bg-slate-800 text-[#4C1D95] dark:text-purple-400 shadow-slate-200 dark:shadow-none border border-purple-50 dark:border-slate-700 ring-[6px] ring-white dark:ring-slate-900'
            }`}
          >
            {/* Subtle Pulse Animation for Home */}
            {isActive && (
                <motion.div
                    className="absolute inset-0 rounded-full bg-[#4C1D95]"
                    initial={{ opacity: 0, scale: 1 }}
                    animate={{ 
                        opacity: [0, 0.2, 0],
                        scale: [1, 1.35]
                    }}
                    transition={{ 
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeOut"
                    }}
                />
            )}
            
            <item.icon size={28} strokeWidth={2.5} className="relative z-10 drop-shadow-sm" />
          </motion.div>
        </div>
      ) : (
        // Standard Icons - Premium Micro-interactions
        <motion.div
          whileTap={{ scale: 0.85 }}
          className="flex flex-col items-center gap-1.5 py-1 w-full relative z-10"
        >
          <div className="relative p-1">
            {/* Active Soft Highlight */}
            {isActive && (
              <div
                className="absolute inset-0 bg-purple-50 dark:bg-slate-800 rounded-xl -z-10"
              />
            )}
            
            {/* Icon with Bounce Effect */}
            <div>
                <item.icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2} 
                className={`transition-all duration-300 ${
                    isActive 
                    ? 'text-[#4C1D95] dark:text-purple-400 drop-shadow-[0_2px_8px_rgba(76,29,149,0.25)]' 
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-[#4C1D95] dark:group-hover:text-purple-400'
                }`} 
                />
            </div>
          </div>
          
          {/* Label */}
          <span className={`text-[10px] font-bold tracking-wide transition-all duration-300 ${
            isActive ? 'text-[#4C1D95] dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'
          }`}>
            {item.label}
          </span>
          
          {/* Active Indicator Line */}
          {isActive && (
             <div 
               className="absolute -bottom-2 w-8 h-1 bg-[#4C1D95] dark:bg-purple-500 rounded-t-full shadow-[0_-2px_6px_rgba(76,29,149,0.3)]"
             />
          )}
        </motion.div>
      )}
    </button>
  );
});

const BottomNav: React.FC<BottomNavProps> = React.memo(({ currentView }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-0 pointer-events-none">
      <div className="max-w-md mx-auto relative pointer-events-auto">
        {/* Premium Glass Container with Rounded Top - White Theme */}
        <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-t border-purple-100/50 dark:border-slate-800/50 shadow-[0_-8px_30px_-5px_rgba(0,0,0,0.1),0_-2px_10px_-2px_rgba(0,0,0,0.05)] rounded-t-[24px]">
           {/* Soft Gradient Overlay */}
           <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-white/20 dark:from-slate-800/50 dark:to-slate-800/20 rounded-t-[24px] pointer-events-none" />
        </div>
        
        <div className="relative px-2 h-[80px] flex justify-around items-end pb-3">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={currentView === item.view}
          />
        ))}
      </div>
      </div>
    </div>
  );
});

export default BottomNav;
