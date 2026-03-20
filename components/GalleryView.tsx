import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Unlock, Plus, Trash2, Settings, X, ChevronLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ViewState } from '../types';
import { supabase } from '../lib/supabaseClient';

interface GalleryCategory {
  id: string;
  bn: string;
  en: string;
  icon: string;
  is_locked: boolean;
  images: string[];
  slider_images: string[];
  videos?: string[];
  created_at?: string;
}

interface GalleryViewProps {
  onBack: () => void;
  setView: (view: ViewState, params?: Record<string, string>) => void;
}

const GalleryView: React.FC<GalleryViewProps> = ({ onBack, setView }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<GalleryCategory | null>(null);
  const [newCategory, setNewCategory] = useState({ bn: '', en: '', icon: 'fa-images' });
  const [pin, setPin] = useState('1966');
  const [mainSliderImages, setMainSliderImages] = useState<string[]>([]);
  const [editingSliderIndex, setEditingSliderIndex] = useState<number | null>(null);
  const [editingSliderValue, setEditingSliderValue] = useState('');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const initialCategories = [
    { bn: "বিল্ডিং বহির্ভাগ", en: "Building Exterior", icon: "fa-building" },
    { bn: "গাড়ি পার্কিং", en: "Parking Area", icon: "fa-car" },
    { bn: "কন্ট্রোল রুম ও মনিটরিং", en: "Control Room & Monitoring", icon: "fa-tv" },
    { bn: "সিঁড়ির দৃশ্য", en: "Staircase View", icon: "fa-stairs" },
    { bn: "ফ্ল্যাট অভ্যন্তরীণ দৃশ্য", en: "Flat Interior View", icon: "fa-couch" },
    { bn: "ছাদের দৃশ্য", en: "Rooftop View", icon: "fa-warehouse" },
    { bn: "কমিউনিটি হল রুম", en: "Community Hall Room", icon: "fa-users" },
    { bn: "ইভেন্ট ও গেট টুগেদার", en: "Events & Gatherings", icon: "fa-calendar-check" }
  ];

  const categoryOrder = [
    "বিল্ডিং বহির্ভাগ",
    "গাড়ি পার্কিং",
    "কন্ট্রোল রুম ও মনিটরিং",
    "সিঁড়ির দৃশ্য",
    "ফ্ল্যাট অভ্যন্তরীণ দৃশ্য",
    "ছাদের দৃশ্য",
    "কমিউনিটি হল রুম",
    "ইভেন্ট ও গেট টুগেদার"
  ];

  useEffect(() => {
    const isAdminParam = new URLSearchParams(location.search).get('admin');
    if (isAdminParam === 'true') {
      setIsAdmin(true);
    }
  }, [location.search]);

  useEffect(() => {
    fetchCategories();
    fetchSettings();

    // Set up real-time subscription
    const channel = supabase
      .channel('gallery_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_categories' }, () => {
        fetchCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('gallery_categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }

    if (data) {
      // Filter out sub-events (categories that start with SUB_EVENT:)
      const mainCategories = data.filter(cat => !cat.en.startsWith('SUB_EVENT:'));
      
      // Check for duplicates and remove them if found (keep the first one)
      const uniqueCategories: GalleryCategory[] = [];
      const seenNames = new Set();
      const duplicateIds: string[] = [];

      mainCategories.forEach(cat => {
        if (seenNames.has(cat.bn)) {
          duplicateIds.push(cat.id);
        } else {
          seenNames.add(cat.bn);
          uniqueCategories.push(cat);
        }
      });

      if (duplicateIds.length > 0) {
        console.log('Removing duplicates:', duplicateIds);
        await supabase.from('gallery_categories').delete().in('id', duplicateIds);
        // The real-time subscription will trigger another fetch
        return;
      }

      // Sort categories by the requested order
      const sorted = [...uniqueCategories].sort((a, b) => {
        const indexA = categoryOrder.indexOf(a.bn);
        const indexB = categoryOrder.indexOf(b.bn);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });

      setCategories(sorted);
      
      // If database is empty, seed initial categories
      if (uniqueCategories.length === 0) {
        const seedData = initialCategories.map(cat => ({
          ...cat,
          is_locked: false,
          images: [],
          slider_images: []
        }));
        await supabase.from('gallery_categories').insert(seedData);
      }
    }
  };

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('gallery_settings')
      .select('pin, main_slider_images')
      .eq('id', 'config')
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        await supabase.from('gallery_settings').insert([{ 
          id: 'config', 
          pin: '1966',
          main_slider_images: [
            "https://i.imghippo.com/files/IxR3498AKE.png",
            "https://i.imghippo.com/files/VN1922RL.jpg",
            "https://i.imghippo.com/files/aPPh2154sY.jpg",
            "https://i.imghippo.com/files/hIAW5391FUU.jpg",
            "https://i.imghippo.com/files/zuMa8505Yo.jpg"
          ]
        }]);
      }
      console.error('Error fetching settings:', error);
      return;
    }

    if (data) {
      if (data.pin === '1234') {
        await supabase.from('gallery_settings').update({ pin: '1966' }).eq('id', 'config');
        setPin('1966');
      } else {
        setPin(data.pin);
      }
      setMainSliderImages(data.main_slider_images || []);
    }
  };

  const handlePinSubmit = () => {
    if (pinInput === pin) {
      setIsAdmin(true);
      setShowPinModal(false);
      setPinInput('');
      
      // Update URL to include admin=true
      const params = new URLSearchParams(location.search);
      params.set('admin', 'true');
      navigate({ search: params.toString() }, { replace: true });
    } else {
      alert('ভুল পিন! আবার চেষ্টা করুন।');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.bn || !newCategory.en) return;
    
    // Check for duplicates locally first
    if (categories.some(cat => cat.bn === newCategory.bn)) {
      alert('এই নামের ক্যাটাগরি ইতিমধ্যে আছে।');
      return;
    }

    const { error } = await supabase
      .from('gallery_categories')
      .insert([{
        ...newCategory,
        is_locked: false,
        images: [],
        slider_images: []
      }]);
    
    if (error) alert('Error adding category: ' + error.message);
    else {
      setNewCategory({ bn: '', en: '', icon: 'fa-images' });
      // fetchCategories() will be called by real-time subscription
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const category = categories.find(cat => cat.id === id);
    if (category?.is_locked) {
      alert('এই ক্যাটাগরি লক করা আছে। ডিলিট করতে হলে প্রথমে আনলক করুন।');
      return;
    }
    
    setShowDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;
    
    const { error } = await supabase
      .from('gallery_categories')
      .delete()
      .eq('id', showDeleteConfirm);
    
    if (error) {
      console.error('Delete error:', error);
      alert('Error deleting category: ' + error.message);
    } else {
      setCategories(prev => prev.filter(cat => cat.id !== showDeleteConfirm));
      setShowDeleteConfirm(null);
    }
  };

  const handleToggleLock = async (category: GalleryCategory) => {
    const newLockStatus = !category.is_locked;
    
    // Update local state immediately for responsiveness
    setCategories(prev => prev.map(cat => 
      cat.id === category.id ? { ...cat, is_locked: newLockStatus } : cat
    ));

    const { error } = await supabase
      .from('gallery_categories')
      .update({ is_locked: newLockStatus })
      .eq('id', category.id);
    
    if (error) {
      alert('Error toggling lock: ' + error.message);
      // Revert local state on error
      setCategories(prev => prev.map(cat => 
        cat.id === category.id ? { ...cat, is_locked: !newLockStatus } : cat
      ));
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    const { error } = await supabase
      .from('gallery_categories')
      .update({
        bn: editingCategory.bn,
        en: editingCategory.en,
        icon: editingCategory.icon
      })
      .eq('id', editingCategory.id);
    
    if (error) alert('Error updating category: ' + error.message);
    else {
      setEditingCategory(null);
      fetchCategories();
    }
  };

  const handleUpdateSliderImages = async (newImages: string[]) => {
    const { error } = await supabase
      .from('gallery_settings')
      .update({ main_slider_images: newImages })
      .eq('id', 'config');
    
    if (error) alert('Error updating slider: ' + error.message);
    else {
      setMainSliderImages(newImages);
    }
  };

  const handleUpdatePin = async (newPin: string) => {
    if (newPin.length !== 4) return;
    const { error } = await supabase
      .from('gallery_settings')
      .update({ pin: newPin })
      .eq('id', 'config');
    
    if (error) alert('Error updating PIN: ' + error.message);
    else {
      setPin(newPin);
      alert('পিন পরিবর্তন সফল!');
    }
  };

  // Default slides if no categories have slider images
  const defaultSlides = [
    "https://i.imghippo.com/files/IxR3498AKE.png",
    "https://i.imghippo.com/files/VN1922RL.jpg",
    "https://i.imghippo.com/files/aPPh2154sY.jpg"
  ];

  // Use mainSliderImages for display
  const displaySlides = mainSliderImages.length > 0 ? mainSliderImages : defaultSlides;
  // Add first slide at the end for smooth looping
  const loopSlides = [...displaySlides, displaySlides[0]];

  return (
    <div className="min-h-screen bg-[#f5f7ff] pb-24">
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">গ্যালারি</h1>
        </div>
        <button 
          onClick={() => isAdmin ? setShowAdminModal(true) : setShowPinModal(true)}
          className={`p-2 rounded-full transition-all ${isAdmin ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
        >
          {isAdmin ? <Settings size={24} /> : <Lock size={24} className="opacity-50" />}
        </button>
      </div>

      {/* Slider Section */}
      <div className="max-w-[900px] mx-auto mt-[30px] relative overflow-hidden rounded-[10px] shadow-[0_0_15px_rgba(0,0,0,0.3)] bg-white">
        <div 
          className="flex w-full" 
          style={{ 
            animation: `slide ${loopSlides.length * 3}s infinite`,
            display: 'flex',
            width: `${loopSlides.length * 100}%`
          }}
        >
          {loopSlides.map((src, index) => (
            <img 
              key={index} 
              src={src} 
              style={{ width: `${100 / loopSlides.length}%` }}
              className="height-auto flex-shrink-0 object-contain" 
              alt={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Glance Section */}
      <div className="max-w-[960px] mx-auto my-10 text-center px-4 py-10 bg-white rounded-[25px] shadow-xl border border-gray-100">
        <div className="flex items-center justify-between mb-[30px] px-4">
          <div className="flex-1"></div>
          <h2 className="text-[22px] text-[#1a2e45] font-bold leading-[1.2]">
            হলান টাওয়ার এক নজরে <span className="text-[16px] font-medium opacity-80 whitespace-nowrap ml-1">(Holan Tower at a Glance)</span>
          </h2>
          <div className="flex-1 flex justify-end">
            {isAdmin && (
              <button 
                onClick={() => setShowAdminModal(true)}
                className="bg-blue-600 text-white p-3 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95"
              >
                <Plus size={20} /> নতুন ক্যাটাগরি
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-[18px]">
          {categories.map((cat) => (
            <div key={cat.id} className="relative group">
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => {
                    const params: Record<string, string> = { category: cat.en };
                    if (isAdmin) params.admin = 'true';
                    setView('GALLERY_DETAIL', params);
                  }}
                  className="w-full bg-gradient-to-br from-[#4a69bd] to-[#6a82fb] rounded-[15px] p-[12px_20px] min-h-[70px] text-white shadow-[0_5px_20px_rgba(74,105,189,0.4)] transition-all duration-300 flex items-center gap-[18px] hover:from-[#6a82fb] hover:to-[#4a69bd] hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(74,105,189,0.6)]"
                >
                  <i className={`fas ${cat.icon} text-[28px] min-w-[40px] text-center`}></i>
                  <div className="flex-1 flex flex-col justify-center text-center">
                    <div className="text-[18px] font-bold leading-[1.1]">{cat.bn}</div>
                    <div className="text-[14px] opacity-[0.85] mt-[3px]">({cat.en})</div>
                  </div>
                  {isAdmin && (
                    <div className="opacity-40 flex-shrink-0">
                      {cat.is_locked ? <Lock size={18} /> : <Unlock size={18} />}
                    </div>
                  )}
                </button>

                {isAdmin && (
                  <div className="flex justify-center gap-2 mt-1">
                    <button 
                      onClick={() => handleToggleLock(cat)}
                      className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-xl text-sm font-bold transition-all ${cat.is_locked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
                    >
                      {cat.is_locked ? <><Lock size={16} /> আনলক করুন</> : <><Unlock size={16} /> লক করুন</>}
                    </button>
                    <button 
                      onClick={() => {
                        const params: Record<string, string> = { category: cat.en };
                        if (isAdmin) params.admin = 'true';
                        setView('GALLERY_DETAIL', params);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 p-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100"
                    >
                      <Plus size={16} /> ছবি যোগ করুন
                    </button>
                    <button 
                      onClick={() => setEditingCategory(cat)}
                      className="flex-1 flex items-center justify-center gap-2 p-2 bg-yellow-50 text-yellow-600 rounded-xl text-sm font-bold hover:bg-yellow-100"
                    >
                      <Settings size={16} /> নাম এডিট
                    </button>
                    {!cat.is_locked && (
                      <button 
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <Lock size={32} className="opacity-50" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">অ্যাডমিন পিন</h2>
              <input 
                type="password" 
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center text-3xl tracking-[1em] p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:outline-none"
                placeholder="••••"
              />
              <div className="flex gap-3 w-full mt-4">
                <button onClick={() => setShowPinModal(false)} className="flex-1 p-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100">বাতিল</button>
                <button onClick={handlePinSubmit} className="flex-1 p-4 bg-blue-600 rounded-2xl font-bold text-white hover:bg-blue-700 shadow-lg">প্রবেশ</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">ম্যানেজমেন্ট</h2>
              <button onClick={() => setShowAdminModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
            </div>
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-blue-800 flex items-center gap-2"><Plus size={20} /> নতুন ক্যাটাগরি</h3>
                <input placeholder="বাংলা নাম" value={newCategory.bn} onChange={e => setNewCategory({...newCategory, bn: e.target.value})} className="w-full p-3 rounded-xl border border-blue-100" />
                <input placeholder="English Name" value={newCategory.en} onChange={e => setNewCategory({...newCategory, en: e.target.value})} className="w-full p-3 rounded-xl border border-blue-100" />
                <input placeholder="Icon (e.g. fa-images)" value={newCategory.icon} onChange={e => setNewCategory({...newCategory, icon: e.target.value})} className="w-full p-3 rounded-xl border border-blue-100" />
                <button onClick={handleAddCategory} className="w-full p-3 bg-blue-600 text-white rounded-xl font-bold">যোগ করুন</button>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Lock size={20} className="opacity-50" /> স্লাইডার ইমেজ ম্যানেজমেন্ট</h3>
                <div className="space-y-3">
                  {mainSliderImages.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-100">
                      {editingSliderIndex === idx ? (
                        <>
                          <input 
                            value={editingSliderValue}
                            onChange={(e) => setEditingSliderValue(e.target.value)}
                            className="flex-1 p-2 text-xs border rounded-lg outline-none focus:border-blue-500"
                          />
                          <button 
                            onClick={() => {
                              const updated = [...mainSliderImages];
                              updated[idx] = editingSliderValue;
                              handleUpdateSliderImages(updated);
                              setEditingSliderIndex(null);
                            }}
                            className="p-2 bg-green-600 text-white rounded-lg text-xs"
                          >
                            সেভ
                          </button>
                          <button onClick={() => setEditingSliderIndex(null)} className="p-2 bg-gray-400 text-white rounded-lg"><X size={14} /></button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 text-[10px] text-gray-500 truncate">{url}</div>
                          <button 
                            onClick={() => {
                              setEditingSliderIndex(idx);
                              setEditingSliderValue(url);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg text-xs"
                          >
                            এডিট
                          </button>
                          <button 
                            onClick={() => {
                              const updated = mainSliderImages.filter((_, i) => i !== idx);
                              handleUpdateSliderImages(updated);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <input 
                      id="new-slider-url"
                      placeholder="নতুন স্লাইডার ইমেজ URL"
                      className="flex-1 p-2 text-xs border rounded-lg outline-none"
                    />
                    <button 
                      onClick={() => {
                        const input = document.getElementById('new-slider-url') as HTMLInputElement;
                        if (input.value) {
                          handleUpdateSliderImages([...mainSliderImages, input.value]);
                          input.value = '';
                        }
                      }}
                      className="p-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
                    >
                      যোগ করুন
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Settings size={20} /> পিন পরিবর্তন</h3>
                <input 
                  type="password"
                  placeholder="নতুন পিন" 
                  onChange={(e) => handleUpdatePin(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button onClick={() => setIsAdmin(false)} className="w-full p-4 bg-red-50 text-red-600 rounded-2xl font-bold">অ্যাডমিন মোড বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">ক্যাটাগরি এডিট</h2>
              <button onClick={() => setEditingCategory(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">বাংলা নাম</label>
                <input 
                  value={editingCategory.bn} 
                  onChange={e => setEditingCategory({...editingCategory, bn: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">English Name</label>
                <input 
                  value={editingCategory.en} 
                  onChange={e => setEditingCategory({...editingCategory, en: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Icon (FontAwesome class)</label>
                <input 
                  value={editingCategory.icon} 
                  onChange={e => setEditingCategory({...editingCategory, icon: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none" 
                />
              </div>
              <button 
                onClick={handleUpdateCategory} 
                className="w-full p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all mt-4"
              >
                আপডেট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Overlay */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center">
          <button 
            onClick={() => setFullscreenImage(null)}
            className="text-white bg-[#d1b3ff] p-[12px_20px] rounded-xl text-lg font-semibold cursor-pointer mb-[15px] shadow-[0_0_12px_rgba(209,179,255,0.8)] transition-all duration-300 flex items-center gap-2 hover:bg-[#b78cff] hover:shadow-[0_0_18px_rgba(183,140,255,1)] hover:scale-105"
          >
            <ChevronLeft size={20} /> ফিরে যান
          </button>
          <img src={fullscreenImage} className="max-w-[95vw] max-h-[85vh] rounded-xl shadow-[0_0_20px_#fff] object-contain" alt="Fullscreen" />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">আপনি কি নিশ্চিত?</h2>
            <p className="text-gray-500 mb-6">এই ক্যাটাগরি মুছে ফেললে এর সব ছবিও ডিলিট হয়ে যাবে।</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 p-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200"
              >
                বাতিল
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 p-3 bg-red-600 text-white rounded-xl font-bold shadow-lg hover:bg-red-700"
              >
                ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide {
          ${loopSlides.length > 1 ? loopSlides.map((_, i) => {
            const step = 100 / (loopSlides.length - 1);
            const start = i * step;
            const pause = start + (step * 0.8); // 80% pause, 20% slide
            return `
              ${start}% { transform: translateX(-${i * 100 / loopSlides.length}%); }
              ${pause}% { transform: translateX(-${i * 100 / loopSlides.length}%); }
            `;
          }).join('') : '0% { transform: translateX(0%); } 100% { transform: translateX(0%); }'}
          100% { transform: translateX(-${loopSlides.length > 1 ? (loopSlides.length - 1) * 100 / loopSlides.length : 0}%); }
        }
      `}} />
    </div>
  );
};

export default GalleryView;
