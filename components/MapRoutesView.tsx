import React, { useState } from 'react';
import { ArrowLeft, Map as MapIcon, Navigation, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MapRoutesViewProps {
  onBack: () => void;
}

export const MapRoutesView: React.FC<MapRoutesViewProps> = ({ onBack }) => {
  const [expandedRoute, setExpandedRoute] = useState<number | null>(null);

  const toggleRoute = (id: number) => {
    setExpandedRoute(expandedRoute === id ? null : id);
  };

  const routes = [
    {
      id: 1,
      title: "রুট ১ : (এয়ারপোর্ট) হাজী ক্যাম্প থেকে হলান টাওয়ার",
      path: ["(এয়ারপোর্ট) হাজী ক্যাম্প", "আশকোনা", "তালতলা", "নদ্দাপাড়া", "বৈশাখী মোর", "হলান মোড়", "চিটাগাং স'মিল", "হলান টাওয়ার"],
      transport: "রিকশা, অটো রিকশা",
      fare: ["রিকশা: ৩০ টাকা", "অটো রিকশা: ২০ টাকা", "প্রতিজন"]
    },
    {
      id: 2,
      title: "রুট ২: উত্তরা থেকে হলান টাওয়ার",
      path: ["উত্তরা (জসীমউদ্দীন, রাজলক্ষ্মী, আজমপুর, হাউজ বিল্ডিং)", "কসাইবাড়ি", "প্রেমবাগান", "দক্ষিণখান বাজার", "হলান মোড়", "চিটাগাং স'মিল", "হলান টাওয়ার"],
      transport: "রিকশা, অটো রিকশা",
      fare: ["উত্তরা থেকে কসাইবাড়ি: রিকশা ২০-৫০ টাকা (দূরত্ব অনুযায়ী)", "কসাইবাড়ি থেকে দক্ষিণখান বাজার: অটো ১০ টাকা", "দক্ষিণখান বাজার থেকে হলান টাওয়ার: রিকশা ৩০ টাকা", "প্রতিজন"]
    },
    {
      id: 3,
      title: "রুট ৩: কাওলা রেলগেট থেকে হলান টাওয়ার",
      path: ["কাওলা রেলগেট", "কাওলা বাজার", "আশিয়ান সিটি (পয়সা বাজার)", "নদ্দাপাড়া", "বৈশাখী মোর", "হলান মোড়", "চিটাগাং স'মিল", "হলান টাওয়ার"],
      transport: "রিকশা",
      fare: ["রিকশা ৫০-৭০ টাকা"]
    },
    {
      id: 4,
      title: "রুট ৪: খিলক্ষেত থেকে হলান টাওয়ার",
      path: ["খিলক্ষেত বাজার", "মেরিডিয়ান (খা'পাড়া)", "কাওলা বাজার", "আশিয়ান সিটি (পয়সা বাজার)", "নদ্দাপাড়া", "বৈশাখী মোর", "হলান মোড়", "চিটাগাং স'মিল", "হলান টাওয়ার"],
      transport: "রিকশা",
      fare: ["রিকশা ৬০-৮০ টাকা"]
    },
    {
      id: 5,
      title: "রুট ৫: খিলক্ষেত থেকে হলান টাওয়ার বিকল্প রুট",
      path: ["খিলক্ষেত বাজার", "লেকসিটি", "বাগানবাড়ি", "বড়ূয়া", "ব্যাংকের কার্ড", "লঞ্জনিপাড়া", "আশিয়ান সিটি (গেট ২)", "চিটাগাং স'মিল", "হলান টাওয়ার"],
      transport: "রিকশা, অটো রিকশা",
      fare: ["খিলক্ষেত থেকে বাগানবাড়ি: অটো ২০ টাকা", "বাগানবাড়ি থেকে হলান টাওয়ার: রিকশা ৪০-৬০ টাকা"]
    },
    {
      id: 6,
      title: "রুট ৬: ৩০০ফিট থেকে হলান টাওয়ার",
      path: ["৩০০ফিট (খিলক্ষেত, স্বদেশ)", "বাগানবাড়ি", "বড়ূয়া", "ব্যাংকের কার্ড", "লঞ্জনিপাড়া", "আশিয়ান সিটি (গেট ২)", "চিটাগাং স'মিল", "হলান টাওয়ার"],
      transport: "রিকশা",
      fare: ["৩০০ফিট থেকে বাগানবাড়ি: অটো ৩০-৫০ টাকা", "বাগানবাড়ি থেকে হলান টাওয়ার: রিকশা ৪০-৬০ টাকা"]
    },
    {
      id: 7,
      title: "রুট ৭: উত্তরখান (আব্দুল্লাহপুর, টঙ্গী) থেকে হলান টাওয়ার",
      path: ["উত্তরখান (আব্দুল্লাহপুর, টঙ্গী)", "আটিপাড়া", "মাজার রোড", "দক্ষিণখান বাজার", "হলান মোড়", "চিটাগাং স'মিল", "হলান টাওয়ার"],
      transport: "রিকশা, অটো রিকশা",
      fare: ["মাজার রোড থেকে দক্ষিণখান বাজার: রিকশা ১০ টাকা", "দক্ষিণখান বাজার থেকে হলান টাওয়ার: রিকশা ৩০ টাকা"]
    }
  ];

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
            background: rgba(255, 255, 255, 0.95);
            padding: 14px 18px;
            border-radius: 16px;
            margin-bottom: 14px;
            color: #064e3b;
            font-weight: 700;
            max-width: 100%;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          }
          .fare-list {
            margin-left: 10px;
            margin-top: 8px;
            color: #065f46;
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
                            className={`station-box ${(index === 0 || index === route.path.length - 1) ? 'highlight-station' : ''}`}
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
                        className={`station-box ${(index === 0 || index === route.path.length - 1) ? 'highlight-station' : ''}`}
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
      </div>
    </div>
  );
};
