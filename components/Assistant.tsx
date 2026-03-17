import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGeminiResponse } from '../services/geminiService';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface AssistantProps {
  isVisible: boolean;
  lang?: 'bn' | 'en';
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const SUGGESTIONS_BN = [
  "সার্ভিস চার্জ কত?",
  "ম্যানেজারের নাম্বার",
  "আজকের নোটিশ",
  "গেট বন্ধের সময়?",
  "ময়লা নেয়ার সময়",
  "ওয়াইফাই পাসওয়ার্ড",
  "লিফট নষ্ট?",
  "গ্যাস বিল",
  "জরুরী যোগাযোগ",
  "বাসা ভাড়া তথ্য",
  "লোকেশন ম্যাপ"
];

const SUGGESTIONS_EN = [
  "Service charge amount?",
  "Manager number",
  "Today's notice",
  "Gate closing time?",
  "Garbage collection time",
  "WiFi password",
  "Lift broken?",
  "Gas bill",
  "Emergency contact",
  "To-Let info",
  "Location map"
];

const Assistant: React.FC<AssistantProps> = ({ isVisible, lang = 'bn', isOpen, onOpenChange }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message when language or visibility changes
  useEffect(() => {
    const initialMsg = lang === 'bn' 
        ? 'আসসালামু আলাইকুম! আমি হলান টাওয়ারের স্মার্টু মিয়া। আমি কীভাবে আপনাকে সাহায্য করতে পারি?'
        : 'Assalamu Alaikum! I am Smartu Mia of Hollan Tower. How can I assist you today?';
    
    // Only reset if empty to avoid wiping conversation, or just add a system note? 
    // For simplicity, we just check if it's empty.
    if (messages.length === 0) {
        setMessages([{ role: 'assistant', text: initialMsg }]);
    }
  }, [lang]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // অন্য পেজে গেলে চ্যাট বন্ধ করে দিবে
  useEffect(() => {
    if (!isVisible) {
      onOpenChange(false);
    }
  }, [isVisible]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMessage = text;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    const response = await getGeminiResponse(userMessage, lang as 'bn' | 'en');

    setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    setIsLoading(false);
  };

  const suggestions = lang === 'bn' ? SUGGESTIONS_BN : SUGGESTIONS_EN;

  // যদি হোম পেজে না থাকে এবং চ্যাট ওপেন না থাকে, তবে কিছুই রেন্ডার করার দরকার নেই
  if (!isVisible && !isOpen) return null;

  return (
    <>
      {/* Floating Action Button - Updated Icon to 'Bot' */}
      <AnimatePresence>
        {isVisible && !isOpen && (
          <motion.button
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: -180 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onOpenChange(true)}
            className="fixed bottom-24 right-5 z-40 p-3 rounded-full shadow-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-violet-600 text-white flex items-center justify-center border-2 border-white/30 backdrop-blur-md group"
          >
            <div className="relative">
                 <Bot size={24} className="text-white drop-shadow-md" />
                 <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
                 </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm md:items-end md:justify-end md:p-6 md:bottom-20 md:right-4 md:inset-auto"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* Height: h-[500px] and max-h-[70vh] for mobile optimization */}
            <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[500px] max-h-[70vh] border border-gray-100 dark:border-slate-700 ring-1 ring-black/5">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-3.5 flex justify-between items-center text-white shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Bot size={60} />
                </div>

                <div className="flex items-center gap-3 relative z-10">
                  <div className="bg-white/20 p-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                    <Zap size={18} className="text-yellow-300 fill-yellow-300" />
                  </div>
                  <div>
                    <span className="font-bold text-base block leading-tight tracking-wide">
                        {lang === 'bn' ? 'স্মার্টু মিয়া' : 'Smartu Mia'}
                    </span>
                    <span className="text-[10px] text-indigo-100 flex items-center gap-1 opacity-90">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(74,222,128,0.8)]"></span>
                      {lang === 'bn' ? 'সক্রিয় আছে' : 'Active Now'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => onOpenChange(false)} 
                  className="hover:bg-white/20 p-1.5 rounded-full transition-colors active:scale-90 relative z-10"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-900 space-y-3">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
                  >
                    {msg.role === 'assistant' && (
                       <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-sm border border-white dark:border-slate-600">
                          <Bot size={14} className="text-white" />
                       </div>
                    )}
                    
                    <div
                      className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start items-end gap-2">
                     <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                        <Bot size={14} className="text-white" />
                     </div>
                    <div className="bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions Chips */}
              {!isLoading && (
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 flex gap-2 overflow-x-auto no-scrollbar border-t border-gray-100 dark:border-slate-700">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(suggestion)}
                      className="whitespace-nowrap px-3 py-1 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-600 rounded-full text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:border-indigo-200 transition-colors shadow-sm flex-shrink-0 active:scale-95"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div className="p-3 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex gap-2 items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={lang === 'bn' ? "এখানে লিখুন..." : "Type here..."}
                  className="flex-1 bg-gray-100 dark:bg-slate-700 border border-transparent focus:bg-white dark:focus:bg-slate-600 focus:border-indigo-200 dark:focus:border-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-400 text-gray-700 dark:text-slate-200"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 flex items-center justify-center"
                >
                  <Send size={18} className={isLoading ? 'hidden' : 'block'} />
                  {isLoading && (
                     <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block"></span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Assistant;
