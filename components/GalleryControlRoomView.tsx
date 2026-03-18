import React, { useState, useEffect } from 'react';
import { ArrowLeft, X, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface GalleryControlRoomViewProps {
  onBack: () => void;
}

const GalleryControlRoomView: React.FC<GalleryControlRoomViewProps> = ({ onBack }) => {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [sliderImages, setSliderImages] = useState<string[]>([]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('control_room_changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'gallery_categories',
        filter: 'bn=eq.কন্ট্রোল রুম ও মনিটরিং'
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('gallery_categories')
      .select('images, slider_images')
      .eq('bn', 'কন্ট্রোল রুম ও মনিটরিং')
      .single();

    if (error) {
      console.error('Error fetching control room data:', error);
      // Fallback
      setImages([
        "https://i.imghippo.com/files/hIAW5391FUU.jpg",
        "https://i.imghippo.com/files/zuMa8505Yo.jpg",
        "https://i.imghippo.com/files/hcq1824tg.jpg",
        "https://i.imghippo.com/files/DZRO1355HgE.jpg",
        "https://i.imghippo.com/files/GRxk1322XLE.jpg",
        "https://i.imghippo.com/files/PSPU3951bik.jpg",
        "https://i.imghippo.com/files/FFis6697ozE.jpg",
        "https://i.imghippo.com/files/baGA8609t.jpg",
        "https://i.imghippo.com/files/Xm1093pH.jpg",
        "https://i.imghippo.com/files/rEHS8514v.jpg",
        "https://i.imghippo.com/files/aYm9387HEM.jpg",
        "https://i.imghippo.com/files/Bhf3045brA.jpg"
      ]);
      return;
    }

    if (data) {
      setImages(data.images || []);
      setSliderImages(data.slider_images || []);
    }
  };

  const displaySliderImages = sliderImages.length > 0 ? sliderImages : images.slice(0, 6);

  return (
    <div className="min-h-screen bg-[#f0f0f0] pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center gap-4 shadow-sm sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">গ্যালারি</h1>
      </div>

      {/* Auto Slider */}
      {displaySliderImages.length > 0 && (
        <div className="max-w-[700px] mx-auto mt-[20px] relative overflow-hidden rounded-[10px] shadow-[0_0_10px_rgba(0,0,0,0.2)]">
          <div 
            className="flex w-full" 
            style={{ 
              animation: `gallerySlide ${displaySliderImages.length * 4}s infinite`,
              width: `${displaySliderImages.length * 100}%`
            }}
          >
            {displaySliderImages.map((src, index) => (
              <div key={index} style={{ width: `${100 / displaySliderImages.length}%` }}>
                <img 
                  src={src} 
                  alt={`Slide ${index + 1}`}
                  className="w-full h-auto cursor-pointer"
                  onClick={() => setFullscreenImage(src)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header Title */}
      <div className="bg-[#3b5998] text-white text-center p-[12px_10px] text-[18px] font-bold mt-[15px] shadow-md">
        কন্ট্রোল রুম ও মনিটরিং (Control Room & Monitoring)
      </div>

      {/* Gallery Grid (Vertical List) */}
      <div className="max-w-[700px] mx-auto my-[12px] p-[10px] flex flex-col gap-[12px]">
        {images.map((src, index) => (
          <img 
            key={index}
            src={src} 
            alt={`Gallery ${index + 1}`}
            className="w-full rounded-[8px] shadow-[0_0_6px_rgba(0,0,0,0.12)] cursor-pointer transition-transform duration-300 hover:scale-[1.01]"
            onClick={() => setFullscreenImage(src)}
          />
        ))}
      </div>

      {/* Fullscreen Overlay */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4">
          <button 
            onClick={() => setFullscreenImage(null)}
            className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X size={28} />
          </button>
          
          <button 
            onClick={() => setFullscreenImage(null)}
            className="mb-4 text-white bg-[#d1b3ff] p-[8px_16px] rounded-xl text-sm font-semibold cursor-pointer shadow-[0_0_10px_rgba(209,179,255,0.5)] transition-all duration-300 flex items-center gap-2 hover:bg-[#b78cff] hover:shadow-[0_0_15px_rgba(183,140,255,0.7)] hover:scale-105"
          >
            <ChevronLeft size={16} /> ফিরে যান
          </button>

          <img 
            src={fullscreenImage} 
            className="max-w-[90%] max-h-[70vh] rounded-lg shadow-[0_0_25px_rgba(255,255,255,0.15)] object-contain"
            alt="Fullscreen"
          />
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gallerySlide {
          0% { transform: translateX(0%); }
          ${100 / displaySliderImages.length / 2}% { transform: translateX(0%); }
          ${100 / displaySliderImages.length}% { transform: translateX(-${100 / displaySliderImages.length}%); }
        }
      `}} />
    </div>
  );
};

export default GalleryControlRoomView;
