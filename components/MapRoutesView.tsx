import React, { useState } from 'react';
import { ArrowLeft, Map as MapIcon, Navigation, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MapRoutesViewProps {
  onBack: () => void;
}

const PremiumMapCard: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative group w-full max-w-[800px] mx-auto"
    >
      {/* Map Container with Glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-[2.5rem] blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
      
      <div className="relative bg-white border border-emerald-100 rounded-[2.5rem] overflow-hidden shadow-2xl">
        {/* Top Bar Info */}
        <div className="px-8 py-5 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20">
              <MapPin size={16} />
            </div>
            <span className="text-emerald-900 font-bold text-sm tracking-wide">হলান টাওয়ার লোকেশন</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live View</span>
          </div>
        </div>

        {/* Map Iframe */}
        <div className="w-full aspect-[4/3] md:aspect-video relative">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d912.260769595932!2d90.4321598!3d23.852604!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c70057ad5d4f%3A0xe6299bcc3a3ae506!2z4Ka54Kay4Ka-4KaoIOCmn-CmvuCmk-Cmr-CmvOCmvuCmsCAtIOCmueCmsuCmvuCmqCDgpp_gpr7gppPgpq_gprzgpr7gprA!5e1!3m2!1sbn!2sbd!4v1752594822521!5m2!1sbn!2sbd"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full hover:contrast-[1.05] transition-all duration-1000"
            title="Google Map Location"
          ></iframe>
          
          {/* Overlay Gradient for Depth */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.05)]"></div>
        </div>

        {/* Bottom Details */}
        <div className="px-8 py-6 bg-emerald-50/20 flex flex-col gap-4">
          <div>
            <p className="text-emerald-600/60 text-[10px] font-bold uppercase tracking-widest mb-1">Address</p>
            <p className="text-emerald-900 text-sm font-bold">হলান টাওয়ার, দক্ষিণখান, ঢাকা - ১২৩০</p>
          </div>
          <a 
            href="https://maps.app.goo.gl/mwFP2BxYm1cK2m2P9"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95 w-full"
          >
            <Navigation size={16} />
            Open in Google Maps
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export const MapRoutesView: React.FC<MapRoutesViewProps> = ({ onBack }) => {
  const [expandedRoute, setExpandedRoute] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(false);

  const toggleRoute = (id: number) => {
    setExpandedRoute(expandedRoute === id ? null : id);
  };

  const routes = [
    {
      id: 1,
      title: "রুট ১ : (এয়ারপোর্ট) হাজী ক্যাম্প থেকে হলান টাওয়ার",
      path: ["(এয়ারপোর্ট) হাজী ক্যাম্প", "আশকোনা", "তালতলা", "নদ্দাপাড়া", "বৈশাখী মোর", "হলান মোড়", "চিটাগাং স'মিল", "হলান টাওয়ার"],
      transport: "রিকশা , অটো রিকশা",
      fare: ["রিকশা ৩০ টাকা (১ জন)", "রিকশা ৫০-৬০ টাকা (১ রিকশা)", "অটো রিকশা ২০ টাকা (১ জন)", "অটো রিকশা ১২০ টাকা (১ অটো)"]
    },
    {
      id: 2,
      title: "রুট ২ : হাজী ক্যাম্প থেকে কাওলা থেকে হলান টাওয়ার",
      path: ["(এয়ারপোর্ট) হাজী ক্যাম্প", "কাওলা বাজার", "আশিয়ান সিটি (পয়সা বাজার)", "নদ্দাপাড়া", "বৈশাখী মোর", "হলান মোড়", "চিটাগাং স'মিল", "হলান টাওয়ার"],
      transport: "রিকশা",
      fare: ["রিকশা ৫০-৬০ টাকা (১ রিকশা)"]
    },
    {
      id: 3,
      title: "রুট ৩: উত্তরা থেকে হলান টাওয়ার",
      path: ["উত্তরা (জসীমউদ্দীন, রাজলক্ষ্মী, আজমপুর, হাউজ বিল্ডিং)", "কসাইবাড়ি", "প্রেমবাগান", "দক্ষিণখান বাজার", "হলান মোড়", "চিটাগাং স'মিল", "হলান টাওয়ার"],
      transport: "রিকশা , অটো রিকশা",
      fare: ["উত্তরা থেকে কসাইবাড়ি: রিকশা ২০-৫০ টাকা (দূরত্ব অনুযায়ী) (১ রিকশা)", "কসাইবাড়ি থেকে দক্ষিণখান বাজার: অটো ১০ টাকা (১ জন)", "দক্ষিণখান বাজার থেকে হলান টাওয়ার: রিকশা ২০-৩০ টাকা (১ রিকশা)"]
    },
    {
      id: 4,
      title: "রুট ৪: কাওলা রেলগেট থেকে হলান টাওয়ার",
      path: ["কাওলা রেলগেট", "কাওলা বাজার", "আশিয়ান সিটি (পয়সা বাজার)", "নদ্দাপাড়া", "বৈশাখী মোর", "হলান মোড়", "চিটাগাং স'মিল", "হলান টাওয়ার"],
      transport: "রিকশা",
      fare: ["রিকশা ৫০-৬০ টাকা (১ রিকশা)"]
    },
    {
      id: 5,
      title: "রুট ৫: খিলক্ষেত থেকে হলান টাওয়ার",
      path: ["খিলক্ষেত বাজার", "মেরিডিয়ান (খা'পাড়া)", "কাওলা বাজার", "আশিয়ান সিটি (পয়সা বাজার)", "নদ্দাপাড়া", "বৈশাখী মোর", "হলান মোড়", "চিটাগাং স'মিল", "হলান টাওয়ার"],
      transport: "রিকশা",
      fare: ["খিলক্ষেত বাজার থেকে মেরিডিয়ান (খা'পাড়া) ২০ টাকা (১ রিকশা)", "মেরিডিয়ান (খা'পাড়া) থেকে হলান টাওয়ার ৫০-৬০ টাকা (১ রিকশা)"]
    },
    {
      id: 6,
      title: "রুট ৬: খিলক্ষেত থেকে হলান টাওয়ার বিকল্প রুট",
      path: ["খিলক্ষেত বাজার", "লেকসিটি", "বাগানবাড়ি", "বড়ূয়া", "ব্যাংকের কার্ড", "লঞ্জনিপাড়া", "আশিয়ান সিটি (গেট ২)", "চিটাগাং স'মিল", "হলান টাওয়ার"],
      transport: "রিকশা , অটো রিকশা",
      fare: ["খিলক্ষেত থেকে বাগানবাড়ি: অটো রিকশা ২০ টাকা (১ জন)", "বাগানবাড়ি থেকে হলান টাওয়ার: রিকশা ৪০-৬০ টাকা (১ রিকশা)"]
    },
    {
      id: 7,
      title: "রুট ৭: ৩০০ফিট থেকে হলান টাওয়ার",
      path: ["৩০০ফিট (খিলক্ষেত, স্বদেশ)", "বাগানবাড়ি", "বড়ূয়া", "ব্যাংকের কার্ড", "লঞ্জনিপাড়া", "আশিয়ান সিটি (গেট ২)", "চিটাগাং স'মিল", "হলান টাওয়ার"],
      transport: "রিকশা",
      fare: ["৩০০ফিট থেকে বাগানবাড়ি: রিকশা ৩০-৫০ টাকা (১ রিকশা)", "বাগানবাড়ি থেকে হলান টাওয়ার: রিকশা ৪০-৬০ টাকা (১ রিকশা)"]
    },
    {
      id: 8,
      title: "রুট ৮: উত্তরখান (আব্দুল্লাহপুর, টঙ্গী) থেকে হলান টাওয়ার",
      path: ["উত্তরখান (আব্দুল্লাহপুর, টঙ্গী)", "আটিপাড়া", "মাজার রোড", "দক্ষিণখান বাজার", "হলান মোড়", "চিটাগাং স'মিল", "হলান টাওয়ার"],
      transport: "রিকশা, অটো রিকশা",
      fare: ["উত্তরা থেকে মজার রোড ৪০-৬০ টাকা (১ রিকশা)", "মাজার রোড থেকে দক্ষিণখান বাজার: রিকশা ১০-২০ টাকা (১ জন)", "দক্ষিণখান বাজার থেকে হলান টাওয়ার: রিকশা ২০-৩০ টাকা (১ রিকশা)"]
    }
  ];

  if (showMap) {
    return (
      <div className="animate-in fade-in duration-700 bg-[#f0fdf4] min-h-screen relative font-sans overflow-hidden">
        {/* Atmospheric Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-200/40 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-200/40 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Minimalist Floating Header */}
        <div className="relative z-50 px-6 py-6 flex items-center justify-between">
          <button 
            onClick={() => setShowMap(false)}
            className="flex items-center gap-2 text-emerald-800/70 hover:text-emerald-900 transition-all group bg-white/50 hover:bg-white/80 px-4 py-2 rounded-full border border-emerald-200/50 backdrop-blur-md shadow-sm"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold tracking-wide">ফিরে যান</span>
          </button>
          
          <div className="flex flex-col items-end">
            <h2 className="text-lg font-black text-emerald-900 tracking-tight uppercase">গুগল ম্যাপ</h2>
            <div className="h-0.5 w-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mt-1"></div>
          </div>
        </div>

        <div className="relative z-10 px-4 pb-12 max-w-[800px] mx-auto">
          <PremiumMapCard />

          {/* Additional Info Cards */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/60 border border-emerald-100 rounded-3xl p-5 backdrop-blur-sm shadow-sm"
            >
              <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest mb-2">Coordinates</p>
              <p className="text-emerald-900/80 text-xs font-mono">23.8526° N, 90.4322° E</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/60 border border-emerald-100 rounded-3xl p-5 backdrop-blur-sm shadow-sm"
            >
              <p className="text-teal-600 text-[10px] font-bold uppercase tracking-widest mb-2">Location Type</p>
              <p className="text-emerald-900/80 text-xs font-medium">Residential & Commercial</p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 animate-in slide-in-from-right duration-500 bg-slate-50 dark:bg-slate-900 min-h-screen relative font-sans transition-colors duration-300">
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg">
                <MapIcon size={20} />
            </div>
            <div className="text-left">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">ম্যাপ ও বিভিন্ন রুট</h2>
                <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 mt-0.5 uppercase tracking-wider">
                  লোকেশন ও যাতায়াত নির্দেশনা
                </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Slim Map Access Bar */}
        <motion.button 
          onClick={() => setShowMap(true)}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[420px] mx-auto bg-gradient-to-r from-[#6a11cb] to-[#2575fc] rounded-xl py-2 px-4 shadow-md border border-white/20 flex items-center justify-center gap-2 mb-6 active:scale-[0.98] transition-all group"
        >
          <MapPin size={16} className="text-white group-hover:scale-110 transition-transform" />
          <span className="text-white font-bold text-sm">ম্যাপ এ দেখুন</span>
        </motion.button>

        <style dangerouslySetInnerHTML={{ __html: `
          .route-box {
            background: linear-gradient(145deg, #134e4a 0%, #064e3b 100%);
            color: white;
            padding: 0;
            margin: 12px auto;
            border-radius: 18px;
            font-family: 'Inter', 'Segoe UI', sans-serif;
            box-shadow: 0 10px 25px -10px rgba(6, 78, 59, 0.35);
            max-width: 420px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .route-box:hover {
            transform: translateY(-1.5px);
            box-shadow: 0 12px 30px -10px rgba(6, 78, 59, 0.45);
          }
          .route-header {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            background: rgba(255, 255, 255, 0.03);
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: left;
            border: none;
            outline: none;
          }
          .route-header:hover {
            background: rgba(255, 255, 255, 0.08);
          }
          .route-title {
            font-size: 1rem;
            font-weight: 800;
            color: #fef3c7; /* Soft Gold text */
            line-height: 1.4;
            flex: 1;
            margin-right: 12px;
            letter-spacing: -0.01em;
          }
          .route-content {
            padding: 20px;
            background: rgba(0, 0, 0, 0.1);
            border-top: 1px solid rgba(255, 255, 255, 0.08);
          }
          .route-path {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            margin-bottom: 24px;
          }
          .station-box {
            position: relative;
            background: #ffffff;
            padding: 14px 18px;
            border-radius: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            font-size: 0.9rem;
            font-weight: 700;
            white-space: normal;
            text-align: center;
            min-width: 220px;
            max-width: 300px;
            color: #064e3b;
            border: 1px solid #f1f5f9;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .highlight-station {
            border: 2px solid #f59e0b !important;
            background: #fffbeb !important;
            color: #92400e !important;
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.25) !important;
            transform: scale(1.05);
            z-index: 5;
          }
          .station-box:not(:last-child)::after {
            content: "";
            position: absolute;
            bottom: -14px;
            left: 50%;
            transform: translateX(-50%);
            border-left: 9px solid transparent;
            border-right: 9px solid transparent;
            border-top: 12px solid #f59e0b;
            filter: drop-shadow(0 2px 3px rgba(0,0,0,0.1));
          }
          .route-transport, .route-fare {
            font-size: 0.9rem;
            background: #f5f3ff;
            padding: 14px 18px;
            border-radius: 16px;
            margin-bottom: 14px;
            color: #5b21b6;
            font-weight: 700;
            max-width: 100%;
            border: 1px solid #ddd6fe;
            box-shadow: 0 4px 6px rgba(139, 92, 246, 0.05);
          }
          .fare-list {
            margin-left: 10px;
            margin-top: 8px;
            color: #6d28d9;
            font-weight: 600;
            list-style-type: none;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .fare-list li {
            position: relative;
            padding-left: 18px;
            line-height: 1.4;
          }
          .fare-list li::before {
            content: "→";
            position: absolute;
            left: 0;
            color: #f59e0b;
            font-weight: 900;
          }
        `}} />

        {/* Routes Section */}
        <div className="space-y-4 animate-in slide-in-from-bottom-8 duration-1000">
          {routes.map((route) => (
            <div key={route.id} id={`route-${route.id}`} className="route-box">
              <button 
                className="route-header"
                onClick={() => toggleRoute(route.id)}
              >
                <span className="route-title">{route.title}</span>
                {expandedRoute === route.id ? (
                  <ChevronUp className="text-amber-400 shrink-0" size={24} />
                ) : (
                  <ChevronDown className="text-amber-400 shrink-0" size={24} />
                )}
              </button>
              
              <AnimatePresence>
                {expandedRoute === route.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="route-content">
                      <div className="route-path">
                        {route.path.map((station, index) => (
                          <div 
                            key={index} 
                            className={`station-box ${
                              (index === 0 || index === route.path.length - 1) ? 'highlight-station' : ''
                            }`}
                          >
                            {station}
                          </div>
                        ))}
                      </div>
                      <div className="route-transport">
                        <strong>পরিবহন:</strong> {route.transport}
                      </div>
                      <div className="route-fare">
                        <strong>ভাড়া:</strong>
                        <ul className="fare-list">
                          {route.fare.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Full Details Section (Static) */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-700 mt-10">
          <h3 className="text-center text-slate-500 dark:text-slate-400 font-bold text-sm mb-6 uppercase tracking-widest">
            সবগুলো রুট এর বিস্তারিত
          </h3>
          <div className="space-y-8">
            {routes.map((route) => (
              <div key={`static-${route.id}`} className="route-box">
                <div className="route-header cursor-default">
                  <span className="route-title">{route.title}</span>
                </div>
                <div className="route-content">
                  <div className="route-path">
                    {route.path.map((station, index) => (
                      <div 
                        key={index} 
                        className={`station-box ${
                          (index === 0 || index === route.path.length - 1) ? 'highlight-station' : ''
                        }`}
                      >
                        {station}
                      </div>
                    ))}
                  </div>
                  <div className="route-transport">
                    <strong>পরিবহন:</strong> {route.transport}
                  </div>
                  <div className="route-fare">
                    <strong>ভাড়া:</strong>
                    <ul className="fare-list">
                      {route.fare.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Iframe Section at the Bottom */}
        <div className="mt-12 mb-8">
          <h3 className="text-center text-slate-500 dark:text-slate-400 font-bold text-sm mb-8 uppercase tracking-widest">
            লোকেশন ম্যাপ
          </h3>
          <div className="px-2">
            <PremiumMapCard />
          </div>
        </div>
      </div>
    </div>
  );
};
