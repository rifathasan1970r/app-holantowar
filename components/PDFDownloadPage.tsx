import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FLAT_OWNERS } from '../constants';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { FileDown, RefreshCw, ArrowLeft, Copy, Check } from 'lucide-react';

// English months array to map logic consistently
const MONTHS_LOGIC = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

interface PaymentData {
  id?: number;
  unit_text: string;
  month_name: string;
  year_num: number;
  amount: number;
  due: number;
  paid_date: string;
}

interface MonthlyRecord {
  month: string;
  date: string;
  amount: number;
  due: number;
  status: 'PAID' | 'DUE' | 'UPCOMING' | 'PARTIAL';
}

export const PDFDownloadPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [unit, setUnit] = useState('');
  const [year, setYear] = useState(2026);
  const [viewMode, setViewMode] = useState<'SERVICE' | 'PARKING'>('SERVICE');
  const [ownerName, setOwnerName] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalDue, setTotalDue] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const unitParam = params.get('unit') || '';
    const yearParam = parseInt(params.get('year') || '2026');
    const typeParam = params.get('type') as 'SERVICE' | 'PARKING' || 'SERVICE';

    setUnit(unitParam);
    setYear(yearParam);
    setViewMode(typeParam);

    // Fetch Data
    const fetchData = async () => {
      try {
        const { data: payData, error } = await supabase
          .from('payments')
          .select('*')
          .eq('year_num', yearParam);

        if (error) throw error;

        const dbData = payData as PaymentData[];
        const dbUnitText = typeParam === 'PARKING' ? `${unitParam}_P` : unitParam;

        const calculatedRecords = MONTHS_LOGIC.map((month, index) => {
          const paymentRecord = dbData.find(
            d => d.unit_text === dbUnitText && d.month_name === month
          );

          if (paymentRecord) {
            let recStatus: 'PAID' | 'DUE' | 'UPCOMING' | 'PARTIAL' = 'DUE';
            if (paymentRecord.amount > 0 && paymentRecord.due > 0) recStatus = 'PARTIAL';
            else if (paymentRecord.amount > 0) recStatus = 'PAID';
            else if (paymentRecord.amount === 0 && paymentRecord.due === 0) recStatus = 'UPCOMING';

            return {
              month: month,
              date: paymentRecord.paid_date || '-',
              amount: paymentRecord.amount,
              due: paymentRecord.due,
              status: recStatus
            };
          }

          // Default Logic
          const now = new Date();
          const currentRealYear = now.getFullYear();
          const currentRealMonthIdx = now.getMonth();
          const isFuture = yearParam > currentRealYear || (yearParam === currentRealYear && index > currentRealMonthIdx);

          let defaultAmount = 0;
          // Basic default logic (can be refined if needed, but 0 is safe for defaults)
           if (typeParam === 'SERVICE') {
              defaultAmount = (unitParam.slice(-1) !== 'B') ? 2000 : 500;
          }

          if (isFuture) {
            return { month: month, date: '-', amount: 0, due: 0, status: 'UPCOMING' as const };
          } else {
            return { month: month, date: '-', amount: 0, due: defaultAmount, status: 'DUE' as const };
          }
        });

        setRecords(calculatedRecords);
        setTotalAmount(calculatedRecords.reduce((sum, r) => sum + r.amount, 0));
        setTotalDue(calculatedRecords.reduce((sum, r) => sum + r.due, 0));

        // Owner Name
        const owner = FLAT_OWNERS.find(f => f.flat === unitParam)?.name || 'Unknown';
        setOwnerName(owner);

      } catch (err) {
        console.error("Error fetching PDF data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDownload = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    const sourceElement = document.getElementById('pdf-content');
    if (!sourceElement) return;

    try {
      // 1. Clone the element to render it cleanly for PDF generation
      // This fixes the "White PDF" issue caused by scroll/transform/visibility
      const clone = sourceElement.cloneNode(true) as HTMLElement;
      
      // 2. Reset styles for the clone to ensure perfect A4 capture
      clone.style.position = 'fixed';
      clone.style.left = '-10000px'; // Move off-screen
      clone.style.top = '0';
      clone.style.width = '800px'; // Force A4 width
      clone.style.height = 'auto';
      clone.style.minHeight = '1131px';
      clone.style.transform = 'none'; // Remove any scaling
      clone.style.overflow = 'visible';
      clone.style.zIndex = '-1000';
      clone.style.backgroundColor = 'white'; // Ensure background is white
      
      // Append to body
      document.body.appendChild(clone);

      // 3. Wait for images in the clone to load
      const images = clone.getElementsByTagName('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>(resolve => { 
            const timer = setTimeout(() => resolve(), 3000); // 3s timeout
            img.onload = () => { clearTimeout(timer); resolve(); }; 
            img.onerror = () => { clearTimeout(timer); resolve(); };
        });
      }));

      // 4. Capture with html2canvas
      const canvas = await html2canvas(clone, {
        scale: 2, // High resolution
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 800,
        windowWidth: 800,
        x: 0,
        y: 0
      });

      // 5. Generate PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const fileName = viewMode === 'PARKING' ? `Parking_Charge_${unit}_${year}.pdf` : `Service_Charge_${unit}_${year}.pdf`;
      pdf.save(fileName);

      // 6. Cleanup
      document.body.removeChild(clone);

    } catch (error) {
      console.error("PDF Generation failed:", error);
      alert("পিডিএফ ডাউনলোড করতে সমস্যা হয়েছে।");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGoBack = () => {
    // Navigate back to the main app view for this unit
    const baseUrl = window.location.origin + window.location.pathname;
    const targetUrl = `${baseUrl}?view=SERVICE_CHARGE&unit=${unit}`;
    window.location.href = targetUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto text-indigo-600 mb-4" size={32} />
          <p className="text-slate-600 font-medium">তথ্য লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  const title = viewMode === 'PARKING' ? 'হলান টাওয়ার - পার্কিং চার্জ স্টেটমেন্ট' : 'হলান টাওয়ার - সার্ভিস চার্জ স্টেটমেন্ট';
  const timestamp = new Date().toLocaleString('bn-BD', { 
      year: 'numeric', month: 'long', day: 'numeric', 
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
  });

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex flex-col items-center">
      {/* Action Bar - Sticky */}
      <div className="sticky top-2 sm:top-4 z-50 w-full max-w-[800px] mb-6 flex flex-col sm:flex-row justify-between items-center bg-white/95 backdrop-blur shadow-lg p-4 rounded-xl border border-slate-200/60 gap-4 transition-all duration-300">
        <div className="flex items-center gap-4 w-full sm:w-auto">
            <button 
                onClick={handleGoBack}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
                title="ফিরে যান"
            >
                <ArrowLeft size={24} />
            </button>
            <div className="text-center sm:text-left">
                <h1 className="text-lg font-bold text-slate-800">পিডিএফ প্রিভিউ</h1>
                <p className="text-xs text-slate-500">ইউনিট: {unit} | বছর: {year}</p>
            </div>
        </div>
        <button 
          onClick={handleDownload}
          disabled={isGenerating}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-all active:scale-95 ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isGenerating ? <RefreshCw size={20} className="animate-spin" /> : <FileDown size={20} />}
          {isGenerating ? 'তৈরি হচ্ছে...' : 'ডাউনলোড করুন'}
        </button>
      </div>

      {/* External Link Option */}
      <div className="w-full max-w-[800px] mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col gap-3">
        <p className="text-sm font-bold text-slate-700">পিডিএফ প্রিভিউ লিংক:</p>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-500 font-mono break-all select-all">
            {typeof window !== 'undefined' ? window.location.href : ''}
          </div>
          
          <button 
            onClick={handleCopyLink}
            className="bg-slate-100 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors active:scale-95 flex items-center justify-center"
            title="কপি করুন"
          >
            {copied ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
          </button>

          <a 
            href={typeof window !== 'undefined' ? window.location.href : '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (typeof window !== 'undefined') {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }
            }}
            className="w-full sm:w-auto bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors text-center shadow-sm active:scale-95"
          >
            দেখো
          </a>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800">
          <p className="font-bold mb-1">! ডাউনলোড হচ্ছে না?</p>
          <p>যদি <strong>"ডাউনলোড করুন"</strong> বাটন কাজ না করে, তবে উপরের <strong>"দেখো"</strong> বাটনে ক্লিক করুন। এতে পিডিএফটি ওয়েব লিংক কপি হয়ে ব্রাউজারে ওপেন হবে, যদি ব্রাউজারে ওপেন না হয় তাহলে কপি হওয়া লিংক <strong>ক্রোম (Chrome)</strong> ব্রাউজারে যেয়ে ওপেন করুন। সেখান থেকে প্রিন্ট বা ডাউনলোড করতে পারবেন।</p>
        </div>
      </div>

      {/* PDF Content (Visible Preview - Scaled Down) */}
      <div className="w-full flex justify-center pb-10 overflow-hidden">
        {/* Scaled Wrapper to fit screen better */}
        <div className="relative h-[460px] sm:h-[690px] md:h-[920px] transition-all duration-300">
          <div className="origin-top transform scale-[0.4] sm:scale-[0.6] md:scale-[0.8]">
            <div className="min-w-[800px] bg-white shadow-2xl mx-auto" style={{ minHeight: '1131px' }}>
              <div id="pdf-content" style={{ padding: '40px', position: 'relative', minHeight: '1131px', display: 'flex', flexDirection: 'column', backgroundColor: 'white', color: 'black', fontFamily: '"Inter", sans-serif', width: '800px', boxSizing: 'border-box' }}>
                
                {/* Header Section */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', paddingBottom: '10px', gap: '20px' }}>
                  <div>
                    <img src="https://i.imghippo.com/files/xPV6164w.png" crossOrigin="anonymous" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <h1 style={{ color: '#9333ea', margin: 0, fontSize: '42px', fontWeight: 900, fontFamily: '"Inter", sans-serif' }}>হলান টাওয়ার</h1>
                    <h2 style={{ color: '#000', margin: 0, fontSize: '36px', fontWeight: 900, letterSpacing: '4px', fontFamily: '"Inter", sans-serif' }}>HOLAN TOWER</h2>
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px', fontWeight: 800, color: '#000' }}>HOUSE #755 | HOLAN | WARD NO : 48 | DAKSHINKHAN | DHAKA 1230</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', fontWeight: 700, color: '#000' }}>holantower@gmail.com | www.holantower.blogspot.com | www.facebook.com/holantower</p>
                  </div>
                </div>
                
                {/* Header Line */}
                <div style={{ height: '4px', backgroundColor: '#000', marginBottom: '40px', width: '100%' }}></div>

                {/* Watermark */}
                <div style={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.06, zIndex: 0, width: '70%', pointerEvents: 'none' }}>
                  <img src="https://i.imghippo.com/files/xPV6164w.png" crossOrigin="anonymous" style={{ width: '100%' }} />
                </div>

                {/* Content Section */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <h3 style={{ textAlign: 'center', color: '#4f46e5', marginBottom: '20px', fontSize: '24px' }}>{title}</h3>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <p style={{ margin: '5px 0', fontSize: '16px' }}><strong>ইউনিট:</strong> <span style={{ color: '#4f46e5' }}>{unit}</span></p>
                      <p style={{ margin: '5px 0', fontSize: '16px' }}><strong>মালিক:</strong> {ownerName}</p>
                      <p style={{ margin: '5px 0', fontSize: '16px' }}><strong>বছর:</strong> {year}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '5px 0', color: '#16a34a', fontSize: '16px' }}><strong>মোট পরিশোধ:</strong> ৳{totalAmount.toLocaleString()}</p>
                      <p style={{ margin: '5px 0', color: '#dc2626', fontSize: '16px' }}><strong>মোট বকেয়া:</strong> ৳{totalDue.toLocaleString()}</p>
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#4f46e5', color: 'white' }}>
                        <th style={{ padding: '15px', border: '1px solid #e2e8f0', textAlign: 'left' }}>মাস</th>
                        <th style={{ padding: '15px', border: '1px solid #e2e8f0', textAlign: 'left' }}>তারিখ</th>
                        <th style={{ padding: '15px', border: '1px solid #e2e8f0', textAlign: 'right' }}>পরিমাণ</th>
                        <th style={{ padding: '15px', border: '1px solid #e2e8f0', textAlign: 'right' }}>বকেয়া</th>
                        <th style={{ padding: '15px', border: '1px solid #e2e8f0', textAlign: 'center' }}>অবস্থা</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r, i) => (
                        <tr key={i} style={{ backgroundColor: r.status === 'DUE' ? '#fff1f2' : 'transparent' }}>
                          <td style={{ padding: '12px', border: '1px solid #e2e8f0', fontWeight: 600 }}>{r.month}</td>
                          <td style={{ padding: '12px', border: '1px solid #e2e8f0' }}>{r.date || '-'}</td>
                          <td style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600 }}>৳{r.amount}</td>
                          <td style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600, color: r.due > 0 ? '#dc2626' : 'inherit' }}>৳{r.due}</td>
                          <td style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 800, color: r.status === 'PAID' ? '#16a34a' : (r.status === 'DUE' ? '#dc2626' : '#854d0e') }}>
                            {r.status === 'PAID' ? 'পরিশোধিত' : (r.status === 'DUE' ? 'বকেয়া' : (r.status === 'PARTIAL' ? 'আংশিক' : 'আসন্ন'))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 900, fontSize: '16px' }}>
                        <td colSpan={2} style={{ padding: '15px', border: '1px solid #e2e8f0', textAlign: 'center' }}>সর্বমোট হিসাব</td>
                        <td style={{ padding: '15px', border: '1px solid #e2e8f0', textAlign: 'right', color: '#16a34a' }}>৳{totalAmount.toLocaleString()}</td>
                        <td style={{ padding: '15px', border: '1px solid #e2e8f0', textAlign: 'right', color: '#dc2626' }}>৳{totalDue.toLocaleString()}</td>
                        <td style={{ padding: '15px', border: '1px solid #e2e8f0' }}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Footer */}
                <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '12px', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '20px', paddingBottom: '20px' }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>হলান টাওয়ার ম্যানেজমেন্ট সিস্টেম কর্তৃক স্বয়ংক্রিয়ভাবে জেনারেট করা রিপোর্ট।</p>
                  <p style={{ margin: '5px 0 0 0' }}>House #755, Holan, Dakshinkhan, Dhaka-1230</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '10px', color: '#94a3b8' }}>ডাউনলোডের সময়: {timestamp}</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '12px', fontWeight: 'bold', color: '#9333ea' }}>Design By A.H.M RIFAT HASAN</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
