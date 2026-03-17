import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Unlock, Plus, Trash2, Settings, X, Image as ImageIcon, ChevronLeft } from 'lucide-react';
import { ViewState } from '../types';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  setDoc,
  query
} from 'firebase/firestore';

interface GalleryCategory {
  id: string;
  bn: string;
  en: string;
  icon: string;
  isLocked: boolean;
  images: string[];
  sliderImages: string[];
}

interface GalleryViewProps {
  onBack: () => void;
  setView: (view: ViewState) => void;
}

const GalleryView: React.FC<GalleryViewProps> = ({ onBack, setView }) => {
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<GalleryCategory | null>(null);
  const [newCategory, setNewCategory] = useState({ bn: '', en: '', icon: 'fa-images' });
  const [pin, setPin] = useState('1234');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'gallery_categories'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryCategory));
      setCategories(cats);
    });

    const fetchPin = async () => {
      const pinDoc = await getDoc(doc(db, 'gallery_settings', 'config'));
      if (pinDoc.exists()) {
        setPin(pinDoc.data().pin);
      } else {
        await setDoc(doc(db, 'gallery_settings', 'config'), { pin: '1234' });
      }
    };
    fetchPin();

    return () => unsubscribe();
  }, []);

  const handlePinSubmit = () => {
    if (pinInput === pin) {
      setIsAdmin(true);
      setShowPinModal(false);
      setPinInput('');
    } else {
      alert('ভুল পিন! আবার চেষ্টা করুন।');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.bn || !newCategory.en) return;
    await addDoc(collection(db, 'gallery_categories'), {
      ...newCategory,
      isLocked: false,
      images: [],
      sliderImages: []
    });
    setNewCategory({ bn: '', en: '', icon: 'fa-images' });
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই ক্যাটাগরি মুছে ফেলতে চান?')) {
      await deleteDoc(doc(db, 'gallery_categories', id));
    }
  };

  const handleToggleLock = async (category: GalleryCategory) => {
    await updateDoc(doc(db, 'gallery_categories', category.id), {
      isLocked: !category.isLocked
    });
  };

  const handleUpdateImages = async (categoryId: string, type: 'images' | 'sliderImages', url: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    const updatedImages = [...(category[type] || []), url];
    await updateDoc(doc(db, 'gallery_categories', categoryId), {
      [type]: updatedImages
    });
  };

  const handleRemoveImage = async (categoryId: string, type: 'images' | 'sliderImages', index: number) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    const updatedImages = [...(category[type] || [])];
    updatedImages.splice(index, 1);
    await updateDoc(doc(db, 'gallery_categories', categoryId), {
      [type]: updatedImages
    });
  };

  // Default slides if no categories have slider images
  const defaultSlides = [
    "https://i.imghippo.com/files/IxR3498AKE.png",
    "https://i.imghippo.com/files/VN1922RL.jpg",
    "https://i.imghippo.com/files/aPPh2154sY.jpg"
  ];

  // Collect all slider images from all categories
  const allSliderImages = categories.reduce((acc, cat) => [...acc, ...(cat.sliderImages || [])], [] as string[]);
  const displaySlides = allSliderImages.length > 0 ? allSliderImages : defaultSlides;

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
          {isAdmin ? <Settings size={24} /> : <Lock size={24} />}
        </button>
      </div>

      {/* Slider Section */}
      <div className="max-w-[960px] mx-auto mt-6 px-4">
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#f0f4ff] to-[#d9e3ff] shadow-lg">
          <div className="flex animate-[slide_25s_ease-in-out_infinite]">
            {displaySlides.map((src, index) => (
              <div key={index} className="w-full flex-shrink-0 p-[10px] box-border text-center">
                <img 
                  src={src} 
                  onClick={() => setFullscreenImage(src)}
                  className="max-w-full h-auto rounded-xl cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
                  alt={`Slide ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Glance Section */}
      <div className="max-w-[960px] mx-auto my-10 text-center px-4 py-10 bg-gradient-to-br from-[#f0f4ff] to-[#d9e3ff] rounded-[25px] shadow-xl">
        <h2 className="text-[22px] mb-[30px] text-[#1a2e45] font-bold leading-[1.2]">
          হলান টাওয়ার এক নজরে (Holan Tower at a Glance)
        </h2>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-[18px]">
          {categories.map((cat) => (
            <div key={cat.id} className="relative group">
              <button 
                onClick={() => {
                  if (cat.isLocked && !isAdmin) {
                    alert('এই ক্যাটাগরি লক করা আছে।');
                  } else {
                    if (cat.bn === "কন্ট্রোল রুম ও মনিটরিং") {
                      setView('GALLERY_CONTROL_ROOM');
                    } else {
                      setView('GALLERY_COMING_SOON');
                    }
                  }
                }}
                className="w-full bg-gradient-to-br from-[#4a69bd] to-[#6a82fb] rounded-[15px] p-[12px_20px] min-h-[70px] text-white shadow-[0_5px_20px_rgba(74,105,189,0.4)] transition-all duration-300 flex items-center gap-[18px] hover:from-[#6a82fb] hover:to-[#4a69bd] hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(74,105,189,0.6)]"
              >
                <i className={`fas ${cat.icon} text-[28px] min-w-[40px] text-center`}></i>
                <div className="flex-1 flex flex-col justify-center text-center">
                  <div className="text-[18px] font-bold leading-[1.1]">{cat.bn}</div>
                  <div className="text-[14px] opacity-[0.85] mt-[3px]">({cat.en})</div>
                </div>
                {cat.isLocked && <Lock size={20} className="text-red-200" />}
              </button>

              {isAdmin && (
                <div className="absolute top-[-10px] right-[-10px] flex gap-1 z-20">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleToggleLock(cat); }}
                    className="p-2 bg-white shadow-lg rounded-full text-blue-600 hover:bg-blue-50"
                  >
                    {cat.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); }}
                    className="p-2 bg-white shadow-lg rounded-full text-amber-600 hover:bg-amber-50"
                  >
                    <Settings size={16} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                    className="p-2 bg-white shadow-lg rounded-full text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
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
                <Lock size={32} />
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
              <button onClick={() => setIsAdmin(false)} className="w-full p-4 bg-red-50 text-red-600 rounded-2xl font-bold">অ্যাডমিন মোড বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{editingCategory.bn}</h2>
              <button onClick={() => setEditingCategory(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
            </div>
            <div className="space-y-8">
              {['sliderImages', 'images'].map((type) => (
                <div key={type} className="space-y-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <ImageIcon size={20} className="text-blue-600" /> {type === 'sliderImages' ? 'স্লাইডার' : 'গ্যালারি'} ইমেজ
                  </h3>
                  <div className="flex gap-2">
                    <input id={`${type}-url`} placeholder="ইমেজ URL দিন" className="flex-1 p-3 rounded-xl border border-gray-200" />
                    <button 
                      onClick={() => {
                        const input = document.getElementById(`${type}-url`) as HTMLInputElement;
                        if (input.value) {
                          handleUpdateImages(editingCategory.id, type as any, input.value);
                          input.value = '';
                        }
                      }}
                      className="p-3 bg-blue-600 text-white rounded-xl"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(editingCategory[type as keyof GalleryCategory] as string[])?.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border">
                        <img src={url} className="w-full h-full object-cover" alt="" />
                        <button onClick={() => handleRemoveImage(editingCategory.id, type as any, idx)} className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full"><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
            <ChevronLeft size={20} /> ফিরে যাও
          </button>
          <img src={fullscreenImage} className="max-w-[95vw] max-h-[85vh] rounded-xl shadow-[0_0_20px_#fff] object-contain" alt="Fullscreen" />
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide {
          0% { transform: translateX(0%); }
          20% { transform: translateX(0%); }
          25% { transform: translateX(-100%); }
          45% { transform: translateX(-100%); }
          50% { transform: translateX(-200%); }
          70% { transform: translateX(-200%); }
          75% { transform: translateX(-300%); }
          95% { transform: translateX(-300%); }
          100% { transform: translateX(0%); }
        }
      `}} />
    </div>
  );
};

export default GalleryView;
