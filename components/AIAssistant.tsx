import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { X, Send, Bot, User, Sparkles, RefreshCw, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  contextData: {
    payments: any[];
    unitsInfo: any;
    parkingUnits: string[];
    externalUnits: any[];
    selectedYear: number;
    summary: any;
  };
}

const SUGGESTIONS = [
  "এই মাসের মোট কালেকশন কত?",
  "বকেয়া ইউনিটের তালিকা দাও",
  "পার্কিং চার্জ কত?",
  "৫এ ইউনিটের তথ্য দাও",
  "সবচেয়ে বেশি বকেয়া কার?"
];

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, contextData }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'আসসালামু আলাইকুম! আমি হলান টাওয়ারের সার্ভিস মিয়া। সার্ভিস চার্জ, পার্কিং বা পেমেন্ট সংক্রান্ত যেকোনো তথ্য জানতে আমাকে জিজ্ঞাসা করুন।' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage = text.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      setMessages(prev => [...prev, { role: 'model', text: "দুঃখিত, এআই সিস্টেমের এপিআই কী (API Key) কনফিগার করা নেই। অনুগ্রহ করে ডেভেলপারকে জানান।" }]);
      setIsLoading(false);
      return;
    }

    const MAX_RETRIES = 3;
    const BASE_DELAY = 1000;
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const systemInstruction = `
      You are an advanced AI Assistant named "Service Mia" (সার্ভিস মিয়া) for "Hollan Tower", a premium smart building management app.
      Your goal is to provide detailed, well-formatted, and easy-to-read information about service charges, parking, and building status.

      FORMATTING RULES (CRITICAL):
      1. Use Markdown for all responses.
      2. Use **bold text** for emphasis (e.g., unit names, amounts, dates).
      3. Use line breaks and double line breaks to separate different points. NEVER send a single block of text.
      4. Use bullet points (•) or numbered lists for multiple items.
      5. Use emojis (🏢, 💰, 🚗, 📅, ✅) to make the response friendly and scannable.
      6. If listing multiple units or months, use a structured list format.

      CONTEXT DATA (Year ${contextData.selectedYear}):
      - Total Payments Records: ${contextData.payments.length}
      - Parking Units: ${contextData.parkingUnits.join(', ')}
      - External Parking: ${contextData.externalUnits.map(u => u.name + ' (' + u.owner + ')').join(', ')}
      
      MONTHLY SUMMARY:
      ${JSON.stringify(contextData.summary.monthly.map((m: any) => ({ month: m.month, collected: m.collected, due: m.due, paidCount: m.paidUnits.length, dueCount: m.dueUnits.length })))}
      
      UNIT-WISE SUMMARY (Detailed):
      ${JSON.stringify(contextData.summary.unitWise.slice(0, 50))} (Showing first 50 units)
      
      UNITS INFO (Occupancy, Phone, Notes):
      ${JSON.stringify(contextData.unitsInfo)}

      ADVANCED RULES:
      1. Always respond in Bangla (Bengali).
      2. Be polite, professional, and helpful.
      3. If a user asks about a specific unit (e.g., "5A"), provide a complete breakdown: Owner, Status, Paid Amount, and Due Amount.
      4. For parking queries, clearly distinguish between internal and external parking.
      5. If asked for a summary, provide a "Quick Stats" section followed by details.
      6. If data is missing, suggest who to contact (e.g., Building Manager).
    `;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Construct history including the current message
        const currentHistory = messages
          .filter((m, idx) => !(idx === 0 && m.role === 'model')) // Skip initial welcome message
          .map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          }));
        
        // Add the current user message which was just sent
        currentHistory.push({
          role: 'user',
          parts: [{ text: userMessage }]
        });

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: currentHistory,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
            topP: 0.95,
            topK: 40
          }
        });

        const aiText = response.text || "দুঃখিত, আমি এখন উত্তর দিতে পারছি না।";
        setMessages(prev => [...prev, { role: 'model', text: aiText }]);
        setIsLoading(false);
        return; 
      } catch (error: any) {
        console.error(`AI Error (Attempt ${attempt + 1}):`, error.message || error);
        
        if (attempt < MAX_RETRIES - 1) {
          await sleep(BASE_DELAY * Math.pow(2, attempt));
          continue;
        }
        
        const errorMsg = error.message?.includes('API key') 
          ? "এপিআই কী (API Key) সঠিক নয়। অনুগ্রহ করে চেক করুন।" 
          : "এআই সার্ভারে সাময়িক সমস্যা হচ্ছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।";
          
        setMessages(prev => [...prev, { role: 'model', text: `দুঃখিত, ${errorMsg}` }]);
      }
    }
    
    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm md:items-end md:justify-end md:p-6 md:bottom-20 md:right-4 md:inset-auto"
        >
          <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[500px] max-h-[70vh] border border-gray-100 dark:border-slate-700 ring-1 ring-black/5">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-3.5 flex justify-between items-center text-white shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Bot size={60} />
              </div>

              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-white/20 p-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                  <Sparkles size={18} className="text-yellow-300 fill-yellow-300" />
                </div>
                <div>
                  <span className="font-bold text-base block leading-tight tracking-wide">
                      সার্ভিস মিয়া
                  </span>
                  <span className="text-[10px] text-indigo-100 flex items-center gap-1 opacity-90">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(74,222,128,0.8)]"></span>
                    সক্রিয় আছে
                  </span>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="hover:bg-white/20 p-1.5 rounded-full transition-colors active:scale-90 relative z-10"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-900 space-y-3 custom-scrollbar"
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
                >
                  {msg.role === 'model' && (
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
                    <div className="markdown-content text-inherit">
                      <Markdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="mb-0.5">{children}</li>,
                          strong: ({ children }) => <strong className="font-bold text-indigo-700 dark:text-indigo-300">{children}</strong>,
                        }}
                      >
                        {msg.text}
                      </Markdown>
                    </div>
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
            </div>

            {/* Suggestions Chips */}
            {!isLoading && (
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 flex gap-2 overflow-x-auto no-scrollbar border-t border-gray-100 dark:border-slate-700">
                {SUGGESTIONS.map((suggestion, idx) => (
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
                placeholder="এখানে লিখুন..."
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
  );
};
