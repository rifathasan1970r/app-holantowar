import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, CreditCard, Banknote, Droplets, Trash2, Zap, User, MoreHorizontal, Calculator, Calendar, CalendarDays, ChevronRight, Save, X, Plus, Minus, PieChart, ArrowUpRight, ArrowDownRight, Lock, Unlock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import EmergencyNoticeBox from '../src/components/EmergencyNoticeBox';

interface AccountsViewProps {
  onBack: () => void;
  setView: (view: string) => void;
}

interface OtherItem {
  label: string;
  amount: number;
}

interface MonthlyAccountData {
  id?: string;
  month: string;
  year: number;
  income: {
    surplus: number;
    serviceCharge: number;
    otherItems: OtherItem[];
    note?: string;
  };
  expense: {
    water: number;
    electricity: number;
    garbage: number;
    caretaker: number;
    nightGuard: number;
    otherItems: OtherItem[];
  };
}

const MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const INITIAL_YEAR = 2026;
const EDIT_PIN = "1966"; // Default PIN for editing

const getDefaultAccounts = (year: number): MonthlyAccountData[] => 
  MONTHS.map(month => ({
    month,
    year,
    income: { surplus: 0, serviceCharge: 0, otherItems: [], note: '' },
    expense: { water: 0, electricity: 0, garbage: 0, caretaker: 0, nightGuard: 0, otherItems: [] }
  }));

