import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, X, Lock, Unlock, Settings, Edit, Video, ChevronRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import FlatInteriorView from './FlatInteriorView';
import { ViewState } from '../types';

interface GalleryCategory {
  id: string;
  bn: string;
  en: string;
  icon: string;
  is_locked: boolean;
  images: string[];
  slider_images: string[];
  videos?: string[];
}

interface GalleryDetailViewProps {
  onBack: () => void;
  setView?: (view: ViewState, params?: Record<string, string>) => void;
}

const GalleryDetailView: React.FC<GalleryDetailViewProps> = ({ onBack, setView }) => {
  const location = useLocation();
  const navigate = useNavigate();
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
  const [mainSliderImages, setMainSliderImages] = useState<string[]>([]);
  const [subEvents, setSubEvents] = useState<GalleryCategory[]>([]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ bn: '', date: '' });
  const [editingSubEvent, setEditingSubEvent] = useState<{ id: string, bn: string, date: string } | null>(null);

  const categoryParam = new URLSearchParams(location.search).get('category');
  const urlCategoryId = new URLSearchParams(location.search).get('id');
  const effectiveId = categoryParam || urlCategoryId;
  const categoryId = category?.id;
  const isAdminParam = new URLSearchParams(location.search).get('admin');
  const unitParam = new URLSearchParams(location.search).get('unit');

  useEffect(() => {
    if (isAdminParam === 'true') {
      setIsAdmin(true);
    }
  }, [isAdminParam]);

  useEffect(() => {
    fetchMainSlider();
    if (effectiveId) {
      fetchCategory();
      
      const channel = supabase
        .channel(`category_${effectiveId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'gallery_categories'
        }, () => {
          fetchCategory();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [effectiveId]);

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
    if (!effectiveId) return;
    
    // Try to fetch by ID if it looks like a UUID, otherwise try by English name
    const isUUID = /^[0-9a-fA-F-]{36}$/.test(effectiveId);
    let query = supabase.from('gallery_categories').select('*');
    
    if (isUUID) {
      query = query.or(`id.eq.${effectiveId},en.eq."${effectiveId}"`);
    } else {
      query = query.eq('en', effectiveId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Error fetching category:', error);
    } else if (data) {
      setCategory(data);
      if (data.en === 'Events & Gatherings') {
        fetchSubEvents(data.id);
      }
    }
    setLoading(false);
  };

  const fetchSubEvents = async (parentId: string) => {
    const { data, error } = await supabase
      .from('gallery_categories')
      .select('*')
      .filter('en', 'like', `SUB_EVENT:${parentId}:%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sub-events:', error);
    } else {
      setSubEvents(data || []);
    }
  };

  const handleBack = async () => {
    if (category?.en.startsWith('SUB_EVENT:')) {
      const parentId = category.en.split(':')[1];
      
      // Try to find the parent's English name for a cleaner URL
      const { data: parentData } = await supabase
        .from('gallery_categories')
        .select('en')
        .eq('id', parentId)
        .single();
      
      const effectiveParentId = parentData?.en || parentId;

      if (setView) {
        const params: Record<string, string> = { category: effectiveParentId };
        if (isAdmin) params.admin = 'true';
        setView('GALLERY_DETAIL', params);
      } else {
        const adminStr = isAdmin ? '&admin=true' : '';
        window.location.search = `?category=${effectiveParentId}${adminStr}`;
      }
    } else {
      if (setView) {
        const params: Record<string, string> = {};
        if (isAdmin) params.admin = 'true';
        setView('GALLERY', params);
      } else {
        onBack();
      }
    }
  };

  const handleAddSubEvent = async () => {
    if (!category || !newEvent.bn || !newEvent.date) return;

    const subEventData = {
      bn: newEvent.bn,
      en: `SUB_EVENT:${category.id}:${newEvent.date}`,
      icon: 'fa-calendar-alt',
      is_locked: false,
      images: [],
      slider_images: []
    };

    const { error } = await supabase
      .from('gallery_categories')
      .insert(subEventData);

    if (error) {
      alert('Error adding event: ' + error.message);
    } else {
      setShowAddEventModal(false);
      setNewEvent({ bn: '', date: '' });
      fetchSubEvents(category.id);
    }
  };

  const handleDeleteSubEvent = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে আপনি এই ইভেন্টটি ডিলিট করতে চান?')) return;

    const { error } = await supabase
      .from('gallery_categories')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error deleting event: ' + error.message);
    } else {
      if (category) fetchSubEvents(category.id);
    }
  };

  const handleUpdateSubEvent = async () => {
    if (!editingSubEvent || !editingSubEvent.bn || !editingSubEvent.date || !category) return;

    const updatedData = {
      bn: editingSubEvent.bn,
      en: `SUB_EVENT:${category.id}:${editingSubEvent.date}`
    };

    const { error } = await supabase
      .from('gallery_categories')
      .update(updatedData)
      .eq('id', editingSubEvent.id);

    if (error) {
      alert('Error updating event: ' + error.message);
    } else {
      setShowEditEventModal(false);
      setEditingSubEvent(null);
      fetchSubEvents(category.id);
    }
  };

  const getEmbedUrl = (url: string) => {
    // Remove hash for embedding
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
    return '16/9'; // Default
  };

  const sliderImages = category?.images && category.images.length > 0 
    ? category.images.filter(url => !url.includes('drive.google.com')) 
    : [];
  const loopSlides = sliderImages.length > 0 ? [...sliderImages, sliderImages[0]] : [];

  const handleUpdateImages = async (url: string) => {
    if (!category || !categoryId || !url) return;
    
    // Ensure it's not a drive link being added as an image if we want them separate
    if (url.includes('drive.google.com')) {
      alert('এটি একটি ভিডিও লিংক। দয়া করে ভিডিও সেকশনে যোগ করুন।');
      return;
    }

    const updatedImages = [...(category.images || []), url];
    
    try {
      const { error } = await supabase
        .from('gallery_categories')
        .update({ 
          images: updatedImages
        })
        .eq('id', categoryId);
      
      if (error) {
        console.error('Update error:', error);
        alert('Error updating images: ' + error.message);
      } else {
        fetchCategory();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const handleEditImage = async (index: number, newUrl: string) => {
    if (!category || !categoryId || !newUrl) return;
    
    const updatedImages = [...(category.images || [])];
    updatedImages[index] = newUrl;
    
    const { error } = await supabase
      .from('gallery_categories')
      .update({ 
        images: updatedImages
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
    updatedImages.splice(index, 1);
    
    const { error } = await supabase
      .from('gallery_categories')
      .update({ 
        images: updatedImages
      })
      .eq('id', categoryId);
    
    if (error) alert('Error removing image: ' + error.message);
    else fetchCategory();
  };

  const handleUpdateVideos = async (url: string) => {
    if (!category || !categoryId || !url) return;
    
    // We use the 'images' column to store both images and videos
    // Video links are identified by 'drive.google.com'
    const updatedImages = [...(category.images || []), url];
    
    try {
      const { error } = await supabase
        .from('gallery_categories')
        .update({ 
          images: updatedImages
        })
        .eq('id', categoryId);
      
      if (error) {
        console.error('Update error:', error);
        alert('Error updating videos: ' + error.message);
      } else {
        fetchCategory();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const handleEditVideo = async (index: number, newUrl: string) => {
    if (!category || !categoryId || !newUrl) return;
    
    // Get all drive links to find the correct one to edit
    const driveLinks = category.images.filter(url => url.includes('drive.google.com'));
    const targetUrl = driveLinks[index];
    const actualIndex = category.images.indexOf(targetUrl);
    
    if (actualIndex !== -1) {
      const updatedImages = [...category.images];
      updatedImages[actualIndex] = newUrl;
      
      const { error } = await supabase
        .from('gallery_categories')
        .update({ images: updatedImages })
        .eq('id', categoryId);
      
      if (error) alert('Error editing video: ' + error.message);
      else {
        setEditingVideoIndex(null);
        fetchCategory();
      }
    }
  };

  const handleRemoveVideo = async (index: number) => {
    if (!category || !categoryId) return;
    
    const driveLinks = category.images.filter(url => url.includes('drive.google.com'));
    const targetUrl = driveLinks[index];
    const actualIndex = category.images.indexOf(targetUrl);
    
    if (actualIndex !== -1) {
      const updatedImages = [...category.images];
      updatedImages.splice(actualIndex, 1);
      
      const { error } = await supabase
        .from('gallery_categories')
        .update({ images: updatedImages })
        .eq('id', categoryId);
      
      if (error) alert('Error removing video: ' + error.message);
      else fetchCategory();
    }
  };

  const handleToggleCategoryLock = async () => {
    if (!category || !categoryId) return;
    const newLockStatus = !category.is_locked;
    
    // Update local state immediately
    setCategory(prev => prev ? { ...prev, is_locked: newLockStatus } : null);

    const { error } = await supabase
      .from('gallery_categories')
      .update({ is_locked: newLockStatus })
      .eq('id', categoryId);
    
    if (error) {
      alert('Error toggling lock: ' + error.message);
      fetchCategory(); // Revert on error
    }
  };

  const handleVerifyPin = async () => {
    if (pin === '1966') {
      setIsAdmin(true);
      setShowPinModal(false);
      setPin('');
      
      // Update URL to include admin=true
      const params = new URLSearchParams(location.search);
      params.set('admin', 'true');
      navigate({ search: params.toString() }, { replace: true });
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
      {!unitParam && (
        <div className="bg-white p-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <h1 className="text-lg font-bold text-gray-800 leading-tight">
              {category.bn}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => isAdmin ? setIsAdmin(false) : setShowPinModal(true)}
              className={`p-2 rounded-xl transition-all ${isAdmin ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
              title={isAdmin ? "লক করুন" : "এডিট মোড আনলক করুন"}
            >
              {isAdmin ? <Unlock size={20} /> : <Lock size={20} />}
            </button>
          </div>
        </div>
      )}

      {category.en === 'Flat Interior View' ? (
        <FlatInteriorView isAdmin={isAdmin} unit={unitParam} />
      ) : category.en === 'Events & Gatherings' ? (
        /* Events List View */
        <div className="max-w-[700px] mx-auto p-4 space-y-3">
          <div className="bg-[#3b5998] text-white text-center p-[12px_10px] rounded-xl shadow-md mb-6 flex flex-col gap-1">
            <div className="text-[18px] font-bold leading-tight">{category.bn}</div>
            <div className="text-[14px] font-medium opacity-90">({category.en})</div>
          </div>

          {isAdmin && (
            <button 
              onClick={() => setShowAddEventModal(true)}
              className="w-full bg-blue-600 text-white p-4 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95"
            >
              <Plus size={20} /> নতুন ইভেন্ট যোগ করুন
            </button>
          )}

          <div className="space-y-3">
            {subEvents.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-gray-200">
                <Lock size={48} className="text-gray-200 mx-auto mb-3 opacity-50" />
                <p className="text-gray-500 font-medium">কোনো ইভেন্ট পাওয়া যায়নি</p>
              </div>
            ) : (
              subEvents.map((event) => {
                const eventDate = event.en.split(':')[2];
                return (
                  <div key={event.id} className="group bg-white rounded-xl shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06),0_4px_6px_-2px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden flex items-stretch hover:shadow-md transition-all duration-300 active:scale-[0.99]">
                    <button 
                      onClick={() => {
                        if (setView) {
                          const params: Record<string, string> = { category: event.en };
                          if (isAdmin) params.admin = 'true';
                          setView('GALLERY_DETAIL', params);
                        } else {
                          const adminStr = isAdmin ? '&admin=true' : '';
                          window.location.search = `?category=${event.en}${adminStr}`;
                        }
                      }}
                      className="flex-1 p-3.5 flex items-center gap-3.5 hover:bg-gray-50/50 transition-colors text-left min-w-0"
                    >
                      {/* Date Section */}
                      <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-700 px-2 py-1.5 rounded-xl w-[80px] border border-blue-100 flex-shrink-0">
                        <span className="text-[9px] uppercase tracking-wider font-bold opacity-70">তারিখ</span>
                        <span className="text-[13px] font-black text-center leading-tight">{eventDate}</span>
                      </div>
                      
                      {/* Name Section */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                        <span className="text-gray-900 font-bold text-[16px] leading-[1.4] group-hover:text-blue-700 transition-colors break-words">
                          {event.bn}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium mt-1">
                          {isAdmin && (
                            event.is_locked ? (
                              <Lock size={10} className="text-red-300 flex-shrink-0 opacity-70" />
                            ) : (
                              <Unlock size={10} className="text-green-300 flex-shrink-0 opacity-70" />
                            )
                          )}
                          <span>ইভেন্ট বিস্তারিত দেখুন</span>
                        </div>
                      </div>
                      
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </button>
                    {isAdmin && (
                      <div className="flex border-l border-gray-50 bg-gray-50/30">
                        <button 
                          onClick={() => {
                            setEditingSubEvent({ id: event.id, bn: event.bn, date: eventDate });
                            setShowEditEventModal(true);
                          }}
                          className="px-3.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-all border-r border-gray-100 flex items-center justify-center"
                          title="এডিট করুন"
                        >
                          <Edit size={16} />
                        </button>
                        {!event.is_locked && (
                          <button 
                            onClick={() => handleDeleteSubEvent(event.id)}
                            className="px-3.5 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-center"
                            title="ডিলিট করুন"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Standard Gallery View */
        <>
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
            <div className="text-[18px] font-bold leading-tight">{category.bn}</div>
            <div className="text-[14px] font-medium opacity-90">
              {category.en.startsWith('SUB_EVENT:') ? `(${category.en.split(':')[2]})` : `(${category.en})`}
            </div>
          </div>

          {/* Admin Panel */}
          {isAdmin && (
            <div className="max-w-[700px] mx-auto m-4 p-5 bg-white rounded-3xl shadow-md border border-blue-100 space-y-4">
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

              {/* Video Management Section */}
              <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Video size={20} className="text-blue-600" /> নতুন ভিডিও লিংক যোগ করুন (ঐচ্ছিক)
                </h3>
                <div className="flex gap-2">
                  <input 
                    id="new-video-url" 
                    placeholder="ড্রাইভ ভিডিও প্রিভিউ লিংক দিন" 
                    className="flex-1 p-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
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
                  <h4 className="font-bold text-gray-700 text-sm">বর্তমান ভিডিও লিংকগুলো</h4>
                  {category.images?.filter(url => url.includes('drive.google.com')).map((url, idx) => (
                    <div key={idx} className="flex flex-col gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2">
                        {editingVideoIndex === idx ? (
                          <>
                            <input 
                              value={editingVideoValue}
                              onChange={(e) => setEditingVideoValue(e.target.value)}
                              className="flex-1 p-2 text-xs border rounded-lg outline-none focus:border-blue-500"
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
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              এডিট
                            </button>
                            <button 
                              onClick={() => handleRemoveVideo(idx)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
                                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
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
          {category.images && category.images.some(url => url.includes('drive.google.com')) && (
            <div className="w-full max-w-[700px] mx-auto my-8 p-[10px] space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                <Video size={24} className="text-blue-600" />
                <h3 className="text-xl font-bold text-gray-800">ভিডিও গ্যালারি</h3>
              </div>
              <div className="flex flex-col gap-6">
                {category.images.filter(url => url.includes('drive.google.com')).map((url, idx) => (
                  <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100">
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
            {(!category.images || category.images.filter(url => !url.includes('drive.google.com')).length === 0) ? (
              <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-gray-200">
                <Lock size={48} className="text-gray-200 mx-auto mb-3 opacity-50" />
                <p className="text-gray-500 font-medium">কোনো ছবি পাওয়া যায়নি</p>
              </div>
            ) : (
              category.images.filter(url => !url.includes('drive.google.com')).map((url, idx) => (
                <div key={idx} className="relative w-full rounded-[8px] overflow-hidden shadow-[0_0_6px_rgba(0,0,0,0.12)] bg-white group">
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
                        className="p-2 bg-white/90 text-blue-600 rounded-lg shadow-lg hover:bg-white"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          const actualIndex = category.images.indexOf(url);
                          handleRemoveImage(actualIndex);
                        }}
                        className="p-2 bg-white/90 text-red-600 rounded-lg shadow-lg hover:bg-white"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">নতুন ইভেন্ট যোগ করুন</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">ইভেন্টের নাম</label>
                <input 
                  type="text" 
                  value={newEvent.bn}
                  onChange={(e) => setNewEvent({ ...newEvent, bn: e.target.value })}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-blue-500"
                  placeholder="যেমন: বার্ষিক পিকনিক"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">তারিখ</label>
                <input 
                  type="text" 
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-blue-500"
                  placeholder="যেমন: ১২/০৩/২০২৪"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowAddEventModal(false)}
                  className="flex-1 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button 
                  onClick={handleAddSubEvent}
                  className="flex-1 py-3 font-bold text-white bg-blue-600 rounded-xl"
                >
                  যোগ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditEventModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">ইভেন্ট এডিট করুন</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">ইভেন্টের নাম</label>
                <input 
                  type="text" 
                  value={editingSubEvent?.bn || ''}
                  onChange={(e) => setEditingSubEvent(prev => prev ? { ...prev, bn: e.target.value } : null)}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-blue-500"
                  placeholder="ইভেন্টের নাম লিখুন"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">তারিখ</label>
                <input 
                  type="text" 
                  value={editingSubEvent?.date || ''}
                  onChange={(e) => setEditingSubEvent(prev => prev ? { ...prev, date: e.target.value } : null)}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-blue-500"
                  placeholder="তারিখ লিখুন"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowEditEventModal(false)}
                  className="flex-1 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button 
                  onClick={handleUpdateSubEvent}
                  className="flex-1 py-3 font-bold text-white bg-blue-600 rounded-xl"
                >
                  আপডেট করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={32} className="opacity-50" />
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
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4">
          <button 
            onClick={() => setFullscreenImage(null)}
            className="text-white bg-[#d1b3ff] p-[10px_20px] rounded-xl text-lg font-semibold cursor-pointer mb-[15px] shadow-[0_0_12px_rgba(209,179,255,0.8)] transition-all duration-300 flex items-center gap-2 hover:bg-[#b78cff] hover:shadow-[0_0_18px_rgba(183,140,255,1)] hover:scale-105 active:scale-95"
          >
            <ArrowLeft size={20} /> ফিরে যান
          </button>
          <img src={fullscreenImage} className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" alt="" />
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gallerySlide {
          ${loopSlides.length > 1 ? loopSlides.map((_, i) => {
            const step = 100 / (loopSlides.length - 1);
            const start = i * step;
            const pause = start + (step * 0.8);
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

export default GalleryDetailView;
