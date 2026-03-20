import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Plus, Trash2, ChevronLeft, Building2, MapPin, Phone, CheckCircle2, X, Edit2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const FLOOR_OPTIONS = [
  { label: '২য় তলা', value: '২য় তলা', num: '2' },
  { label: '৩য় তলা', value: '৩য় তলা', num: '3' },
  { label: '৪র্থ তলা', value: '৪র্থ তলা', num: '4' },
  { label: '৫ম তলা', value: '৫ম তলা', num: '5' },
  { label: '৬ষ্ঠ তলা', value: '৬ষ্ঠ তলা', num: '6' },
  { label: '৭ম তলা', value: '৭ম তলা', num: '7' },
  { label: '৮ম তলা', value: '৮ম তলা', num: '8' },
  { label: '৯ম তলা', value: '৯ম তলা', num: '9' },
  { label: '১০ম তলা', value: '১০ম তলা', num: '10' },
];

interface Flat {
  id: string | number;
  info: string;
  details: {
    floor: string;
    unit: string;
    rent: string;
  };
}

export const ToLetView = ({ setView }: { setView?: (view: string, params?: any) => void }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [showOwnerDetails, setShowOwnerDetails] = useState(false);
  const [galleryCategoryName, setGalleryCategoryName] = useState<string | null>(null);
  const [newFlat, setNewFlat] = useState({
    floor: '',
    unit: '',
    rent: ''
  });

  // Owner and Contact Details State
  const [ownerName, setOwnerName] = useState('ফিরোজ মোল্লা');
  const [ownerPhone, setOwnerPhone] = useState('০১৯×××××××');
  const [contactName, setContactName] = useState('রিফাত');
  const [contactPhone, setContactPhone] = useState('+8801310988954');

  const selectedFlat = flats.find(f => f.details.unit === searchParams.get('tolet_unit')) || null;

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setOwnerName(data.owner_name || 'ফিরোজ মোল্লা');
        setOwnerPhone(data.owner_phone || '০১৯×××××××');
        setContactName(data.contact_name || 'রিফাত');
        setContactPhone(data.contact_phone || '+8801310988954');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          id: 1,
          owner_name: ownerName,
          owner_phone: ownerPhone,
          contact_name: contactName,
          contact_phone: contactPhone
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const getUnitsForFloor = (floorLabel: string) => {
    const floor = FLOOR_OPTIONS.find(f => f.label === floorLabel);
    if (!floor) return [];
    return [`${floor.num}A`, `${floor.num}B`, `${floor.num}C`];
  };

  // Fetch flats and settings from Supabase
  useEffect(() => {
    fetchFlats();
    fetchSettings();
    
    const fetchGalleryCategory = async () => {
      const { data, error } = await supabase
        .from('gallery_categories')
        .select('en')
        .eq('en', 'Flat Interior View')
        .single();
      if (data) setGalleryCategoryName(data.en);
    };
    fetchGalleryCategory();

    // Add Font Awesome
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const fetchFlats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('flats')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          console.error('The "flats" table does not exist in Supabase. Please create it.');
        }
        throw error;
      }

      if (data) {
        const formattedFlats: Flat[] = data.map((item: any) => ({
          id: item.id,
          info: `${item.floor} | ফ্ল্যাট নং: ${item.unit}`,
          details: {
            floor: item.floor,
            unit: item.unit,
            rent: item.rent
          }
        }));
        setFlats(formattedFlats);
      }
    } catch (error: any) {
      console.error('Error fetching flats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1966') {
      setIsLocked(false);
      setShowPinModal(false);
      setPin('');
      setPinError(false);
    } else {
      setPinError(true);
      setPin('');
    }
  };

  const handleAddFlat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlat.floor || !newFlat.unit) return;
    
    try {
      if (editingId) {
        const { data, error } = await supabase
          .from('flats')
          .update({
            floor: newFlat.floor,
            unit: newFlat.unit,
            rent: newFlat.rent || 'আলোচনা সাপেক্ষে'
          })
          .eq('id', editingId)
          .select();

        if (error) throw error;

        if (data) {
          const updatedItem = data[0];
          setFlats(flats.map(f => f.id === editingId ? {
            id: updatedItem.id,
            info: `${updatedItem.floor} | ফ্ল্যাট নং: ${updatedItem.unit}`,
            details: {
              floor: updatedItem.floor,
              unit: updatedItem.unit,
              rent: updatedItem.rent
            }
          } : f));
          setEditingId(null);
          setNewFlat({ floor: '', unit: '', rent: '' });
        }
      } else {
        const { data, error } = await supabase
          .from('flats')
          .insert([
            {
              floor: newFlat.floor,
              unit: newFlat.unit,
              rent: newFlat.rent || 'আলোচনা সাপেক্ষে'
            }
          ])
          .select();

        if (error) throw error;

        if (data) {
          const newItem = data[0];
          const flat: Flat = {
            id: newItem.id,
            info: `${newItem.floor} | ফ্ল্যাট নং: ${newItem.unit}`,
            details: {
              floor: newItem.floor,
              unit: newItem.unit,
              rent: newItem.rent
            }
          };
          setFlats([flat, ...flats]);
          setNewFlat({ floor: '', unit: '', rent: '' });
        }
      }
    } catch (error: any) {
      console.error('Error adding/updating flat:', error);
      alert(`ফ্ল্যাট সেভ করতে সমস্যা হয়েছে: ${error.message || 'Unknown error'}`);
    }
  };

  const startEdit = (flat: Flat) => {
    setEditingId(flat.id);
    setNewFlat({
      floor: flat.details.floor,
      unit: flat.details.unit,
      rent: flat.details.rent
    });
    // Scroll to form
    const form = document.querySelector('form');
    if (form) form.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewFlat({ floor: '', unit: '', rent: '' });
  };

  const removeFlat = async (id: string | number) => {
    try {
      const { error } = await supabase
        .from('flats')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setFlats(flats.filter(f => f.id !== id));
    } catch (error) {
      console.error('Error removing flat:', error);
      alert('ফ্ল্যাট ডিলিট করতে সমস্যা হয়েছে।');
    }
  };

  if (selectedFlat) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="min-h-screen bg-[#f5f8fb] pb-20 font-['Noto_Sans_Bengali',Inter,sans-serif]"
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setSearchParams({});
                setShowOwnerDetails(false);
              }}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="font-bold text-lg">ফ্ল্যাট বিস্তারিত</h2>
          </div>
          
          <button 
            onClick={() => {
              if (isLocked) {
                setShowPinModal(true);
              } else {
                setIsLocked(true);
                saveSettings();
              }
            }}
            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-emerald-500 transition-colors shadow-sm mr-1"
            title={isLocked ? "Unlock to edit" : "Lock to save"}
          >
            {isLocked ? <Lock size={18} /> : <Unlock size={18} className="text-emerald-500" />}
          </button>
        </div>

        <div className="max-w-[760px] mx-auto p-5">
          <div className="text-center mb-6">
            <h1 className="text-[34px] font-black text-[#dc2626] m-0">টু-লেট</h1>
            <h2 className="text-[22px] font-extrabold mt-1.5 text-slate-800 dark:text-white">হলান টাওয়ার</h2>
          </div>

          <div className="flex gap-2.5 justify-center mt-3 flex-wrap">
            <div className="bg-[#e6f7ff] border border-[#bee8ff] px-3.5 py-2 rounded-[10px] font-bold text-[#0284c7]">
              {selectedFlat.details.floor}
            </div>
            <div className="bg-[#e6f7ff] border border-[#bee8ff] px-3.5 py-2 rounded-[10px] font-bold text-[#0284c7]">
              ফ্ল্যাট নং: {selectedFlat.details.unit}
            </div>
          </div>

          <div className="mt-[18px] bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="grid grid-cols-2 bg-[#e9f7ff] dark:bg-slate-700 border-b border-[#d7eefe] dark:border-slate-600">
              <div className="p-3 font-bold text-center border-r border-[#d7eefe] dark:border-slate-600">ফ্ল্যাটের বিবরণ</div>
              <div className="p-3 font-bold text-center">সুবিধাসমূহ</div>
            </div>
            <div className="grid grid-cols-2">
              <div className="p-3 border-r border-slate-100 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2.5 font-bold text-sm text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  <i className="fa-solid fa-bed text-[#0284c7] w-5 text-center"></i> ৩ বেড
                </div>
                <div className="flex items-center gap-2.5 font-bold text-sm text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  <i className="fa-solid fa-couch text-[#0284c7] w-5 text-center"></i> ডয়িং & ডাইনিং
                </div>
                <div className="flex items-center gap-2.5 font-bold text-sm text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  <i className="fa-solid fa-toilet text-[#0284c7] w-5 text-center"></i> ৩ বাথ
                </div>
                <div className="flex items-center gap-2.5 font-bold text-sm text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  <i className="fa-solid fa-door-open text-[#0284c7] w-5 text-center"></i> ২ বারান্দা
                </div>
                <div className="flex items-center gap-2.5 font-bold text-sm text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  <i className="fa-solid fa-kitchen-set text-[#0284c7] w-5 text-center"></i> ১ কিচেন
                </div>
              </div>
              <div className="p-3 space-y-1.5">
                <div className="flex items-center justify-end gap-2.5 font-bold text-sm text-slate-700 dark:text-slate-200 text-right">
                  ২৪ ঘন্টা পানি <i className="fa-solid fa-droplet text-[#0284c7] w-5 text-center"></i>
                </div>
                <div className="flex items-center justify-end gap-2.5 font-bold text-sm text-slate-700 dark:text-slate-200 text-right">
                  বিদ্যুৎ <i className="fa-solid fa-bolt text-[#0284c7] w-5 text-center"></i>
                </div>
                <div className="flex items-center justify-end gap-2.5 font-bold text-sm text-slate-700 dark:text-slate-200 text-right">
                  সিকিউরিটি <i className="fa-solid fa-shield-halved text-[#0284c7] w-5 text-center"></i>
                </div>
                <div className="flex items-center justify-end gap-2.5 font-bold text-sm text-slate-700 dark:text-slate-200 text-right">
                  লিফট <i className="fa-solid fa-elevator text-[#0284c7] w-5 text-center"></i>
                </div>
                <div className="flex items-center justify-end gap-2.5 font-bold text-sm text-slate-700 dark:text-slate-200 text-right">
                  পার্কিং <i className="fa-solid fa-square-parking text-[#0284c7] w-5 text-center"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Rent and Service Charge Box */}
          <div className="mt-[18px] grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md">
            <div className="bg-gradient-to-br from-[#0284c7] to-[#0369a1] p-4 flex flex-col items-center justify-center text-white">
              <div className="flex items-center gap-2 mb-1 opacity-90">
                <i className="fa-solid fa-house-chimney-window text-white/90 text-sm"></i>
                <span className="text-[13px] font-bold">মাসিক ভাড়া</span>
              </div>
              <div className="flex items-center gap-1 font-black">
                {selectedFlat.details.rent === 'আলোচনা সাপেক্ষে' ? (
                  <span className="text-[15px] leading-tight text-center">আলোচনা সাপেক্ষে</span>
                ) : (
                  <>
                    <span className="text-lg">৳</span>
                    <span className="text-2xl">{selectedFlat.details.rent}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] p-4 flex flex-col items-center justify-center text-white border-l border-white/10">
              <div className="flex items-center gap-2 mb-1 opacity-90">
                <i className="fa-solid fa-hand-holding-dollar text-white/90 text-sm"></i>
                <span className="text-[13px] font-bold">সার্ভিস চার্জ</span>
              </div>
              <div className="flex items-center gap-1 font-black text-2xl">
                <span className="text-lg">৳</span>
                2000
              </div>
            </div>
          </div>

          {/* New Box: See Flat Pictures */}
          {galleryCategoryName && (
            <div 
              onClick={() => {
                if (setView && selectedFlat?.details.unit) {
                  const unitStr = selectedFlat.details.unit.trim().toUpperCase();
                  
                  // Check for A, B, C anywhere in the string or Bangla equivalents
                  if (unitStr.includes('A') || unitStr.includes('এ')) {
                    setView('UNIT_A');
                  } else if (unitStr.includes('B') || unitStr.includes('বি')) {
                    setView('UNIT_B');
                  } else if (unitStr.includes('C') || unitStr.includes('সি')) {
                    setView('UNIT_C');
                  } else {
                    setView('GALLERY_DETAIL', { category: galleryCategoryName });
                  }
                }
              }}
              className="bg-gradient-to-br from-red-600 to-red-800 text-white p-4 rounded-xl mt-[18px] font-extrabold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-shadow active:scale-[0.98] cursor-pointer"
              style={{ fontFamily: '"Noto Sans Bengali", Inter, sans-serif' }}
            >
              <i className="fa-solid fa-camera-retro"></i> ফ্ল্যাটের ছবি দেখুন
            </div>
          )}

          {/* Owner Section */}
          <button 
            onClick={() => setShowOwnerDetails(!showOwnerDetails)}
            className="w-full bg-[#0284c7] text-white p-3.5 rounded-xl font-black flex items-center gap-3 mt-[18px] text-[17px] relative active:scale-[0.99] transition-transform"
          >
            <i className="fa-solid fa-user"></i>
            <i className="fa-solid fa-id-card"></i>
            <i className="fa-solid fa-building"></i>
            মালিকের বিবরণ
            <i className={`fa-solid ${showOwnerDetails ? 'fa-chevron-up' : 'fa-chevron-down'} absolute right-3.5 text-lg`}></i>
          </button>

          <AnimatePresence>
            {showOwnerDetails && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-[#f0f9ff] dark:bg-slate-800 p-3.5 rounded-xl mt-2 font-extrabold text-base leading-7 border border-[#dbeefb] dark:border-slate-700">
                  <div className="flex justify-between py-1.5 items-center">
                    <div className="flex gap-2 text-slate-600 dark:text-slate-400"><i className="fa-solid fa-user-tie mt-1"></i> নাম</div>
                    {isLocked ? (
                      <div className="font-black text-[#dc2626]">{ownerName}</div>
                    ) : (
                      <input 
                        type="text" 
                        value={ownerName} 
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="font-black text-[#dc2626] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-right outline-none focus:border-blue-500"
                      />
                    )}
                  </div>
                  <div className="flex justify-between py-1.5 items-center">
                    <div className="flex gap-2 text-slate-600 dark:text-slate-400"><i className="fa-solid fa-phone mt-1"></i> মোবাইল</div>
                    {isLocked ? (
                      <div className="font-black text-[#dc2626]">{ownerPhone}</div>
                    ) : (
                      <input 
                        type="text" 
                        value={ownerPhone} 
                        onChange={(e) => setOwnerPhone(e.target.value)}
                        className="font-black text-[#dc2626] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-right outline-none focus:border-blue-500"
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Contact Box */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mt-[18px] overflow-hidden font-extrabold">
            <div className="bg-[#e9f7ff] dark:bg-slate-700 p-3.5 text-lg flex justify-center items-center gap-2.5 border-b border-[#d7eefe] dark:border-slate-600">
              <i className="fa-solid fa-headset"></i> যোগাযোগ করুন
            </div>
            <div className="p-3.5">
              <div className="flex justify-between py-1.5 items-center">
                <div className="flex gap-2 text-slate-600 dark:text-slate-400 items-center"><i className="fa-solid fa-user"></i> নাম</div>
                {isLocked ? (
                  <div className="font-black text-[#dc2626]">{contactName}</div>
                ) : (
                  <input 
                    type="text" 
                    value={contactName} 
                    onChange={(e) => setContactName(e.target.value)}
                    className="font-black text-[#dc2626] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-right outline-none focus:border-blue-500"
                  />
                )}
              </div>
              <div className="flex justify-between py-1.5 items-center">
                <div className="flex gap-2 text-slate-600 dark:text-slate-400 items-center"><i className="fa-solid fa-phone"></i> নম্বর</div>
                {isLocked ? (
                  <div className="font-black text-[#dc2626]">{contactPhone}</div>
                ) : (
                  <input 
                    type="text" 
                    value={contactPhone} 
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="font-black text-[#dc2626] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-right outline-none focus:border-blue-500"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <button 
            onClick={() => {
              navigator.clipboard.writeText(contactPhone);
              alert('নম্বর কপি করা হয়েছে!');
            }}
            className="block w-full p-[18px] rounded-xl mt-3 text-[17px] font-black text-white text-center bg-[#0ea5e9] active:scale-95 transition-transform"
          >
            <i className="fa-solid fa-copy mr-2"></i> নম্বর কপি করুন
          </button>

          <a 
            href={`tel:${contactPhone}`}
            className="block w-full p-[18px] rounded-xl mt-3 text-[17px] font-black text-white text-center bg-[#10b981] active:scale-95 transition-transform"
          >
            <i className="fa-solid fa-phone mr-2"></i> কল করুন
          </a>

          <a 
            href={`https://wa.me/${contactPhone.replace(/\D/g, '')}?text=হ্যালো%20আমি%20ফ্ল্যাট%20সম্পর্কে%20জানতে%20চাই`}
            target="_blank"
            className="block w-full p-[18px] rounded-xl mt-3 text-[17px] font-black text-white text-center bg-[#25d366] active:scale-95 transition-transform"
          >
            <i className="fa-brands fa-whatsapp mr-2"></i> WhatsApp বার্তা ও কল
          </a>
        </div>

        {/* PIN Modal for Selected View */}
        <AnimatePresence>
          {showPinModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-[320px] shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowPinModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={20} />
                </button>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-500">
                    <Lock size={32} />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white">পিন কোড দিন</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">এডিট করতে ৪ ডিজিটের পিন দিন</p>
                </div>
                <form onSubmit={handlePinSubmit} className="space-y-4">
                  <input 
                    type="password" 
                    maxLength={4}
                    placeholder="••••"
                    className={`w-full text-center text-3xl tracking-[1em] p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 outline-none transition-all ${pinError ? 'border-red-500 animate-shake' : 'border-slate-100 dark:border-slate-700 focus:border-emerald-500'}`}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      setPinError(false);
                    }}
                    autoFocus
                  />
                  {pinError && <p className="text-red-500 text-xs text-center font-bold">ভুল পিন! আবার চেষ্টা করুন।</p>}
                  <button 
                    type="submit"
                    className="w-full bg-emerald-500 text-white p-4 rounded-2xl font-black shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-600 active:scale-95 transition-all"
                  >
                    আনলক করুন
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6 relative">
      {/* Admin Controls */}
      <div className="absolute top-0 right-0 flex gap-2 z-20">
        <button 
          onClick={() => {
            if (isLocked) {
              setShowPinModal(true);
            } else {
              setIsLocked(true);
              saveSettings();
            }
          }}
          className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-emerald-500 transition-colors shadow-sm"
          title={isLocked ? "Unlock to edit" : "Lock to save"}
        >
          {isLocked ? <Lock size={16} /> : <Unlock size={16} className="text-emerald-500" />}
        </button>
      </div>

      {/* PIN Modal */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-[320px] shadow-2xl relative"
            >
              <button 
                onClick={() => setShowPinModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-500">
                  <Lock size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white">পিন কোড দিন</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">এডিট করতে ৪ ডিজিটের পিন দিন</p>
              </div>
              <form onSubmit={handlePinSubmit} className="space-y-4">
                <input 
                  type="password" 
                  maxLength={4}
                  placeholder="••••"
                  className={`w-full text-center text-3xl tracking-[1em] p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 outline-none transition-all ${pinError ? 'border-red-500 animate-shake' : 'border-slate-100 dark:border-slate-700 focus:border-emerald-500'}`}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setPinError(false);
                  }}
                  autoFocus
                />
                {pinError && <p className="text-red-500 text-xs text-center font-bold">ভুল পিন! আবার চেষ্টা করুন।</p>}
                <button 
                  type="submit"
                  className="w-full bg-emerald-500 text-white p-4 rounded-2xl font-black shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-600 active:scale-95 transition-all"
                >
                  আনলক করুন
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700;900&display=swap');

        .ht-wrapper {
          display: flex;
          flex-direction: column;
          gap: 18px;
          align-items: center;
          justify-content: center;
          padding: 20px 0;
          font-family: 'Inter', sans-serif;
        }

        /* --- Main TO LET box --- */
        .ht-main-box {
          background: #f8f8f8;
          padding: 20px 16px;
          border-radius: 14px;
          border: 2px solid #e0e0e0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
          max-width: 300px;
          width: 90%;
          text-align: center;
        }

        .ht-title {
          font-size: 42px;
          font-weight: 900;
          color: #d40000;
          margin: 0 0 10px;
          text-transform: uppercase;
        }

        .ht-text {
          font-size: 13px;
          font-weight: 900;
          color: #333;
          line-height: 1.5;
          text-align: justify;
          text-align-last: center;
        }

        /* --- Red Text Box --- */
        .ht-red-box {
          background: #f8f8f8;
          padding: 14px 12px;
          border-radius: 14px;
          border: 2px solid #e0e0e0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
          max-width: 300px;
          width: 90%;
          font-size: 14px;
          font-weight: 900;
          color: #d40000;
          text-align: center;
        }

        /* --- Purple Link Box --- */
        .ht-unit-box {
          display: flex;
          flex-direction: column;
          background: #8a3bff;
          font-weight: 900;
          font-size: 18px;
          padding: 10px 14px;
          border-radius: 12px;
          text-align: center;
          max-width: 240px;
          width: 100%;
          box-shadow: 0 6px 18px rgba(0,0,0,0.20);
          text-decoration: none;
          transition: transform .18s ease, box-shadow .18s ease;
          border: none;
          cursor: pointer;
          position: relative;
        }

        .ht-unit-box,
        .ht-unit-box:link,
        .ht-unit-box:visited,
        .ht-unit-box:hover,
        .ht-unit-box:active,
        .ht-unit-box:focus {
          color: #ffffff !important;
        }

        .ht-unit-box:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 26px rgba(0,0,0,0.25);
        }

        .ht-unit-box:active {
          transform: scale(0.97);
        }

        .ht-delete-btn {
          position: absolute;
          top: -10px;
          right: -10px;
          background: #ff4444;
          color: white;
          border-radius: 50%;
          padding: 4px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          z-index: 10;
        }

        .ht-edit-btn {
          position: absolute;
          top: -10px;
          left: -10px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          padding: 4px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          z-index: 10;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }

        @media (max-width:420px){
          .ht-unit-box { font-size: 16px; max-width: 200px; }
        }
      `}} />

      <div className="ht-wrapper">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="ht-main-box"
        >
          <div className="ht-title">TO LET</div>
          <div className="ht-text">
            ভাড়া দেওয়া হবে – সুপরিচ্ছন্ন ও নিরাপদ আবাসিক ভবনে
            আধুনিক সুবিধাসম্পন্ন ফ্ল্যাটসমূহ, যা পরিবারবান্ধব পরিবেশে
            নিশ্চিন্ত ও আরামদায়ক বসবাসের উপযোগী।
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="ht-red-box"
        >
          নিচে দেওয়া খালি ইউনিট লিস্ট থেকে আপনার পছন্দের ফ্ল্যাটটি বেছে নিন।
        </motion.div>

        <div className="w-full flex flex-col items-center gap-4">
          {loading ? (
            <div className="p-8 text-slate-400 font-bold animate-pulse">লোড হচ্ছে...</div>
          ) : error ? (
            <div className="p-8 text-red-500 font-bold text-center bg-red-50 dark:bg-red-900/20 rounded-2xl max-w-[300px]">
              সার্ভার কানেকশন সমস্যা: {error === 'relation "public.flats" does not exist' ? '"flats" টেবিলটি ডাটাবেসে নেই।' : error}
            </div>
          ) : (
            <AnimatePresence>
              {flats.map((flat, index) => (
                <motion.div
                  key={flat.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: 0.1 * index }}
                  className="w-full flex justify-center relative"
                >
                  {!isLocked && (
                    <>
                      <button 
                        onClick={() => startEdit(flat)}
                        className="ht-edit-btn hover:bg-blue-600 transition-colors"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        onClick={() => removeFlat(flat.id)}
                        className="ht-delete-btn hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}

                  <button 
                    className="ht-unit-box" 
                    onClick={() => setSearchParams({ tolet_unit: flat.details.unit })}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {flat.info}
                    </span>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          
          {!loading && flats.length === 0 && (
            <div className="p-8 text-slate-400 font-bold text-center">
              বর্তমানে কোনো ফ্ল্যাট খালি নেই।
            </div>
          )}
        </div>

        {!isLocked && (
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleAddFlat}
            className="w-full max-w-[300px] mt-8 p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700"
          >
            <h3 className="text-center font-black text-slate-800 dark:text-white mb-4 flex items-center justify-center gap-2">
              {editingId ? (
                <><Edit2 size={18} className="text-blue-500" /> তথ্য পরিবর্তন করুন</>
              ) : (
                <><Plus size={18} className="text-emerald-500" /> নতুন ইউনিট যোগ করুন</>
              )}
            </h3>
            <div className="space-y-3">
              <select 
                className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none focus:border-emerald-500 transition-colors"
                value={newFlat.floor}
                onChange={(e) => setNewFlat({...newFlat, floor: e.target.value, unit: ''})}
              >
                <option value="">তলা সিলেক্ট করুন</option>
                {FLOOR_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              
              <select 
                className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none focus:border-emerald-500 transition-colors"
                value={newFlat.unit}
                onChange={(e) => setNewFlat({...newFlat, unit: e.target.value})}
                disabled={!newFlat.floor}
              >
                <option value="">ইউনিট সিলেক্ট করুন</option>
                {getUnitsForFloor(newFlat.floor).map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>

              <input 
                type="text" 
                placeholder="ভাড়া (যেমন: ১৮,০০০)" 
                className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none focus:border-emerald-500 transition-colors"
                value={newFlat.rent}
                onChange={(e) => setNewFlat({...newFlat, rent: e.target.value})}
              />
              <div className="flex gap-2">
                {editingId && (
                  <button 
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 p-3 rounded-xl font-black hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                  >
                    বাতিল
                  </button>
                )}
                <button 
                  type="submit"
                  className={`flex-[2] text-white p-3 rounded-xl font-black shadow-lg transition-all active:scale-95 ${editingId ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-100' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100'} dark:shadow-none`}
                >
                  {editingId ? 'আপডেট করুন' : 'অ্যাড করুন'}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
};





