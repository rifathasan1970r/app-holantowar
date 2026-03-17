import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Plus, 
  Calendar as CalendarIcon, 
  FileText, 
  ExternalLink,
  Trash2,
  X,
  Send,
  LogOut as LogOutIcon,
  Bold,
  Pin,
  Edit
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

interface Notice {
  id: string;
  title: string;
  date: string;
  driveLink: string;
  createdAt: number;
  isPinned?: boolean;
  description?: string;
}

interface EmergencyNoticeDetailViewProps {
  onBack: () => void;
}

const BENGALI_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const BENGALI_NUMBERS: { [key: string]: string } = {
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
  '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
};

const toBengaliNumber = (num: string | number) => {
  return num.toString().split('').map(char => BENGALI_NUMBERS[char] || char).join('');
};

export const EmergencyNoticeDetailView: React.FC<EmergencyNoticeDetailViewProps> = ({ onBack }) => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [previewNotice, setPreviewNotice] = useState<Notice | null>(null);
  const [noticeToDelete, setNoticeToDelete] = useState<string | null>(null);
  const [noticeToEdit, setNoticeToEdit] = useState<any | null>(null);
  
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Date states
  const today = new Date();
  const [day, setDay] = useState(today.getDate().toString());
  const [month, setMonth] = useState(BENGALI_MONTHS[today.getMonth()]);
  const [year, setYear] = useState(today.getFullYear().toString());

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleBoldClick = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = description.substring(start, end);
    const newText = description.substring(0, start) + `**${selectedText || 'বোল্ড লেখা'}**` + description.substring(end);
    setDescription(newText);
    
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(start + 2, end + 2 + (selectedText ? 0 : 9));
    }, 0);
  };

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'emergency_notices')
        .single();
        
      if (data && data.value) {
        const parsedNotices = JSON.parse(data.value);
        // Sort by pinned first, then createdAt descending
        parsedNotices.sort((a: Notice, b: Notice) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return b.createdAt - a.createdAt;
        });
        setNotices(parsedNotices);
      } else {
        setNotices([]);
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleTogglePin = async (id: string) => {
    try {
      const newNotices = notices.map(n => 
        n.id === id ? { ...n, isPinned: !n.isPinned } : n
      );
      // Re-sort
      newNotices.sort((a: Notice, b: Notice) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.createdAt - a.createdAt;
      });

      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'emergency_notices', value: JSON.stringify(newNotices) }, { onConflict: 'key' });
        
      if (error) throw error;
      setNotices(newNotices);
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  };

  const handleLockClick = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
    } else {
      setShowLogin(true);
    }
  };

  const handleLogin = () => {
    if (pinInput === '1966') { 
      setIsAdminMode(true);
      setShowLogin(false);
      setPinInput('');
    } else {
      alert('ভুল পিন কোড!');
    }
  };

  const handleLogout = () => {
    setIsAdminMode(false);
  };

  const getPreviewLink = (url: string) => {
    if (url.includes('drive.google.com')) {
      return url.replace(/\/(view|edit).*$/, '/preview');
    }
    return url;
  };

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !day || !month || !year || !driveLink) return;

    setIsSubmitting(true);
    try {
      const formattedDate = `${toBengaliNumber(day)} ${month} ${toBengaliNumber(year)}`;
      
      const newNotice: Notice = {
        id: Date.now().toString(),
        title,
        date: formattedDate,
        driveLink,
        createdAt: Date.now(),
        isPinned: false,
        description: description.trim() || undefined
      };
      
      const newNotices = [newNotice, ...notices];
      
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'emergency_notices', value: JSON.stringify(newNotices) }, { onConflict: 'key' });
        
      if (error) throw error;
      
      setNotices(newNotices);
      setTitle('');
      setDescription('');
      setDay(today.getDate().toString());
      setMonth(BENGALI_MONTHS[today.getMonth()]);
      setYear(today.getFullYear().toString());
      setDriveLink('');
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding notice:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!noticeToDelete) return;
    try {
      const newNotices = notices.filter(n => n.id !== noticeToDelete);
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'emergency_notices', value: JSON.stringify(newNotices) }, { onConflict: 'key' });
        
      if (error) throw error;
      setNotices(newNotices);
    } catch (error) {
      console.error("Error deleting notice:", error);
    } finally {
      setNoticeToDelete(null);
    }
  };

  const confirmEdit = async () => {
    if (!noticeToEdit) return;
    try {
      const newNotices = notices.map(n => n.id === noticeToEdit.id ? noticeToEdit : n);
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'emergency_notices', value: JSON.stringify(newNotices) }, { onConflict: 'key' });
        
      if (error) throw error;
      setNotices(newNotices);
    } catch (error) {
      console.error("Error editing notice:", error);
    } finally {
      setNoticeToEdit(null);
    }
  };

  if (previewNotice) {
    return (
      <div className="space-y-4 pb-20 min-h-[calc(100vh-5rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setPreviewNotice(null)} 
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
            >
              <ChevronLeft size={24} className="text-slate-600 dark:text-slate-300" />
            </button>
            <div className="flex flex-col">
              <h3 className="font-bold text-slate-800 dark:text-white line-clamp-1 text-sm sm:text-base">
                {previewNotice.title}
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {previewNotice.date}
              </span>
            </div>
          </div>
          <button 
            onClick={() => window.open(previewNotice.driveLink, '_blank')}
            className="p-2.5 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 hover:bg-primary-100 transition-all shrink-0"
            title="ব্রাউজারে ওপেন করুন"
          >
            <ExternalLink size={20} />
          </button>
        </div>

        {/* PDF Preview Container */}
        <div className="flex-1 w-full flex flex-col items-center justify-start gap-4">
          <div 
            className="w-full bg-white shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700 rounded-xl shrink-0" 
            style={{ aspectRatio: '1 / 1.414', maxHeight: '60vh' }}
          >
            <iframe 
              src={getPreviewLink(previewNotice.driveLink)} 
              className="w-full h-full border-none bg-white"
              title="PDF Preview"
              allow="autoplay"
            />
          </div>
          
          <div className="w-full bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl p-4 text-center my-1">
            <h4 className="text-[17px] font-bold text-rose-600 dark:text-rose-400 mb-1">আপনার গুরুত্বপূর্ণ নোটিশ</h4>
            <p className="text-[14px] font-medium text-rose-500/80 dark:text-rose-400/80 m-0">সকলকে মেনে চলার জন্য অনুরোধ করা হচ্ছে</p>
          </div>

          {previewNotice.description && (
            <div className="w-full bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="text-slate-800 dark:text-slate-200 font-normal text-[15px] leading-loose text-left m-0 whitespace-pre-wrap tracking-wide">
                {previewNotice.description.split(/(\*\*[\s\S]*?\*\*)/g).map((part, i) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-bold text-black dark:text-white">{part.slice(2, -2)}</strong>;
                  }
                  return <span key={i}>{part}</span>;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft size={24} className="text-slate-600 dark:text-slate-300" />
          </button>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">জরুরী নোটিশ</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {isAdminMode && (
            <button 
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
              title="লগআউট"
            >
              <LogOutIcon size={20} />
            </button>
          )}
          <button 
            onClick={handleLockClick}
            className={`p-2.5 rounded-xl transition-all duration-300 ${
              isAdminMode 
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' 
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {isAdminMode ? <Unlock size={20} /> : <Lock size={20} />}
          </button>
        </div>
      </div>

      {/* Login Modal */}
      <AnimatePresence>
        {showLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-700"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">এডমিন লগইন</h3>
                <button onClick={() => setShowLogin(false)} className="text-slate-400 hover:text-rose-500">
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 block">পিন কোড দিন</label>
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="****"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-center text-2xl tracking-widest focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleLogin();
                    }}
                  />
                </div>
                <button
                  onClick={handleLogin}
                  className="w-full bg-primary-600 text-white font-bold py-3 rounded-xl hover:bg-primary-700 active:scale-95 transition-all"
                >
                  লগইন করুন
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Controls */}
      <AnimatePresence>
        {isAdminMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-xl border border-primary-100 dark:border-primary-900/30"
          >
            {!showAddForm ? (
              <button 
                onClick={() => setShowAddForm(true)}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-500/20"
              >
                <Plus size={20} />
                নতুন নোটিশ যোগ করুন
              </button>
            ) : (
              <form onSubmit={handleAddNotice} className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-slate-800 dark:text-white">নতুন নোটিশ ফরম</h3>
                  <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-rose-500">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">নোটিশের নাম</label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="উদা: পানির বিল সংক্রান্ত নোটিশ"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">তারিখ</label>
                    <div className="flex gap-2">
                      <select 
                        value={day}
                        onChange={(e) => setDay(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                      >
                        {Array.from({ length: 31 }, (_, i) => (
                          <option key={i + 1} value={(i + 1).toString()}>{toBengaliNumber(i + 1)}</option>
                        ))}
                      </select>
                      <select 
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="flex-[1.5] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                      >
                        {BENGALI_MONTHS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select 
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                      >
                        <option value={today.getFullYear().toString()}>{toBengaliNumber(today.getFullYear())}</option>
                        <option value={(today.getFullYear() + 1).toString()}>{toBengaliNumber(today.getFullYear() + 1)}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">পিডিএফ এর নিচের লেখা (ঐচ্ছিক)</label>
                      <button 
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleBoldClick}
                        className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                        title="বোল্ড করুন"
                      >
                        <Bold size={14} />
                      </button>
                    </div>
                    <textarea 
                      ref={textareaRef}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="পিডিএফ এর নিচে দেখাবে... (বোল্ড করতে লেখা সিলেক্ট করে B বাটনে ক্লিক করুন)"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all min-h-[100px] resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">ড্রাইভ লিংক (PDF)</label>
                    <input 
                      type="url" 
                      value={driveLink}
                      onChange={(e) => setDriveLink(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'পাবলিশ হচ্ছে...' : (
                    <>
                      <Send size={18} />
                      পাবলিশ করুন
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notices List */}
      <div className="max-w-[420px] mx-auto font-['Hind_Siliguri',sans-serif]">
        <div className="flex items-center justify-center gap-2.5 my-2.5 mb-5">
          <div className="w-1 h-7 bg-[#e63946] rounded-[3px]"></div>
          <h1 className="text-[26px] font-bold text-[#111827] dark:text-white m-0">নোটিশবোর্ড</h1>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-10 h-10 border-4 border-[#1f6fa7] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-500">লোড হচ্ছে...</p>
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-10 rounded-3xl text-center border border-dashed border-slate-200 dark:border-slate-700">
            <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">কোনো নোটিশ পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Pinned Notices Section */}
            {notices.filter(n => n.isPinned).map((notice, index) => (
              <motion.div
                key={`pinned-${notice.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setPreviewNotice(notice)}
                className="bg-[#1f6fa7] rounded-[14px] p-4 text-white mb-4 flex gap-2.5 items-start cursor-pointer transition-transform active:scale-[0.98] relative pt-8 border-2 border-[#e63946]"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-br from-[#6a11cb] to-[#2575fc] text-white px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap shadow-sm">
                  📌 পিন করা নোটিশ
                </div>
                
                <div className="bg-white text-[#1f6fa7] px-2 py-1.5 rounded-[10px] font-semibold text-sm min-w-[82px] text-center self-center shrink-0">
                  {notice.date}
                </div>
                
                <div className="flex-[1.3] min-w-0 self-center">
                  <p className="text-[15px] leading-relaxed font-semibold m-0 hover:underline">
                    {notice.title}
                  </p>
                </div>

                {isAdminMode && (
                  <div className="flex flex-col items-end gap-2 shrink-0 ml-2 z-10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setNoticeToEdit(notice);
                      }}
                      className="p-2 rounded-xl transition-all shadow-sm bg-blue-500 hover:bg-blue-600 text-white"
                      title="এডিট"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePin(notice.id);
                      }}
                      className="p-2 rounded-xl transition-all shadow-sm bg-amber-500 hover:bg-amber-600 text-white"
                      title="আনপিন করুন"
                    >
                      <Pin size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setNoticeToDelete(notice.id);
                      }}
                      className="p-2 rounded-xl bg-rose-500/80 hover:bg-rose-600 text-white transition-all shadow-sm"
                      title="ডিলিট"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}

            {/* All Notices Section */}
            {[...notices].sort((a, b) => b.createdAt - a.createdAt).map((notice, index) => {
              const isFirst = index === 0;
              
              return (
                <motion.div
                  key={`all-${notice.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setPreviewNotice(notice)}
                  className={`bg-[#1f6fa7] rounded-[14px] p-4 text-white mb-4 flex gap-2.5 items-start cursor-pointer transition-transform active:scale-[0.98] ${
                    isFirst ? 'relative pt-8' : ''
                  }`}
                >
                  {isFirst && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-br from-[#6a11cb] to-[#2575fc] text-white px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap shadow-sm">
                      সকল নোটিশ
                    </div>
                  )}
                  
                  <div className="bg-white text-[#1f6fa7] px-2 py-1.5 rounded-[10px] font-semibold text-sm min-w-[82px] text-center self-center shrink-0">
                    {notice.date}
                  </div>
                  
                  <div className="flex-[1.3] min-w-0 self-center">
                    <p className="text-[15px] leading-relaxed font-semibold m-0 hover:underline">
                      {notice.title}
                    </p>
                  </div>

                  {isAdminMode && (
                    <div className="flex flex-col items-end gap-2 shrink-0 ml-2 z-10">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoticeToEdit(notice);
                        }}
                        className="p-2 rounded-xl transition-all shadow-sm bg-blue-500 hover:bg-blue-600 text-white"
                        title="এডিট"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePin(notice.id);
                        }}
                        className={`p-2 rounded-xl transition-all shadow-sm ${notice.isPinned ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                        title={notice.isPinned ? "আনপিন করুন" : "পিন করুন"}
                      >
                        <Pin size={16} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoticeToDelete(notice.id);
                        }}
                        className="p-2 rounded-xl bg-rose-500/80 hover:bg-rose-600 text-white transition-all shadow-sm"
                        title="ডিলিট"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
          উপরোক্ত সকল নোটিশসমূহ হলান টাওয়ার কর্তৃপক্ষের নির্দেশক্রমে প্রকাশ করা হলো।
        </p>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {noticeToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-700 text-center"
            >
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">নোটিশ ডিলিট</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                আপনি কি নিশ্চিত যে এই নোটিশটি ডিলিট করতে চান? এটি আর ফিরে পাওয়া যাবে না।
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setNoticeToDelete(null)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors"
                >
                  ডিলিট করুন
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {noticeToEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-700"
            >
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">নোটিশ এডিট</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">নোটিশের নাম</label>
                  <input
                    type="text"
                    value={noticeToEdit.title}
                    onChange={(e) => setNoticeToEdit({...noticeToEdit, title: e.target.value})}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                    placeholder="টাইটেল"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">তারিখ</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={noticeToEdit.date}
                      onChange={(e) => setNoticeToEdit({...noticeToEdit, date: e.target.value})}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      placeholder="তারিখ (উদা: ১ জানুয়ারি)"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">পিডিএফ লিংক</label>
                  <input
                    type="url"
                    value={noticeToEdit.driveLink}
                    onChange={(e) => setNoticeToEdit({...noticeToEdit, driveLink: e.target.value})}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                    placeholder="পিডিএফ লিংক"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">বিস্তারিত লেখা</label>
                    <button 
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const textarea = document.getElementById('edit-textarea') as HTMLTextAreaElement;
                        if (!textarea) return;
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const text = textarea.value;
                        const selected = text.substring(start, end);
                        const before = text.substring(0, start);
                        const after = text.substring(end);
                        setNoticeToEdit({...noticeToEdit, description: before + `**${selected}**` + after});
                        setTimeout(() => {
                          textarea.focus();
                          textarea.setSelectionRange(start + 2, end + 2);
                        }, 0);
                      }}
                      className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                      title="বোল্ড করুন"
                    >
                      <Bold size={14} />
                    </button>
                  </div>
                  <textarea
                    id="edit-textarea"
                    value={noticeToEdit.description}
                    onChange={(e) => setNoticeToEdit({...noticeToEdit, description: e.target.value})}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                    placeholder="বিস্তারিত লিখুন"
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setNoticeToEdit(null)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  onClick={confirmEdit}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
                >
                  সেভ করুন
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

