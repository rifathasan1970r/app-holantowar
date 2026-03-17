import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Smartphone, Share2, ShieldCheck, CheckCircle2, Star, Zap, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

interface DownloadAppViewProps {
  onBack: () => void;
}

export const DownloadAppView: React.FC<DownloadAppViewProps> = ({ onBack }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isStandaloneMode);

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Capture install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Fallback or if already installed
      alert('অ্যাপটি ইতিমধ্যে ইনস্টল করা আছে অথবা আপনার ব্রাউজার থেকে ম্যানুয়ালি ইনস্টল করুন। (মেনু > Add to Home Screen)');
    }
  };

  const handleDownloadAPK = () => {
    // Direct link to the APK or download page provided by user
    window.open('https://holan-tower-apps-download.vercel.app/#download', '_blank');
  };

  return (
    <div className="pb-24 relative min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">অ্যাপ ডাউনলোড</h2>
      </div>

      <div className="p-5 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-6">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[22px] mx-auto shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center">
            <Smartphone size={48} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-1">হলান টাওয়ার</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">স্মার্ট বিল্ডিং ম্যানেজমেন্ট অ্যাপ</p>
          </div>
          
          <div className="flex justify-center gap-2">
            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full flex items-center gap-1">
              <ShieldCheck size={12} /> Verified
            </span>
            <span className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold rounded-full flex items-center gap-1">
              <CheckCircle2 size={12} /> Latest Version
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* PWA Install Button (Android/Desktop) */}
          {!isIOS && !isStandalone && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleInstallClick}
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold shadow-lg flex items-center justify-center gap-3"
            >
              <Download size={20} />
              <span>ইনস্টল করুন (App)</span>
            </motion.button>
          )}

          {/* APK Download Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadAPK}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-3"
          >
            <Globe size={20} />
            <span>ডাউনলোড করুন (APK)</span>
          </motion.button>

          {/* iOS Instructions */}
          {isIOS && !isStandalone && (
            <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                <Share2 size={16} /> আইফোন ইউজারদের জন্য:
              </h3>
              <ol className="list-decimal list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1.5">
                <li>সাফারি ব্রাউজারে <strong>Share</strong> বাটনে ক্লিক করুন</li>
                <li>নিচে স্ক্রল করে <strong>Add to Home Screen</strong> সিলেক্ট করুন</li>
                <li>উপরে ডানপাশে <strong>Add</strong> বাটনে ক্লিক করুন</li>
              </ol>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Star size={18} className="text-amber-500" /> অ্যাপের সুবিধাসমূহ
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { title: 'সার্ভিস চার্জ', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { title: 'ডেসকো রিচার্জ', icon: Smartphone, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
              { title: 'নোটিশ বোর্ড', icon: Share2, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
              { title: 'জরুরী সেবা', icon: ShieldCheck, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
            ].map((item, idx) => (
              <div key={idx} className={`${item.bg} p-3 rounded-xl border border-transparent dark:border-white/5`}>
                <item.icon size={20} className={`${item.color} mb-2`} />
                <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{item.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Version Info */}
        <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-400 dark:text-slate-500">Version 1.0.0 • Build 202405</p>
          <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">Developed by Holan Tower IT</p>
        </div>
      </div>
    </div>
  );
};
