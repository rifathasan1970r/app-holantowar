import React from 'react';
import { Globe, Facebook, MessageCircle, Wrench } from 'lucide-react';

interface MaintenanceViewProps {
  onBack: () => void;
  setView: (view: string) => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ onBack, setView }) => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 space-y-8">
      {/* Maintenance Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-tr from-orange-400 to-amber-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20 rotate-3 hover:rotate-0 transition-transform duration-500">
          <Wrench size={36} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">মেইনটেন্যান্স ডেস্ক</h2>
      </div>

      {/* Developer Box - Premium Design */}
      <div className="relative w-full max-w-[420px] group">
        {/* Background Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#6a11cb] via-[#2575fc] to-[#6a11cb] rounded-[20px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        
        <div className="relative bg-white dark:bg-slate-900 rounded-[20px] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800">
          {/* Top Label */}
          <div className="bg-slate-50 dark:bg-slate-800/30 py-2 border-b border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
              অ্যাপ আপডেট করেছেন
            </span>
          </div>

          {/* Top Banner Gradient */}
          <div className="h-24 bg-gradient-to-r from-[#6a11cb] to-[#2575fc]"></div>
          
          <div className="px-6 pb-8 -mt-12 text-center">
            {/* ... profile and info ... */}
            <div className="relative inline-block mb-4">
              <div className="absolute -inset-1 bg-white dark:bg-slate-900 rounded-full"></div>
              <img 
                className="relative w-24 h-24 rounded-full object-cover object-top border-4 border-white dark:border-slate-900 shadow-xl" 
                src="https://i.imghippo.com/files/uvH2161.jpg" 
                alt="এ এইচ এম রিফাত হাসান" 
              />
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white dark:border-slate-900 rounded-full"></div>
            </div>

            {/* Info */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">A.H.M RIFAT HASAN</h3>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">এ এইচ এম রিফাত হাসান</p>
              <div className="inline-flex items-center px-3 py-1 mt-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                Site Admin
              </div>
            </div>

            {/* Social Links */}
            <div className="grid grid-cols-1 gap-3">
              <a 
                href="https://ahmrifathasan.bio.link/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 font-bold text-sm border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
              >
                <Globe size={18} className="text-[#6a11cb]" /> 
                <span>WEBSITE</span>
              </a>

              <div className="grid grid-cols-2 gap-3">
                <a 
                  href="https://www.facebook.com/rifathasan.1234" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1877F2]/10 text-[#1877F2] font-bold text-sm border border-[#1877F2]/20 hover:bg-[#1877F2]/20 transition-all active:scale-95"
                >
                  <Facebook size={18} /> 
                  <span>FACEBOOK</span>
                </a>

                <a 
                  href="https://wa.me/+8801626678138" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366]/10 text-[#25D366] font-bold text-sm border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-all active:scale-95"
                >
                  <MessageCircle size={18} /> 
                  <span>WHATSAPP</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <button 
        onClick={onBack}
        className="px-8 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
      >
        ফিরে যান
      </button>
    </div>
  );
};
