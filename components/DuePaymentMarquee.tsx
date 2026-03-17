import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const MONTHS_BN = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export const DuePaymentMarquee: React.FC = () => {
  const [dueUnits, setDueUnits] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState('');
  const [currentYear, setCurrentYear] = useState(0);

  useEffect(() => {
    const fetchDueUnits = async () => {
      const now = new Date();
      const month = MONTHS_BN[now.getMonth()];
      const year = now.getFullYear();
      setCurrentMonth(month);
      setCurrentYear(year);

      try {
        // Fetch all payments for current month/year
        const { data, error } = await supabase
          .from('payments')
          .select('unit_text, amount, due')
          .eq('month_name', month)
          .eq('year_num', year);

        if (error) throw error;

        // Get all units that HAVE paid (amount > 0)
        const paidUnits = new Set(data?.filter(p => p.amount > 0 && p.due === 0).map(p => p.unit_text) || []);
        const partialUnits = new Set(data?.filter(p => p.amount > 0 && p.due > 0).map(p => p.unit_text) || []);

        // Define all units
        const FLOORS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
        const UNITS_PER_FLOOR = ['A', 'B', 'C'];
        const ALL_UNITS = FLOORS.flatMap(f => UNITS_PER_FLOOR.map(u => `${f}${u}`));

        // Filter units that haven't paid fully
        const unpaid = ALL_UNITS.filter(unit => !paidUnits.has(unit));
        setDueUnits(unpaid);
      } catch (err) {
        console.error('Error fetching due units:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDueUnits();

    // Subscribe to changes
    const channel = supabase
      .channel('payments_due_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchDueUnits();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading || dueUnits.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-800/80 dark:to-slate-900/40 backdrop-blur-xl rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 dark:border-slate-700/50 overflow-hidden shadow-[0_0_20px_rgba(225,29,72,0.1)] dark:shadow-[0_0_20px_rgba(225,29,72,0.15)]"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-red-500 to-rose-600 p-2.5 rounded-2xl text-white shadow-lg shadow-red-500/20">
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">বকেয়া সার্ভিস চার্জ</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
              {currentMonth} {currentYear}
            </p>
          </div>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 px-3 py-1.5 rounded-xl">
          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
            {dueUnits.length} টি বাকি
          </span>
        </div>
      </div>

      <div className="relative flex overflow-hidden w-full">
        <motion.div 
          animate={{ x: ["0%", "-50%"] }}
          transition={{ 
            duration: Math.max(dueUnits.length * 4, 25), 
            repeat: Infinity, 
            ease: "linear",
            repeatType: "loop"
          }}
          className="flex items-center gap-3 py-1 whitespace-nowrap"
        >
          {dueUnits.map((unit) => (
            <div key={unit} className="flex items-center gap-2 bg-white/60 dark:bg-slate-700/40 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200/50 dark:border-slate-600/50 shadow-sm shrink-0">
              <span className="text-xs font-black text-slate-900 dark:text-white">{unit}</span>
              <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider">বকেয়া</span>
            </div>
          ))}
          {/* Duplicate for seamless loop */}
          {dueUnits.map((unit) => (
            <div key={`${unit}-dup`} className="flex items-center gap-2 bg-white/60 dark:bg-slate-700/40 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200/50 dark:border-slate-600/50 shadow-sm shrink-0">
              <span className="text-xs font-black text-slate-900 dark:text-white">{unit}</span>
              <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider">বকেয়া</span>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};
