import React from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { EMERGENCY_NOTICE_TEXT } from '../../constants';

interface EmergencyNoticeBoxProps {
  onClick: () => void;
}

const EmergencyNoticeBox: React.FC<EmergencyNoticeBoxProps> = ({ onClick }) => (
  <motion.button 
    onClick={onClick}
    animate={{ 
      scale: [1, 1.03, 1],
      boxShadow: [
        "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "0 0 15px 2px rgba(239, 68, 68, 0.5)",
        "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
      ]
    }}
    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    className="w-full bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 rounded-r-xl shadow-sm mb-4 flex items-center justify-between gap-3 text-left transition-transform active:scale-[0.98]"
  >
    <div className="flex items-start gap-3">
      <AlertTriangle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={20} />
      <div>
        <h4 className="font-bold text-red-900 dark:text-red-100 text-sm mb-0.5">জরুরী নোটিশ</h4>
        <p className="text-[10px] text-red-800 dark:text-red-200 leading-tight line-clamp-1">বিস্তারিত দেখুন...</p>
      </div>
    </div>
    <ChevronRight className="text-red-500 shrink-0" size={18} />
  </motion.button>
);

export default EmergencyNoticeBox;
