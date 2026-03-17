import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, X, Image as ImageIcon, Lock, Unlock, Key, Settings } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface GalleryCategory {
  id: string;
  bn: string;
  en: string;
  icon: string;
  is_locked: boolean;
  images: string[];
  slider_images: string[];
}

interface GalleryDetailViewProps {
  onBack: () => void;
}

const GalleryDetailView: React.FC<GalleryDetailViewProps> = ({ onBack }) => {
  const location = useLocation();
  const [category, setCategory] = useState<GalleryCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [editingUrlIndex, setEditingUrlIndex] = useState<number | null>(null);
  const [editingUrlValue, setEditingUrlValue] = useState('');
  const [mainSliderImages, setMainSliderImages] = useState<string[]>([]);

  const categoryId = new URLSearchParams(location.search).get('id');
  const isAdminParam = new URLSearchParams(location.search).get('admin');

  useEffect(() => {
    if (isAdminParam === 'true') {
      setIsAdmin(true);
    }
  }, [isAdminParam]);

  useEffect(() => {
    fetchMainSlider();
    if (categoryId) {
      fetchCategory();
      
      const channel = supabase
        .channel(`category_${categoryId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'gallery_categories',
          filter: `id=eq.${categoryId}`
        }, () => {
          fetchCategory();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [categoryId]);

  const fetchMainSlider = async () => {
    const { data } = await supabase
      .from('gallery_settings')
      .select('main_slider_images')
      .eq('id', 'config')
      .single();
    if (data) {
      setMainSliderImages(data.main_slider_images || []);
    }
  };

  const fetchCategory = async () => {
    if (!categoryId) return;
    const { data, error } = await supabase
      .from('gallery_categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (error) {
      console.error('Error fetching category:', error);
    } else {
      setCategory(data);
    }
    setLoading(false);
  };

  const handleUpdateImages = async (url: string) => {
    if (!category || !categoryId || !url) return;
    
    const updatedImages = [...(category.images || []), url];
    const updatedSliderImages = [...(category.slider_images || []), url];
    
    const { error } = await supabase
      .from('gallery_categories')
      .update({ 
        images: updatedImages,
        slider_images: updatedSliderImages
      })
      .eq('id', categoryId);
    
    if (error) alert('Error updating images: ' + error.message);
    else fetchCategory();
  };

  const handleEditImage = async (index: number, newUrl: string) => {
    if (!category || !categoryId || !newUrl) return;
    
    const oldUrl = category.images[index];
    const updatedImages = [...(category.images || [])];
    updatedImages[index] = newUrl;
    
    const updatedSliderImages = [...(category.slider_images || [])];
    const sliderIndex = updatedSliderImages.indexOf(oldUrl);
    if (sliderIndex > -1) {
      updatedSliderImages[sliderIndex] = newUrl;
    }

    const { error } = await supabase
      .from('gallery_categories')
      .update({ 
        images: updatedImages,
        slider_images: updatedSliderImages
      })
      .eq('id', categoryId);
    
    if (error) alert('Error editing image: ' + error.message);
    else {
      setEditingUrlIndex(null);
      fetchCategory();
    }
  };

  const handleRemoveImage = async (index: number) => {
    if (!category || !categoryId) return;
    
    const updatedImages = [...(category.images || [])];
    const urlToRemove = updatedImages[index];
    updatedImages.splice(index, 1);
    
    const updatedSliderImages = [...(category.slider_images || [])];
    const sliderIndex = updatedSliderImages.indexOf(urlToRemove);
    if (sliderIndex > -1) {
      updatedSliderImages.splice(sliderIndex, 1);
    }

    const { error } = await supabase
      .from('gallery_categories')
      .update({ 
        images: updatedImages,
        slider_images: updatedSliderImages
      })
      .eq('id', categoryId);
    
    if (error) alert('Error removing image: ' + error.message);
    else fetchCategory();
  };

  const handleVerifyPin = async () => {
    const { data, error } = await supabase
      .from('gallery_settings')
      .select('pin')
      .eq('id', 'config')
      .single();

    if (!error && data && pin === data.pin) {
      setIsAdmin(true);
      setShowPinModal(false);
      setPin('');
    } else {
      alert('ভুল পিন! আবার চেষ্টা করুন।');
      setPin('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-4">ক্যাটাগরি খুঁজে পাওয়া যায়নি</h2>
        <button onClick={onBack} className="bg-blue-600 text-white px-6 py-2 rounded-xl">ফিরে যান</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-800 leading-tight">গ্যালারি ভিউ</h1>
        </div>
        <button 
          onClick={() => isAdmin ? setIsAdmin(false) : setShowPinModal(true)}
          className={`p-2 rounded-xl transition-all ${isAdmin ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
        >
          {isAdmin ? <Unlock size={20} /> : <Lock size={20} />}
        </button>
      </div>

      {/* Slider Section */}
      {mainSliderImages.length > 0 && (
        <div className="max-w-[900px] mx-auto mt-[30px] relative overflow-hidden rounded-[10px] shadow-[0_0_15px_rgba(0,0,0,0.3)] bg-white">
          <div 
            className="flex w-full" 
            style={{ 
              animation: `slide ${mainSliderImages.length * 4}s infinite`,
              display: 'flex',
              width: `${mainSliderImages.length * 100}%`
            }}
          >
            {mainSliderImages.map((src, idx) => (
              <img 
                key={idx} 
                src={src} 
                style={{ width: `${100 / mainSliderImages.length}%` }}
                className="height-auto flex-shrink-0 object-contain" 
                alt="" 
              />
            ))}
          </div>
        </div>
      )}

      {/* Header Title */}
      <div className="bg-[#3b5998] text-white text-center p-[20px_10px] text-[24px] font-bold mt-[20px] max-w-[900px] mx-auto rounded-lg shadow-md">
        {category.bn} ({category.en})
      </div>

      {/* Admin Panel */}
      {isAdmin && (
        <div className="max-w-[900px] mx-auto m-4 p-5 bg-white rounded-3xl shadow-md border border-blue-100 space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Plus size={20} className="text-blue-600" /> নতুন ছবি যোগ করুন
          </h3>
          <div className="flex gap-2">
            <input 
              id="new-img-url" 
              placeholder="ইমেজ URL দিন" 
              className="flex-1 p-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
            />
            <button 
              onClick={() => {
                const input = document.getElementById('new-img-url') as HTMLInputElement;
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
            <h4 className="font-bold text-gray-700 text-sm border-b pb-2">বর্তমান ছবিগুলোর URL (এডিট/ডিলিট)</h4>
            {category.images?.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                {editingUrlIndex === idx ? (
                  <>
                    <input 
                      value={editingUrlValue}
                      onChange={(e) => setEditingUrlValue(e.target.value)}
                      className="flex-1 p-2 text-xs border rounded-lg outline-none focus:border-blue-500"
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
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      এডিট
                    </button>
                    <button 
                      onClick={() => handleRemoveImage(idx)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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

      {/* Gallery List */}
      <div className="max-w-[900px] mx-auto my-[20px] p-[10px] flex flex-col gap-[20px]">
        {(!category.images || category.images.length === 0) ? (
          <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-gray-200">
            <ImageIcon size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">কোনো ছবি পাওয়া যায়নি</p>
          </div>
        ) : (
          category.images.map((url, idx) => (
            <div key={idx} className="relative w-full rounded-[8px] overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.2)] bg-white">
              <img 
                src={url} 
                className="w-full h-auto cursor-pointer hover:scale-[1.01] transition-transform duration-300" 
                alt="" 
                onClick={() => setFullscreenImage(url)}
              />
              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-2">
                  <button 
                    onClick={() => {
                      setEditingUrlIndex(idx);
                      setEditingUrlValue(url);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-2 bg-blue-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Settings size={14} />
                  </button>
                  <button 
                    onClick={() => handleRemoveImage(idx)}
                    className="p-2 bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">অ্যাডমিন পিন</h3>
              <p className="text-sm text-gray-500">ছবি এডিট করতে ৪ ডিজিটের পিন দিন</p>
            </div>
            <input 
              type="password" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 text-center text-2xl font-bold tracking-widest mb-4 focus:border-blue-500 outline-none"
              placeholder="••••"
              maxLength={4}
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowPinModal(false)}
                className="flex-1 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl"
              >
                বাতিল
              </button>
              <button 
                onClick={handleVerifyPin}
                className="flex-1 py-3 font-bold text-white bg-blue-600 rounded-xl"
              >
                যাচাই করুন
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
            className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full backdrop-blur-md"
          >
            <X size={24} />
          </button>
          <img src={fullscreenImage} className="max-w-full max-h-full object-contain" alt="" />
        </div>
      )}

      <style>{`
        @keyframes slide {
          0% { transform: translateX(0%); }
          16.66% { transform: translateX(-100%); }
          33.33% { transform: translateX(-200%); }
          50% { transform: translateX(-300%); }
          66.66% { transform: translateX(-400%); }
          83.33% { transform: translateX(-500%); }
          100% { transform: translateX(0%); }
        }
      `}</style>
    </div>
  );
};

export default GalleryDetailView;
