import React from 'react';
import { ArrowLeft, Clock, Zap } from 'lucide-react';

interface DescoRulesViewProps {
  onBack: () => void;
}

export const DescoRulesView: React.FC<DescoRulesViewProps> = ({ onBack }) => {
  return (
    <div className="pb-24 animate-in slide-in-from-right duration-500 bg-slate-50 dark:bg-slate-900 min-h-screen relative transition-colors duration-300">
      {/* Navigation Header Section */}
      <div className="bg-white dark:bg-slate-800 sticky top-[var(--header-height)] z-10 border-b border-slate-100 dark:border-slate-700 shadow-sm transition-all">
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white shadow-md">
                <Zap size={20} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">রিচার্জের নিয়ম</h2>
                <p className="text-xs font-bold text-orange-600 dark:text-orange-400 mt-0.5">
                  ডেসকো রিচার্জ গাইড
                </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Clock size={40} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">কাজ চলমান</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">অপেক্ষা করুন...</p>
        </div>
      </div>
    </div>
  );
};
