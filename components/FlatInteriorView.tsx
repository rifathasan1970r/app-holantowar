import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Unlock, Plus, Edit, Trash2, X, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import UnitDetailView from './UnitDetailView';

interface GalleryCategory {
  id: string;
  bn: string;
  en: string;
  icon: string;
  is_locked: boolean;
  images: string[];
  slider_images: string[];
}

interface FlatInteriorViewProps {
  isAdmin?: boolean;
  unit?: string | null;
}

const FlatInteriorView: React.FC<FlatInteriorViewProps> = ({ isAdmin: parentIsAdmin, unit }) => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<GalleryCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [localIsAdmin, setLocalIsAdmin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [editingUrlIndex, setEditingUrlIndex] = useState<number | null>(null);
  const [editingUrlValue, setEditingUrlValue] = useState('');

  const isAdmin = parentIsAdmin !== undefined ? parentIsAdmin : localIsAdmin;

  const categoryEnName = 'Flat Interior View';

  const fetchCategory = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('gallery_categories')
      .select('*')
      .eq('en', categoryEnName)
      .single();

    if (data) {
      setCategory(data);
    } else if (error) {
      console.error('Error fetching flat interior data:', error);
      // Fallback or initial state if not found
      setCategory({
        id: 'flat-interior',
        bn: 'ফ্ল্যাট অভ্যন্তরীণ দৃশ্য',
        en: categoryEnName,
        icon: 'fa-couch',
        is_locked: false,
        images: [
          "https://i.imghippo.com/files/IxR3498AKE.png",
          "https://i.imghippo.com/files/VN1922RL.jpg",
          "https://i.imghippo.com/files/aPPh2154sY.jpg"
        ],
        slider_images: []
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategory();
    
    const channel = supabase
      .channel('flat_interior_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'gallery_categories',
        filter: `en=eq.${categoryEnName}`
      }, () => {
        fetchCategory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCategory]);

  const handleVerifyPin = () => {
    if (pin === '1966') {
      setLocalIsAdmin(true);
      setShowPinModal(false);
      setPin('');
    } else {
      alert('ভুল পিন! আবার চেষ্টা করুন।');
      setPin('');
    }
  };

  const handleUpdateImages = async (url: string) => {
    if (!category || !url) return;
    
    const updatedImages = [...(category.images || []), url];
    const isNew = !category.id || category.id === 'flat-interior';
    
    let result;
    if (isNew) {
      result = await supabase
        .from('gallery_categories')
        .insert([{ 
          bn: 'ফ্ল্যাট অভ্যন্তরীণ দৃশ্য',
          en: categoryEnName,
          icon: 'fa-couch',
          is_locked: false,
          images: updatedImages,
          slider_images: []
        }])
        .select()
        .single();
    } else {
      result = await supabase
        .from('gallery_categories')
        .update({ images: updatedImages })
        .eq('id', category.id)
        .select()
        .single();
    }
    
    if (result.error) alert('Error updating images: ' + result.error.message);
    else fetchCategory();
  };

  const handleEditImage = async (index: number, newUrl: string) => {
    if (!category || !newUrl) return;
    
    const updatedImages = [...(category.images || [])];
    updatedImages[index] = newUrl;
    
    const { error } = await supabase
      .from('gallery_categories')
      .update({ images: updatedImages })
      .eq('id', category.id)
      .select()
      .single();
    
    if (error) alert('Error editing image: ' + error.message);
    else {
      setEditingUrlIndex(null);
      fetchCategory();
    }
  };

  const handleRemoveImage = async (index: number) => {
    if (!category) return;
    
    const updatedImages = [...(category.images || [])];
    updatedImages.splice(index, 1);
    
    const { error } = await supabase
      .from('gallery_categories')
      .update({ images: updatedImages })
      .eq('id', category.id)
      .select()
      .single();
    
    if (error) alert('Error removing image: ' + error.message);
    else fetchCategory();
  };

  const units = [
    { id: 'unit-a', title: 'UNIT A', subtitle: '(ইউনিট A — বিস্তারিত)' },
    { id: 'unit-b', title: 'UNIT B', subtitle: '(ইউনিট B — বিস্তারিত)' },
    { id: 'unit-c', title: 'UNIT C', subtitle: '(ইউনিট C — বিস্তারিত)' },
  ];

  const sliderImages = category?.images && category.images.length > 0 ? category.images : [
    "https://i.imghippo.com/files/IxR3498AKE.png",
    "https://i.imghippo.com/files/VN1922RL.jpg",
    "https://i.imghippo.com/files/aPPh2154sY.jpg"
  ];
  const loopSlides = [...sliderImages, sliderImages[0]];

  if (unit) {
    return <UnitDetailView unitId={unit} onBack={() => navigate(-1)} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Admin Toggle (only if not controlled by parent) */}
      {parentIsAdmin === undefined && (
        <div className="max-w-[960px] mx-auto flex justify-end px-4">
          <button 
            onClick={() => localIsAdmin ? setLocalIsAdmin(false) : setShowPinModal(true)}
            className={`p-2 rounded-xl transition-all ${localIsAdmin ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'}`}
          >
            {localIsAdmin ? <Unlock size={20} /> : <Lock size={20} />}
          </button>
        </div>
      )}

      {/* Slider */}
      <div className="max-w-[960px] mx-auto mt-[10px] relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#f0f4ff] to-[#d9e3ff] shadow-[0_8px_25px_rgba(0,0,0,0.1)]">
        <div 
          className="flex" 
          style={{ 
            animation: `slide ${loopSlides.length * 5}s ease-in-out infinite`,
            width: `${loopSlides.length * 100}%`
          }}
        >
          {loopSlides.map((src, idx) => (
            <div key={idx} className="w-full flex-shrink-0 p-[10px] text-center" style={{ width: `${100 / loopSlides.length}%` }}>
              <img 
                src={src} 
                alt={`Slide ${idx + 1}`} 
                className="max-w-full h-auto rounded-[12px] cursor-pointer transition-transform hover:scale-[1.02]" 
                onClick={() => setFullscreenImage(src)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Admin Panel */}
      {isAdmin && (
        <div className="max-w-[960px] mx-auto m-4 p-5 bg-white dark:bg-slate-800 rounded-3xl shadow-md border border-blue-100 dark:border-slate-700 space-y-4">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Plus size={20} className="text-blue-600" /> স্লাইডার ইমেজ যোগ করুন
          </h3>
          <div className="flex gap-2">
            <input 
              id="new-flat-img-url" 
              placeholder="ইমেজ URL দিন" 
              className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
            />
            <button 
              onClick={() => {
                const input = document.getElementById('new-flat-img-url') as HTMLInputElement;
                if (input.value) {
                  handleUpdateImages(input.value);
                  input.value = '';
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm"
            >
              যোগ করুন
            </button>
          </div>

          <div className="mt-6 space-y-3">
            <h4 className="font-bold text-gray-700 dark:text-slate-300 text-sm border-b dark:border-slate-700 pb-2">বর্তমান স্লাইডার ছবিগুলো</h4>
            {category?.images?.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900 p-2 rounded-xl border border-gray-100 dark:border-slate-700">
                {editingUrlIndex === idx ? (
                  <>
                    <input 
                      value={editingUrlValue}
                      onChange={(e) => setEditingUrlValue(e.target.value)}
                      className="flex-1 p-2 text-xs border rounded-lg outline-none focus:border-blue-500 dark:bg-slate-800 dark:text-white"
                    />
                    <button 
                      onClick={() => handleEditImage(idx, editingUrlValue)}
                      className="p-2 bg-green-600 text-white rounded-lg"
                    >
                      সেভ
                    </button>
                    <button 
                      onClick={() => setEditingUrlIndex(null)}
                      className="p-2 bg-gray-400 text-white rounded-lg"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 text-[10px] text-gray-500 truncate">{url}</div>
                    <button 
                      onClick={() => {
                        setEditingUrlIndex(idx);
                        setEditingUrlValue(url);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                    >
                      এডিট
                    </button>
                    <button 
                      onClick={() => handleRemoveImage(idx)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Units Section */}
      <div className="max-w-[960px] mx-auto my-[40px] text-center p-[40px_20px] bg-gradient-to-br from-[#f0f4ff] to-[#d9e3ff] rounded-[25px] shadow-[0_12px_30px_rgba(0,0,0,0.1)]">
        <h2 className="text-[22px] mb-[30px] text-[#1a2e45] font-bold leading-[1.2]">
          হলান টাওয়ার ফ্লাট সমূহ
          <br /><span className="text-[14px] opacity-[0.8]">(Holan Tower Flats)</span>
        </h2>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-[18px]">
          {units.map((unit) => (
            <button
              key={unit.id}
              onClick={() => navigate(`/${unit.id}`)}
              className="bg-gradient-to-br from-[#4a69bd] to-[#6a82fb] rounded-[15px] p-[12px_20px] min-h-[70px] text-white shadow-[0_5px_20px_rgba(74,105,189,0.4)] transition-all duration-300 flex items-center gap-[18px] hover:from-[#6a82fb] hover:to-[#4a69bd] hover:-translate-y-[5px] hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(74,105,189,0.6)] cursor-pointer text-left w-full"
            >
              <i className="fas fa-door-open text-[28px] min-w-[40px] text-center text-white"></i>
              <div className="flex-1 flex flex-col justify-center text-center">
                <div className="text-[18px] font-bold leading-[1.1] text-white">{unit.title}</div>
                <div className="text-[14px] opacity-[0.85] mt-[3px] text-white">{unit.subtitle}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* PIN Modal (only if not controlled by parent) */}
      {showPinModal && parentIsAdmin === undefined && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPinModal(false)}></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl w-full max-w-xs text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">পিন কোড দিন</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 font-medium">স্লাইডার এডিট করতে ৪ ডিজিটের পিন দিন</p>
            <input 
              type="password" 
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full text-center text-2xl tracking-[1em] p-4 rounded-2xl border-2 border-gray-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:border-blue-500 outline-none mb-6"
              autoFocus
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowPinModal(false)}
                className="flex-1 py-4 text-sm font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 rounded-2xl"
              >
                বাতিল
              </button>
              <button 
                onClick={handleVerifyPin}
                className="flex-1 py-4 text-sm font-bold text-white bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none"
              >
                আনলক
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-4">
          <button 
            onClick={() => setFullscreenImage(null)}
            className="absolute top-6 right-6 text-white p-2 bg-white/10 rounded-full backdrop-blur-md"
          >
            <X size={24} />
          </button>
          <img src={fullscreenImage} alt="Fullscreen" className="max-w-full max-h-full object-contain" />
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide {
          ${loopSlides.map((_, i) => {
            const step = 100 / (loopSlides.length - 1);
            const start = i * step;
            const pause = start + (step * 0.8);
            return `
              ${start}% { transform: translateX(-${i * 100 / loopSlides.length}%); }
              ${pause}% { transform: translateX(-${i * 100 / loopSlides.length}%); }
            `;
          }).join('')}
          100% { transform: translateX(-${(loopSlides.length - 1) * 100 / loopSlides.length}%); }
        }
      `}} />
    </div>
  );
};

export default FlatInteriorView;
