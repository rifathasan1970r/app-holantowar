import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Zap, Smartphone } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface RechargeRulesViewProps {
  onBack: () => void;
}

const SLIDE_DURATION = 4000;

// Placeholder images - ready for dynamic URLs later
const SLIDES = [
  {
    id: 1,
    image: "https://picsum.photos/seed/recharge1/800/450",
    title: "ধাপ ১: অ্যাপ ওপেন করুন"
  },
  {
    id: 2,
    image: "https://picsum.photos/seed/recharge2/800/450",
    title: "ধাপ ২: রিচার্জ অপশন সিলেক্ট করুন"
  },
  {
    id: 3,
    image: "https://picsum.photos/seed/recharge3/800/450",
    title: "ধাপ ৩: পরিমাণ দিন"
  }
];

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 1,
    zIndex: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 1,
  })
};

export const RechargeRulesView: React.FC<RechargeRulesViewProps> = ({ onBack }) => {
  const [[page, direction], setPage] = useState([0, 0]);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Calculate current image index ensuring it's always positive and within bounds
  const imageIndex = ((page % SLIDES.length) + SLIDES.length) % SLIDES.length;

  const paginate = useCallback((newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  }, [page]);

  // Auto-slide logic
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setInterval(() => {
      paginate(1);
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [isAutoPlaying, paginate]);

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const handleDragEnd = (e: any, { offset, velocity }: PanInfo) => {
    const swipe = swipePower(offset.x, velocity.x);

    if (swipe < -swipeConfidenceThreshold) {
      paginate(1);
    } else if (swipe > swipeConfidenceThreshold) {
      paginate(-1);
    }
    
    // Pause auto-play briefly after interaction
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 4000);
  };

  return (
    <div className="pb-24 animate-in slide-in-from-right duration-500 bg-slate-50 dark:bg-slate-900 min-h-screen relative transition-colors duration-300">
      {/* Navigation Header Section */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 shadow-sm transition-all">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50 dark:border-slate-700">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors py-1 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-base font-bold">ফিরে যান</span>
          </button>
        </div>
        
        <div className="flex items-center justify-center px-6 py-4">
          <div className="text-center animate-in zoom-in duration-300 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white shadow-md">
                <Smartphone size={20} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">রিচার্জ করার নিয়ম</h2>
                <p className="text-xs font-bold text-orange-600 dark:text-orange-400 mt-0.5 flex items-center justify-center gap-1">
                  <Zap size={10} /> সহজ ধাপসমূহ
                </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        
        {/* Premium Slider Card */}
        <div className="w-full max-w-md mx-auto">
            <div className="relative bg-white dark:bg-slate-800 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-black/30 border border-slate-100 dark:border-slate-700 overflow-hidden aspect-[16/10]">
                
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={page}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={handleDragEnd}
                        className="absolute inset-0 w-full h-full"
                    >
                        <img 
                            src={SLIDES[imageIndex].image} 
                            alt={SLIDES[imageIndex].title}
                            className="w-full h-full object-cover pointer-events-none"
                            referrerPolicy="no-referrer"
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                        
                        {/* Text Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                            <h3 className="text-white text-lg font-bold tracking-wide drop-shadow-md">
                                {SLIDES[imageIndex].title}
                            </h3>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Dot Indicators */}
                <div className="absolute bottom-4 right-4 flex gap-1.5 z-20">
                    {SLIDES.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                const newDirection = idx > imageIndex ? 1 : -1;
                                setPage([page + (idx - imageIndex), newDirection]);
                                setIsAutoPlaying(false);
                                setTimeout(() => setIsAutoPlaying(true), 4000);
                            }}
                            className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${
                                idx === imageIndex 
                                    ? 'w-6 bg-orange-500' 
                                    : 'w-1.5 bg-white/50 hover:bg-white/80'
                            }`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>

        {/* Info Card */}
        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl p-5">
           <h3 className="font-bold text-orange-800 dark:text-orange-300 mb-2">নোট:</h3>
           <p className="text-sm text-orange-700/80 dark:text-orange-400/80 leading-relaxed">
             উপরের স্লাইডারে দেখানো ধাপগুলো অনুসরণ করে আপনি খুব সহজেই আপনার প্রিপেইড মিটার রিচার্জ করতে পারবেন। কোনো সমস্যা হলে আমাদের হেল্পলাইন নম্বরে যোগাযোগ করুন।
           </p>
        </div>

      </div>
    </div>
  );
};
