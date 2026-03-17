import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const IMAGES = [
  "https://i.imghippo.com/files/IxR3498AKE.png",
  "https://i.imghippo.com/files/doWD3644bN.jpg",
  "https://i.imghippo.com/files/aPPh2154sY.jpg",
  "https://i.imghippo.com/files/VN1922RL.jpg"
];

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0
  })
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

const ImageSlider: React.FC = () => {
  const [[page, direction], setPage] = useState([0, 0]);

  // We only have IMAGES.length images, so we wrap the index
  const imageIndex = ((page % IMAGES.length) + IMAGES.length) % IMAGES.length;

  const paginate = useCallback((newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  }, [page]);

  // Auto-slide - resets whenever page changes (including manual swipes)
  useEffect(() => {
    const timer = setInterval(() => {
      paginate(1);
    }, 4000);
    return () => clearInterval(timer);
  }, [paginate]);

  return (
    <div className="relative w-full h-64 rounded-2xl overflow-hidden shadow-lg border border-white/50 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800 transition-colors duration-300">
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
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);

            if (swipe < -swipeConfidenceThreshold) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1);
            }
          }}
          className="absolute inset-0 w-full h-full flex items-center justify-center"
        >
            {/* Blurred Background for filling space */}
            <div 
                className="absolute inset-0 bg-cover bg-center blur-xl opacity-30 scale-110"
                style={{ backgroundImage: `url(${IMAGES[imageIndex]})` }}
            />
            
            {/* Main Image */}
            <img
                src={IMAGES[imageIndex]}
                alt={`Slide ${imageIndex + 1}`}
                className="relative w-full h-full object-contain pointer-events-none z-10"
                referrerPolicy="no-referrer"
            />
        </motion.div>
      </AnimatePresence>
      
      {/* Dots indicator */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
        {IMAGES.map((_, idx) => (
          <div 
            key={idx} 
            className={`h-1.5 rounded-full transition-all duration-500 shadow-sm backdrop-blur-sm ${
              idx === imageIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
            }`} 
          />
        ))}
      </div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none z-10" />
    </div>
  );
};

export default ImageSlider;
