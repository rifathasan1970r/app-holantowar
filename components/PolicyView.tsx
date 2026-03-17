import React from 'react';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';

interface PolicyViewProps {
  onBack: () => void;
}

export const PolicyView: React.FC<PolicyViewProps> = ({ onBack }) => {
  const introText = "হলান টাওয়ার এর সকল ফ্ল্যাট মালিকদের সম্মতিক্রমে নিম্নলিখিত নীতিমালা অনুমোদন ও কার্যকর করা হলোঃ";
  const policies = [
    "হলান টাওয়ার পরিচালনার নিমিত্তে নতুন করে একজন সেক্রেটারী, সভাপতি ও ক্যাশিয়ার নিয়োগ করা হবে। ক্যাশিয়ার নতুনভাবে সকল হিসাব সংরক্ষণ করবেন।",
    "সভাপতি, সেক্রেটারী, ক্যাশিয়ার এবং দুইজন নির্বাহী সদস্য নিয়ে ভোটের মাধ্যমে বিল্ডিং পরিচালনা কমিটি গঠন করতে হবে।",
    "হলান টাওয়ারে অবস্থানরত সদস্যদের সমন্বয়ে মিটিং অনুষ্ঠিত করে প্রয়োজন অনুযায়ী সেক্রেটারী ও অন্যান্য সদস্য নিয়োগ করা হবে।",
    "হলান টাওয়ারে বসবাসকারী মালিকদের মধ্য হতে প্রতি বছর সভাপতি ও সেক্রেটারী নির্বাচিত হবেন।",
    "হলান টাওয়ারের মালিকদের মধ্য থেকে ৩ সদস্য বিশিষ্ট একটি কার্যনির্বাহী কমিটি গঠন করা হবে। উক্ত কমিটি হলান টাওয়ারের নিয়ম-শৃঙ্খলা ও উন্নয়নমূলক কার্যক্রম সংক্রান্ত বিষয়াদি সভাপতি ও সেক্রেটারীর সাথে সমন্বয় করে পরিচালনা করবেন।",
    "আর্থিক বা গুরুত্বপূর্ণ কোনো সিদ্ধান্ত গ্রহণের ক্ষেত্রে গ্রুপ মিটিং আয়োজন করা হবে।",
    "হলান টাওয়ারের নিকটবর্তী IFIC ব্যাংকে একটি যৌথ ব্যাংক একাউন্ট খোলা হবে।",
    "প্রতিমাসের সার্ভিস চার্জ, ভাড়াটিয়ার গ্যারেজ ভাড়া এবং যে কোনো আয়ের উৎস থেকে প্রাপ্ত অর্থ ব্যাংক একাউন্টে জমা ও সংযুক্ত করতে হবে।",
    "পানি, গ্যাস ও বিদ্যুৎ বিলের ভাউচার ফাইল তৈরি করতে হবে। অন্যান্য আনুষঙ্গিক খরচের জন্য পৃথক ভাউচার ফাইল তৈরি করতে হবে।",
    "সভাপতির অনুমতি ব্যতীত কোনো প্রকার খরচ করা যাবে না।",
    "তিন মাস অন্তর অন্তর একটি অডিট টিম গঠন করে সকল সদস্যদের নিকট আয়-ব্যয়ের হিসাব প্রদান করতে হবে।",
    "ইউটিলিটি সার্ভিস চার্জ প্রতি মাসে ২০০০ টাকা নির্ধারণ করা হলো। খালি ইউনিটের জন্য প্রতি মাসে ৫০০ টাকা সার্ভিস চার্জ প্রযোজ্য হবে এবং তা সংশ্লিষ্ট ফ্ল্যাট মালিক বহন করবেন।",
    "ইউটিলিটি সার্ভিস চার্জ প্রতি মাসের ৫ তারিখের মধ্যে পরিশোধ করতে হবে।",
    "ভাড়াটিয়ার গাড়ি থাকলে নির্ধারিত হারে গ্যারেজ ভাড়া আদায় করতে হবে।",
    "২১ জন মালিকের ব্যক্তিগত প্রাইভেট গাড়ির গ্যারেজ ভাড়া ১০০০ টাকা নির্ধারণ করা হলো।",
    "২১ জন মালিকের ব্যক্তিগত বাইকের গ্যারেজ ভাড়া ৫০০ টাকা নির্ধারণ করা হলো।",
    "ভাড়াটিয়ার ব্যক্তিগত প্রাইভেট গাড়ির গ্যারেজ ভাড়া ২০০০ টাকা নির্ধারণ করা হলো (গ্যারেজ ফাঁকা সাপেক্ষে সুবিধা প্রদান করা হবে)।",
    "ভাড়াটিয়ার ব্যক্তিগত বাইকের গ্যারেজ ভাড়া ৫০০ টাকা নির্ধারণ করা হলো (গ্যারেজ ফাঁকা থাকা সাপেক্ষে সুবিধা প্রদান করা হবে)।",
    "ভাড়াটিয়ার বাসা ভাড়া ফরম (থানা কর্তৃক প্রদত্ত) পূরণ করে প্রত্যেক সদস্যের ১ কপি পিপি সাইজের ছবি, এনআইডি এর ফটোকপি এবং কর্মস্থলের ঠিকানা সেক্রেটারীর নিকট জমা দিতে হবে।",
    "ভাড়াটিয়াদের করণীয় বিষয়সমূহ সেক্রেটারী কর্তৃক লিখিতভাবে প্রদান করা হবে।",
    "আর্থিক বা গুরুত্বপূর্ণ কোনো সিদ্ধান্ত গ্রহণের ক্ষেত্রে গ্রুপ মিটিং আয়োজন করা হবে।",
    "কোনো ফ্ল্যাটের মালিক কোনো প্রকার সাবলেট ভাড়া প্রদান করতে পারবেন না।",
    "ভাড়াটিয়াদের পরিবারের সদস্য সংখ্যা ৫ জনের অধিক হতে পারবে না।",
    "কোনো ফ্ল্যাটের মালিক তার ফ্ল্যাট ভাড়া দেওয়ার পূর্বে ভাড়াটিয়ার এনআইডি ও কর্মস্থলের ঠিকানা সেক্রেটারীর নিকট জমা প্রদান নিশ্চিত করবেন।",
    "রাত ১১:৩০ ঘটিকার পর মেইন গেইট সম্পূর্ণ বন্ধ রাখা হবে।",
    "হলান টাওয়ারের মেইন গেইটের চাবি শুধুমাত্র ফ্ল্যাট মালিকদের প্রদান করা হবে। কোনো ভাড়াটিয়ার কাছে চাবি রাখা যাবে না।",
    "সর্বসময় গেইট লক থাকবে এবং কেয়ারটেকার পরিচয় নিশ্চিত না হওয়া পর্যন্ত কাউকে প্রবেশ করতে দেওয়া হবে না।",
    "কোনো ভাড়াটিয়া রাষ্ট্রবিরোধী কার্যকলাপ বা অসদাচরণে জড়িত থাকলে সভাপতি ও সেক্রেটারী তাকে বাসা ছেড়ে দেওয়ার নির্দেশ দিতে পারবেন। সে ক্ষেত্রে ফ্ল্যাট মালিকের কোনো আপত্তি গ্রহণযোগ্য হবে না।",
    "সভাপতি ও সেক্রেটারীর অনুমতি ব্যতীত বহিরাগতদের দ্বারা হল রুম ও ছাদ ব্যবহার সম্পূর্ণ নিষিদ্ধ।",
    "কেয়ারটেকারের পদ খালি রেখে ব্যক্তিগত কাজে কেয়ারটেকারকে ব্যবহার করা যাবে না।",
    "ছাদ সম্পূর্ণ খালি রাখা হবে এবং কোনো ধরনের গাছের টব ব্যবহার করা যাবে না।",
    "ছাদ শুধুমাত্র নির্ধারিত সময়ে খোলা থাকবে (বিকাল ৪:০০টা থেকে রাত ৮:০০টা পর্যন্ত)।"
  ];

  return (
    <div className="animate-in slide-in-from-right duration-300 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-b-3xl shadow-sm border-b border-slate-100 dark:border-slate-700 mb-6 sticky top-[60px] z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">হলান টাওয়ার এর নীতিমালা অনুমোদন ও কার্যকর</h2>
            <p className="text-xs text-rose-500 font-medium">হলান টাওয়ার ব্যবস্থাপনা</p>
          </div>
          <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400">
            <FileText size={20} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-0 relative">
        <div className="mb-6 px-4">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30">
            {introText}
          </p>
        </div>

        {/* Vertical Line */}
        <div className="absolute left-8 top-24 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-700"></div>

        {policies.map((policy, index) => (
          <div key={index} className="relative pl-12 py-4 group">
            {/* Number Bubble */}
            <div className="absolute left-4 top-4 w-8 h-8 -ml-4 bg-white dark:bg-slate-900 border-2 border-rose-500 text-rose-500 rounded-full flex items-center justify-center text-xs font-bold z-10 shadow-sm group-hover:scale-110 transition-transform">
              {index + 1}
            </div>
            
            {/* Content Card */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 group-hover:border-rose-200 dark:group-hover:border-rose-900/50 transition-colors">
               <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
                  {policy}
               </p>
            </div>
          </div>
        ))}

        <div className="mt-8 p-6 bg-gradient-to-br from-rose-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-3xl border border-rose-100 dark:border-slate-700 text-center relative z-10">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-3">
            <FileText size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">ধন্যবাদ</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            সকলের সহযোগিতায় আমাদের ভবনকে সুন্দর ও সুশৃঙ্খল রাখা সম্ভব।
          </p>
        </div>
      </div>
    </div>
  );
};
