import React from 'react';
import { ArrowLeft, Wrench } from 'lucide-react';

interface MaintenanceViewProps {
  onBack: () => void;
  setView: (view: string) => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ onBack, setView }) => {
  return (
    <>
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Wrench size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">মেইনটেন্যান্স ডেস্ক</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium">কাজ চলমান</p>
        
        <button 
          onClick={onBack}
          className="mt-8 px-6 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          ফিরে যান
        </button>
      </div>
    </>
  );
};