export const AccountsView: React.FC<AccountsViewProps> = ({ onBack, setView }) => {
  const currentMonthName = useMemo(() => {
    const date = new Date();
    let monthIndex = date.getMonth() - 1;
    if (monthIndex < 0) monthIndex = 11; // Handle January -> December
    return MONTHS[monthIndex];
  }, []);

  const [selectedYear, setSelectedYear] = useState(INITIAL_YEAR);
  const [accounts, setAccounts] = useState<MonthlyAccountData[]>(getDefaultAccounts(INITIAL_YEAR));
  const [editingMonth, setEditingMonth] = useState<string | null>(currentMonthName);
  const [editData, setEditData] = useState<MonthlyAccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // PIN Protection State
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pendingMonth, setPendingMonth] = useState<string | null>(null);

  // Initialize Data
  useEffect(() => {
    loadData();
  }, [selectedYear]);

  // Set editData when editingMonth changes (for initial load or clicks)
  useEffect(() => {
    if (editingMonth && accounts.length > 0) {
      const account = accounts.find(a => a.month === editingMonth);
      if (account) {
        setEditData(JSON.parse(JSON.stringify(account)));
      }
    }
  }, [editingMonth, accounts]);

  const migrateAccountData = (data: any[]): MonthlyAccountData[] => {
    return MONTHS.map(month => {
      const existing = data.find(d => d.month === month);
      if (existing) {
        // Migration: convert legacy 'others' number to otherItems array
        if (existing.income && typeof existing.income.others === 'number' && !existing.income.otherItems) {
          existing.income.otherItems = existing.income.others > 0 ? [{ label: 'অন্যান্য আয়', amount: existing.income.others }] : [];
          delete existing.income.others;
        }
        if (existing.expense && typeof existing.expense.others === 'number' && !existing.expense.otherItems) {
          existing.expense.otherItems = existing.expense.others > 0 ? [{ label: 'অন্যান্য ব্যয়', amount: existing.expense.others }] : [];
          delete existing.expense.others;
        }
        
        // Ensure otherItems exists
        if (existing.income && !existing.income.otherItems) existing.income.otherItems = [];
        if (existing.income && existing.income.note === undefined) existing.income.note = '';
        if (existing.expense) {
          if (!existing.expense.otherItems) existing.expense.otherItems = [];
          if (existing.expense.nightGuard === undefined) existing.expense.nightGuard = 0;
          if (existing.expense.garbage === undefined) existing.expense.garbage = 0;
        }
        
        return existing;
      }
      
      return {
        month,
        year: selectedYear,
        income: { surplus: 0, serviceCharge: 0, otherItems: [], note: '' },
        expense: { water: 0, electricity: 0, garbage: 0, caretaker: 0, nightGuard: 0, otherItems: [] }
      };
    });
  };

  const loadData = async () => {
    setLoading(true);
    
    // 1. Try to load from Supabase
    try {
      const { data, error } = await supabase
        .from('building_accounts')
        .select('*')
        .eq('year', selectedYear);

      if (error) {
        // If table doesn't exist or other error, fallback to local
        console.warn("Supabase fetch failed, using local fallback:", error.message);
        throw error;
      }

      if (data && data.length > 0) {
        setAccounts(migrateAccountData(data));
      } else {
        setAccounts(getDefaultAccounts(selectedYear));
      }
    } catch (err) {
      setAccounts(getDefaultAccounts(selectedYear));
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (month: string) => {
    if (editingMonth === month) {
      setEditingMonth(null);
      setEditData(null);
      return;
    }

    const account = accounts.find(a => a.month === month);
    if (account) {
      setEditData(JSON.parse(JSON.stringify(account))); // Deep copy
      setEditingMonth(month);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === EDIT_PIN) {
      setIsAuthorized(true);
      setShowPinModal(false);
      setPinInput("");
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  const handleSaveEdit = async () => {
    if (!editData) return;
    
    setIsSaving(true);
    try {
      // 1. Update Local State
      const updatedAccounts = accounts.map(a => a.month === editData.month ? editData : a);
      setAccounts(updatedAccounts);

      // 2. Sync with Supabase
      const { error } = await supabase
        .from('building_accounts')
        .upsert({
          month: editData.month,
          year: editData.year,
          income: editData.income,
          expense: editData.expense,
          updated_at: new Date().toISOString()
        }, { onConflict: 'month,year' });

      if (error) throw error;

      setEditingMonth(null);
      setEditData(null);
    } catch (err) {
      console.error("Save error:", err);
      alert("তথ্য সেভ করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (section: 'income' | 'expense', field: string, value: string) => {
    if (!editData) return;
    const numValue = parseFloat(value) || 0;
    setEditData({
      ...editData,
      [section]: {
        ...editData[section],
        [field]: numValue
      }
    });
  };

  const handleOtherItemChange = (section: 'income' | 'expense', index: number, field: 'label' | 'amount', value: string) => {
    if (!editData) return;
    const updatedItems = [...editData[section].otherItems];
    if (field === 'amount') {
      updatedItems[index].amount = parseFloat(value) || 0;
    } else {
      updatedItems[index].label = value;
    }
    setEditData({
      ...editData,
      [section]: {
        ...editData[section],
        otherItems: updatedItems
      }
    });
  };

  const addOtherItem = (section: 'income' | 'expense') => {
    if (!editData) return;
    setEditData({
      ...editData,
      [section]: {
        ...editData[section],
        otherItems: [...editData[section].otherItems, { label: '', amount: 0 }]
      }
    });
  };

  const removeOtherItem = (section: 'income' | 'expense', index: number) => {
    if (!editData) return;
    const updatedItems = editData[section].otherItems.filter((_, i) => i !== index);
    setEditData({
      ...editData,
      [section]: {
        ...editData[section],
        otherItems: updatedItems
      }
    });
  };

  // Calculations
  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let lastMonthBalance = 0;

    accounts.forEach(acc => {
      const otherIncome = acc.income.otherItems?.reduce((sum, item) => sum + item.amount, 0) || 0;
      const otherExpense = acc.expense.otherItems?.reduce((sum, item) => sum + item.amount, 0) || 0;
      
      const inc = acc.income.surplus + acc.income.serviceCharge + otherIncome;
      const exp = acc.expense.water + acc.expense.electricity + acc.expense.garbage + acc.expense.caretaker + acc.expense.nightGuard + otherExpense;
      
      totalIncome += inc;
      totalExpense += exp;

      if (inc > 0 || exp > 0) {
        lastMonthBalance = inc - exp;
      }
    });

    return {
      totalIncome,
      totalExpense,
      balance: lastMonthBalance
    };
  }, [accounts]);

  const getMonthSummary = (acc: MonthlyAccountData) => {
    const otherIncome = acc.income.otherItems?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const otherExpense = acc.expense.otherItems?.reduce((sum, item) => sum + item.amount, 0) || 0;
    
    const inc = acc.income.surplus + acc.income.serviceCharge + otherIncome;
    const exp = acc.expense.water + acc.expense.electricity + acc.expense.garbage + acc.expense.caretaker + acc.expense.nightGuard + otherExpense;
    return { inc, exp, bal: inc - exp };
  };

  return (
    <div className="pb-24 animate-in fade-in duration-1000 bg-[#f8fafc] min-h-screen relative font-sans text-slate-900">
      
      {/* Header - Minimal & Refined */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200">
        <div className="flex items-center justify-between px-4 py-4 max-w-md mx-auto">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center group-hover:border-emerald-200 group-hover:bg-emerald-50 transition-all">
              <ArrowLeft size={18} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest">ফিরে যান</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => isAuthorized ? setIsAuthorized(false) : setShowPinModal(true)}
              className={`p-2 rounded-full transition-all ${isAuthorized 
                ? 'text-emerald-600 hover:bg-emerald-50' 
                : 'text-slate-400 hover:bg-slate-100'}`}
            >
              {isAuthorized ? <Unlock size={20} /> : <Lock size={20} />}
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto px-4 py-6 space-y-6">
        <EmergencyNoticeBox onClick={() => setView('EMERGENCY_NOTICE_DETAIL')} />
        {/* Title Section */}
        <div className="space-y-4">
          <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">স্বচ্ছ হিসাব খাতা</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">বাৎসরিক আর্থিক বিবরণী • {selectedYear}</p>
          </div>
          
          {/* Year Selection Tabs - Matching ServiceChargeView style */}
          <div className="bg-white border border-slate-100 p-1 rounded-xl shadow-sm flex">
            {[2025, 2026, 2027].map(year => (
              <button 
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${selectedYear === year ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <CalendarDays size={16} /> {year}
              </button>
            ))}
          </div>
        </div>

        {/* Premium Ledger Summary Card */}
        <div 
          className="rounded-2xl shadow-xl overflow-hidden border-none"
          style={{ background: 'linear-gradient(135deg, #6a11cb, #2575fc)' }}
        >
          <div className="p-6 border-b border-white/10">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">বর্তমান উদ্বৃত্ত</p>
              <div className="w-8 h-8 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-sm backdrop-blur-sm">
                <PieChart size={18} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl font-medium text-white/60">৳</span>
              <h3 className="text-4xl font-black text-white tracking-tighter">
                {summary.balance.toLocaleString()}
              </h3>
            </div>
          </div>
          
          <div className="grid grid-cols-2 divide-x divide-white/10">
            <div className="p-5 space-y-1">
              <div className="flex items-center gap-2 text-white/90">
                <ArrowUpRight size={14} className="text-emerald-300" />
                <p className="text-[9px] font-bold uppercase tracking-wider">মোট আয়</p>
              </div>
              <p className="text-xl font-extrabold text-white">৳{summary.totalIncome.toLocaleString()}</p>
            </div>
            <div className="p-5 space-y-1">
              <div className="flex items-center gap-2 text-white/90">
                <ArrowDownRight size={14} className="text-rose-300" />
                <p className="text-[9px] font-bold uppercase tracking-wider">মোট ব্যয়</p>
              </div>
              <p className="text-xl font-extrabold text-white">৳{summary.totalExpense.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Ledger Table Header */}
        <div className="grid grid-cols-12 px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-y border-slate-200 bg-slate-50/50">
          <div className="col-span-4 border-r border-slate-200/50 pr-2">বিবরণ (Month)</div>
          <div className="col-span-3 text-right border-r border-slate-200/50 px-2">আয় (+)</div>
          <div className="col-span-3 text-right border-r border-slate-200/50 px-2">ব্যয় (-)</div>
          <div className="col-span-2 text-right pl-2">উদ্বৃত্ত</div>
        </div>

        {/* Monthly Ledger Rows */}
        <div className="space-y-2">
            {accounts.map((acc, index) => {
                const { inc, exp, bal } = getMonthSummary(acc);
                const isCurrentMonth = acc.month === currentMonthName;
                const isEditing = editingMonth === acc.month;
                const currentMonthIndex = MONTHS.indexOf(currentMonthName);
                const monthIndex = MONTHS.indexOf(acc.month);
                const isFutureMonth = monthIndex > currentMonthIndex;

                return (
                    <div key={acc.month} className="space-y-2">
                      <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          onClick={() => handleEditClick(acc.month)}
                          className={`grid grid-cols-12 items-center px-4 py-5 cursor-pointer transition-all rounded-xl border relative ${isEditing ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'} ${isCurrentMonth ? 'border-emerald-500/50 ring-1 ring-emerald-500/20 animate-glow' : ''}`}
                      >
                          <div className="col-span-4 flex items-center gap-3 border-r border-slate-100 h-full pr-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${isCurrentMonth ? 'bg-emerald-500' : isFutureMonth ? 'bg-amber-400' : 'bg-slate-200'}`}></div>
                              <div className="flex flex-col">
                                <span className={`text-sm font-bold ${isEditing ? 'text-emerald-700' : 'text-slate-700'}`}>{acc.month}</span>
                              </div>
                          </div>
                          
                          {isFutureMonth ? (
                            <div className="col-span-8 text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] flex items-center justify-center h-full">
                              আসন্ন
                            </div>
                          ) : (
                            <>
                              <div className="col-span-3 text-right text-xs font-bold text-emerald-600 border-r border-slate-100 h-full px-2 flex items-center justify-end">
                                ৳{inc.toLocaleString()}
                              </div>
                              <div className="col-span-3 text-right text-xs font-bold text-rose-500 border-r border-slate-100 h-full px-2 flex items-center justify-end">
                                ৳{exp.toLocaleString()}
                              </div>
                              <div className={`col-span-2 text-right text-xs font-black h-full pl-2 flex items-center justify-end ${bal >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                                {bal.toLocaleString()}
                              </div>
                            </>
                          )}
                          
                          {/* Tiny hint at bottom */}
                          <div className="absolute bottom-1 left-0 right-0 flex justify-center items-center gap-2 pointer-events-none">
                            <div className="flex items-center justify-center w-3 h-3 rounded-full bg-slate-50 border border-slate-200">
                              <Plus size={7} className="text-slate-400" />
                            </div>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-tight">বিস্তারিত তথ্য দেখুন</span>
                            <div className="flex items-center justify-center w-3 h-3 rounded-full bg-slate-50 border border-slate-200">
                              <ChevronRight size={7} className={`text-slate-400 transition-transform ${isEditing ? 'rotate-90' : ''}`} />
                            </div>
                          </div>
                      </motion.div>

                      {/* Inline Detail/Edit View */}
                      <AnimatePresence>
                        {isEditing && editData && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-white border border-emerald-100 rounded-xl shadow-inner mx-1"
                          >
                            <div className="p-5 space-y-6">
                              {/* Income Section */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded-md flex items-center justify-center">
                                      <TrendingUp size={12} />
                                    </div>
                                    <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">আয় বিবরণী</h4>
                                  </div>
                                  <div className="h-[1px] flex-1 mx-4 bg-emerald-50"></div>
                                </div>
                                <div className="space-y-2">
                                  {/* Fixed Income Fields */}
                                  {[
                                    { label: `${MONTHS[(MONTHS.indexOf(acc.month) - 1 + 12) % 12]} মাসের উদ্বৃত্ত টাকা`, field: 'surplus' },
                                    { label: 'সার্ভিস চার্জ', field: 'serviceCharge' }
                                  ].map((item) => (
                                    <div key={item.field} className="flex items-center justify-between text-xs">
                                      <span className="text-slate-500 font-medium">{item.label}</span>
                                      {isAuthorized ? (
                                        <input 
                                          type="number" 
                                          value={(editData.income as any)[item.field] || ''}
                                          onChange={(e) => handleInputChange('income', item.field, e.target.value)}
                                          className="w-24 bg-slate-50 border border-slate-200 rounded-md py-1 px-2 text-right font-bold text-slate-800 focus:border-emerald-500 outline-none"
                                        />
                                      ) : (
                                        <span className="font-bold text-slate-700">৳ {(editData.income as any)[item.field].toLocaleString()}</span>
                                      )}
                                    </div>
                                  ))}

                                  {/* Dynamic Income Title */}
                                  {(editData.income.otherItems?.length > 0 || isAuthorized) && (
                                    <div className="pt-2 pb-1 border-t border-emerald-50/50">
                                      <p className="text-[9px] font-bold text-emerald-500/70 uppercase tracking-tighter">অন্যান্য হতে আয়</p>
                                    </div>
                                  )}

                                  {/* Dynamic Income Fields */}
                                  {editData.income.otherItems?.map((item, idx) => (
                                    <div key={`income-other-${idx}`} className="flex items-center justify-between gap-2">
                                      {isAuthorized ? (
                                        <>
                                          <div className="flex-1 flex items-center gap-2 min-w-0">
                                            <button 
                                              onClick={() => removeOtherItem('income', idx)}
                                              className="shrink-0 text-rose-400 hover:text-rose-600 transition-colors"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                            <input 
                                              type="text" 
                                              value={item.label}
                                              placeholder="বিবরণ"
                                              onChange={(e) => handleOtherItemChange('income', idx, 'label', e.target.value)}
                                              className="flex-1 bg-slate-50 border border-slate-200 rounded-md py-1 px-2 text-xs font-medium text-slate-700 focus:border-emerald-500 outline-none min-w-0"
                                            />
                                          </div>
                                          <input 
                                            type="number" 
                                            value={item.amount || ''}
                                            onChange={(e) => handleOtherItemChange('income', idx, 'amount', e.target.value)}
                                            className="w-24 bg-slate-50 border border-slate-200 rounded-md py-1 px-2 text-right font-bold text-slate-800 focus:border-emerald-500 outline-none shrink-0"
                                          />
                                        </>
                                      ) : (
                                        <div className="flex items-center justify-between w-full text-xs">
                                          <span className="text-slate-500 font-medium">{item.label || 'অন্যান্য আয়'}</span>
                                          <span className="font-bold text-slate-700">৳ {item.amount.toLocaleString()}</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}

                                  {/* Add Other Income Button */}
                                  {isAuthorized && (
                                    <button 
                                      onClick={() => addOtherItem('income')}
                                      className="w-full py-2 mt-1 border border-dashed border-emerald-200 rounded-lg flex items-center justify-center gap-2 text-emerald-600 hover:bg-emerald-50 transition-all group"
                                    >
                                      <Plus size={14} className="group-hover:scale-110 transition-transform" />
                                      <span className="text-[10px] font-bold uppercase tracking-wider">অন্যান্য আয় যোগ করুন</span>
                                    </button>
                                  )}

                                  {/* Income Total */}
                                  <div className="pt-2 border-t border-emerald-50 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">মোট আয়</span>
                                    <span className="text-xs font-black text-emerald-700">
                                      ৳ {(editData.income.surplus + editData.income.serviceCharge + (editData.income.otherItems?.reduce((sum, i) => sum + i.amount, 0) || 0)).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Expense Section */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 bg-rose-50 text-rose-600 rounded-md flex items-center justify-center">
                                      <TrendingDown size={12} />
                                    </div>
                                    <h4 className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">ব্যয় বিবরণী</h4>
                                  </div>
                                  <div className="h-[1px] flex-1 mx-4 bg-rose-50"></div>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                  {/* Fixed Expense Fields */}
                                  {[
                                    { label: 'বিদ্যুৎ বিল', field: 'electricity' },
                                    { label: 'পানি বিল', field: 'water' },
                                    { label: 'ময়লার বিল', field: 'garbage' },
                                    { label: 'গার্ড/কেয়ারটেকার বেতন', field: 'caretaker' },
                                    { label: 'নাইট গার্ড বিল', field: 'nightGuard' }
                                  ].map((item) => (
                                    <div key={item.field} className="flex items-center justify-between text-xs">
                                      <span className="text-slate-500 font-medium">{item.label}</span>
                                      {isAuthorized ? (
                                        <input 
                                          type="number" 
                                          value={(editData.expense as any)[item.field] || ''}
                                          onChange={(e) => handleInputChange('expense', item.field, e.target.value)}
                                          className="w-24 bg-slate-50 border border-slate-200 rounded-md py-1 px-2 text-right font-bold text-slate-800 focus:border-emerald-500 outline-none"
                                        />
                                      ) : (
                                        <span className="font-bold text-slate-700">৳ {(editData.expense as any)[item.field].toLocaleString()}</span>
                                      )}
                                    </div>
                                  ))}

                                  {/* Dynamic Expense Title */}
                                  {(editData.expense.otherItems?.length > 0 || isAuthorized) && (
                                    <div className="pt-2 pb-1 border-t border-rose-50/50">
                                      <p className="text-[9px] font-bold text-rose-500/70 uppercase tracking-tighter">অন্যান্য হতে ব্যয়</p>
                                    </div>
                                  )}

                                  {/* Dynamic Expense Fields */}
                                  {editData.expense.otherItems?.map((item, idx) => (
                                    <div key={`expense-other-${idx}`} className="flex items-center justify-between gap-2">
                                      {isAuthorized ? (
                                        <>
                                          <div className="flex-1 flex items-center gap-2 min-w-0">
                                            <button 
                                              onClick={() => removeOtherItem('expense', idx)}
                                              className="shrink-0 text-rose-400 hover:text-rose-600 transition-colors"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                            <input 
                                              type="text" 
                                              value={item.label}
                                              placeholder="বিবরণ"
                                              onChange={(e) => handleOtherItemChange('expense', idx, 'label', e.target.value)}
                                              className="flex-1 bg-slate-50 border border-slate-200 rounded-md py-1 px-2 text-xs font-medium text-slate-700 focus:border-emerald-500 outline-none min-w-0"
                                            />
                                          </div>
                                          <input 
                                            type="number" 
                                            value={item.amount || ''}
                                            onChange={(e) => handleOtherItemChange('expense', idx, 'amount', e.target.value)}
                                            className="w-24 bg-slate-50 border border-slate-200 rounded-md py-1 px-2 text-right font-bold text-slate-800 focus:border-emerald-500 outline-none shrink-0"
                                          />
                                        </>
                                      ) : (
                                        <div className="flex items-center justify-between w-full text-xs">
                                          <span className="text-slate-500 font-medium">{item.label || 'অন্যান্য ব্যয়'}</span>
                                          <span className="font-bold text-slate-700">৳ {item.amount.toLocaleString()}</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}

                                  {/* Add Other Expense Button */}
                                  {isAuthorized && (
                                    <button 
                                      onClick={() => addOtherItem('expense')}
                                      className="w-full py-2 mt-1 border border-dashed border-rose-200 rounded-lg flex items-center justify-center gap-2 text-rose-600 hover:bg-rose-50 transition-all group"
                                    >
                                      <Plus size={14} className="group-hover:scale-110 transition-transform" />
                                      <span className="text-[10px] font-bold uppercase tracking-wider">অন্যান্য ব্যয় যোগ করুন</span>
                                    </button>
                                  )}

                                  {/* Expense Total */}
                                  <div className="pt-2 border-t border-rose-50 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">মোট ব্যয়</span>
                                    <span className="text-xs font-black text-rose-700">
                                      ৳ {(editData.expense.water + editData.expense.electricity + editData.expense.garbage + editData.expense.caretaker + editData.expense.nightGuard + (editData.expense.otherItems?.reduce((sum, i) => sum + i.amount, 0) || 0)).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Premium Note Box */}
                              <div className="pt-4 border-t border-slate-100">
                                <div className="relative bg-white rounded-xl p-4 border border-slate-200 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] overflow-hidden group">
                                  {/* Decorative elements */}
                                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-bl-[100px] -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110 pointer-events-none"></div>
                                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-slate-50 to-slate-100/50 rounded-tr-[80px] -ml-6 -mb-6 transition-transform duration-500 group-hover:scale-110 pointer-events-none"></div>
                                  
                                  <div className="relative z-10 space-y-3">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                      </div>
                                      <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">বিশেষ নোট / মন্তব্য</h4>
                                    </div>
                                    
                                    {isAuthorized ? (
                                      <textarea
                                        value={editData.income.note || ''}
                                        onChange={(e) => setEditData({ ...editData, income: { ...editData.income, note: e.target.value } })}
                                        placeholder="এই মাসের জন্য কোনো বিশেষ নোট বা মন্তব্য লিখুন..."
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-lg p-3 text-xs font-medium text-slate-700 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 outline-none resize-none min-h-[80px] transition-all placeholder:text-slate-400"
                                      />
                                    ) : (
                                      <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-3 min-h-[60px]">
                                        {editData.income.note ? (
                                          <p className="text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{editData.income.note}</p>
                                        ) : (
                                          <p className="text-xs font-medium text-slate-400 italic">কোনো নোট বা মন্তব্য যোগ করা হয়নি</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Comprehensive Summary Block - Always visible when expanded */}
                              <div className="pt-4 border-t border-slate-100 space-y-3">
                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                                  <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-slate-500 uppercase">মোট আয়</span>
                                    <span className="text-emerald-600">৳ {(editData.income.surplus + editData.income.serviceCharge + (editData.income.otherItems?.reduce((sum, i) => sum + i.amount, 0) || 0)).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-slate-500 uppercase">মোট ব্যয়</span>
                                    <span className="text-rose-600">৳ {(editData.expense.water + editData.expense.electricity + editData.expense.garbage + editData.expense.caretaker + editData.expense.nightGuard + (editData.expense.otherItems?.reduce((sum, i) => sum + i.amount, 0) || 0)).toLocaleString()}</span>
                                  </div>
                                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-[11px] font-black text-slate-700 uppercase">নিট উদ্বৃত্ত</span>
                                    <span className={`text-sm font-black ${((editData.income.surplus + editData.income.serviceCharge + (editData.income.otherItems?.reduce((sum, i) => sum + i.amount, 0) || 0)) - (editData.expense.water + editData.expense.electricity + editData.expense.garbage + editData.expense.caretaker + editData.expense.nightGuard + (editData.expense.otherItems?.reduce((sum, i) => sum + i.amount, 0) || 0))) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      ৳{((editData.income.surplus + editData.income.serviceCharge + (editData.income.otherItems?.reduce((sum, i) => sum + i.amount, 0) || 0)) - (editData.expense.water + editData.expense.electricity + editData.expense.garbage + editData.expense.caretaker + editData.expense.nightGuard + (editData.expense.otherItems?.reduce((sum, i) => sum + i.amount, 0) || 0))).toLocaleString()}
                                    </span>
                                  </div>
                                </div>

                                {isAuthorized && (
                                  <div className="flex items-center justify-end">
                                    <button 
                                      onClick={handleSaveEdit}
                                      disabled={isSaving}
                                      className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-xs font-bold shadow-md shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"
                                    >
                                      {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                      সেভ করুন
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                );
            })}
        </div>
      </div>

      {/* PIN Modal - Clean & Professional */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPinModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-[300px] bg-white rounded-2xl shadow-2xl p-8 border border-slate-100"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Lock size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">নিরাপত্তা পিন</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">এডিট মোড আনলক করুন</p>
              </div>

              <form onSubmit={handlePinSubmit} className="space-y-6">
                <input 
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  autoFocus
                  className={`w-full text-center text-3xl tracking-[0.5em] font-bold py-3 bg-slate-50 border-2 rounded-xl focus:outline-none transition-all ${pinError ? 'border-rose-500' : 'border-slate-100 focus:border-emerald-500'}`}
                  placeholder="••••"
                />
                {pinError && (
                  <p className="text-[10px] text-center font-bold text-rose-500 uppercase">ভুল পিন কোড!</p>
                )}
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowPinModal(false)}
                    className="flex-1 py-3 text-xs font-bold text-slate-400 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    বাতিল
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 text-xs font-bold text-white bg-emerald-600 rounded-lg shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-colors"
                  >
                    নিশ্চিত
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
