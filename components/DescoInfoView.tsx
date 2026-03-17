import React, { useState, useEffect } from 'react';
import { ArrowLeft, Copy, ChevronDown, ChevronUp, Search, Check } from 'lucide-react';
import { FLAT_OWNERS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface DescoInfoViewProps {
  onBack: () => void;
}

export const DescoInfoView: React.FC<DescoInfoViewProps> = ({ onBack }) => {
  const [showModal, setShowModal] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const filteredData = FLAT_OWNERS.filter(item => 
    item.flat.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.account.includes(searchTerm)
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setToastMsg('কপি হয়েছে');
    setTimeout(() => setToastMsg(''), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-900 flex flex-col max-w-md mx-auto transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-4 py-3 flex items-center gap-3 relative z-20">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-600 dark:text-slate-300">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">ডেসকো মিটারের তথ্য</h2>
      </div>

      {/* Top Fixed Popup Card - Now in flow */}
      <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 relative z-30">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          {/* Header / Trigger */}
          <div className="py-1.5 px-3 bg-white dark:bg-slate-800 flex flex-col items-center justify-center gap-1">
             <h3 className="font-bold text-[12px] text-slate-800 dark:text-white leading-tight text-center">আপনার ডেসকো একাউন্ট নম্বর কপি করুন</h3>
             
             <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 bg-purple-900 hover:bg-purple-800 px-3 py-0.5 rounded-full transition-colors group active:scale-95 shadow-sm"
             >
                <span className="text-[9px] font-bold text-white">লিস্ট দেখুন (২৭ টি ইউনিট)</span>
                <ChevronDown size={10} className={`text-white transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
             </button>
          </div>

          {/* Dropdown Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <div className="p-3 pt-2">
                  <div className="mb-3 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="ইউনিট খুঁজুন..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white placeholder:text-slate-400"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                    {filteredData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white dark:bg-slate-700 p-2.5 rounded-lg border border-slate-100 dark:border-slate-600 shadow-sm">
                        <div className="min-w-0 flex-1 mr-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-500">{item.flat}</span>
                            <span className="text-[11px] font-bold text-slate-800 dark:text-white truncate">{item.name}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">{item.account}</div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(item.account);
                            setIsExpanded(false);
                          }}
                          className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 active:scale-95 transition-all"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      
      <div className="flex-1 w-full overflow-hidden">
        <iframe 
          src="https://prepaid.desco.org.bd/customer/#/customer-info" 
          className="w-full h-full border-none"
          title="Desco Customer Info"
        />
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 z-[60]"
          >
            <Check size={14} className="text-green-400" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
