import React from 'react';
import { Megaphone } from 'lucide-react';
import { NOTICES, TRANSLATIONS } from '../constants';

interface NoticeBoardProps {
  lang?: 'bn' | 'en';
  text?: string;
}

const NoticeBoard: React.FC<NoticeBoardProps> = ({ lang = 'bn', text }) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 py-2 relative overflow-hidden flex items-center shadow-sm h-10 transition-colors duration-300">
      <div className="absolute left-0 z-10 bg-white dark:bg-slate-900 pl-4 pr-3 py-2 h-full flex items-center border-r border-gray-100 dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] gap-2 transition-colors duration-300">
        <Megaphone className="w-4 h-4 text-primary-700 dark:text-primary-400" />
        <span className="text-xs font-bold text-primary-700 dark:text-primary-400 pt-0.5">{t.notice}</span>
      </div>
      
      <div className="whitespace-nowrap overflow-hidden w-full ml-24">
        <div className="animate-marquee inline-flex items-center will-change-transform" style={{ animationDuration: '60s' }}>
          {text ? (
            <>
              <span className="text-sm font-semibold text-gray-900 dark:text-white mx-4">
                {text}
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white mx-4">
                {text}
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center">
                {NOTICES.map((n) => (
                  <div key={n.id} className="flex items-center mx-6">
                    {n.icon && <n.icon className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-2 shrink-0" />}
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{n.text}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center">
                {NOTICES.map((n) => (
                  <div key={`dup-${n.id}`} className="flex items-center mx-6">
                    {n.icon && <n.icon className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-2 shrink-0" />}
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{n.text}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoticeBoard;