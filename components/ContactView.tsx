import React from 'react';
import { ArrowLeft, Phone, MessageCircle, ShieldCheck, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface ContactViewProps {
  onBack: () => void;
  setView: (view: string) => void;
}

interface Contact {
  id: string;
  name: string;
  role?: string;
  phone: string;
  isSecurity?: boolean;
  theme?: 'indigo' | 'emerald' | 'amber' | 'blue' | 'purple';
}

const CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'মোঃ মোজাম্মেল হক',
    role: 'সেক্রেটারি',
    phone: '+8801718635845',
    theme: 'indigo'
  },
  {
    id: '2',
    name: 'মো: শাহীন',
    role: 'ক্যাশিয়ার',
    phone: '+8801822532977',
    theme: 'emerald'
  },
  {
    id: '3',
    name: 'মো গোলাম ফারুক',
    role: 'কার্যকরী সদস্য',
    phone: '+8801822940728',
    theme: 'amber'
  },
  {
    id: '4',
    name: 'রিফাত',
    role: 'নিরাপত্তা ও তত্ত্বাবধানে',
    phone: '+8801310988954',
    isSecurity: true,
  }
];

export const ContactView: React.FC<ContactViewProps> = ({ onBack, setView }) => {
  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (phone: string) => {
    // Remove '+' and spaces for WhatsApp link
    const formattedPhone = phone.replace(/\+/g, '').replace(/\s/g, '').replace(/-/g, '');
    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}`, '_blank');
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">যোগাযোগ</h2>
      </div>

      {/* Contact List */}
      <div className="space-y-4">
        {CONTACTS.map((contact, index) => (
          <motion.div
            key={contact.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative overflow-hidden rounded-2xl p-5 border ${
              contact.isSecurity 
                ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-white' 
                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm'
            }`}
          >
            {/* Background Decoration for Security */}
            {contact.isSecurity && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
            )}

            <div className="flex items-start gap-4 relative z-10">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                contact.isSecurity 
                  ? 'bg-white/10 text-white' 
                  : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500'
              }`}>
                {contact.isSecurity ? <ShieldCheck size={24} /> : <User size={24} />}
              </div>
              
              <div className="flex-1">
                {contact.role && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 inline-block ${
                    contact.isSecurity 
                      ? 'bg-rose-500 text-white' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {contact.role}
                  </span>
                )}
                <h3 className={`text-lg font-bold ${contact.isSecurity ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                  {contact.name}
                </h3>
                <p className={`font-mono text-sm mt-0.5 ${contact.isSecurity ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                  {contact.phone}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-5 relative z-10">
              <button
                onClick={() => handleCall(contact.phone)}
                className={`w-1/3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold transition-all active:scale-95 ${
                  contact.isSecurity
                    ? 'bg-white text-slate-900 hover:bg-slate-100'
                    : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-none'
                }`}
              >
                <Phone size={14} /> কল করুন
              </button>
              
              <button
                onClick={() => handleWhatsApp(contact.phone)}
                className={`w-2/3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold transition-all active:scale-95 border ${
                  contact.isSecurity
                    ? 'border-white/20 text-white hover:bg-white/10'
                    : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <MessageCircle size={14} /> হোয়াটসঅ্যাপ বার্তা
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Help Text */}
      <div className="mt-8 text-center px-4">
        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
          যেকোনো প্রয়োজনে উপরে উল্লেখিত নম্বরগুলোতে যোগাযোগ করুন।<br/>
          জরুরী পরিস্থিতিতে সরাসরি কল করাই শ্রেয়।
        </p>
      </div>
    </>
  );
};
