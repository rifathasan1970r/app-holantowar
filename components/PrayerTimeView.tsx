import React, { useState, useEffect } from 'react';
import { ArrowLeft, Moon, Sun, Sunrise, Sunset, Clock, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface PrayerTimeViewProps {
  onBack: () => void;
}

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string;
}

const toBanglaDigits = (str: string) => str.replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d)]);

const formatTime12 = (time24: string) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  let h = parseInt(hours, 10);
  const m = parseInt(minutes, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${toBanglaDigits(h.toString())}:${toBanglaDigits(m.toString().padStart(2, '0'))} ${ampm === 'PM' ? 'পিএম' : 'এএম'}`;
};

export const PrayerTimeView: React.FC<PrayerTimeViewProps> = ({ onBack }) => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<string>('');
  const [countdown, setCountdown] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWaqt, setCurrentWaqt] = useState<string>('');

  // Fetch Prayer Times
  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        setLoading(true);
        // Method 1: University of Islamic Sciences, Karachi (Standard for BD)
        // School 1: Hanafi (Standard for BD)
        const response = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Dhaka&country=Bangladesh&method=1&school=1');
        const data = await response.json();
        
        if (data.code === 200 && data.data) {
          setPrayerTimes(data.data.timings);
        } else {
          setError('তথ্য লোড করতে সমস্যা হয়েছে');
        }
      } catch (err) {
        setError('ইন্টারনেট সংযোগ পরীক্ষা করুন');
      } finally {
        setLoading(false);
      }
    };

    fetchPrayerTimes();
  }, []);

  // Calculate Next Prayer & Countdown
  useEffect(() => {
    if (!prayerTimes) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeNow = now.getTime();

      const prayers = [
        { name: 'Fajr', time: prayerTimes.Fajr },
        { name: 'Sunrise', time: prayerTimes.Sunrise }, // Used for logic, not a prayer
        { name: 'Dhuhr', time: prayerTimes.Dhuhr },
        { name: 'Asr', time: prayerTimes.Asr },
        { name: 'Maghrib', time: prayerTimes.Maghrib },
        { name: 'Isha', time: prayerTimes.Isha },
      ];

      // Helper to create Date object for today's prayer time
      const getPrayerDate = (timeStr: string) => {
        const [h, m] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(h), parseInt(m), 0, 0);
        return date;
      };

      let next = null;
      let current = '';

      // Find next prayer
      for (let i = 0; i < prayers.length; i++) {
        const pDate = getPrayerDate(prayers[i].time);
        if (pDate.getTime() > timeNow) {
          next = prayers[i];
          // Current is the previous one (handling index 0 wrap-around later)
          current = i > 0 ? prayers[i-1].name : 'Isha'; 
          break;
        }
      }

      // If no next prayer found today (after Isha), next is Fajr tomorrow
      if (!next) {
        next = prayers[0];
        // Current is Isha
        current = 'Isha';
        // Add 1 day to next prayer date for calculation
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const [h, m] = next.time.split(':');
        tomorrow.setHours(parseInt(h), parseInt(m), 0, 0);
        
        const diff = tomorrow.getTime() - timeNow;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown(`${toBanglaDigits(hours.toString().padStart(2, '0'))}:${toBanglaDigits(minutes.toString().padStart(2, '0'))}:${toBanglaDigits(seconds.toString().padStart(2, '0'))}`);
        setNextPrayer('Fajr');
      } else {
        const pDate = getPrayerDate(next.time);
        const diff = pDate.getTime() - timeNow;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown(`${toBanglaDigits(hours.toString().padStart(2, '0'))}:${toBanglaDigits(minutes.toString().padStart(2, '0'))}:${toBanglaDigits(seconds.toString().padStart(2, '0'))}`);
        setNextPrayer(next.name);
      }
      
      setCurrentWaqt(current);

    }, 1000);

    return () => clearInterval(interval);
  }, [prayerTimes]);

  const getPrayerNameBn = (name: string) => {
    const isFriday = new Date().getDay() === 5;
    switch (name) {
      case 'Fajr': return 'ফজর';
      case 'Sunrise': return 'সূর্যোদয়';
      case 'Dhuhr': return isFriday ? 'জুম্মা' : 'জোহর';
      case 'Asr': return 'আসর';
      case 'Maghrib': return 'মাগরিব';
      case 'Isha': return 'ইশা';
      case 'Jayez': return 'জায়েজ (ইশরাক)';
      default: return name;
    }
  };

  // Calculate Jayez time (Sunrise + 15 mins)
  const getJayezTime = () => {
    if (!prayerTimes) return '';
    const [h, m] = prayerTimes.Sunrise.split(':');
    const date = new Date();
    date.setHours(parseInt(h), parseInt(m) + 15, 0, 0);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const prayerCards = [
    { id: 'Fajr', name: 'ফজর', time: prayerTimes?.Fajr, icon: Sunrise, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-100 dark:border-cyan-800' },
    { id: 'Jayez', name: 'জায়েজ (ইশরাক)', time: getJayezTime(), icon: Sun, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800' },
    { id: 'Dhuhr', name: new Date().getDay() === 5 ? 'জুম্মা' : 'জোহর', time: prayerTimes?.Dhuhr, icon: Sun, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-100 dark:border-yellow-800' },
    { id: 'Asr', name: 'আসর', time: prayerTimes?.Asr, icon: Sun, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-100 dark:border-orange-800' },
    { id: 'Maghrib', name: 'মাগরিব', time: prayerTimes?.Maghrib, icon: Sunset, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-100 dark:border-rose-800' },
    { id: 'Isha', name: 'ইশা', time: prayerTimes?.Isha, icon: Moon, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-100 dark:border-indigo-800' },
  ];

  return (
    <div className="pb-24 animate-in slide-in-from-right duration-500 bg-slate-50 dark:bg-slate-900 min-h-screen relative transition-colors duration-300">
      {/* Navigation Header Section */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 shadow-sm transition-all">
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                <Clock size={20} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">নামাজের সময়সূচি</h2>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center justify-center gap-1">
                  <MapPin size={10} /> ঢাকা, বাংলাদেশ
                </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        
        {/* Countdown Hero Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-black dark:to-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-900/20 dark:shadow-black/40 relative overflow-hidden">
           {/* Background Decoration */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
           <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl -ml-5 -mb-5"></div>
           
           <div className="relative z-10 text-center">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 size={32} className="animate-spin text-indigo-400 mb-2" />
                  <p className="text-sm text-slate-400">তথ্য লোড হচ্ছে...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-8 text-rose-400">
                  <AlertCircle size={32} className="mb-2" />
                  <p className="text-sm">{error}</p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-400 mb-1">পরবর্তী ওয়াক্ত</p>
                  <h3 className="text-3xl font-bold text-white mb-2">{getPrayerNameBn(nextPrayer)}</h3>
                  
                  <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl py-3 px-6 inline-block mb-4">
                     <span className="text-4xl font-mono font-bold tracking-wider text-indigo-300 shadow-glow">{countdown}</span>
                  </div>
                  
                  <p className="text-xs text-slate-400 font-medium">
                    এখন চলছে: <span className="text-emerald-400 font-bold">{getPrayerNameBn(currentWaqt)}</span>
                  </p>
                </>
              )}
           </div>
        </div>

        {/* Prayer Cards Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-2 gap-3">
            {prayerCards.map((prayer) => {
              const isActive = currentWaqt === prayer.id || (prayer.id === 'Jayez' && currentWaqt === 'Sunrise');
              const isNext = nextPrayer === prayer.id;
              
              return (
                <motion.div
                  key={prayer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative p-4 rounded-2xl border transition-all duration-300 ${
                    isActive 
                      ? 'bg-white dark:bg-slate-800 border-indigo-500 dark:border-indigo-500 shadow-lg ring-1 ring-indigo-500/20' 
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                  )}
                  {isNext && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 rounded-t-2xl"></div>
                  )}
                  
                  <div className={`w-10 h-10 rounded-xl ${prayer.bg} ${prayer.color} flex items-center justify-center mb-3`}>
                    <prayer.icon size={20} />
                  </div>
                  
                  <div>
                    <h4 className={`text-base font-bold ${isActive ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                      {prayer.name}
                    </h4>
                    <p className={`text-lg font-black mt-0.5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {formatTime12(prayer.time || '')}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer Note */}
        <div className="text-center pb-4">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            * ইসলামিক ফাউন্ডেশন ও হানাফি মাযহাব অনুযায়ী সময়সূচি (ঢাকা)
          </p>
        </div>
      </div>
    </div>
  );
};
