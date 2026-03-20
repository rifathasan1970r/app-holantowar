import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, Lock, Unlock, Plus, Edit, Trash2, X, Video } from 'lucide-react';
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

interface UnitDetailViewProps {
  unitId: string;
  onBack: () => void;
}

const UnitDetailView: React.FC<UnitDetailViewProps> = ({ unitId, onBack }) => {
  const [category, setCategory] = useState<GalleryCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [editingUrlIndex, setEditingUrlIndex] = useState<number | null>(null);
  const [editingUrlValue, setEditingUrlValue] = useState('');
  const [editingVideoIndex, setEditingVideoIndex] = useState<number | null>(null);
  const [editingVideoValue, setEditingVideoValue] = useState('');

  const unitInfo = {
    'unit-a': { title: 'UNIT A', subtitle: '(ইউনিট A — বিস্তারিত)' },
    'unit-b': { title: 'UNIT B', subtitle: '(ইউনিট B — বিস্তারিত)' },
    'unit-c': { title: 'UNIT C', subtitle: '(ইউনিট C — বিস্তারিত)' },
  }[unitId] || { title: unitId.toUpperCase(), subtitle: '' };

  const fetchCategory = useCallback(async () => {
    setLoading(true);
    const letter = unitId.split('-')[1]?.toUpperCase() || '';
    
    // Try fetching by ID first
    let { data } = await supabase
      .from('gallery_categories')
      .select('*')
      .or(`id.eq.${unitId},en.ilike.%Unit ${letter}%,bn.ilike.%ইউনিট ${letter}%`)
      .limit(1)
      .maybeSingle();

    if (data) {
      setCategory(data);
    } else {
      // If not found, we set a default state with the unitId as a placeholder ID
      setCategory({
        id: unitId,
        bn: unitInfo.title,
        en: unitId,
        icon: 'fa-door-open',
        is_locked: false,
        images: [],
        slider_images: []
      });
    }
    setLoading(false);
  }, [unitId, unitInfo.title]);

  useEffect(() => {
    fetchCategory();
    
    const channel = supabase
      .channel(`unit_${unitId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'gallery_categories',
        filter: `id=eq.${unitId}`
      }, () => {
        fetchCategory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [unitId, fetchCategory]);

  const handleVerifyPin = () => {
    if (pin === '1966') {
      setIsAdmin(true);
      setShowPinModal(false);
      setPin('');
    } else {
      alert('ভুল পিন! আবার চেষ্টা করুন।');
      setPin('');
    }
  };

  const handleUpdateImages = async (url: string) => {
    if (!category || !url) return;
    
    if (url.includes('drive.google.com')) {
      alert('এটি একটি ভিডিও লিংক। দয়া করে ভিডিও সেকশনে যোগ করুন।');
      return;
    }

    const updatedImages = [...(category.images || []), url];
    const isNew = !category.id || category.id === unitId;
    
    let result;
    if (isNew) {
      result = await supabase
        .from('gallery_categories')
        .insert([{ 
          bn: unitInfo.title,
          en: unitId,
          icon: 'fa-door-open',
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

  const handleUpdateVideos = async (url: string) => {
    if (!category || !url) return;
    
    const updatedImages = [...(category.images || []), url];
    const isNew = !category.id || category.id === unitId;
    
    let result;
    if (isNew) {
      result = await supabase
        .from('gallery_categories')
        .insert([{ 
          bn: unitInfo.title,
          en: unitId,
          icon: 'fa-door-open',
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
    
    if (result.error) alert('Error updating videos: ' + result.error.message);
    else fetchCategory();
  };

  const handleEditVideo = async (index: number, newUrl: string) => {
    if (!category || !newUrl) return;
    
    const driveLinks = category.images.filter(url => url.includes('drive.google.com'));
    const targetUrl = driveLinks[index];
    const actualIndex = category.images.indexOf(targetUrl);
    
    if (actualIndex !== -1) {
      const updatedImages = [...category.images];
      updatedImages[actualIndex] = newUrl;
      
      const { error } = await supabase
        .from('gallery_categories')
        .update({ images: updatedImages })
        .eq('id', category.id)
        .select()
        .single();
      
      if (error) alert('Error editing video: ' + error.message);
      else {
        setEditingVideoIndex(null);
        fetchCategory();
      }
    }
  };

  const handleRemoveVideo = async (index: number) => {
    if (!category) return;
    
    const driveLinks = category.images.filter(url => url.includes('drive.google.com'));
    const targetUrl = driveLinks[index];
    const actualIndex = category.images.indexOf(targetUrl);
    
    if (actualIndex !== -1) {
      const updatedImages = [...category.images];
      updatedImages.splice(actualIndex, 1);
      
      const { error } = await supabase
        .from('gallery_categories')
        .update({ images: updatedImages })
        .eq('id', category.id)
        .select()
        .single();
      
      if (error) alert('Error removing video: ' + error.message);
      else fetchCategory();
    }
  };

  const getEmbedUrl = (url: string) => {
    const cleanUrl = url.split('#')[0];
    if (cleanUrl.includes('drive.google.com')) {
      const driveMatch = cleanUrl.match(/\/file\/d\/([^\/]+)/);
      if (driveMatch && driveMatch[1]) {
        return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
      }
    }
    return cleanUrl;
  };

  const getVideoRatio = (url: string) => {
    if (url.includes('#ratio=')) {
      return url.split('#ratio=')[1];
    }
    return '16/9';
  };

  const sliderImages = category?.images && category.images.length > 0 
    ? category.images.filter(url => !url.includes('drive.google.com')) 
    : [];
  const loopSlides = sliderImages.length > 0 ? [...sliderImages, sliderImages[0]] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{unitInfo.title}</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none">{unitInfo.subtitle}</p>
          </div>
        </div>
        <button 
          onClick={() => isAdmin ? setIsAdmin(false) : setShowPinModal(true)}
          className={`p-2 rounded-xl transition-all ${isAdmin ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'}`}
        >
          {isAdmin ? <Unlock size={20} /> : <Lock size={20} />}
        </button>
      </div>

      {/* Slider Section */}
      {loopSlides.length > 0 && (
        <div className="max-w-[700px] mx-auto mt-[20px] relative overflow-hidden rounded-[10px] shadow-[0_0_10px_rgba(0,0,0,0.2)]">
          <div 
            className="flex w-full" 
            style={{ 
              animation: `gallerySlide ${loopSlides.length * 3}s infinite`,
              width: `${loopSlides.length * 100}%`
            }}
          >
            {loopSlides.map((src, idx) => (
              <div key={idx} style={{ width: `${100 / loopSlides.length}%` }}>
                <img 
                  src={src} 
                  alt={`Slide ${idx + 1}`}
                  className="w-full h-auto cursor-pointer"
                  onClick={() => setFullscreenImage(src)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header Title */}
      <div className="bg-[#3b5998] text-white text-center p-[12px_10px] mt-[15px] max-w-[700px] mx-auto shadow-md flex flex-col gap-1">
        <div className="text-[18px] font-bold leading-tight">{unitInfo.title}</div>
        <div className="text-[14px] font-medium opacity-90">{unitInfo.subtitle}</div>
      </div>

      {/* Admin Panel */}
      {isAdmin && (
        <div className="max-w-[700px] mx-auto m-4 p-5 bg-white dark:bg-slate-800 rounded-3xl shadow-md border border-blue-100 dark:border-slate-700 space-y-4">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Plus size={20} className="text-blue-600" /> নতুন ছবি যোগ করুন
          </h3>
          <div className="flex gap-2">
            <input 
              id="new-img-url" 
              placeholder="ইমেজ URL দিন" 
              className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
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
            <h4 className="font-bold text-gray-700 dark:text-slate-300 text-sm border-b dark:border-slate-700 pb-2">বর্তমান ছবিগুলোর URL (এডিট/ডিলিট)</h4>
            {category?.images?.filter(url => !url.includes('drive.google.com')).map((url, idx) => (
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

          {/* Video Management Section */}
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700 space-y-4">
            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Video size={20} className="text-blue-600" /> নতুন ভিডিও লিংক যোগ করুন (ঐচ্ছিক)
            </h3>
            <div className="flex gap-2">
              <input 
                id="new-video-url" 
                placeholder="ড্রাইভ ভিডিও প্রিভিউ লিংক দিন" 
                className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              />
              <button 
                onClick={() => {
                  const input = document.getElementById('new-video-url') as HTMLInputElement;
                  if (input.value) {
                    handleUpdateVideos(input.value);
                    input.value = '';
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm"
              >
                যোগ করুন
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <h4 className="font-bold text-gray-700 dark:text-slate-300 text-sm">বর্তমান ভিডিও লিংকগুলো</h4>
              {category?.images?.filter(url => url.includes('drive.google.com')).map((url, idx) => (
                <div key={idx} className="flex flex-col gap-2 bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    {editingVideoIndex === idx ? (
                      <>
                        <input 
                          value={editingVideoValue}
                          onChange={(e) => setEditingVideoValue(e.target.value)}
                          className="flex-1 p-2 text-xs border rounded-lg outline-none focus:border-blue-500 dark:bg-slate-800 dark:text-white"
                        />
                        <button 
                          onClick={() => handleEditVideo(idx, editingVideoValue)}
                          className="p-2 bg-green-600 text-white rounded-lg"
                        >
                          সেভ
                        </button>
                        <button 
                          onClick={() => setEditingVideoIndex(null)}
                          className="p-2 bg-gray-400 text-white rounded-lg"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 text-[10px] text-gray-500 truncate">{url.split('#')[0]}</div>
                        <button 
                          onClick={() => {
                            setEditingVideoIndex(idx);
                            setEditingVideoValue(url);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                        >
                          এডিট
                        </button>
                        <button 
                          onClick={() => handleRemoveVideo(idx)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-400">রেশিও:</span>
                    {['16/9', '9/16', '1/1', '4/3'].map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => {
                          const cleanUrl = url.split('#')[0];
                          handleEditVideo(idx, `${cleanUrl}#ratio=${ratio}`);
                        }}
                        className={`px-2 py-1 text-[10px] rounded-md border transition-colors ${
                          getVideoRatio(url) === ratio 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-blue-300'
                        }`}
                      >
                        {ratio.replace('/', ':')}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Video List Section */}
      {category?.images && category.images.some(url => url.includes('drive.google.com')) && (
        <div className="w-full max-w-[700px] mx-auto my-8 p-[10px] space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-2">
            <Video size={24} className="text-blue-600" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">ভিডিও গ্যালারি</h3>
          </div>
          <div className="flex flex-col gap-6">
            {category.images.filter(url => url.includes('drive.google.com')).map((url, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-slate-700">
                <div 
                  className="w-full bg-black relative" 
                  style={{ 
                    aspectRatio: getVideoRatio(url),
                    maxHeight: getVideoRatio(url) === '9/16' ? '80vh' : 'auto'
                  }}
                >
                  <iframe
                    src={getEmbedUrl(url)}
                    className="absolute top-0 left-0 w-full h-full"
                    allow="autoplay"
                    allowFullScreen
                    style={{ border: 'none' }}
                  ></iframe>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gallery List */}
      <div className="max-w-[700px] mx-auto my-[12px] p-[10px] flex flex-col gap-[12px]">
        {(!category?.images || category.images.filter(url => !url.includes('drive.google.com')).length === 0) ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 text-center border-2 border-dashed border-gray-200 dark:border-slate-700">
            <Lock size={48} className="text-gray-200 dark:text-slate-700 mx-auto mb-3 opacity-50" />
            <p className="text-gray-500 dark:text-slate-400 font-medium">কোনো ছবি পাওয়া যায়নি</p>
          </div>
        ) : (
          category.images.filter(url => !url.includes('drive.google.com')).map((url, idx) => (
            <div key={idx} className="relative w-full rounded-[8px] overflow-hidden shadow-[0_0_6px_rgba(0,0,0,0.12)] bg-white dark:bg-slate-800 group">
              <img 
                src={url} 
                alt={`Gallery ${idx + 1}`}
                className="w-full rounded-[8px] shadow-[0_0_6px_rgba(0,0,0,0.12)] cursor-pointer transition-transform duration-300 hover:scale-[1.01]" 
                onClick={() => setFullscreenImage(url)}
              />
              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      const actualIndex = category.images.indexOf(url);
                      setEditingUrlIndex(actualIndex);
                      setEditingUrlValue(url);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-2 bg-white/90 dark:bg-slate-800/90 text-blue-600 rounded-lg shadow-lg hover:bg-white dark:hover:bg-slate-800"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    onClick={() => {
                      const actualIndex = category.images.indexOf(url);
                      handleRemoveImage(actualIndex);
                    }}
                    className="p-2 bg-white/90 dark:bg-slate-800/90 text-red-600 rounded-lg shadow-lg hover:bg-white dark:hover:bg-slate-800"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPinModal(false)}></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl w-full max-w-xs text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">পিন কোড দিন</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 font-medium">এডিট মোড আনলক করতে ৪ ডিজিটের পিন দিন</p>
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
    </div>
  );
};

export default UnitDetailView;
