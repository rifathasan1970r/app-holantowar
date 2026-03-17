import React from 'react';
import { ArrowLeft, Clock } from 'lucide-react';

interface GalleryComingSoonViewProps {
  onBack: () => void;
}

const GalleryComingSoonView: React.FC<GalleryComingSoonViewProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#f5f7ff] flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 flex items-center gap-4 shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">গ্যালারি</h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Clock size={48} className="text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">আপডেট চলমান</h2>
        <p className="text-lg text-gray-600 mb-8">অপেক্ষা করুন। খুব শীঘ্রই নতুন ছবি যুক্ত করা হবে।</p>
        
        <button 
          onClick={onBack}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95"
        >
          ফিরে যান
        </button>
      </div>
    </div>
  );
};

export default GalleryComingSoonView;
