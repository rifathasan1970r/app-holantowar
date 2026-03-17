import React, { useState } from 'react';
import { MapPin, Maximize, Bed, Bath, Key, Phone, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const ToLetView = () => {
  // Mock data for available flats
  const [availableFlats] = useState([
    {
      id: 1,
      unit: '৩-বি',
      floor: '৩য় তলা',
      side: 'দক্ষিণ পাশ, রোড ভিউ',
      size: '১২৫০',
      beds: 3,
      baths: 3,
      rent: '১৮,০০০',
      status: 'available'
    }
  ]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white px-1 border-l-4 border-emerald-500 pl-3">
        বাসাভাড়া / টু-লেট
      </h2>

      {availableFlats.length > 0 ? (
        availableFlats.map((flat) => (
          <motion.div 
            key={flat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden"
          >
             <div className="p-5 border-b border-slate-50 dark:border-slate-700">
                <div className="flex justify-between items-start mb-4">
                   <div>
                      <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">ফ্ল্যাট {flat.unit} <span className="text-sm font-medium text-slate-500 dark:text-slate-400">({flat.floor})</span></h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1.5 font-medium">
                         <MapPin size={14} className="text-emerald-500" /> {flat.side}
                      </p>
                   </div>
                   <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <CheckCircle2 size={12} /> ভাড়া হবে
                   </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-4 text-slate-600 dark:text-slate-400">
                   <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-700/50 py-2 rounded-xl border border-slate-100 dark:border-slate-600">
                      <Maximize size={16} className="text-slate-400 dark:text-slate-500 mb-1" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{flat.size} <span className="text-[10px] font-normal">বর্গফুট</span></span>
                   </div>
                   <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-700/50 py-2 rounded-xl border border-slate-100 dark:border-slate-600">
                      <Bed size={16} className="text-slate-400 dark:text-slate-500 mb-1" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{flat.beds} <span className="text-[10px] font-normal">বেড</span></span>
                   </div>
                   <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-700/50 py-2 rounded-xl border border-slate-100 dark:border-slate-600">
                      <Bath size={16} className="text-slate-400 dark:text-slate-500 mb-1" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{flat.baths} <span className="text-[10px] font-normal">বাথ</span></span>
                   </div>
                </div>
             </div>
             
             <div className="p-5 bg-slate-50 dark:bg-slate-700/30 flex justify-between items-center">
                <div>
                   <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-0.5">মাসিক ভাড়া</p>
                   <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">৳ {flat.rent}</p>
                </div>
                <a 
                  href="tel:01716524033"
                  className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2"
                >
                   <Phone size={16} /> যোগাযোগ
                </a>
             </div>
          </motion.div>
        ))
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 text-center">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key size={24} className="text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">কোনো ফ্ল্যাট খালি নেই</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">বর্তমানে এই ভবনে কোনো ফ্ল্যাট ভাড়ার জন্য খালি নেই।</p>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-5 flex items-start gap-4 mt-6">
         <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl text-blue-600 dark:text-blue-400 shadow-sm shrink-0">
            <Key size={20} />
         </div>
         <div>
            <p className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-1">বিজ্ঞাপন দিতে চান?</p>
            <p className="text-xs text-blue-700/80 dark:text-blue-300/80 leading-relaxed">আপনার ফ্ল্যাট ভাড়া দিতে চাইলে ম্যানেজারের সাথে যোগাযোগ করুন। অ্যাপে আপনার বিজ্ঞাপন যুক্ত করা হবে।</p>
            <a href="tel:01716524033" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 mt-3 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
              <Phone size={12} /> ম্যানেজারকে কল করুন
            </a>
         </div>
      </div>
    </div>
  );
};
