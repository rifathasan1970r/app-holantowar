import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowUpDown, Phone, Users, Weight, DoorOpen, Ban, Wind, Bell, PowerOff, ChevronsUpDown, Hand, UserCheck, Trash2, VolumeX, Building
} from 'lucide-react';

interface LiftInstructionsViewProps {
  onBack: () => void;
}

const instructions = [
  { icon: Building, text: "হলান টাওয়ার লিফটে আপনাকে স্বাগতম।" },
  { icon: Users, text: "অনুগ্রহপূর্বক লাইনে দাঁড়ান এবং ধৈর্য ধরুন।" },
  { icon: ChevronsUpDown, text: "উপরে বা নিচে নামার জন্য নির্ধারিত বাটন চাপুন।" },
  { icon: Hand, text: "বাটন চাপার পর আলো জ্বলা পর্যন্ত অপেক্ষা করুন।" },
  { icon: DoorOpen, text: "লিফটের দরজা সম্পূর্ণ খোলার পর প্রবেশ করুন।" },
  { icon: UserCheck, text: "আপনার কাঙ্ক্ষিত ফ্লোরের বাটন একবার চাপুন।" },
  { icon: Weight, text: "ধারন ক্ষমতার অতিরিক্ত ওজন বহন থেকে বিরত থাকুন। (সর্বোচ্চ ৮ জন বা ৬৩০ কেজি)" },
  { icon: VolumeX, text: "অতিরিক্ত ওজনের সংকেত বাজলে সর্বশেষ আরোহনকারী নেমে পড়ুন।" },
  { icon: Ban, text: "লিফটের ভিতরে ধুমপান করা সম্পূর্ণ নিষিদ্ধ।" },
  { icon: Users, text: "শিশু ও বৃদ্ধদের একা একা লিফটে ভ্রমণ করতে নিরুৎসাহিত করা হচ্ছে।" },
  { icon: Trash2, text: "লিফটে সকল প্রকার ময়লা আবর্জনা ফেলা থেকে বিরত থাকুন।" },
  { icon: PowerOff, text: "বিদ্যুৎ চলে গেলে আতঙ্কিত হবেন না, অটো রেস্কিউ ডিভাইস আপনাকে নিকটস্থ ফ্লোরে নিয়ে যাবে।" },
  { icon: Bell, text: "যান্ত্রিক ত্রুটিতে লিফটের ভিতরের কলিং বেল চাপুন এবং কর্তৃপক্ষের সাহায্য নিন।" },
  { icon: Wind, text: "লিফটের ভিতরে পর্যাপ্ত বায়ু চলাচল ও ইমারজেন্সি লাইটের ব্যবস্থা রয়েছে।" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 100 }
  },
};

export const LiftInstructionsView: React.FC<LiftInstructionsViewProps> = ({ onBack }) => {
  return (
    <div className="pb-24 animate-in slide-in-from-right duration-500 bg-slate-100 dark:bg-slate-900 min-h-screen transition-colors duration-300">
      {/* Background decorative shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full filter blur-3xl opacity-50"></div>
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-red-200/30 dark:bg-red-900/20 rounded-full filter blur-3xl opacity-50"></div>
      </div>

      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl relative border-b border-gray-200/50 dark:border-slate-700/50 transition-colors duration-300">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors py-1 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-base font-bold">ফিরে যান</span>
          </button>
        </div>
      </div>

      <div className="p-4 relative z-1">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black p-6 rounded-3xl shadow-2xl shadow-slate-900/20 dark:shadow-black/40 mb-6 overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full opacity-50"></div>
            <div className="relative flex items-center gap-4 text-white">
              <div className="bg-white/10 p-3 rounded-xl border border-white/20">
                <ArrowUpDown size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">লিফট নির্দেশাবলি</h2>
                <p className="text-sm opacity-80">নিরাপদ ও সুন্দর অভিজ্ঞতার জন্য</p>
              </div>
            </div>
        </div>
        
        <motion.div 
          className="space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {instructions.map((item, index) => (
            <motion.div 
              key={index} 
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200/80 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm flex items-start gap-4 transition-all hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-lg hover:scale-[1.02]"
              variants={itemVariants}
            >
              <div className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center shadow-md shadow-indigo-500/30">
                <item.icon size={20} />
              </div>
              <p className="flex-1 font-semibold text-slate-800 dark:text-slate-200 text-sm pt-2">{item.text}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="mt-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-xl shadow-red-500/30"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: instructions.length * 0.08 + 0.2 }}
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full border border-white/30">
              <Phone size={20} />
            </div>
            <div>
              <p className="font-bold">জরুরি প্রয়োজনে যোগাযোগ করুন</p>
              <p className="text-lg font-bold tracking-wider">01310-988954 ( রিফাত )</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="mt-8 text-center text-slate-500 dark:text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: instructions.length * 0.08 + 0.4 }}
        >
          <p className="font-bold text-base">ধন্যবাদান্তে,</p>
          <p className="font-semibold text-sm">হলান টাওয়ারের কর্তৃপক্ষ</p>
        </motion.div>
      </div>
    </div>
  );
};
