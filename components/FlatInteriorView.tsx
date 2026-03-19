import React from 'react';
import { useNavigate } from 'react-router-dom';

const FlatInteriorView: React.FC = () => {
  const navigate = useNavigate();

  const units = [
    { id: 'unit-a', title: 'UNIT A', subtitle: '(ইউনিট A — বিস্তারিত)' },
    { id: 'unit-b', title: 'UNIT B', subtitle: '(ইউনিট B — বিস্তারিত)' },
    { id: 'unit-c', title: 'UNIT C', subtitle: '(ইউনিট C — বিস্তারিত)' },
  ];

  return (
    <div className="space-y-6">
      {/* Slider */}
      <div className="max-w-[960px] mx-auto mt-[30px] relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#f0f4ff] to-[#d9e3ff] shadow-[0_8px_25px_rgba(0,0,0,0.1)]">
        <div className="flex animate-[slide_25s_ease-in-out_infinite]">
          <div className="w-full flex-shrink-0 p-[10px] text-center">
            <img src="https://i.imghippo.com/files/IxR3498AKE.png" alt="Image 1" className="max-w-full h-auto rounded-[12px] cursor-pointer transition-transform hover:scale-[1.02]" />
          </div>
          <div className="w-full flex-shrink-0 p-[10px] text-center">
            <img src="https://i.imghippo.com/files/VN1922RL.jpg" alt="Image 2" className="max-w-full h-auto rounded-[12px] cursor-pointer transition-transform hover:scale-[1.02]" />
          </div>
          <div className="w-full flex-shrink-0 p-[10px] text-center">
            <img src="https://i.imghippo.com/files/aPPh2154sY.jpg" alt="Image 3" className="max-w-full h-auto rounded-[12px] cursor-pointer transition-transform hover:scale-[1.02]" />
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default FlatInteriorView;
