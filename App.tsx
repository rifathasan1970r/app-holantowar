import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { Building2, Phone, MapPin, ChevronRight, User, CloudSun, Calendar, Zap, Key, Bed, Bath, Maximize, AlertTriangle, X, LogOut, Sun, Moon, Sunset, Wrench, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabaseClient';

import { APP_NAME, MENU_ITEMS, TRANSLATIONS, MENU_NOTICE_TEXT, DESCO_NOTICE_TEXT, SERVICE_CHARGE_NOTICE_TEXT, EMERGENCY_NOTICE_TEXT, VIEW_TO_PATH } from './constants';
import { ViewState } from './types';
import NoticeBoard from './components/NoticeBoard';
import BottomNav from './components/BottomNav';
import Assistant from './components/Assistant';
import { DescoView } from './components/DescoView';
import { DescoInfoView } from './components/DescoInfoView';
import { DescoRulesView } from './components/DescoRulesView';
import { AccountsView } from './components/AccountsView';
import { MapRoutesView } from './components/MapRoutesView';
import { ServiceChargeView } from './components/ServiceChargeView';
import { EmergencyView } from './components/EmergencyView';
import { ToLetView } from './components/ToLetView';
import { WaterBillView } from './components/WaterBillView';
import { LiftInstructionsView } from './components/LiftInstructionsView';
import ImageSlider from './components/ImageSlider';
import { MaintenanceView } from './components/MaintenanceView';
import { SettingsView } from './components/SettingsView';
import { PrayerTimeView } from './components/PrayerTimeView';
import { RechargeRulesView } from './components/RechargeRulesView';
import { PullToRefresh } from './components/PullToRefresh';
import { PolicyView } from './components/PolicyView';
import { MaintenancePopup } from './components/MaintenancePopup';
import EmergencyNoticeBox from './src/components/EmergencyNoticeBox';
import { EmergencyNoticeDetailView } from './src/components/EmergencyNoticeDetailView';
import { PDFDownloadPage } from './components/PDFDownloadPage';
import { ContactView } from './components/ContactView';
import { DownloadAppView } from './components/DownloadAppView';
import { DuePaymentMarquee } from './components/DuePaymentMarquee';
import GalleryView from './components/GalleryView';
import GalleryDetailView from './components/GalleryDetailView';
import GalleryControlRoomView from './components/GalleryControlRoomView';
import UnitDetailView from './components/UnitDetailView';

const PATH_TO_VIEW: Record<string, ViewState> = Object.entries(VIEW_TO_PATH).reduce(
  (acc, [view, path]) => ({ ...acc, [path]: view as ViewState }),
  {}
);

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isExitingRef = useRef(false);

  // Sync currentView with URL path
  const currentView = useMemo(() => {
    const path = location.pathname;
    return PATH_TO_VIEW[path] || 'HOME';
  }, [location.pathname]);

  const setCurrentView = (view: ViewState, params?: Record<string, string>) => {
    let path = VIEW_TO_PATH[view] || '/';
    if (params) {
      const searchParams = new URLSearchParams(params);
      path += `?${searchParams.toString()}`;
    }
    navigate(path);
  };

  // Check for PDF Download Mode
  const [isPdfMode] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('mode') === 'pdf_download';
  });

  if (isPdfMode) {
    return <PDFDownloadPage />;
  }

  const [selectedUnit, setSelectedUnit] = useState<string | null>(() => {
    const params = new URLSearchParams(location.search);
    return params.get('unit') || null;
  });

  // Update URL when unit changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (selectedUnit) {
      params.set('unit', selectedUnit);
    } else {
      params.delete('unit');
    }
    const newSearch = params.toString();
    if (newSearch !== location.search.substring(1)) {
      navigate({ search: newSearch }, { replace: true });
    }
  }, [selectedUnit, navigate, location.search]);

  // Handle legacy hash URLs by redirecting to clean URLs
  useEffect(() => {
    if (location.hash && location.hash.startsWith('#/')) {
      const cleanPath = location.hash.substring(1);
      navigate(cleanPath, { replace: true });
    }
  }, [location.hash, navigate]);

  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Persist state removed to always start at HOME

  const [showSummaryList, setShowSummaryList] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [currentSeconds, setCurrentSeconds] = useState('');
  const [amPm, setAmPm] = useState('');
  const [timeIcon, setTimeIcon] = useState<React.ReactNode>(<CloudSun size={24} className="text-yellow-300" />);
  const [isReloadEnabled, setIsReloadEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  // Apply Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const totalMinutes = hour * 60 + minute;
      
      // 1. Greeting & Icon logic
      if (totalMinutes >= 300 && totalMinutes < 720) { // 5:00 AM – 11:59 AM
        setGreeting('শুভ সকাল');
        setTimeIcon(<Sun size={24} className="text-yellow-300 animate-pulse" />);
      } else if (totalMinutes >= 720 && totalMinutes < 960) { // 12:00 PM – 3:59 PM
        setGreeting('শুভ দুপুর');
        setTimeIcon(<Sun size={24} className="text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" />);
      } else if (totalMinutes >= 960 && totalMinutes < 1080) { // 4:00 PM – 6:00 PM
        setGreeting('শুভ বিকেল');
        setTimeIcon(<Sunset size={24} className="text-orange-300" />);
      } else if (totalMinutes >= 1080 && totalMinutes < 1170) { // 6:00 PM – 7:30 PM
        setGreeting('শুভ সন্ধ্যা');
        setTimeIcon(<Sunset size={24} className="text-orange-400" />);
      } else { // 7:30 PM – 4:59 AM
        setGreeting('শুভ রাত্রি');
        setTimeIcon(<Moon size={24} className="text-blue-100 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" />);
      }

      const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      setCurrentDate(now.toLocaleDateString('bn-BD', options));
      
      // Time parts
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      // Example: "05:47:03 AM"
      const [hms, ap] = timeStr.split(' ');
      const [h, m, s] = hms.split(':');
      
      // Convert HH:MM and SS to Bangla digits for consistency with the rest of the app
      const toBanglaDigits = (str: string) => str.replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d)]);
      
      setCurrentTime(toBanglaDigits(`${h}:${m}`));
      setCurrentSeconds(toBanglaDigits(s));
      setAmPm(ap);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Global Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('key, value');
        
        if (data) {
          data.forEach(setting => {
            if (setting.key === 'is_reload_enabled') {
              setIsReloadEnabled(setting.value === 'true');
            } else if (setting.key === 'show_maintenance_popup') {
              setMaintenanceMode(setting.value === 'true');
            }
          });
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };

    fetchSettings();

    // Subscribe to changes for real-time updates
    const channel = supabase
      .channel('app_settings_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'app_settings'
      }, (payload) => {
        const newData = payload.new as any;
        if (newData) {
          if (newData.key === 'is_reload_enabled') {
            setIsReloadEnabled(newData.value === 'true');
          } else if (newData.key === 'show_maintenance_popup') {
            setMaintenanceMode(newData.value === 'true');
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle native overscroll behavior
  useEffect(() => {
    if (isReloadEnabled) {
      document.body.style.overscrollBehaviorY = 'auto';
    } else {
      document.body.style.overscrollBehaviorY = 'contain';
    }
  }, [isReloadEnabled]);

  // Advanced Back Navigation Support
  // Scroll to top on view or unit change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView, selectedUnit, showSummaryList]);

  const t = TRANSLATIONS['bn']; // Default to Bangla for now, can be dynamic if needed

  const handleExitApp = () => {
    try {
      window.close();
    } catch (e) {
      // ignore
    }
    
    try {
      // @ts-ignore
      if (navigator.app && navigator.app.exitApp) {
        // @ts-ignore
        navigator.app.exitApp();
      }
    } catch (e) {
      // ignore
    }

    // Go back 2 steps: 
    // 1. Undo the pushState we did when showing the dialog
    // 2. Undo the initial navigation to BASE (effectively exiting)
    window.history.go(-2);
  };

  const renderContent = () => {
    return (
      <Routes>
        <Route path="/" element={
          <div className="space-y-6 pb-6">
            {/* Premium Hero Dashboard for Home */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl group transition-all duration-500">
              {/* Background Image with Overlay */}
              <div className="absolute inset-0">
                <img 
                  src="https://i.imghippo.com/files/doWD3644bN.jpg" 
                  alt="Hollan Tower Background" 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-teal-900/80 via-teal-800/60 to-emerald-900/80 backdrop-brightness-75"></div>
              </div>
              
              {/* Content */}
              <div className="relative z-10 p-6 text-white">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-light opacity-90 mb-1">{greeting},</h2>
                    <h1 className="text-2xl font-bold tracking-tight">হলান টাওয়ার বাসী</h1>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 shadow-lg">
                    {timeIcon}
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="bg-teal-500/30 p-2.5 rounded-xl">
                         <Calendar size={20} className="text-white" />
                      </div>
                      <div>
                         <p className="text-[10px] opacity-70 uppercase tracking-wider font-semibold">আজকের তারিখ</p>
                         <p className="text-sm font-bold leading-tight">{currentDate}</p>
                      </div>
                   </div>
                   <div className="text-right border-l border-white/10 pl-4 flex flex-col justify-center items-end">
                      <p className="text-2xl font-bold font-mono tracking-wider leading-none">{currentTime}</p>
                      <p className="text-[12px] font-bold font-mono opacity-80 mt-1.5 leading-none">{currentSeconds} সেকেন্ড</p>
                      <p className="text-sm font-black opacity-100 mt-2 leading-none tracking-widest bg-white/20 px-2 py-1 rounded-md">{amPm}</p>
                   </div>
                </div>
              </div>
            </div>

            {/* Grid Menu */}
            <div>
              <div className="flex justify-between items-end mb-4 px-1">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white">সেবা কেন্দ্র</h3>
                 <button onClick={() => setCurrentView('MENU')} className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors">
                   সব দেখুন
                 </button>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {MENU_ITEMS.slice(0, 6).map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentView(item.view)}
                    className="relative bg-white dark:bg-slate-800 p-2 rounded-tl-3xl rounded-br-3xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-700 overflow-hidden group text-center h-26 flex flex-col items-center justify-center gap-1 transition-all hover:shadow-primary-500/20"
                  >
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${item.gradient || 'from-gray-500 to-gray-700'} flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-all duration-300`}>
                      <item.icon size={18} />
                    </div>
                    <div className="w-full px-1 mt-1">
                      <h4 className="font-bold text-slate-800 dark:text-white text-[10px] leading-tight group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors line-clamp-2">{item.label}</h4>
                    </div>
                  </motion.button>
                ))}
              </div>
              <div className="mt-6">
                <EmergencyNoticeBox onClick={() => setCurrentView('EMERGENCY_NOTICE_DETAIL')} />
              </div>
            </div>

            {/* Due Payment Marquee */}
            <div className="px-1">
              <DuePaymentMarquee />
            </div>
          </div>
        } />

        <Route path="/assistant.html" element={
          <div className="space-y-6 pb-6">
            {/* Premium Hero Dashboard for Home */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl group transition-all duration-500">
              {/* Background Image with Overlay */}
              <div className="absolute inset-0">
                <img 
                  src="https://i.imghippo.com/files/doWD3644bN.jpg" 
                  alt="Hollan Tower Background" 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-teal-900/80 via-teal-800/60 to-emerald-900/80 backdrop-brightness-75"></div>
              </div>
              
              {/* Content */}
              <div className="relative z-10 p-6 text-white">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-light opacity-90 mb-1">{greeting},</h2>
                    <h1 className="text-2xl font-bold tracking-tight">হলান টাওয়ার বাসী</h1>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 shadow-lg">
                    {timeIcon}
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="bg-teal-500/30 p-2.5 rounded-xl">
                         <Calendar size={20} className="text-white" />
                      </div>
                      <div>
                         <p className="text-[10px] opacity-70 uppercase tracking-wider font-semibold">আজকের তারিখ</p>
                         <p className="text-sm font-bold leading-tight">{currentDate}</p>
                      </div>
                   </div>
                   <div className="text-right border-l border-white/10 pl-4 flex flex-col justify-center items-end">
                      <p className="text-2xl font-bold font-mono tracking-wider leading-none">{currentTime}</p>
                      <p className="text-[12px] font-bold font-mono opacity-80 mt-1.5 leading-none">{currentSeconds} সেকেন্ড</p>
                      <p className="text-sm font-black opacity-100 mt-2 leading-none tracking-widest bg-white/20 px-2 py-1 rounded-md">{amPm}</p>
                   </div>
                </div>
              </div>
            </div>

            {/* Grid Menu */}
            <div>
              <div className="flex justify-between items-end mb-4 px-1">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white">সেবা কেন্দ্র</h3>
                 <button onClick={() => setCurrentView('MENU')} className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors">
                   সব দেখুন
                 </button>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {MENU_ITEMS.slice(0, 6).map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentView(item.view)}
                    className="relative bg-white dark:bg-slate-800 p-2 rounded-tl-3xl rounded-br-3xl shadow-[0_4px_20_px_-5px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-700 overflow-hidden group text-center h-26 flex flex-col items-center justify-center gap-1 transition-all hover:shadow-primary-500/20"
                  >
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${item.gradient || 'from-gray-500 to-gray-700'} flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-all duration-300`}>
                      <item.icon size={18} />
                    </div>
                    <div className="w-full px-1 mt-1">
                      <h4 className="font-bold text-slate-800 dark:text-white text-[10px] leading-tight group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors line-clamp-2">{item.label}</h4>
                    </div>
                  </motion.button>
                ))}
              </div>
              <div className="mt-6">
                <EmergencyNoticeBox onClick={() => setCurrentView('EMERGENCY_NOTICE_DETAIL')} />
              </div>
            </div>

            {/* Due Payment Marquee */}
            <div className="px-1">
              <DuePaymentMarquee />
            </div>
          </div>
        } />
        <Route path="/menu.html" element={
          <div className="space-y-6 pb-6">
            <div>
              <div className="mb-6">
                <EmergencyNoticeBox onClick={() => setCurrentView('EMERGENCY_NOTICE_DETAIL')} />
              </div>
              
              <div className="flex justify-between items-end mb-4 px-1">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white">সকল সেবা</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {MENU_ITEMS.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentView(item.view)}
                    className="relative bg-white dark:bg-slate-800 p-2 rounded-tl-3xl rounded-br-3xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-700 overflow-hidden group text-center h-26 flex flex-col items-center justify-center gap-1 transition-all hover:shadow-primary-500/20"
                  >
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${item.gradient || 'from-gray-500 to-gray-700'} flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-all duration-300`}>
                      <item.icon size={18} />
                    </div>
                    <div className="w-full px-1 mt-1">
                      <h4 className="font-bold text-slate-800 dark:text-white text-[10px] leading-tight group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors line-clamp-2">{item.label}</h4>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="space-y-3 mt-4 mb-8">
               <button onClick={() => setCurrentView('MAINTENANCE')} className="w-full relative bg-white dark:bg-slate-800 p-4 rounded-[14px] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-white dark:border-slate-700 overflow-hidden flex items-center gap-4 group transition-all active:scale-[0.98]">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                     <Wrench size={20} />
                  </div>
                  <div className="text-left"><h4 className="text-base font-bold text-slate-800 dark:text-white mb-0.5">মেইনটেন্যান্স ডেস্ক</h4></div>
                  <ChevronRight className="ml-auto text-slate-300 dark:text-slate-600" size={18} />
               </button>

               <button onClick={() => setCurrentView('SETTINGS')} className="w-full relative bg-white dark:bg-slate-800 p-4 rounded-[14px] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-white dark:border-slate-700 overflow-hidden flex items-center gap-4 group transition-all active:scale-[0.98]">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                     <Settings size={20} />
                  </div>
                  <div className="text-left"><h4 className="text-base font-bold text-slate-800 dark:text-white mb-0.5">সেটিং</h4></div>
                  <ChevronRight className="ml-auto text-slate-300 dark:text-slate-600" size={18} />
               </button>
            </div>
          </div>
        } />

        <Route path="/service-charge.html" element={<ServiceChargeView selectedUnit={selectedUnit} onUnitSelect={setSelectedUnit} showSummaryList={showSummaryList} onSummaryToggle={setShowSummaryList} />} />
        <Route path="/desco.html" element={<DescoView setView={setCurrentView} />} />
        <Route path="/desco-info.html" element={<DescoInfoView onBack={() => setCurrentView('DESCO')} />} />
        <Route path="/desco-rules.html" element={<DescoRulesView onBack={() => setCurrentView('DESCO')} />} />
        <Route path="/accounts.html" element={<AccountsView onBack={() => setCurrentView('MENU')} setView={setCurrentView} />} />
        <Route path="/map-routes.html" element={<MapRoutesView onBack={() => setCurrentView('MENU')} />} />
        <Route path="/to-let.html" element={<ToLetView setView={setCurrentView} />} />
        <Route path="/emergency.html" element={<EmergencyView />} />
        <Route path="/lift-instructions.html" element={<LiftInstructionsView onBack={() => setCurrentView('MENU')} />} />
        <Route path="/maintenance.html" element={<MaintenanceView onBack={() => setCurrentView('MENU')} setView={setCurrentView} />} />
        <Route path="/settings.html" element={<SettingsView onBack={() => setCurrentView('MENU')} darkMode={darkMode} toggleDarkMode={toggleDarkMode} maintenanceMode={maintenanceMode} />} />
        <Route path="/prayer-time.html" element={<PrayerTimeView onBack={() => setCurrentView('MENU')} />} />
        <Route path="/recharge-rules.html" element={<RechargeRulesView onBack={() => setCurrentView('MENU')} />} />
        <Route path="/policy.html" element={<PolicyView onBack={() => setCurrentView('MENU')} />} />
        <Route path="/contact.html" element={<ContactView onBack={() => setCurrentView('MENU')} setView={setCurrentView} />} />
        <Route path="/download-app.html" element={<DownloadAppView onBack={() => setCurrentView('MENU')} />} />
        <Route path="/emergency-notice.html" element={<EmergencyNoticeDetailView onBack={() => setCurrentView('HOME')} />} />
        <Route path="/gallery.html" element={<GalleryView onBack={() => setCurrentView('MENU')} setView={setCurrentView} />} />
        <Route path="/gallery-detail.html" element={<GalleryDetailView onBack={() => setCurrentView('GALLERY')} setView={setCurrentView} />} />
        <Route path="/gallery-control-room.html" element={<GalleryControlRoomView onBack={() => setCurrentView('GALLERY')} />} />
        <Route path="/unit-a" element={<UnitDetailView unitId="unit-a" onBack={() => navigate(-1)} />} />
        <Route path="/unit-b" element={<UnitDetailView unitId="unit-b" onBack={() => navigate(-1)} />} />
        <Route path="/unit-c" element={<UnitDetailView unitId="unit-c" onBack={() => navigate(-1)} />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  };

  const hasNotice = (currentView === 'HOME' || currentView === 'MENU' || currentView === 'DESCO' || currentView === 'SERVICE_CHARGE' || currentView === 'EMERGENCY');

  return (
    <>
    <div className={`min-h-screen pb-24 max-w-md mx-auto bg-[#F8FAFC] dark:bg-slate-900 relative shadow-2xl transition-colors duration-300 ${hasNotice ? 'has-notice' : ''}`}>
      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[20%] bg-teal-200/20 dark:bg-teal-900/20 blur-[100px] rounded-full"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[20%] bg-indigo-200/20 dark:bg-indigo-900/20 blur-[100px] rounded-full"></div>
      </div>

      {/* Top Header - Fixed */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-800/50 transition-all duration-300">
        <div className="px-5 py-[2px] flex items-center justify-start">
          <div className="flex items-center gap-3 text-left">
            <img 
              src="https://i.imghippo.com/files/xPV6164w.png" 
              alt="Logo" 
              className="w-14 h-14 object-contain shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-lg font-extrabold text-slate-800 dark:text-white leading-tight">
                {APP_NAME}
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                <MapPin size={10} /> হলান, দক্ষিণখান
              </p>
            </div>
          </div>
          <div className="ml-auto">
             <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500">
                <User size={16} />
             </div>
          </div>
        </div>
        {hasNotice && (
          <NoticeBoard 
            key={currentView} 
            text={
              currentView === 'DESCO' ? DESCO_NOTICE_TEXT : 
              currentView === 'SERVICE_CHARGE' ? SERVICE_CHARGE_NOTICE_TEXT :
              (currentView === 'MENU' || currentView === 'EMERGENCY') ? EMERGENCY_NOTICE_TEXT : undefined
            } 
          />
        )}
      </header>

      {/* Main Content Area */}
      <main 
        className="px-5 relative z-10"
        style={{ paddingTop: 'var(--header-height)' }}
      >
        <PullToRefresh isEnabled={isReloadEnabled && !isAssistantOpen}>
          {renderContent()}
          {currentView !== 'HOME' && (
            <div className="mt-12 mb-8 text-center">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 tracking-widest">
                Design By A.H.M RIFAT HASAN
              </p>
            </div>
          )}
        </PullToRefresh>
      </main>


      {/* Exit Confirmation Dialog */}
      {showExitDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div
            onClick={() => setShowExitDialog(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <div
            className="relative w-full max-w-xs bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t.exitTitle}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {t.exitMessage}
              </p>
            </div>
            <div className="flex border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setShowExitDialog(false)}
                className="flex-1 py-4 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-r border-slate-100 dark:border-slate-700"
              >
                {t.exitCancel}
              </button>
              <button
                onClick={handleExitApp}
                className="flex-1 py-4 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                {t.exitConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Gemini Assistant - Only visible on HOME or ASSISTANT view */}
    <Assistant 
      isVisible={currentView === 'HOME' || currentView === 'AI_ASSISTANT'} 
      isOpen={isAssistantOpen} 
      onOpenChange={(open) => {
        setIsAssistantOpen(open);
        if (open) {
          setCurrentView('AI_ASSISTANT');
        } else if (currentView === 'AI_ASSISTANT') {
          setCurrentView('HOME');
        }
      }} 
    />

    {/* Maintenance Popup */}
    <MaintenancePopup enabled={maintenanceMode} />

    {/* Bottom Navigation */}
    <BottomNav currentView={currentView} />
    </>
  );
};

export default App;