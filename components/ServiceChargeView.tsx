import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AIAssistant } from './AIAssistant';
import { ChevronLeft, ChevronRight, ArrowLeft, Search, CheckCircle2, XCircle, Clock, Users, Home, PieChart, CalendarDays, TrendingUp, Wallet, ArrowUpRight, ListFilter, RefreshCw, Lock, Unlock, Edit3, Save, X, Grid, Calendar as CalendarIcon, DollarSign, Check, Info, MessageCircle, Send, Phone, Car, Bot, FileDown, ChevronDown, MessageSquare, Bell, AlertCircle } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabaseClient';
import { TRANSLATIONS, FLAT_OWNERS } from '../constants';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { useLocalStorage } from '../src/hooks/useLocalStorage';

// কনফিগারেশন: ২৭টি ইউনিট (ফ্লোর ২ থেকে ১০)
const FLOORS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const UNITS_PER_FLOOR = ['A', 'B', 'C'];
const ALL_UNITS = FLOORS.flatMap(f => UNITS_PER_FLOOR.map(u => `${f}${u}`));
const SERVICE_CHARGE_AMOUNT = 2000;

// English months array to map logic consistently, UI will use translated array
const MONTHS_LOGIC = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

type Status = 'PAID' | 'DUE' | 'UPCOMING' | 'PARTIAL';

interface MonthlyRecord {
  month: string;
  monthIndex: number;
  date: string;
  amount: number;
  due: number;
  status: Status;
  note?: string;
}

interface PaymentData {
  id?: number;
  unit_text: string;
  month_name: string;
  year_num: number;
  amount: number;
  due: number;
  paid_date: string;
  note?: string;
}

interface UnitInfo {
  unit_text: string;
  is_occupied: boolean;
  note?: string;
  phone?: string;
  confirm_template?: string;
  due_template?: string;
  owner_phone?: string;
  owner_confirm_template?: string;
  owner_due_template?: string;
  year_num?: number;
}

interface WhatsAppLog {
  id?: number;
  unit_text: string;
  month_name: string;
  year_num: number;
  message_type: 'confirm' | 'due';
  target_audience?: 'tenant' | 'owner';
  sent_count: number;
  last_sent_at: string;
}

interface ServiceChargeViewProps {
  lang?: 'bn' | 'en';
  selectedUnit: string | null;
  onUnitSelect: (unit: string | null) => void;
  showSummaryList: boolean;
  onSummaryToggle: (show: boolean) => void;
}

export const ServiceChargeView: React.FC<ServiceChargeViewProps> = ({ 
  lang = 'bn',
  selectedUnit,
  onUnitSelect,
  showSummaryList,
  onSummaryToggle
}) => {
  const [showMonthlySummary, setShowMonthlySummary] = useState<boolean>(false);
  const [showDueSummary, setShowDueSummary] = useState<boolean>(false);
  const [dueSummaryData, setDueSummaryData] = useState<{unit: string, due2025: number, due2026: number}[]>([]);
  const [loadingDueSummary, setLoadingDueSummary] = useState<boolean>(false);
  const [showParkingView, setShowParkingView] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'SERVICE' | 'PARKING'>('SERVICE');
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonthForFullTable, setSelectedMonthForFullTable] = useState<number | null>(null);
  const [showFullYearTable, setShowFullYearTable] = useState<boolean>(false);
  const [fullYearTableUnitFilter, setFullYearTableUnitFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Supabase State
  const [dbData, setDbData] = useState<PaymentData[]>([]);
  const [unitsInfo, setUnitsInfo] = useState<Record<string, UnitInfo>>({});
  const [whatsAppLogs, setWhatsAppLogs] = useState<WhatsAppLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [useMock, setUseMock] = useState<boolean>(false);

  // Admin State
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Reset internal view states when unit changes or goes back to list
  useEffect(() => {
    setShowFullYearTable(false);
    setFullYearTableUnitFilter(null);
    setShowMonthlySummary(false);
    setShowDueSummary(false);
    setShowParkingView(false);
    setShowSummaryModal(false);
  }, [selectedUnit]);

  const DEFAULT_UNIT_INFO: UnitInfo = {
    unit_text: '',
    is_occupied: true,
    note: '',
    phone: '',
    confirm_template: "Dear Owner, Payment received for Unit {unit}. Month: {month}. Amount: {amount}.",
    due_template: "Dear Owner, Payment DUE for Unit {unit}. Month: {month}. Amount: {amount}. Total Due: {due_amount}.",
    owner_phone: '',
    owner_confirm_template: "Dear Owner, Payment received for Unit {unit}. Month: {month}. Amount: {amount}.",
    owner_due_template: "Dear Owner, Payment DUE for Unit {unit}. Month: {month}. Amount: {amount}. Total Due: {due_amount}."
};
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [showWhatsAppView, setShowWhatsAppView] = useState<boolean>(false);
  const [whatsAppMonth, setWhatsAppMonth] = useState<string>(MONTHS_LOGIC[new Date().getMonth()]);
  const [whatsAppTarget, setWhatsAppTarget] = useState<'tenant' | 'owner'>('tenant');
  const [pinInput, setPinInput] = useState<string>('');
  const [processingUpdate, setProcessingUpdate] = useState<boolean>(false);
  const [isSavingParking, setIsSavingParking] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<boolean>(false);
  const [noteInput, setNoteInput] = useState<string>('');

  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [showUnitSelector, setShowUnitSelector] = useState<boolean>(false);
  const [editModalData, setEditModalData] = useState({
    unit: '',
    month: '',
    year: 2026,
    amount: 2000,
    due: 0,
    day: '1',
    monthName: 'জানুয়ারি',
    yearVal: '2026',
    isDateEnabled: true,
    status: 'PAID' as 'PAID' | 'DUE' | 'UPCOMING' | 'PARTIAL',
    isOccupied: true, // Local occupancy for this specific entry
    parkingType: 'MOTORCYCLE' as 'MOTORCYCLE' | 'CAR',
    ownershipType: 'OWNER' as 'OWNER' | 'TENANT' | 'EXTERNAL'
  });

  const t = TRANSLATIONS[lang];

  // Date Helper
  const getBanglaDate = () => {
    // Just using standard localized date based on lang
    const locale = lang === 'bn' ? 'bn-BD' : 'en-US';
    return new Date().toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }).replace(/,/g, '');
  };

  const [parkingUnits, setParkingUnits] = useState<string[]>([]);
  const [externalUnits, setExternalUnits] = useState<{id: string, name: string, owner: string}[]>([]);
  const [showParkingManager, setShowParkingManager] = useState(false);
  const [newExternalOwner, setNewExternalOwner] = useState('');
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // SMS Sender State
  const [showSmsSender, setShowSmsSender] = useState<boolean>(false);
  const [smsApiKey, setSmsApiKey] = useLocalStorage('smsApiKey', '');
  const [smsSenderId, setSmsSenderId] = useLocalStorage('smsSenderId', '');
  const [smsMessage, setSmsMessage] = useState('');
  const [smsTemplateType, setSmsTemplateType] = useState<'request' | 'received' | 'due' | 'custom'>('request');
  const [smsTarget, setSmsTarget] = useState<'tenant' | 'owner'>('tenant');
  const [smsMonth, setSmsMonth] = useState<string>(MONTHS_LOGIC[new Date().getMonth()]);
  const [smsSelectedUnits, setSmsSelectedUnits] = useState<string[]>(ALL_UNITS);
  const [smsSentUnits, setSmsSentUnits] = useState<string[]>([]);
  const [isSendingSms, setIsSendingSms] = useState(false);

  // Refresh data when switching to Parking mode or becoming Admin to ensure latest configuration is loaded
  useEffect(() => {
    if (viewMode === 'PARKING' || isAdmin) {
        fetchData(false);
    }
  }, [viewMode, isAdmin]);

  // Fetch data from Supabase
  const fetchData = async (showLoading = true, fetchUnitsInfo = true) => {
    if (showLoading) setLoading(true);
    try {
      // Fetch Payments
      const { data: payData, error: payError } = await supabase
        .from('payments')
        .select('*')
        .eq('year_num', selectedYear);

      if (payError) throw payError;
      if (payData) setDbData(payData as PaymentData[]);

      // Fetch Units Occupancy Info
      if (fetchUnitsInfo) {
        const { data: uData, error: uError } = await supabase
          .from('units_info')
          .select('*');
        
        if (uError) {
            console.error("Error fetching units_info:", uError);
        } else if (uData) {
            const mapping: Record<string, UnitInfo> = {};
            let parkingConfig: string[] | null = null;
            let extUnits: {id: string, name: string, owner: string}[] | null = null;

            uData.forEach((u: any) => {
                // Check for Parking Config
                const isParkingConfig = u.unit_text === '_PARKING_CONFIG_' && u.year_num === selectedYear;
                const isCompositeParkingConfig = u.unit_text === `_PARKING_CONFIG_${selectedYear}`;

                if (isParkingConfig || isCompositeParkingConfig) {
                    try {
                        if (u.note) {
                            const parsed = JSON.parse(u.note);
                            if (Array.isArray(parsed)) {
                                parkingConfig = parsed;
                            } else if (typeof parsed === 'object') {
                                parkingConfig = parsed.selectedStandardUnits || [];
                                extUnits = parsed.externalUnits || [];
                            }
                        }
                    } catch (e) {
                        console.error("Error parsing parking config", e);
                    }
                    return;
                }

                // Use year-specific key if available, otherwise fallback to unit_text
                const key = u.year_num ? `${u.unit_text}-${u.year_num}` : u.unit_text;
                
                mapping[key] = { 
                    unit_text: u.unit_text,
                    is_occupied: u.is_occupied, 
                    note: u.note || '',
                    phone: u.phone || '',
                    confirm_template: u.confirm_template || '',
                    due_template: u.due_template || '',
                    owner_phone: u.owner_phone || '',
                    owner_confirm_template: u.owner_confirm_template || '',
                    owner_due_template: u.owner_due_template || '',
                    year_num: u.year_num
                };
            });
            setUnitsInfo(mapping);
            if (parkingConfig !== null) setParkingUnits(parkingConfig);
            if (extUnits !== null) setExternalUnits(extUnits);
        }
      }

      // Fetch WhatsApp Logs
      const { data: logData, error: logError } = await supabase
        .from('whatsapp_logs')
        .select('*')
        .eq('year_num', selectedYear);
      
      if (!logError && logData) {
        setWhatsAppLogs(logData as WhatsAppLog[]);
      }
      
      setUseMock(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setUseMock(true);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchDueSummaryData = async () => {
    setLoadingDueSummary(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .in('year_num', [2025, 2026]);
      
      if (error) throw error;

      const summaryMap: Record<string, { due2025: number, due2026: number }> = {};
      
      ALL_UNITS.forEach(unit => {
        summaryMap[unit] = { due2025: 0, due2026: 0 };
      });

      const now = new Date();
      const currentRealYear = now.getFullYear();
      const currentRealMonthIdx = now.getMonth();

      ALL_UNITS.forEach(unit => {
        const isOccupiedDefault = unit.slice(-1) !== 'B';
        
        [2025, 2026].forEach(year => {
          const uInfoKey = `${unit}-${year}`;
          const uInfo = unitsInfo[uInfoKey] || unitsInfo[unit];
          const isOccupied = uInfo?.is_occupied ?? isOccupiedDefault;
          const defaultAmount = isOccupied ? 2000 : 500;

          MONTHS_LOGIC.forEach((month, index) => {
            const paymentRecord = data?.find(
              d => d.unit_text === unit && d.month_name === month && d.year_num === year
            );

            if (paymentRecord) {
              if (year === 2025) summaryMap[unit].due2025 += paymentRecord.due;
              if (year === 2026) summaryMap[unit].due2026 += paymentRecord.due;
            } else {
              const isFuture = year > currentRealYear || (year === currentRealYear && index > currentRealMonthIdx);
              if (!isFuture) {
                if (year === 2025) summaryMap[unit].due2025 += defaultAmount;
                if (year === 2026) summaryMap[unit].due2026 += defaultAmount;
              }
            }
          });
        });
      });

      const result = ALL_UNITS.map(unit => ({
        unit,
        due2025: summaryMap[unit].due2025,
        due2026: summaryMap[unit].due2026
      }));

      setDueSummaryData(result);
    } catch (error) {
      console.error('Error fetching due summary data:', error);
    } finally {
      setLoadingDueSummary(false);
    }
  };

  const handleSaveParkingConfig = async (newParkingUnits: string[], newExternalUnits: {id: string, name: string, owner: string}[]) => {
    setIsSavingParking(true);
    
    try {
        const config = {
            selectedStandardUnits: newParkingUnits,
            externalUnits: newExternalUnits
        };
        const configStr = JSON.stringify(config);
        const compositeKey = `_PARKING_CONFIG_${selectedYear}`;

        console.log(`Saving parking config for ${selectedYear}...`);

        // Strategy 1: Try upsert with unit_text as conflict target
        let { error } = await supabase
            .from('units_info')
            .upsert({ 
                unit_text: compositeKey, 
                year_num: selectedYear, 
                note: configStr,
                is_occupied: true 
            }, { onConflict: 'unit_text' });
            
        // Strategy 2: If Strategy 1 fails, try with unit_text and year_num as conflict target
        if (error) {
            console.warn("Upsert with unit_text failed, trying with unit_text,year_num:", error);
            const { error: error2 } = await supabase
                .from('units_info')
                .upsert({ 
                    unit_text: compositeKey, 
                    year_num: selectedYear, 
                    note: configStr,
                    is_occupied: true 
                }, { onConflict: 'unit_text,year_num' });
            error = error2;
        }

        // Strategy 3: If still fails, try a simple insert (might fail if exists, but worth a shot)
        if (error) {
            console.warn("Upsert failed again, trying simple insert:", error);
            const { error: error3 } = await supabase
                .from('units_info')
                .insert({ 
                    unit_text: compositeKey, 
                    year_num: selectedYear, 
                    note: configStr,
                    is_occupied: true 
                });
            // If insert fails because it exists, try update
            if (error3 && error3.code === '23505') {
                 const { error: error4 } = await supabase
                    .from('units_info')
                    .update({ note: configStr })
                    .eq('unit_text', compositeKey);
                 error = error4;
            } else {
                error = error3;
            }
        }
            
        if (error) {
            console.error("All saving strategies failed:", error);
            alert(`সেভ করতে সমস্যা হয়েছে: ${error.message || 'Unknown error'}`);
        } else {
            console.log("Parking config saved successfully");
            setParkingUnits(newParkingUnits);
            setExternalUnits(newExternalUnits);
            setShowParkingManager(false);
            // Refresh data to be sure all users see it
            fetchData(false);
        }
    } catch (e: any) {
        console.error("Exception saving parking config:", e);
        alert(`একটি ত্রুটি ঘটেছে: ${e.message || 'Unknown error'}`);
    } finally {
        setIsSavingParking(false);
    }
  };

  // Admin Logic
  const handleLogin = () => {
    if (pinInput === '1966') { 
      setIsAdmin(true);
      setShowLogin(false);
      setPinInput('');
    } else {
      alert('PIN Error!');
    }
  };

  const handleToggleOccupancy = async (unit: string | null) => {
    if (!unit || !isAdmin || processingUpdate) return;
    setProcessingUpdate(true);
    
    const yearKey = `${unit}-${selectedYear}`;
    const isOccupiedDefault = unit.slice(-1) !== 'B';
    const currentInfo = unitsInfo[yearKey] || unitsInfo[unit] || { unit_text: unit, is_occupied: isOccupiedDefault, note: '' };
    const newVal = !currentInfo.is_occupied;

    // Optimistic update - immediate UI feedback
    const newUnitsInfo = { ...unitsInfo, [yearKey]: { ...currentInfo, is_occupied: newVal } };
    setUnitsInfo(newUnitsInfo);
    
    try {
        // Use a more robust check-then-act pattern to ensure persistence with year_num
        const { data: existing, error: fetchError } = await supabase
            .from('units_info')
            .select('unit_text')
            .eq('unit_text', unit)
            .eq('year_num', selectedYear)
            .maybeSingle();

        if (fetchError) {
            console.warn("Supabase fetch error (year_num might not exist), trying with unit_text only as composite key.");
            // Fallback: try using unit_text as the composite key "unit-year"
            const compositeKey = `${unit}-${selectedYear}`;
            await supabase.from('units_info').upsert({ unit_text: compositeKey, is_occupied: newVal, note: currentInfo.note }, { onConflict: 'unit_text' });
            return;
        }

        let error = null;
        if (existing) {
            const { error: updateError } = await supabase
                .from('units_info')
                .update({ is_occupied: newVal })
                .eq('unit_text', unit)
                .eq('year_num', selectedYear);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('units_info')
                .insert({ unit_text: unit, is_occupied: newVal, note: currentInfo.note, year_num: selectedYear });
            error = insertError;
        }

        if (error) {
            console.error("Supabase error updating occupancy:", error);
        } else {
            // Refresh data to ensure sync
            await fetchData(false, true);
        }
    } catch (err) {
        console.error("Error updating occupancy:", err);
    } finally {
        setProcessingUpdate(false);
    }
  };

  const startEditing = (unit: string, month: string) => {
    if (!isAdmin) return;
    
    // Determine DB Unit Text
    const dbUnitText = viewMode === 'PARKING' ? `${unit}_P` : unit;

    const existing = dbData.find(d => d.unit_text === dbUnitText && d.month_name === month && d.year_num === selectedYear);
    
    const monthIndex = MONTHS_LOGIC.indexOf(month);
    let nextMonthIndex = monthIndex + 1;
    let nextYear = selectedYear;
    if (nextMonthIndex > 11) {
        nextMonthIndex = 0;
        nextYear += 1;
    }
    
    let day = '1';
    let monthName = MONTHS_LOGIC[nextMonthIndex];
    let yearVal = nextYear.toString();
    let isDateEnabled = true;

    if (existing?.paid_date) {
        const parts = existing.paid_date.split(' ');
        if (parts.length >= 3) {
            day = parts[0];
            monthName = parts[1];
            yearVal = parts[2];
        }
    } else if (existing && !existing.paid_date) {
        isDateEnabled = false;
    }

    const isOccupiedDefault = unit.slice(-1) !== 'B';
    let defaultAmount = 0;
    if (viewMode === 'SERVICE') {
        defaultAmount = isOccupiedDefault ? 2000 : 500;
    } else {
        // Parking default
        defaultAmount = 500;
    }

    let initialStatus: 'PAID' | 'DUE' | 'UPCOMING' = 'PAID';
    let initialAmount = defaultAmount;
    let initialDue = 0;
    let modalOccupancy = isOccupiedDefault; // Default to standard unit type occupancy

    if (existing) {
        // If existing data exists, we try to infer occupancy from amount/due
        if (existing.amount === 500 || existing.due === 500) {
            modalOccupancy = false;
        } else if (existing.amount === 2000 || existing.due === 2000) {
            modalOccupancy = true;
        } else {
            // Fallback to global status if amount is custom
            const yearKey = `${unit}-${selectedYear}`;
            modalOccupancy = unitsInfo[yearKey]?.is_occupied ?? unitsInfo[unit]?.is_occupied ?? isOccupiedDefault;
        }

        if (existing.amount > 0) {
            initialStatus = 'PAID';
            initialAmount = existing.amount;
            initialDue = existing.due;
        } else if (existing.due > 0) {
            initialStatus = 'DUE';
            initialAmount = 0;
            initialDue = existing.due;
            if (!existing.paid_date) isDateEnabled = false;
        } else {
            initialStatus = 'UPCOMING';
            initialAmount = 0;
            initialDue = 0;
            isDateEnabled = false;
        }
    } else {
        const now = new Date();
        const currentRealYear = now.getFullYear();
        const currentRealMonthIdx = now.getMonth();
        const isFuture = selectedYear > currentRealYear || (selectedYear === currentRealYear && monthIndex > currentRealMonthIdx);
        
        if (isFuture) {
            initialStatus = 'UPCOMING';
            initialAmount = 0;
            initialDue = 0;
            isDateEnabled = false;
        } else {
            initialStatus = 'DUE';
            initialAmount = 0;
            initialDue = defaultAmount;
            isDateEnabled = false;
        }
    }

    setEditModalData({
      unit,
      month,
      year: selectedYear,
      amount: initialAmount,
      due: initialDue,
      day,
      monthName,
      yearVal,
      isDateEnabled,
      status: initialStatus,
      isOccupied: modalOccupancy,
      parkingType: 'CAR',
      ownershipType: 'OWNER'
    });
    setIsEditModalOpen(true);
  };

  const handleModalSave = async () => {
    if (processingUpdate) return;
    
    setProcessingUpdate(true);

    const { unit, month, year, amount, due, day, monthName, yearVal, isDateEnabled, status } = editModalData;
    
    // Construct date string
    let paidDate = '';
    if (status === 'PAID' || status === 'PARTIAL') {
        if (isDateEnabled) {
             paidDate = `${day} ${monthName} ${yearVal}`;
        } else {
             // If date is disabled but status is PAID/PARTIAL, maybe use current date or keep empty?
             // Existing logic was: (isDateEnabled && status !== 'UPCOMING')
             // Let's stick to user input. If disabled, empty string.
             paidDate = '';
        }
    }

    const finalAmount = status === 'UPCOMING' ? 0 : amount;
    const finalDue = status === 'UPCOMING' ? 0 : due;

    // Determine DB Unit Text
    // If viewMode is PARKING, we append _P. 
    // BUT we must be careful. If the unit is already stored as 2A_P in editModalData.unit, we shouldn't append again.
    // editModalData.unit comes from startEditing(unit, ...). 
    // In startEditing, we pass the raw unit (e.g. '2A').
    // So appending _P is correct if we are in PARKING mode.
    const dbUnitText = viewMode === 'PARKING' ? `${unit}_P` : unit;

    try {
      // Check if record exists
      const { data: existingData, error: fetchError } = await supabase
        .from('payments')
        .select('id')
        .eq('unit_text', dbUnitText)
        .eq('month_name', month)
        .eq('year_num', year)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let error = null;

      if (existingData) {
        // UPDATE
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            amount: finalAmount,
            due: finalDue,
            paid_date: paidDate
          })
          .eq('id', existingData.id);
        error = updateError;
      } else {
        // INSERT
        const { error: insertError } = await supabase
          .from('payments')
          .insert({
            unit_text: dbUnitText,
            month_name: month,
            year_num: year,
            amount: finalAmount,
            due: finalDue,
            paid_date: paidDate
          });
        error = insertError;
      }

      if (error) throw error;

      // Also update occupancy/parking type if needed? 
      // The user didn't explicitly ask to save occupancy changes from this modal to DB in this request,
      // but the modal has occupancy toggles. 
      // Currently handleModalOccupancyChange updates local state `editModalData`.
      // If we want to persist occupancy, we should do it here too.
      // However, occupancy is stored in `units_info`, not `payments`.
      // Let's stick to payments for now as per "Service charge er moto PIN set kore deo edit korar jonno".
      
      await fetchData(false, false); 
      setIsEditModalOpen(false);
      setPinInput(''); // Reset PIN
      
    } catch (err: any) {
      console.error("Error saving payment:", err);
      alert(`সেভ করতে সমস্যা হয়েছে: ${err.message}`);
    } finally {
      setProcessingUpdate(false);
    }
  };

  const handleQuickStatusToggle = async (unit: string, month: string) => {
      // For grid view, we can still use quick toggle or open modal?
      // User said "মাসে ক্লিক করলে ডেটা এন্ট্রি জন্য পপআপ উইন্ডো আসবে"
      // Assuming this applies to the detailed view table mainly.
      // But for consistency, let's make grid view also open modal if admin.
      if (!isAdmin) return;
      startEditing(unit, month);
  };

  const handleSaveNote = async () => {
    if (!isAdmin || processingUpdate || !selectedUnit) return;
    setProcessingUpdate(true);
    
    const isOccupiedDefault = selectedUnit.slice(-1) !== 'B';
    const currentInfo = unitsInfo[selectedUnit] || { unit_text: selectedUnit, is_occupied: isOccupiedDefault, note: '' };

    try {
        const { error } = await supabase
            .from('units_info')
            .upsert({ unit_text: selectedUnit, is_occupied: currentInfo.is_occupied, note: noteInput }, { onConflict: 'unit_text' });

        if (error) throw error;
        setUnitsInfo(prev => ({ ...prev, [selectedUnit]: { ...currentInfo, note: noteInput } }));
        setEditingNote(false);
    } catch (err) {
        console.error("Error saving note:", err);
        // Fallback to local state if column doesn't exist
        setUnitsInfo(prev => ({ ...prev, [selectedUnit]: { ...currentInfo, note: noteInput } }));
        setEditingNote(false);
    } finally {
        setProcessingUpdate(false);
    }
  };

  // Generate Data
  const getUnitData = (unit: string): MonthlyRecord[] => {
    const now = new Date();
    const currentRealYear = now.getFullYear();
    const currentRealMonthIdx = now.getMonth();
    
    // Determine the actual unit text to search in DB (e.g., '2A' or '2A_P')
    const dbUnitText = viewMode === 'PARKING' ? `${unit}_P` : unit;

    return MONTHS_LOGIC.map((month, index) => {
      let paymentRecord: PaymentData | undefined;
      
      paymentRecord = dbData.find(
        d => d.unit_text === dbUnitText && d.month_name === month && d.year_num === selectedYear
      );

      // UI display month string
      const displayMonth = t.months[index];

      if (paymentRecord) {
        let recStatus: Status = 'DUE';
        if (paymentRecord.amount > 0 && paymentRecord.due > 0) recStatus = 'PARTIAL';
        else if (paymentRecord.amount > 0) recStatus = 'PAID';
        else if (paymentRecord.amount === 0 && paymentRecord.due === 0) recStatus = 'UPCOMING';

        return {
          month: displayMonth, // Use translated month for display
          monthIndex: index,
          date: paymentRecord.paid_date || '-',
          amount: paymentRecord.amount,
          due: paymentRecord.due,
          status: recStatus,
          note: paymentRecord.note
        };
      }

      // Default Amounts Logic
      let defaultAmount = 0;
      if (viewMode === 'SERVICE') {
          defaultAmount = (unit.slice(-1) !== 'B') ? 2000 : 500;
      } else {
          // Parking Charge Default: Let's assume 0 for now, or maybe 500? 
          // User didn't specify, so let's default to 0 due (meaning not applicable unless set)
          // Or maybe 500 if they have a car? 
          // Let's stick to 0 for now to be safe, or 500 if occupied?
          // Actually, let's make it 0 and let admin set it.
          defaultAmount = 0; 
      }

      const isFuture = selectedYear > currentRealYear || (selectedYear === currentRealYear && index > currentRealMonthIdx);
      if (isFuture) {
        return { month: displayMonth, monthIndex: index, date: '-', amount: 0, due: 0, status: 'UPCOMING' };
      } else {
        return { month: displayMonth, monthIndex: index, date: '-', amount: 0, due: defaultAmount, status: 'DUE' };
      }
    });
  };

  // Filter visible units based on view mode
  const visibleUnits = useMemo(() => {
    if (viewMode === 'PARKING') {
        const standard = ALL_UNITS.filter(u => parkingUnits.includes(u));
        const external = externalUnits.map(u => u.name);
        return [...standard, ...external];
    }
    return ALL_UNITS;
  }, [viewMode, parkingUnits, externalUnits]);

  const allUnitsSummary = useMemo(() => {
    return visibleUnits.map(unit => {
        const records = getUnitData(unit);
        const collected = records.reduce((sum, r) => sum + (r.status === 'PAID' ? r.amount : 0), 0);
        const due = records.reduce((sum, r) => sum + r.due, 0);
        return { unit, collected, due };
    });
  }, [selectedYear, dbData, unitsInfo, lang, viewMode, visibleUnits]); // Added visibleUnits dependency

  // New: 12-Month Aggregate Stats
  const monthlyStats = useMemo(() => {
    const stats = MONTHS_LOGIC.map((m, i) => ({ 
        month: t.months[i], 
        originalMonth: m,
        collected: 0, 
        due: 0,
        paidUnits: [] as string[],
        dueUnits: [] as string[],
        totalUnits: 0
    }));

    visibleUnits.forEach(unit => {
        const unitRecords = getUnitData(unit); // Returns 12 records
        unitRecords.forEach((record, idx) => {
            if (stats[idx]) {
                stats[idx].totalUnits++;
                if (record.status === 'PAID') {
                    stats[idx].collected += record.amount;
                    stats[idx].paidUnits.push(unit);
                } else if (record.status === 'DUE') {
                    stats[idx].due += record.due;
                    stats[idx].dueUnits.push(unit);
                } else {
                    // UPCOMING or other status
                }
            }
        });
    });

    return stats;
  }, [selectedYear, dbData, unitsInfo, lang, viewMode, visibleUnits]); // Added visibleUnits dependency

  // New: Unit Wise Summary for Monthly Summary View
  const unitWiseSummary = useMemo(() => {
    return visibleUnits.map(unit => {
        const owner = FLAT_OWNERS.find(f => f.flat === unit);
        const externalOwner = externalUnits.find(u => u.name === unit)?.owner;
        const ownerName = owner?.name || externalOwner || 'Unknown';
        
        // We need to call getUnitData inside here, but getUnitData depends on state.
        // Since getUnitData is defined in the component scope, we can use it.
        // However, getUnitData is not memoized, so it might be re-created on every render.
        // But since we are inside the component, it's fine.
        // Wait, getUnitData uses selectedYear and dbData which are dependencies of this useMemo.
        
        // Let's copy the logic of getUnitData or just call it if it's stable enough.
        // Actually, getUnitData is defined in the component body, so it's accessible.
        // But to be safe and avoid stale closures if getUnitData changes (it doesn't seem to depend on anything that isn't in the dependency array of this useMemo),
        // we should be fine.
        
        // Re-implementing getUnitData logic here to be safe and efficient inside the loop
        const now = new Date();
        const currentRealYear = now.getFullYear();
        const currentRealMonthIdx = now.getMonth();

        // Determine the actual unit text to search in DB (e.g., '2A' or '2A_P')
        const dbUnitText = viewMode === 'PARKING' ? `${unit}_P` : unit;

        const records = MONTHS_LOGIC.map((month, index) => {
            const paymentRecord = dbData.find(
                d => d.unit_text === dbUnitText && d.month_name === month && d.year_num === selectedYear
            );
            
            // Display month string
            // const displayMonth = t.months[index]; // Not needed for calculation

            if (paymentRecord) {
                let recStatus = 'DUE';
                if (paymentRecord.amount > 0 && paymentRecord.due > 0) recStatus = 'PARTIAL';
                else if (paymentRecord.amount > 0) recStatus = 'PAID';
                else if (paymentRecord.amount === 0 && paymentRecord.due === 0) recStatus = 'UPCOMING';

                return {
                    date: paymentRecord.paid_date || '-',
                    amount: paymentRecord.amount,
                    due: paymentRecord.due,
                    status: recStatus
                };
            }

            // Default Amount Logic for Summary
            let defaultAmount = 0;
            if (viewMode === 'SERVICE') {
                defaultAmount = (unit.slice(-1) !== 'B') ? 2000 : 500;
            } else {
                defaultAmount = 500;
            }

            const isFuture = selectedYear > currentRealYear || (selectedYear === currentRealYear && index > currentRealMonthIdx);
            
            if (isFuture) {
                return { date: '-', amount: 0, due: 0, status: 'UPCOMING' };
            } else {
                return { date: '-', amount: 0, due: defaultAmount, status: 'DUE' };
            }
        });
        
        // Monthly Charge: 2000 for A/C, 500 for B (Service Charge)
        // For Parking, it's 0 by default unless we have a way to know.
        let monthlyCharge = 0;
        if (viewMode === 'SERVICE') {
            monthlyCharge = (unit.slice(-1) !== 'B') ? 2000 : 500;
        } else {
            // Parking Charge: Maybe calculate average paid amount? Or just 0.
            // Let's use 0 for now as it varies.
            monthlyCharge = 0;
        }
        
        // Total Due for the year
        const totalDue = records.reduce((sum, r) => sum + r.due, 0);
        
        // Last Payment Date (Latest PAID record)
        const paidRecords = records.filter(r => r.status === 'PAID');
        const lastPaidRecord = paidRecords.length > 0 ? paidRecords[paidRecords.length - 1] : null;
        const lastPaymentDate = lastPaidRecord ? lastPaidRecord.date : '-';
        
        return {
            unit,
            ownerName: ownerName,
            monthlyCharge,
            totalDue,
            lastPaymentDate,
            paymentMethod: 'Cash' // Hardcoded as per request
        };
    });
  }, [selectedYear, dbData, unitsInfo, lang, viewMode, visibleUnits, externalUnits]);

  const [selectedMonthStat, setSelectedMonthStat] = useState<any>(null);
  const [detailViewType, setDetailViewType] = useState<'SUMMARY' | 'PAID_LIST' | 'DUE_LIST'>('SUMMARY');
  const [selectedUnitSummary, setSelectedUnitSummary] = useState<any>(null);
  const [showYearlySummary, setShowYearlySummary] = useState<boolean>(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);


  const grandTotalCollected = allUnitsSummary.reduce((acc, curr) => acc + curr.collected, 0);
  const grandTotalDue = allUnitsSummary.reduce((acc, curr) => acc + curr.due, 0);

  // Calculate highest due month
  const highestDueMonthStat = useMemo(() => {
      return monthlyStats.reduce((max, current) => (current.due > max.due ? current : max), monthlyStats[0]);
  }, [monthlyStats]);

  // Aging Report Stats
  const agingStats = useMemo(() => {
    let oneMonth = 0;
    let twoMonths = 0;
    let threePlusMonths = 0;
    let totalAccumulatedDue = 0;

    visibleUnits.forEach(unit => {
        // We need to get unit data. Since getUnitData is not memoized but available in scope, 
        // we'll duplicate the logic slightly to ensure correctness inside this useMemo 
        // or rely on the fact that we can call it.
        // Calling getUnitData(unit) is safe here as it uses state variables which are dependencies.
        const records = getUnitData(unit);
        
        // Only count actual DUE records (past/current months)
        const dueRecords = records.filter(r => r.status === 'DUE');
        const count = dueRecords.length;
        
        if (count === 1) oneMonth++;
        else if (count === 2) twoMonths++;
        else if (count >= 3) threePlusMonths++;

        totalAccumulatedDue += dueRecords.reduce((sum, r) => sum + r.due, 0);
    });

    return { oneMonth, twoMonths, threePlusMonths, totalAccumulatedDue };
  }, [selectedYear, dbData, unitsInfo, lang, viewMode, visibleUnits]);

  const fullYearTableView = (
    <div className="animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-3 mb-6">
            <button 
                onClick={() => setShowFullYearTable(false)}
                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95"
            >
                <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                    {fullYearTableUnitFilter ? `${fullYearTableUnitFilter} এর ১২ মাসের তথ্য` : '১২ মাসের তথ্য'}
                </h2>
                <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">{selectedYear}</p>
            </div>
        </div>

        {/* Year Selection Tabs for 12 Months Info */}
        <div className="bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex mb-6">
            <button 
                onClick={() => setSelectedYear(2025)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${selectedYear === 2025 ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
                <CalendarDays size={16} /> 2025
            </button>
            <button 
                onClick={() => setSelectedYear(2026)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${selectedYear === 2026 ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
                <CalendarDays size={16} /> 2026
            </button>
        </div>

        <div className="space-y-4">
            {MONTHS_LOGIC.map((month, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <button 
                        onClick={() => setSelectedMonthForFullTable(selectedMonthForFullTable === idx ? null : idx)}
                        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${selectedMonthForFullTable === idx ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                {idx + 1}
                            </div>
                            <span className="font-bold text-slate-700 dark:text-white">{month}</span>
                        </div>
                        <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${selectedMonthForFullTable === idx ? 'rotate-180' : ''}`} />
                    </button>

                    {selectedMonthForFullTable === idx && (
                        <div className="border-t border-slate-100 dark:border-slate-700">
                            <div className="overflow-x-auto">
                                <table className="w-full text-[11px]">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-600">
                                            <th className="py-2 pl-4 text-left font-bold text-slate-500 uppercase">ইউনিট ও তারিখ</th>
                                            <th className="py-2 text-center font-bold text-slate-500 uppercase">টাকা</th>
                                            <th className="py-2 text-center font-bold text-slate-500 uppercase">বকেয়া</th>
                                            <th className="py-2 pr-4 text-right font-bold text-slate-500 uppercase">অবস্থা</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                        {(() => {
                                            let totalAmount = 0;
                                            let totalDue = 0;
                                            const unitsToDisplay = fullYearTableUnitFilter ? [fullYearTableUnitFilter] : visibleUnits;
                                            const rows = unitsToDisplay.map(unit => {
                                                const unitData = getUnitData(unit)[idx];
                                                totalAmount += unitData.amount;
                                                totalDue += unitData.due;
                                                return (
                                                    <tr key={unit} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                        <td className="py-3 pl-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-700 dark:text-slate-300">{unit}</span>
                                                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{unitData.date}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 text-center font-bold text-slate-700 dark:text-slate-200">
                                                            {unitData.amount > 0 ? `৳${unitData.amount}` : '-'}
                                                        </td>
                                                        <td className="py-3 text-center font-bold text-red-500">
                                                            {unitData.due > 0 ? `৳${unitData.due}` : '-'}
                                                        </td>
                                                        <td className="py-3 pr-4 text-right">
                                                            <span className={`px-2 py-1 rounded-full text-[9px] font-bold ${
                                                                unitData.status === 'PAID' ? 'bg-green-100 text-green-600' :
                                                                unitData.status === 'DUE' ? 'bg-red-100 text-red-600' :
                                                                unitData.status === 'PARTIAL' ? 'bg-orange-100 text-orange-600' :
                                                                'bg-slate-100 text-slate-500'
                                                            }`}>
                                                                {unitData.status === 'PAID' ? 'পরিশোধ' : 
                                                                 unitData.status === 'DUE' ? 'বকেয়া' : 
                                                                 unitData.status === 'PARTIAL' ? 'আংশিক' : 'বাকি'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                            return (
                                                <>
                                                    {rows}
                                                    <tr className="bg-slate-50 dark:bg-slate-700/50 font-black">
                                                        <td className="py-4 pl-4 text-slate-700 dark:text-white uppercase">মোট যোগফল</td>
                                                        <td className="py-4 text-center text-indigo-600 dark:text-indigo-400">৳{totalAmount.toLocaleString()}</td>
                                                        <td className="py-4 text-center text-red-600 dark:text-red-400">৳{totalDue.toLocaleString()}</td>
                                                        <td className="py-4 pr-4 text-right"></td>
                                                    </tr>
                                                </>
                                            );
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
  );

  if (showFullYearTable) {
    return fullYearTableView;
  }

  const filteredUnitsData = allUnitsSummary.filter(data => 
    data.unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Yearly Summary Modal
  const yearlySummaryModal = showYearlySummary && (
    <div className="fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowYearlySummary(false)}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden" onClick={e => e.stopPropagation()}>
         {/* Decorative Background */}
         <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-50 dark:bg-emerald-900/20 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
         <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-teal-50 dark:bg-teal-900/20 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
         
         <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                        <PieChart size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">বাৎসরিক সামারি</h3>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{selectedYear} এর হিসাব</p>
                    </div>
                </div>
                <button onClick={() => setShowYearlySummary(false)} className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 p-1.5 rounded-full transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="space-y-3">
                {/* Total Collected */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full text-green-600 dark:text-green-300">
                            <CheckCircle2 size={18} />
                        </div>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">বছরে মোট আদায়</span>
                    </div>
                    <span className="text-lg font-black text-green-600 dark:text-green-400 whitespace-nowrap">৳ {grandTotalCollected.toLocaleString()}</span>
                </div>

                {/* Total Due */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-100 dark:bg-red-800 p-2 rounded-full text-red-600 dark:text-red-300">
                            <XCircle size={18} />
                        </div>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">বছরে মোট বকেয়া</span>
                    </div>
                    <span className="text-lg font-black text-red-600 dark:text-red-400 whitespace-nowrap">৳ {grandTotalDue.toLocaleString()}</span>
                </div>

                {/* Highest Due Month */}
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-orange-500" />
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">সবচেয়ে বেশি বকেয়া</span>
                        </div>
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40 px-2 py-0.5 rounded-md">
                            {highestDueMonthStat?.month}
                        </span>
                    </div>
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">এই মাসে বকেয়া ছিল</span>
                        <span className="text-lg font-black text-slate-800 dark:text-white whitespace-nowrap">৳ {highestDueMonthStat?.due.toLocaleString()}</span>
                    </div>
                </div>

                {/* Total Billable (Collected + Due) */}
                <div className="bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 rounded-xl p-4 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">বছরের মোট দাবি (Billable)</span>
                    <span className="text-base font-black text-slate-700 dark:text-slate-300 whitespace-nowrap">৳ {(grandTotalCollected + grandTotalDue).toLocaleString()}</span>
                </div>
            </div>
         </div>
      </div>
    </div>
  );

  // Unit Summary Modal
  const unitSummaryModal = selectedUnitSummary && (
    <div className="fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedUnitSummary(null)}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden" onClick={e => e.stopPropagation()}>
         {/* Decorative Background */}
         <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-50 dark:bg-purple-900/20 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
         <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
         
         <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-lg font-black px-3 py-1 rounded-lg">
                        {selectedUnitSummary.unit}
                    </span>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">{selectedUnitSummary.ownerName}</h3>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{selectedYear} এর হিসাব</p>
                    </div>
                </div>
                <button onClick={() => setSelectedUnitSummary(null)} className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 p-1.5 rounded-full transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="space-y-3">
                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">মাসিক চার্জ</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">৳ {selectedUnitSummary.monthlyCharge.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">সর্বশেষ পেমেন্ট</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedUnitSummary.lastPaymentDate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 dark:text-slate-400">পেমেন্ট মেথড</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedUnitSummary.paymentMethod}</span>
                    </div>
                </div>

                <div className={`rounded-xl p-4 flex items-center justify-between ${selectedUnitSummary.totalDue > 0 ? 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50' : 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${selectedUnitSummary.totalDue > 0 ? 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300' : 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300'}`}>
                            {selectedUnitSummary.totalDue > 0 ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                        </div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                            {selectedUnitSummary.totalDue > 0 ? 'মোট বকেয়া' : 'সব পরিশোধিত'}
                        </span>
                    </div>
                    <span className={`text-lg font-black ${selectedUnitSummary.totalDue > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {selectedUnitSummary.totalDue > 0 ? `৳ ${selectedUnitSummary.totalDue.toLocaleString()}` : 'OK'}
                    </span>
                </div>
            </div>
         </div>
      </div>
    </div>
  );

  const getStatusElement = (status: Status) => {
    switch (status) {
      case 'PAID':
        return (
            <div className="flex flex-col items-center justify-center">
                <div className="bg-green-100 text-green-600 p-1 rounded-full mb-0.5">
                    <CheckCircle2 size={14} />
                </div>
                <span className="text-[9px] font-bold text-green-700">{t.paid}</span>
            </div>
        );
      case 'DUE':
        return (
            <div className="flex flex-col items-center justify-center">
                <div className="bg-red-100 text-red-600 p-1 rounded-full mb-0.5">
                    <XCircle size={14} />
                </div>
                <span className="text-[9px] font-bold text-red-700">{t.due}</span>
            </div>
        );
      case 'PARTIAL':
        return (
            <div className="flex flex-col items-center justify-center">
                <div className="bg-yellow-100 text-yellow-600 p-1 rounded-full mb-0.5">
                    <PieChart size={14} />
                </div>
                <span className="text-[9px] font-bold text-yellow-700">আংশিক</span>
            </div>
        );
      default:
        return (
            <div className="flex flex-col items-center justify-center">
                <div className="bg-slate-100 text-slate-400 p-1 rounded-full mb-0.5">
                    <Clock size={14} />
                </div>
                <span className="text-[9px] font-medium text-slate-500">{t.upcoming}</span>
            </div>
        );
    }
  };

  // Login Modal
  const loginModalContent = showLogin && (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-xs shadow-2xl animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t.adminLogin}</h3>
          <button onClick={() => setShowLogin(false)} className="text-slate-400 hover:text-red-500">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t.loginPrompt}:</p>
        <input 
          type="password" 
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 mb-4 text-center text-2xl tracking-widest font-bold focus:outline-none focus:border-indigo-500 transition-colors text-slate-800 dark:text-white"
          placeholder="••••"
          maxLength={4}
          autoFocus
        />
        <button 
          onClick={handleLogin}
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all"
        >
          {t.loginBtn}
        </button>
      </div>
    </div>
  );

  const getParkingAmount = (pType: 'MOTORCYCLE' | 'CAR', oType: 'OWNER' | 'TENANT' | 'EXTERNAL') => {
      if (pType === 'MOTORCYCLE') {
          return oType === 'OWNER' ? 300 : 500;
      } else {
          return oType === 'OWNER' ? 1000 : 2000;
      }
  };

  const handleStatusChange = (newStatus: 'PAID' | 'DUE' | 'UPCOMING' | 'PARTIAL') => {
      let defaultAmount = 0;
      if (viewMode === 'SERVICE') {
          defaultAmount = editModalData.isOccupied ? 2000 : 500;
      } else {
          defaultAmount = getParkingAmount(editModalData.parkingType, editModalData.ownershipType);
      }

      // If user has manually entered amounts, use that total as base for splitting/switching
      const currentTotal = (editModalData.amount || 0) + (editModalData.due || 0);
      const baseAmount = currentTotal > 0 ? currentTotal : defaultAmount;

      if (newStatus === 'PAID') {
          setEditModalData(prev => ({ ...prev, status: newStatus, amount: baseAmount, due: 0, isDateEnabled: true }));
      } else if (newStatus === 'DUE') {
          setEditModalData(prev => ({ ...prev, status: newStatus, amount: 0, due: baseAmount, isDateEnabled: false }));
      } else if (newStatus === 'UPCOMING') {
          setEditModalData(prev => ({ ...prev, status: newStatus, amount: 0, due: 0, isDateEnabled: false }));
      } else if (newStatus === 'PARTIAL') {
          const halfAmount = baseAmount / 2;
          setEditModalData(prev => ({ ...prev, status: newStatus, amount: halfAmount, due: halfAmount, isDateEnabled: true }));
      }
  };

  const handleModalOccupancyChange = (val: boolean) => {
      let defaultAmount = 0;
      if (viewMode === 'SERVICE') {
          defaultAmount = val ? 2000 : 500;
      } else {
          defaultAmount = getParkingAmount(editModalData.parkingType, editModalData.ownershipType);
      }

      setEditModalData(prev => {
          const updates: any = { isOccupied: val };
          if (prev.status === 'PAID') {
              updates.amount = defaultAmount;
              updates.due = 0;
          } else if (prev.status === 'DUE') {
              updates.amount = 0;
              updates.due = defaultAmount;
          }
          return { ...prev, ...updates };
      });
  };

  const handleParkingTypeChange = (type: 'MOTORCYCLE' | 'CAR') => {
      const defaultAmount = getParkingAmount(type, editModalData.ownershipType);
      setEditModalData(prev => {
          const updates: any = { parkingType: type };
          if (prev.status === 'PAID') {
              updates.amount = defaultAmount;
              updates.due = 0;
          } else if (prev.status === 'DUE') {
              updates.amount = 0;
              updates.due = defaultAmount;
          } else if (prev.status === 'PARTIAL') {
              updates.amount = defaultAmount / 2;
              updates.due = defaultAmount / 2;
          }
          return { ...prev, ...updates };
      });
  };

  const handleOwnershipTypeChange = (type: 'OWNER' | 'TENANT' | 'EXTERNAL') => {
      const defaultAmount = getParkingAmount(editModalData.parkingType, type);
      setEditModalData(prev => {
          const updates: any = { ownershipType: type };
          if (prev.status === 'PAID') {
              updates.amount = defaultAmount;
              updates.due = 0;
          } else if (prev.status === 'DUE') {
              updates.amount = 0;
              updates.due = defaultAmount;
          } else if (prev.status === 'PARTIAL') {
              updates.amount = defaultAmount / 2;
              updates.due = defaultAmount / 2;
          }
          return { ...prev, ...updates };
      });
  };

  const generatePDF = async (unit: string, year: number) => {
    // Use pdf.html to force external browser handling (since it lacks manifest)
    const url = `${window.location.origin}/pdf.html?mode=pdf_download&unit=${unit}&year=${year}&type=${viewMode}`;
    
    // Create a temporary link and click it to attempt forcing external browser
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Payment Edit Modal
  const paymentEditModalContent = isEditModalOpen && (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">পেমেন্ট আপডেট</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              ইউনিট: <span className="font-bold text-slate-700 dark:text-slate-300">{editModalData.unit}</span> | মাস: <span className="font-bold text-slate-700 dark:text-slate-300">{editModalData.month} {editModalData.year}</span>
            </p>
          </div>
          <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-700 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
            {/* Occupancy/Parking Type Selection */}
            <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {viewMode === 'SERVICE' ? 'বসবাসের ধরন (এই মাসের জন্য)' : 'পার্কিং ধরন'}
                </label>
                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                    {viewMode === 'SERVICE' ? (
                        <>
                            <button 
                                onClick={() => handleModalOccupancyChange(true)}
                                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${editModalData.isOccupied ? 'bg-white dark:bg-slate-600 text-green-600 dark:text-green-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                <Users size={12} /> বসবাসরত
                            </button>
                            <button 
                                onClick={() => handleModalOccupancyChange(false)}
                                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${!editModalData.isOccupied ? 'bg-white dark:bg-slate-600 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                <Home size={12} /> খালি
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                onClick={() => handleParkingTypeChange('MOTORCYCLE')}
                                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${editModalData.parkingType === 'MOTORCYCLE' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                মোটরসাইকেল
                            </button>
                            <button 
                                onClick={() => handleParkingTypeChange('CAR')}
                                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${editModalData.parkingType === 'CAR' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                গাড়ি
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Ownership Type (Only for Parking) */}
            {viewMode === 'PARKING' && (
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">মালিকানার ধরন</label>
                    <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                        <button 
                            onClick={() => handleOwnershipTypeChange('OWNER')}
                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${editModalData.ownershipType === 'OWNER' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            ফ্ল্যাট মালিক
                        </button>
                        <button 
                            onClick={() => handleOwnershipTypeChange('TENANT')}
                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${editModalData.ownershipType === 'TENANT' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            ভাড়াটিয়া
                        </button>
                        <button 
                            onClick={() => handleOwnershipTypeChange('EXTERNAL')}
                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${editModalData.ownershipType === 'EXTERNAL' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            বাহিরস্থ
                        </button>
                    </div>
                </div>
            )}

            {/* Status Selection */}
            <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                <button 
                    onClick={() => handleStatusChange('PAID')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${editModalData.status === 'PAID' ? 'bg-white dark:bg-slate-600 text-green-600 dark:text-green-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    পরিশোধিত
                </button>
                <button 
                    onClick={() => handleStatusChange('DUE')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${editModalData.status === 'DUE' ? 'bg-white dark:bg-slate-600 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    বকেয়া
                </button>
                <button 
                    onClick={() => handleStatusChange('UPCOMING')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${editModalData.status === 'UPCOMING' ? 'bg-white dark:bg-slate-600 text-slate-700 dark:text-slate-200 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    আসন্ন
                </button>
                <button 
                    onClick={() => handleStatusChange('PARTIAL')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${editModalData.status === 'PARTIAL' ? 'bg-white dark:bg-slate-600 text-yellow-600 dark:text-yellow-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    আংশিক
                </button>
            </div>

            {editModalData.status !== 'UPCOMING' && (
                <>
                    {/* Amount & Due Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">{t.amount}</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                                <input 
                                    type="number" 
                                    value={editModalData.amount}
                                    onChange={(e) => setEditModalData({...editModalData, amount: Number(e.target.value)})}
                                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2.5 pl-8 pr-3 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">{t.due}</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                                <input 
                                    type="number" 
                                    value={editModalData.due}
                                    onChange={(e) => setEditModalData({...editModalData, due: Number(e.target.value)})}
                                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2.5 pl-8 pr-3 text-sm font-bold text-red-600 dark:text-red-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Date Selection Row */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">পেমেন্ট তারিখ</label>
                            <button 
                                onClick={() => setEditModalData({...editModalData, isDateEnabled: !editModalData.isDateEnabled})}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${editModalData.isDateEnabled ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                            >
                                {editModalData.isDateEnabled ? 'অন আছে' : 'অফ আছে'}
                            </button>
                        </div>
                        
                        {editModalData.isDateEnabled && (
                            <div className="grid grid-cols-3 gap-2">
                                {/* Day Dropdown */}
                                <select 
                                    value={editModalData.day}
                                    onChange={(e) => setEditModalData({...editModalData, day: e.target.value})}
                                    className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2.5 px-2 text-xs font-bold text-slate-700 dark:text-white focus:outline-none focus:border-indigo-500"
                                >
                                    {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>

                                {/* Month Dropdown */}
                                <select 
                                    value={editModalData.monthName}
                                    onChange={(e) => setEditModalData({...editModalData, monthName: e.target.value})}
                                    className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2.5 px-2 text-xs font-bold text-slate-700 dark:text-white focus:outline-none focus:border-indigo-500"
                                >
                                    {MONTHS_LOGIC.map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>

                                {/* Year Dropdown */}
                                <select 
                                    value={editModalData.yearVal}
                                    onChange={(e) => setEditModalData({...editModalData, yearVal: e.target.value})}
                                    className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2.5 px-2 text-xs font-bold text-slate-700 dark:text-white focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="2025">2025</option>
                                    <option value="2026">2026</option>
                                    <option value="2027">2027</option>
                                </select>
                            </div>
                        )}
                    </div>
                </>
            )}
            
            {editModalData.status === 'UPCOMING' && (
                <div className="py-8 text-center bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600">
                    <Clock size={32} className="mx-auto text-slate-300 dark:text-slate-500 mb-2" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">এই মাসের বিল এখনো তৈরি হয়নি</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">তারিখ বা টাকার পরিমাণ প্রয়োজন নেই</p>
                </div>
            )}
        </div>

        <div className="mt-6 flex gap-3">
            <button 
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
                বাতিল
            </button>
            <button 
                onClick={handleModalSave}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <Save size={16} />
                সেভ করুন
            </button>
        </div>
      </div>
    </div>
  );

  // Parking Charge View
  if (showParkingView) {
    return (
      <div className="pb-24 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => setShowParkingView(false)}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">পার্কিং চার্জ</h2>
        </div>

        <div className="space-y-4">
          {/* Option 1 */}
          <button className="w-full bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between group active:scale-[0.98] transition-all hover:border-primary-500 dark:hover:border-primary-400">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet size={24} />
              </div>
              <div className="text-left">
                <h3 className="text-base font-bold text-slate-800 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">সার্ভিস চার্জ সহ পার্কিং চার্জ</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">এক সাথে দেখুন</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
          </button>

          {/* Option 2 */}
          <button 
            onClick={() => {
                setViewMode('PARKING');
                setShowParkingView(false);
            }}
            className="w-full bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between group active:scale-[0.98] transition-all hover:border-orange-500 dark:hover:border-orange-400"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Car size={24} />
              </div>
              <div className="text-left">
                <h3 className="text-base font-bold text-slate-800 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">শুধু পার্কিং চার্জ</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">আলাদাভাবে দেখুন</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-400 group-hover:text-orange-500 transition-colors" />
          </button>
        </div>
      </div>
    );
  }

  // VIEW 1: SINGLE UNIT DETAILED VIEW
  if (selectedUnit) {
    const currentIndex = visibleUnits.indexOf(selectedUnit);
    const prevUnit = currentIndex > 0 ? visibleUnits[currentIndex - 1] : null;
    const nextUnit = currentIndex < visibleUnits.length - 1 ? visibleUnits[currentIndex + 1] : null;

    const records = getUnitData(selectedUnit);
    const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
    const totalDue = records.reduce((sum, r) => sum + r.due, 0);
    
    // Stats for Graph
    const paidCount = records.filter(r => r.status === 'PAID').length;
    const dueCount = records.filter(r => r.status === 'DUE').length;
    const upcomingCount = records.filter(r => r.status === 'UPCOMING').length;
    
    const yearKey = `${selectedUnit}-${selectedYear}`;
    const isOccupied = unitsInfo[yearKey]?.is_occupied ?? unitsInfo[selectedUnit]?.is_occupied ?? (selectedUnit.slice(-1) !== 'B'); 
    const occupancyStatus = isOccupied ? t.occupied : t.vacant;
    const unitNote = unitsInfo[yearKey]?.note || unitsInfo[selectedUnit]?.note || '';

    // Important: Changing occupancy status should NOT affect already saved payment records.
    // getUnitData handles this by checking if a payment record exists first.

    // Summary Modal
    const summaryModalContent = showSummaryModal && selectedUnit && (
      <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowSummaryModal(false)}>
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden" onClick={e => e.stopPropagation()}>
          {/* Decorative background */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-2xl opacity-60 pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-2xl opacity-60 pointer-events-none"></div>
          
          <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-2.5 rounded-xl shadow-md shadow-indigo-200 dark:shadow-none">
                          <PieChart size={22} className="text-white" />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">সামারি রিপোর্ট</h3>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{selectedYear} সাল</p>
                      </div>
                  </div>
                  <button onClick={() => setShowSummaryModal(false)} className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 p-1.5 rounded-full transition-colors">
                      <X size={16} />
                  </button>
              </div>

              <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                          <Home size={18} className="text-indigo-500 dark:text-indigo-400" />
                          <span className="text-sm font-medium">ফ্ল্যাট নম্বর</span>
                      </div>
                      <span className="text-base font-bold text-slate-800 dark:text-white">{selectedUnit}</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                          <Users size={18} className="text-blue-500 dark:text-blue-400" />
                          <span className="text-sm font-medium">ফ্ল্যাট মালিক</span>
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-white text-right">{FLAT_OWNERS.find(f => f.flat === selectedUnit)?.name || 'অজানা'}</span>
                  </div>

                  <div 
                    className={`bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl p-4 flex items-center justify-between transition-all ${isAdmin && !processingUpdate ? 'cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-100 dark:hover:border-indigo-800 active:scale-[0.98]' : (processingUpdate ? 'opacity-70 cursor-wait' : '')}`}
                    onClick={() => handleToggleOccupancy(selectedUnit)}
                  >
                      <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                          <Grid size={18} className={occupancyStatus === t.occupied ? 'text-green-500' : 'text-orange-500'} />
                          <span className="text-sm font-medium">বসবাসের ধরন</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {processingUpdate ? (
                           <RefreshCw size={12} className="animate-spin text-indigo-500" />
                        ) : (
                          <>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${occupancyStatus === t.occupied ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>
                                {occupancyStatus}
                            </span>
                            {isAdmin && <Edit3 size={10} className="text-slate-400" />}
                          </>
                        )}
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 rounded-2xl p-4 text-white shadow-lg shadow-slate-900/20 dark:shadow-none">
                          <p className="text-[10px] text-slate-300 font-medium uppercase tracking-wider mb-1">মোট টাকা</p>
                          <p className="font-bold text-base sm:text-lg whitespace-nowrap">৳ {totalAmount.toLocaleString()}</p>
                      </div>
                      <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-4 text-white shadow-lg shadow-red-500/20 dark:shadow-none">
                          <p className="text-[10px] text-red-100 font-medium uppercase tracking-wider mb-1">মোট বকেয়া</p>
                          <p className="font-bold text-base sm:text-lg whitespace-nowrap">৳ {totalDue.toLocaleString()}</p>
                      </div>
                  </div>
              </div>
              
              <button 
                  onClick={() => setShowSummaryModal(false)}
                  className="w-full mt-6 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl transition-colors text-sm"
              >
                  বন্ধ করুন
              </button>
          </div>
        </div>
      </div>
    );

    // Unit Selector Modal
    const unitSelectorModalContent = showUnitSelector && (
      <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowUnitSelector(false)}>
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white text-center mb-4">ইউনিট সিলেক্ট করুন</h3>
          
          <button 
            onClick={() => {
              onUnitSelect(null);
              setShowUnitSelector(false);
            }}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl mb-4 transition-colors shadow-md shadow-indigo-200 dark:shadow-none"
          >
            সকল ইউনিট
          </button>
          
          <div className="grid grid-cols-3 gap-1.5 pb-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {visibleUnits.map((unit) => (
              <button
                key={unit}
                onClick={() => {
                  onUnitSelect(unit);
                  setShowUnitSelector(false);
                }}
                className={`py-1.5 rounded-lg font-bold transition-all shadow-sm border ${unit.length > 6 ? 'text-[10px]' : 'text-xs'} ${
                  selectedUnit === unit 
                    ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700' 
                    : 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
          
          <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-3 overflow-hidden">
             <div className="text-red-600 dark:text-red-400 text-xs font-bold animate-marquee whitespace-nowrap">
               । কোনো ইউনিট এর হিসাব দেখতে উপরের ইউনিট এ ক্লিক করুন। সকল ইউনিট এর হিসাব ডিটেইস এ দেওয়া আছে।
             </div>
          </div>
          
          <div className="flex justify-center mt-3">
            <button 
              onClick={() => setShowUnitSelector(false)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-10 rounded-xl transition-colors text-sm shadow-md shadow-red-200 dark:shadow-none"
            >
              বন্ধ
            </button>
          </div>
        </div>
      </div>
    );

    return (
      <div key={`${selectedUnit}-${selectedYear}`} className="pb-24 animate-in slide-in-from-right duration-500 bg-slate-50 dark:bg-slate-900 min-h-screen relative">
        {loginModalContent}
        {paymentEditModalContent}
        {summaryModalContent}
        {unitSelectorModalContent}
        
        {/* Navigation Header Section */}
        <div className="bg-white dark:bg-slate-800 relative border-b border-slate-100 dark:border-slate-700 shadow-sm transition-all">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50 dark:border-slate-700">
                 <button 
                  onClick={() => onUnitSelect(null)}
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors py-1 group"
                >
                  <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                  <span className="text-base font-bold">{t.back}</span>
                </button>

                {/* Admin Toggle in Unit View */}
                <button 
                  onClick={() => isAdmin ? setIsAdmin(false) : setShowLogin(true)}
                  className={`p-2 rounded-full transition-colors ${isAdmin ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300'}`}
                >
                  {isAdmin ? <Unlock size={18} /> : <Lock size={18} />}
                </button>
            </div>
            
            <div className="flex items-center justify-between px-6 py-3">
                 <button 
                    onClick={() => prevUnit && onUnitSelect(prevUnit)}
                    disabled={!prevUnit}
                    className={`p-2 rounded-full transition-all ${!prevUnit ? 'text-slate-100 dark:text-slate-800 cursor-not-allowed' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 hover:text-primary-600 dark:hover:text-primary-400'}`}
                 >
                    <ChevronLeft size={32} />
                 </button>
                 
                 <div 
                    onClick={() => setShowUnitSelector(true)}
                    className="text-center animate-in zoom-in duration-300 cursor-pointer hover:scale-105 transition-transform active:scale-95"
                  >
                    <h2 className={`font-black text-slate-800 dark:text-white tracking-tight ${selectedUnit.length > 6 ? 'text-lg leading-tight' : 'text-4xl'}`}>{selectedUnit}</h2>
                    <p className="text-sm font-bold text-primary-600 dark:text-primary-400 mt-1">
                      {(() => {
                          const owner = FLAT_OWNERS.find(f => f.flat === selectedUnit);
                          const externalOwner = externalUnits.find(u => u.name === selectedUnit)?.owner;
                          return owner?.name || externalOwner || 'Unknown';
                      })()}
                    </p>
                 </div>
 
                 <button 
                    onClick={() => nextUnit && onUnitSelect(nextUnit)}
                    disabled={!nextUnit}
                    className={`p-2 rounded-full transition-all ${!nextUnit ? 'text-slate-100 dark:text-slate-800 cursor-not-allowed' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 hover:text-primary-600 dark:hover:text-primary-400'}`}
                 >
                    <ChevronRight size={32} />
                 </button>
            </div>
        </div>

        {/* Admin Tip */}
        {isAdmin && (
           <div className="bg-indigo-600 text-white text-[10px] py-1.5 px-4 text-center font-bold animate-in slide-in-from-top flex items-center justify-center gap-2">
             <Edit3 size={12} /> {t.editInfo}
           </div>
        )}

        {/* Year Selection Tabs */}
        <div className="px-4 pt-4 pb-0">
             <div className="bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex">
                <button 
                    onClick={() => setSelectedYear(2025)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${selectedYear === 2025 ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    <CalendarDays size={16} /> 2025
                </button>
                <button 
                    onClick={() => setSelectedYear(2026)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${selectedYear === 2026 ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    <CalendarDays size={16} /> 2026
                </button>
            </div>
        </div>

        {/* PDF Download Button */}
        <div className="px-4 pt-4">
            <button 
                onClick={() => generatePDF(selectedUnit, selectedYear)}
                disabled={isGeneratingPDF}
                className={`w-full bg-yellow-400 hover:bg-yellow-500 border border-yellow-600/20 py-2 px-4 rounded-xl shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all ${isGeneratingPDF ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                        {isGeneratingPDF ? <RefreshCw size={18} className="animate-spin" /> : <FileDown size={18} />}
                    </div>
                    <div className="text-left">
                        <h3 className="text-xs font-bold text-yellow-950 transition-colors">
                            {viewMode === 'PARKING' ? 'পার্কিং চার্জ পিডিএফ ডাউনলোড' : 'সার্ভিস চার্জ পিডিএফ ডাউনলোড'}
                        </h3>
                        <p className="text-[9px] text-yellow-900/70 font-medium">ইউনিট {selectedUnit} এর {selectedYear} সালের রিপোর্ট</p>
                    </div>
                </div>
                <ArrowUpRight size={16} className="text-yellow-900/50 group-hover:text-yellow-900 transition-colors" />
            </button>
        </div>

        {/* Summary Box */}
        <div className="px-4 pt-4">
            <div 
                className={`rounded-2xl p-4 shadow-lg border border-white/10 dark:border-white/5 grid ${viewMode === 'SERVICE' ? 'grid-cols-3' : 'grid-cols-2'} gap-2 divide-x divide-white/20 text-white transition-all duration-500`}
                style={{ background: 'linear-gradient(135deg, #6a11cb, #2575fc)' }}
            >
                {viewMode === 'SERVICE' && (
                    <button 
                        onClick={() => handleToggleOccupancy(selectedUnit)}
                        disabled={!isAdmin || processingUpdate}
                        className={`text-center px-1 flex flex-col items-center justify-center transition-all ${isAdmin && !processingUpdate ? 'active:scale-95 cursor-pointer' : 'opacity-80 cursor-not-allowed'}`}
                    >
                        <p className="text-[10px] text-white/80 font-medium uppercase mb-1">{t.occupancy}</p>
                        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${occupancyStatus === t.occupied ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'bg-white/90 dark:bg-slate-800/90 text-orange-600 dark:text-orange-400'}`}>
                            {processingUpdate ? (
                                <RefreshCw size={12} className="animate-spin" />
                            ) : (
                                <>
                                    {occupancyStatus === t.occupied ? <Users size={12} /> : <Home size={12} />}
                                    {occupancyStatus}
                                </>
                            )}
                        </div>
                    </button>
                )}
                <div className="text-center px-1 flex flex-col items-center justify-center">
                    <p className="text-[10px] text-white/80 font-medium uppercase mb-1">{t.totalAmount}</p>
                    <p className="font-bold text-white text-base">৳ {totalAmount.toLocaleString()}</p>
                </div>
                <div className="text-center px-1 flex flex-col items-center justify-center">
                    <p className="text-[10px] text-white/80 font-medium uppercase mb-1">{t.totalDue}</p>
                    <p className="font-bold text-base text-white">৳ {totalDue.toLocaleString()}</p>
                </div>
            </div>
        </div>



        {/* Ledger Table Section */}
        <div className="p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-600">
                            <th className="py-3 pl-3 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[28%]">{t.monthDate}</th>
                            <th className="py-3 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[22%]">{t.amount}</th>
                            <th className="py-3 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[22%]">{t.due}</th>
                            <th className="py-3 pr-3 text-right text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[28%]">{t.status}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {records.map((record, idx) => {
                            const isEditable = isAdmin && !processingUpdate;
                            // For DB operations, we need the original month name (Bangla)
                            const dbMonth = MONTHS_LOGIC[record.monthIndex];

                            return (
                              <React.Fragment key={idx}>
                                <tr 
                                  key={idx} 
                                  className={`
                                    transition-all duration-200 
                                    ${record.status === 'DUE' ? 'bg-red-50/10 dark:bg-red-900/10' : ''}
                                    ${isEditable ? 'hover:bg-indigo-50 dark:hover:bg-indigo-900/30 active:bg-indigo-100/50 dark:active:bg-indigo-900/50' : 'hover:bg-slate-50/50 dark:hover:bg-slate-700/50'}
                                  `}
                                >
                                  <td onClick={() => isEditable && startEditing(selectedUnit, dbMonth)} className="py-3 pl-3 align-middle cursor-pointer">
                                      <div className="font-bold text-slate-800 dark:text-white text-sm">{record.month}</div>
                                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 whitespace-nowrap">{record.date}</div>
                                  </td>
                                  <td onClick={() => isEditable && startEditing(selectedUnit, dbMonth)} className="py-3 align-middle text-center cursor-pointer">
                                      <div className={`font-semibold text-sm ${record.amount > 0 ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'}`}>
                                          {record.amount > 0 ? `৳${record.amount}` : '-'}
                                      </div>
                                  </td>
                                  <td onClick={() => isEditable && startEditing(selectedUnit, dbMonth)} className="py-3 align-middle text-center cursor-pointer">
                                        <div className={`font-semibold text-sm ${record.due > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-300 dark:text-slate-600'}`}>
                                          {record.due > 0 ? `৳${record.due}` : '-'}
                                        </div>
                                  </td>
                                  <td className="py-3 pr-3 align-middle flex justify-end">
                                      <div onClick={() => isEditable && startEditing(selectedUnit, dbMonth)}>
                                        {isAdmin ? (
                                            <div className={`px-2 py-1.5 rounded-lg text-[9px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                            record.status === 'PAID' 
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 shadow-sm' 
                                                : record.status === 'PARTIAL'
                                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 shadow-sm'
                                                : record.status === 'DUE'
                                                ? 'bg-white dark:bg-slate-800 text-red-500 dark:text-red-400 border-red-200 dark:border-red-800 shadow-sm'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 shadow-sm'
                                            }`}>
                                            {record.status === 'PAID' ? <CheckCircle2 size={10} /> : record.status === 'PARTIAL' ? <PieChart size={10} /> : record.status === 'DUE' ? <XCircle size={10} /> : <Clock size={10} />}
                                            {record.status === 'PAID' ? t.paid : record.status === 'PARTIAL' ? 'আংশিক' : record.status === 'DUE' ? t.due : t.upcoming}
                                            </div>
                                        ) : (
                                            getStatusElement(record.status)
                                        )}
                                      </div>
                                  </td>
                              </tr>
                            </React.Fragment>
                          );
                        })}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-700 border-t border-slate-200 dark:border-slate-600">
                        <tr>
                            <td className="py-3 pl-3 text-sm font-bold text-slate-700 dark:text-slate-200">{t.total}</td>
                            <td className="py-3 text-center text-sm font-bold text-slate-700 dark:text-slate-200">৳ {totalAmount.toLocaleString()}</td>
                            <td className="py-3 text-center text-sm font-bold text-red-600 dark:text-red-400">{totalDue > 0 ? `৳ ${totalDue.toLocaleString()}` : '-'}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            {/* Premium Note Box */}
            <div className="mb-6 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-orange-500"></div>
                <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="bg-amber-100/50 dark:bg-amber-900/30 p-2 rounded-xl text-amber-600 dark:text-amber-400">
                                <Edit3 size={18} strokeWidth={2.5} />
                            </div>
                            <h4 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">জরুরী নোট</h4>
                        </div>
                        {isAdmin && !editingNote && (
                            <button 
                                onClick={() => { setNoteInput(unitNote); setEditingNote(true); }}
                                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                            >
                                <Edit3 size={12} /> এডিট
                            </button>
                        )}
                    </div>
                    
                    <div className="pl-11 pr-2">
                        {editingNote ? (
                            <div className="animate-in fade-in zoom-in-95 duration-200">
                                <textarea 
                                    value={noteInput}
                                    onChange={(e) => setNoteInput(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-700 border border-amber-200/60 dark:border-amber-700/60 rounded-xl p-3.5 text-sm text-slate-700 dark:text-white focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 min-h-[100px] resize-none transition-all"
                                    placeholder="এখানে জরুরী নোট লিখুন..."
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2 mt-3">
                                    <button 
                                        onClick={() => setEditingNote(false)}
                                        className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                    >
                                        বাতিল
                                    </button>
                                    <button 
                                        onClick={handleSaveNote}
                                        className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 rounded-xl transition-all shadow-md shadow-amber-500/20 dark:shadow-none active:scale-95"
                                    >
                                        সেভ করুন
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div 
                                className={`text-sm leading-relaxed ${unitNote ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500 italic'} min-h-[40px] ${isAdmin ? 'cursor-pointer' : ''}`}
                                onClick={() => {
                                    if (isAdmin) {
                                        setNoteInput(unitNote);
                                        setEditingNote(true);
                                    }
                                }}
                            >
                                {unitNote || (isAdmin ? 'নোট যোগ করতে এখানে ক্লিক করুন...' : 'কোনো নোট নেই')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* 12 Months Info Button for this specific unit */}
            <div className="mb-6">
                <button 
                    onClick={() => {
                        setFullYearTableUnitFilter(selectedUnit);
                        setShowFullYearTable(true);
                    }}
                    className="w-full bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 shadow-lg border border-white/10 flex items-center justify-between group active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl text-white group-hover:scale-110 transition-transform">
                            <CalendarIcon size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-base font-bold text-white">১২ মাসের তথ্য</h3>
                            <p className="text-xs text-indigo-100 font-medium opacity-90">এই ইউনিটের পুরো বছরের বিস্তারিত হিসাব দেখুন</p>
                        </div>
                    </div>
                    <div className="bg-white/20 p-2 rounded-full text-white group-hover:bg-white/30 transition-colors">
                        <ChevronRight size={20} />
                    </div>
                </button>
            </div>

            {/* Payment Status Graph */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-50 dark:border-slate-700 pb-3">
                    <PieChart size={20} className="text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">{t.paymentStatus} ({selectedYear})</h3>
                </div>
                
                {/* Premium Pie Chart */}
                <div className="flex flex-col items-center justify-center mb-2">
                    <div className="w-full h-[250px] cursor-pointer" onClick={() => setShowSummaryModal(true)}>
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                                <Pie
                                    data={[
                                        { name: t.paid, value: paidCount, color: '#22c55e' },
                                        { name: t.due, value: dueCount, color: '#ef4444' },
                                        { name: t.upcoming, value: upcomingCount, color: '#cbd5e1' },
                                    ].filter(item => item.value > 0)}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={65}
                                    dataKey="value"
                                    labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, value, name }) => {
                                        const RADIAN = Math.PI / 180;
                                        const radius = outerRadius + 20;
                                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                        
                                        return (
                                            <text x={x} y={y} fill="#94a3b8" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
                                                {`${name} ${value}`}
                                            </text>
                                        );
                                    }}
                                >
                                    {[
                                        { name: t.paid, value: paidCount, color: '#22c55e' },
                                        { name: t.due, value: dueCount, color: '#ef4444' },
                                        { name: t.upcoming, value: upcomingCount, color: '#cbd5e1' },
                                    ].filter(item => item.value > 0).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Status List */}
                    <div className="w-full grid grid-cols-3 gap-3 mt-4">
                        <div className="bg-green-50/50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl p-3 flex flex-col items-center justify-center">
                            <span className="text-xl font-black text-green-600 dark:text-green-400">{paidCount}</span>
                            <span className="text-[10px] font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">{t.paid}</span>
                        </div>
                        <div className="bg-red-50/50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-3 flex flex-col items-center justify-center">
                            <span className="text-xl font-black text-red-600 dark:text-red-400">{dueCount}</span>
                            <span className="text-[10px] font-bold text-red-700 dark:text-red-300 uppercase tracking-wider">{t.due}</span>
                        </div>
                        <div className="bg-slate-50/50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded-xl p-3 flex flex-col items-center justify-center">
                            <span className="text-xl font-black text-slate-600 dark:text-slate-400">{upcomingCount}</span>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.upcoming}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Month Grid Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-50 dark:border-slate-700 pb-2">
                    <CalendarDays size={18} className="text-primary-600 dark:text-primary-400" />
                    <h3 className="font-bold text-slate-700 dark:text-white">{t.month} গ্রিড ({selectedYear})</h3>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {records.map((record, idx) => {
                        const dbMonth = MONTHS_LOGIC[record.monthIndex];
                        return (
                        <div
                            key={idx}
                            onClick={() => isAdmin && !processingUpdate && handleQuickStatusToggle(selectedUnit, dbMonth)}
                            className={`
                                aspect-[4/3] rounded-lg flex flex-col items-center justify-center text-center transition-all relative overflow-hidden shadow-sm border
                                ${record.status === 'PAID' ? 'bg-green-500 text-white border-green-600' : ''}
                                ${record.status === 'DUE' ? 'bg-red-500 text-white border-red-600' : ''}
                                ${record.status === 'UPCOMING' ? 'bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-600' : ''}
                                ${isAdmin ? 'cursor-pointer hover:opacity-90 active:scale-95' : ''}
                            `}
                        >
                            <span className="text-[10px] font-bold leading-tight">{record.month}</span>
                            {record.status === 'PAID' && (
                                <div className="mt-0.5"><CheckCircle2 size={12} /></div>
                            )}
                             {record.status === 'DUE' && (
                                <span className="text-[9px] mt-0.5 font-bold opacity-90">{t.due}</span>
                            )}
                             {record.status === 'UPCOMING' && (
                                <span className="text-[9px] mt-0.5 font-bold opacity-90">{t.upcoming}</span>
                            )}
                        </div>
                    );
                    })}
                </div>
            </div>
        </div>
      </div>
    );
  }

  // Month Detail Modal
  const monthDetailModal = selectedMonthStat && (
    <div className="fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedMonthStat(null)}>
      <div className={`bg-white dark:bg-slate-800 rounded-2xl p-4 w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden flex flex-col ${detailViewType === 'SUMMARY' ? 'max-h-[85vh]' : 'max-h-[50vh]'}`} onClick={e => e.stopPropagation()}>
         {/* Decorative Background */}
         <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
         <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
         
         <div className="relative z-10 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-3 shrink-0">
                <div>
                    {detailViewType === 'SUMMARY' ? (
                        <>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{selectedMonthStat.month}</h3>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{selectedYear} এর হিসাব</p>
                        </>
                    ) : (
                        <button 
                            onClick={() => setDetailViewType('SUMMARY')}
                            className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                            <ArrowLeft size={18} />
                            <span className="font-bold text-base">{detailViewType === 'PAID_LIST' ? 'পরিশোধিত তালিকা' : 'বকেয়া তালিকা'}</span>
                        </button>
                    )}
                </div>
                <button onClick={() => setSelectedMonthStat(null)} className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 p-1.5 rounded-full transition-colors">
                    <X size={16} />
                </button>
            </div>

            {detailViewType === 'SUMMARY' ? (
                <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                    {/* Main Stats Grid */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
                            <div className="bg-green-100 dark:bg-green-800 p-1.5 rounded-full text-green-600 dark:text-green-300 mb-1">
                                <CheckCircle2 size={16} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">{t.totalCollected}</span>
                            <span className="text-base font-black text-green-600 dark:text-green-400">৳ {selectedMonthStat.collected.toLocaleString()}</span>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
                            <div className="bg-red-100 dark:bg-red-800 p-1.5 rounded-full text-red-600 dark:text-red-300 mb-1">
                                <XCircle size={16} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">{t.totalDue}</span>
                            <span className="text-base font-black text-red-600 dark:text-red-400">৳ {selectedMonthStat.due.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Unit Counts */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-50 dark:border-slate-700">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                <Home size={14} className="text-indigo-500" />
                                {t.unit} সংখ্যা
                            </span>
                            <span className="text-base font-black text-slate-800 dark:text-white">{selectedMonthStat.totalUnits} টি</span>
                        </div>
                        
                        <div className="space-y-2">
                            <button 
                                onClick={() => setDetailViewType('PAID_LIST')}
                                className="w-full flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-700/50 p-1.5 -mx-1.5 rounded-lg transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-[10px]">
                                        <Check size={12} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">পরিশোধ করেছে</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-bold text-green-600 dark:text-green-400">{selectedMonthStat.paidUnits.length} টি</span>
                                    <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400" />
                                </div>
                            </button>

                            <button 
                                onClick={() => setDetailViewType('DUE_LIST')}
                                className="w-full flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-700/50 p-1.5 -mx-1.5 rounded-lg transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-[10px]">
                                        <X size={12} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">বাকি আছে</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-bold text-red-600 dark:text-red-400">{selectedMonthStat.dueUnits.length} টি</span>
                                    <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400" />
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* One Line Status */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-3 text-white shadow-md shadow-indigo-200 dark:shadow-none">
                        <div className="flex items-start gap-2">
                            <div className="bg-white/20 p-1.5 rounded-lg shrink-0">
                                <Info size={14} className="text-white" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-medium text-indigo-100 leading-relaxed">
                                    এই মাসে <span className="font-bold text-white">{selectedMonthStat.totalUnits}</span> ইউনিটের মধ্যে <span className="font-bold text-white">{selectedMonthStat.paidUnits.length}টি</span> পরিশোধ করেছে।
                                </p>
                                <p className="text-[10px] font-medium text-indigo-100 leading-relaxed">
                                    এবং <span className="font-bold text-white">{selectedMonthStat.totalUnits}</span> ইউনিটের মধ্যে <span className="font-bold text-white">{selectedMonthStat.dueUnits.length}টি</span> বাকি আছে।
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // LIST VIEW (PAID or DUE)
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 mb-2 shrink-0">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
                            <span>ইউনিট</span>
                            <span>ফ্ল্যাট মালিক</span>
                        </div>
                    </div>
                    
                    <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar space-y-1.5">
                        {(detailViewType === 'PAID_LIST' ? selectedMonthStat.paidUnits : selectedMonthStat.dueUnits).map((unit: string, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                    <span className={`
                                        font-bold text-xs w-8 h-8 rounded-lg flex items-center justify-center
                                        ${detailViewType === 'PAID_LIST' 
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}
                                    `}>
                                        {unit}
                                    </span>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                            {FLAT_OWNERS.find(f => f.flat === unit)?.name || 'Unknown'}
                                        </span>
                                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                                            {detailViewType === 'PAID_LIST' ? 'পরিশোধিত' : 'বকেয়া'}
                                        </span>
                                    </div>
                                </div>
                                {detailViewType === 'PAID_LIST' ? (
                                    <CheckCircle2 size={14} className="text-green-500 dark:text-green-400" />
                                ) : (
                                    <XCircle size={14} className="text-red-500 dark:text-red-400" />
                                )}
                            </div>
                        ))}
                        
                        {(detailViewType === 'PAID_LIST' ? selectedMonthStat.paidUnits : selectedMonthStat.dueUnits).length === 0 && (
                            <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                                <p className="text-xs">কোনো ইউনিট পাওয়া যায়নি</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
         </div>
      </div>
    </div>
  );

  const handleSendSms = async () => {
    if (!smsApiKey || !smsSenderId || !smsMessage) {
        alert('অনুগ্রহ করে API Key, Sender ID এবং Message প্রদান করুন।');
        return;
    }
    if (smsSelectedUnits.length === 0) {
        alert('অনুগ্রহ করে অন্তত একটি ইউনিট নির্বাচন করুন।');
        return;
    }

    if (!confirm(`আপনি কি নিশ্চিত যে আপনি ${smsSelectedUnits.length} টি ইউনিটে এসএমএস পাঠাতে চান?`)) return;

    setIsSendingSms(true);
    let successCount = 0;
    let failCount = 0;

    try {
        for (const unit of smsSelectedUnits) {
            const uInfoKey = `${unit}-${selectedYear}`;
            const uInfo = (unitsInfo[uInfoKey] || unitsInfo[unit] || DEFAULT_UNIT_INFO) as UnitInfo;
            const phone = smsTarget === 'tenant' ? (uInfo.phone || '') : (uInfo.owner_phone || '');

            if (!phone) {
                failCount++;
                continue;
            }

            // Clean phone number (remove +88, spaces, dashes)
            let cleanPhone = phone.replace(/[^0-9]/g, '');
            if (cleanPhone.startsWith('88')) {
                cleanPhone = cleanPhone.substring(2);
            }

            if (cleanPhone.length !== 11) {
                failCount++;
                continue;
            }

            // Calculate Amount
            const payment = dbData.find(d => d.unit_text === unit && d.month_name === smsMonth && d.year_num === selectedYear);
            const dueAmount = payment ? payment.due : (unit.slice(-1) !== 'B' ? 2000 : 500);
            const paidAmount = payment ? payment.amount : 0;
            
            // If message implies due, show due amount. If paid, show paid amount.
            // A simple heuristic: if message contains 'পাওয়া গেছে' or 'গ্রহণ করা হয়েছে', use paidAmount, else use dueAmount.
            const isPaidMessage = smsMessage.includes('পাওয়া গেছে') || smsMessage.includes('গ্রহণ করা হয়েছে') || smsMessage.includes('সফলভাবে');
            const amountToReplace = isPaidMessage ? paidAmount : dueAmount;

            // Replace variables in message
            const personalizedMessage = smsMessage
                .replace(/{{unit}}/g, unit)
                .replace(/{{amount}}/g, amountToReplace.toString());

            try {
                const response = await fetch(`https://bulksmsbd.net/api/smsapi?api_key=${smsApiKey}&type=text&number=${cleanPhone}&senderid=${smsSenderId}&message=${encodeURIComponent(personalizedMessage)}`);
                const data = await response.json();
                
                if (data.response_code === 202) {
                    successCount++;
                    setSmsSentUnits(prev => [...prev, unit]);
                } else {
                    failCount++;
                    console.error('SMS API Error:', data);
                }
            } catch (e) {
                console.error('Fetch Error:', e);
                failCount++;
            }
        }

        alert(`এসএমএস পাঠানো সম্পন্ন হয়েছে!\nসফল: ${successCount}\nব্যর্থ: ${failCount}`);
    } catch (e) {
        console.error(e);
        alert('এসএমএস পাঠাতে সমস্যা হয়েছে।');
    } finally {
        setIsSendingSms(false);
    }
  };

  // VIEW 2 & 3 Combined Logic Wrapper
  return (
    <div className="px-4 pb-24 animate-in slide-in-from-bottom-4 duration-500 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {loginModalContent}
      {paymentEditModalContent}
      {monthDetailModal}
      {unitSummaryModal}
      {yearlySummaryModal}
      
      <AIAssistant 
        isOpen={showAIAssistant} 
        onClose={() => setShowAIAssistant(false)} 
        contextData={{
          payments: dbData,
          unitsInfo: unitsInfo,
          parkingUnits: parkingUnits,
          externalUnits: externalUnits,
          selectedYear: selectedYear,
          summary: {
            monthly: monthlyStats,
            unitWise: unitWiseSummary
          }
        }}
      />

      {/* Floating AI Assistant Button */}
      <motion.button 
        animate={{ 
          y: [0, -8, 0],
          scale: [1, 1.05, 1]
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        onClick={() => setShowAIAssistant(true)}
        className="fixed bottom-24 right-4 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center group"
      >
        <Bot size={24} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-bold text-sm whitespace-nowrap">এআই অ্যাসিস্ট্যান্ট</span>
      </motion.button>
      
      {/* Loading State */}
      {loading && (
         <div className="fixed inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
             <RefreshCw className="animate-spin text-primary-500" size={40} />
         </div>
      )}

      {/* Main Header */}
      <div className="mb-6">
        {viewMode === 'PARKING' && (
            <button 
                onClick={() => {
                    setViewMode('SERVICE');
                    setShowParkingView(true);
                }}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors py-1 mb-2 group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-base font-bold">{t.back}</span>
            </button>
        )}

        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                {viewMode === 'PARKING' ? 'পার্কিং চার্জ' : t.serviceCharge}
            </h2>
            <div className="flex items-center gap-2">
            {useMock && (
                <span className="text-[9px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-200 dark:border-yellow-800">{t.demo}</span>
            )}
            <button 
                onClick={() => isAdmin ? setIsAdmin(false) : setShowLogin(true)}
                className={`p-2 rounded-full transition-colors ${isAdmin ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400'}`}
            >
                {isAdmin ? <Unlock size={18} /> : <Lock size={18} />}
            </button>
            </div>
        </div>
      </div>

      {isAdmin && (
         <div className="mb-4 grid grid-cols-1 gap-3">
             <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-3 flex items-start gap-3">
                 <div className="bg-indigo-100 dark:bg-indigo-800 p-2 rounded-full text-indigo-600 dark:text-indigo-300 mt-0.5">
                   <Edit3 size={16} />
                 </div>
                 <div>
                   <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200">{t.adminDashboard}</p>
                   <p className="text-[10px] text-indigo-600 dark:text-indigo-300 mt-0.5">{t.editInfo}</p>
                 </div>
             </div>
             
             <button 
                onClick={() => setShowWhatsAppView(true)}
                className="bg-purple-700 dark:bg-purple-800 border border-purple-800 dark:border-purple-700 rounded-xl p-3 flex items-center justify-end gap-3 hover:bg-purple-800 dark:hover:bg-purple-700 transition-colors text-right shadow-sm"
             >
                 <div>
                   <p className="text-sm font-bold text-white">হোয়াটসঅ্যাপ বার্তা</p>
                   <p className="text-[10px] text-purple-200 mt-0.5">নোটিফিকেশন পাঠান</p>
                 </div>
                 <div className="bg-purple-600 dark:bg-purple-700 p-2 rounded-full text-white">
                   <MessageCircle size={16} />
                 </div>
             </button>

             <button 
                onClick={() => setShowSmsSender(true)}
                className="bg-emerald-600 dark:bg-emerald-700 border border-emerald-700 dark:border-emerald-600 rounded-xl p-3 flex items-center justify-end gap-3 hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors text-right shadow-sm"
             >
                 <div>
                   <p className="text-sm font-bold text-white">এসএমএস পাঠান</p>
                   <p className="text-[10px] text-emerald-200 mt-0.5">সব ইউনিটে এসএমএস পাঠান</p>
                 </div>
                 <div className="bg-emerald-500 dark:bg-emerald-600 p-2 rounded-full text-white">
                   <MessageSquare size={16} />
                 </div>
             </button>

             {/* Parking Manager Button - Only in Parking Mode */}
             {viewMode === 'PARKING' && (
                 <div className="flex flex-col gap-2">
                     <button 
                        onClick={() => setShowParkingManager(true)}
                        className="bg-orange-600 dark:bg-orange-700 border border-orange-700 dark:border-orange-600 rounded-xl p-3 flex items-center justify-end gap-3 hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors text-right shadow-sm w-full"
                     >
                         <div>
                           <p className="text-sm font-bold text-white">পার্কিং ইউনিট ম্যানেজ</p>
                           <p className="text-[10px] text-orange-200 mt-0.5">গাড়ি বা পার্কিং যুক্ত করুন</p>
                         </div>
                         <div className="bg-orange-500 dark:bg-orange-600 p-2 rounded-full text-white">
                           <Car size={16} />
                         </div>
                     </button>
                     <button 
                        onClick={() => fetchData(true)}
                        className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2 flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-600 dark:text-slate-300 shadow-sm text-xs font-bold w-full"
                     >
                         <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                         ডাটা রিফ্রেশ করুন
                     </button>
                 </div>
             )}
         </div>
      )}

      {/* Parking Manager Modal */}
      {showParkingManager && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowParkingManager(false)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Car size={20} className="text-orange-500" />
                        পার্কিং ইউনিট নির্বাচন
                    </h3>
                    <button onClick={() => setShowParkingManager(false)} className="bg-slate-100 dark:bg-slate-700 p-1.5 rounded-full text-slate-500">
                        <X size={18} />
                    </button>
                </div>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 shrink-0">
                    যেসব ইউনিটের পার্কিং বা গাড়ি আছে, সেগুলো টিক চিহ্ন দিন।
                </p>

                <div className="overflow-y-auto flex-1 custom-scrollbar pr-1 mb-4">
                    <div className="mb-4">
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">বিল্ডিং ইউনিট</h4>
                        <div className="grid grid-cols-3 gap-2">
                            {ALL_UNITS.map(unit => {
                                const isSelected = parkingUnits.includes(unit);
                                return (
                                    <button
                                        key={unit}
                                        onClick={() => {
                                            if (isSelected) {
                                                setParkingUnits(prev => prev.filter(u => u !== unit));
                                            } else {
                                                setParkingUnits(prev => [...prev, unit]);
                                            }
                                        }}
                                        className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                                            isSelected 
                                            ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-400' 
                                            : 'bg-slate-50 dark:bg-slate-700 border-slate-100 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'
                                        }`}
                                    >
                                        {unit}
                                        {isSelected && <CheckCircle2 size={10} className="inline ml-1" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">বাহিরস্থ পার্কিং</h4>
                        <div className="space-y-2">
                            {externalUnits.map((ext, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <div>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{ext.name}</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{ext.owner}</p>
                                    </div>
                                    <button 
                                        onClick={() => setExternalUnits(prev => prev.filter((_, i) => i !== idx))}
                                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            
                            <div className="flex gap-2 mt-2">
                                <input 
                                    type="text" 
                                    placeholder="মালিকের নাম"
                                    value={newExternalOwner}
                                    onChange={(e) => setNewExternalOwner(e.target.value)}
                                    className="flex-1 text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-2 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                />
                                <button 
                                    onClick={() => {
                                        if (!newExternalOwner.trim()) return;
                                        const nextNum = externalUnits.length + 1;
                                        const newUnit = {
                                            id: `EXT-${Date.now()}`,
                                            name: `বাহিরস্থ পার্কিং ${nextNum}`,
                                            owner: newExternalOwner
                                        };
                                        setExternalUnits(prev => [...prev, newUnit]);
                                        setNewExternalOwner('');
                                    }}
                                    className="bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-orange-700"
                                >
                                    যোগ করুন
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 shrink-0">
                    <button 
                        onClick={() => setShowParkingManager(false)}
                        className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold"
                    >
                        বাতিল
                    </button>
                    <button 
                        onClick={() => handleSaveParkingConfig(parkingUnits, externalUnits)}
                        disabled={isSavingParking}
                        className={`flex-1 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-200 dark:shadow-none hover:bg-orange-700 flex items-center justify-center gap-2 ${isSavingParking ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isSavingParking ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                সেভ হচ্ছে...
                            </>
                        ) : 'সেভ করুন'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* VIEW: SMS SENDER */}
      {showSmsSender ? (
        <div className="animate-in slide-in-from-right duration-300 pb-40">
             <div className="flex items-center gap-3 mb-4">
                 <button 
                  onClick={() => setShowSmsSender(false)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">এসএমএস পাঠান</h2>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">BulkSMSBD API এর মাধ্যমে</p>
                </div>
             </div>

             {/* API Configuration */}
             <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 space-y-3">
                <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">API Key</label>
                    <input 
                        type="text" 
                        value={smsApiKey}
                        onChange={(e) => setSmsApiKey(e.target.value)}
                        placeholder="আপনার BulkSMSBD API Key"
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Sender ID</label>
                    <input 
                        type="text" 
                        value={smsSenderId}
                        onChange={(e) => setSmsSenderId(e.target.value)}
                        placeholder="আপনার Sender ID (e.g. 88096...)"
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
             </div>

             {/* Target Selector */}
             <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                    onClick={() => setSmsTarget('tenant')}
                    className={`p-3 rounded-xl font-bold text-xs text-center transition-all ${smsTarget === 'tenant' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    ভাড়াটিয়া
                </button>
                <button
                    onClick={() => setSmsTarget('owner')}
                    className={`p-3 rounded-xl font-bold text-xs text-center transition-all ${smsTarget === 'owner' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    মালিকপক্ষ
                </button>
             </div>

             {/* Month Selector */}
             <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">মাস নির্বাচন করুন (অ্যামাউন্ট হিসাবের জন্য)</label>
                <div className="relative">
                    <select 
                        value={smsMonth}
                        onChange={(e) => setSmsMonth(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg py-3 pl-4 pr-10 appearance-none font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        {MONTHS_LOGIC.map((m, i) => (
                            <option key={i} value={m}>{t.months[i]}</option>
                        ))}
                    </select>
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" size={16} />
                </div>
             </div>

             {/* Message Input */}
             <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
                <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 block">টেমপ্লেট নির্বাচন করুন</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button 
                            onClick={() => {
                                setSmsTemplateType('request');
                                setSmsMessage('সম্মানিত বাসিন্দা (ইউনিট: {{unit}}), অনুগ্রহ করে চলতি মাসের সার্ভিস চার্জ ({{amount}} টাকা) পরিশোধ করার জন্য অনুরোধ করা হচ্ছে। ধন্যবাদ।');
                                setSmsSelectedUnits(ALL_UNITS);
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${smsTemplateType === 'request' ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-transparent shadow-lg shadow-emerald-500/30 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700'}`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-full ${smsTemplateType === 'request' ? 'bg-white/20' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                                    <Bell size={18} />
                                </div>
                                <h3 className={`font-bold text-sm ${smsTemplateType === 'request' ? 'text-white' : 'text-slate-800 dark:text-white'}`}>পেমেন্ট অনুরোধ</h3>
                            </div>
                            <p className={`text-[10px] leading-tight ${smsTemplateType === 'request' ? 'text-emerald-50' : 'text-slate-500 dark:text-slate-400'}`}>সব ইউনিটে একসাথে পাঠানো যাবে</p>
                        </button>
                        
                        <button 
                            onClick={() => {
                                setSmsTemplateType('received');
                                setSmsMessage('সম্মানিত বাসিন্দা (ইউনিট: {{unit}}), আপনার সার্ভিস চার্জ ({{amount}} টাকা) সফলভাবে গ্রহণ করা হয়েছে। ধন্যবাদ।');
                                setSmsSelectedUnits([]);
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${smsTemplateType === 'received' ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-transparent shadow-lg shadow-blue-500/30 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'}`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-full ${smsTemplateType === 'received' ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                    <CheckCircle2 size={18} />
                                </div>
                                <h3 className={`font-bold text-sm ${smsTemplateType === 'received' ? 'text-white' : 'text-slate-800 dark:text-white'}`}>পেমেন্ট রিসিভড</h3>
                            </div>
                            <p className={`text-[10px] leading-tight ${smsTemplateType === 'received' ? 'text-blue-50' : 'text-slate-500 dark:text-slate-400'}`}>আলাদা আলাদা ইউনিটের জন্য</p>
                        </button>
                        
                        <button 
                            onClick={() => {
                                setSmsTemplateType('due');
                                setSmsMessage('সম্মানিত বাসিন্দা (ইউনিট: {{unit}}), আপনার সার্ভিস চার্জ ({{amount}} টাকা) এখনো বকেয়া আছে। অনুগ্রহ করে দ্রুত পরিশোধ করুন। ধন্যবাদ।');
                                setSmsSelectedUnits([]);
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${smsTemplateType === 'due' ? 'bg-gradient-to-br from-rose-500 to-red-600 border-transparent shadow-lg shadow-rose-500/30 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-700'}`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-full ${smsTemplateType === 'due' ? 'bg-white/20' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                                    <AlertCircle size={18} />
                                </div>
                                <h3 className={`font-bold text-sm ${smsTemplateType === 'due' ? 'text-white' : 'text-slate-800 dark:text-white'}`}>বকেয়া রিমাইন্ডার</h3>
                            </div>
                            <p className={`text-[10px] leading-tight ${smsTemplateType === 'due' ? 'text-rose-50' : 'text-slate-500 dark:text-slate-400'}`}>আলাদা আলাদা ইউনিটের জন্য</p>
                        </button>
                    </div>
                </div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block flex justify-between">
                    <span>এসএমএস মেসেজ</span>
                    <span className="text-[10px] text-emerald-500 normal-case">{'{{unit}}'} এবং {'{{amount}}'} ব্যবহার করুন</span>
                </label>
                <textarea 
                    value={smsMessage}
                    onChange={(e) => {
                        setSmsMessage(e.target.value);
                        setSmsTemplateType('custom');
                    }}
                    placeholder="আপনার মেসেজ এখানে লিখুন..."
                    rows={4}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
             </div>

             {/* Unit Selection */}
             <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
                <div className="flex justify-between items-center mb-3 border-b border-slate-100 dark:border-slate-700 pb-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">ইউনিট সমূহ ({smsSelectedUnits.length} নির্বাচিত)</label>
                    {smsTemplateType === 'request' && (
                        <button 
                            onClick={() => {
                                if (smsSelectedUnits.length === ALL_UNITS.length) {
                                    setSmsSelectedUnits([]);
                                } else {
                                    setSmsSelectedUnits(ALL_UNITS);
                                }
                            }}
                            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                        >
                            {smsSelectedUnits.length === ALL_UNITS.length ? 'সব বাতিল করুন' : 'সব নির্বাচন করুন'}
                        </button>
                    )}
                </div>
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                    {ALL_UNITS.map(unit => {
                        const uInfoKey = `${unit}-${selectedYear}`;
                        const uInfo = (unitsInfo[uInfoKey] || unitsInfo[unit] || DEFAULT_UNIT_INFO) as UnitInfo;
                        const phone = smsTarget === 'tenant' ? (uInfo.phone || '') : (uInfo.owner_phone || '');
                        const isSelected = smsSelectedUnits.includes(unit);
                        const isSent = smsSentUnits.includes(unit);

                        return (
                            <div 
                                key={unit} 
                                onClick={() => {
                                    if (isSelected) {
                                        setSmsSelectedUnits(prev => prev.filter(u => u !== unit));
                                    } else {
                                        setSmsSelectedUnits(prev => [...prev, unit]);
                                    }
                                }}
                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                    isSelected 
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                                    : isSent
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 opacity-80'
                                    : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                                        isSelected 
                                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                                        : isSent
                                        ? 'bg-blue-500 border-blue-500 text-white'
                                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-500'
                                    }`}>
                                        {isSelected && <Check size={14} />}
                                        {!isSelected && isSent && <CheckCircle2 size={14} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">{unit}</p>
                                            {isSent && <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-bold">পাঠানো হয়েছে</span>}
                                        </div>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{phone || 'নম্বর নেই'}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
             </div>

             {/* Send Button */}
             <div className="fixed bottom-28 left-0 right-0 px-4 z-40 flex justify-center">
                <button 
                    onClick={handleSendSms}
                    disabled={isSendingSms || smsSelectedUnits.length === 0}
                    className="w-full max-w-md bg-emerald-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSendingSms ? <RefreshCw className="animate-spin" /> : <Send size={20} />}
                    {isSendingSms ? 'পাঠানো হচ্ছে...' : 'এসএমএস পাঠান'}
                </button>
             </div>
        </div>
      ) : showWhatsAppView ? (
        <div className="animate-in slide-in-from-right duration-300 pb-20">
             <div className="flex items-center gap-3 mb-4">
                 <button 
                  onClick={() => setShowWhatsAppView(false)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">WhatsApp বার্তা</h2>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">অ্যাডমিন প্যানেল</p>
                </div>
             </div>

             {/* Month Selector */}
             <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">মাস নির্বাচন করুন</label>
                <div className="relative">
                    <select 
                        value={whatsAppMonth}
                        onChange={(e) => setWhatsAppMonth(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg py-3 pl-4 pr-10 appearance-none font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        {MONTHS_LOGIC.map((m, i) => (
                            <option key={i} value={m}>{t.months[i]}</option>
                        ))}
                    </select>
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" size={16} />
                </div>
             </div>

             {/* Target Selector */}
             <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                    onClick={() => setWhatsAppTarget('tenant')}
                    className={`p-3 rounded-xl font-bold text-xs text-center transition-all ${whatsAppTarget === 'tenant' ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 ring-2 ring-green-500 ring-offset-2 dark:ring-offset-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    চলতি মাসের বার্তা
                </button>
                <button
                    onClick={() => setWhatsAppTarget('owner')}
                    className={`p-3 rounded-xl font-bold text-xs text-center transition-all ${whatsAppTarget === 'owner' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    বকেয়া মাসের বার্তা (মালিকপক্ষ)
                </button>
             </div>

             {/* Units List */}
             <div className="space-y-4">
                {ALL_UNITS.map((unit) => {
                    // Get Payment Data
                    const payment = dbData.find(d => d.unit_text === unit && d.month_name === whatsAppMonth && d.year_num === selectedYear);
                    const status = payment && payment.amount > 0 ? 'PAID' : 'DUE';
                    const dueAmount = payment ? payment.due : (unit.slice(-1) !== 'B' ? 2000 : 500);
                    const amount = payment ? payment.amount : 0;

                    // Get Unit Info (Phone & Templates)
                    // Try specific year key first, then generic unit key
                    const uInfoKey = `${unit}-${selectedYear}`;
                    const uInfo = (unitsInfo[uInfoKey] || unitsInfo[unit] || DEFAULT_UNIT_INFO) as UnitInfo;
                    const phone = uInfo.phone || '';
                    const confirmTemplate = uInfo.confirm_template || DEFAULT_UNIT_INFO.confirm_template;
                    const dueTemplate = uInfo.due_template || DEFAULT_UNIT_INFO.due_template;

                    // Get Logs
                    const log = whatsAppLogs.find(l => l.unit_text === unit && l.month_name === whatsAppMonth && l.year_num === selectedYear);

                    // Local state for inputs (using refs or just controlled inputs would be heavy for list, 
                    // but for 27 units it's manageable. However, to avoid creating 27*3 state variables, 
                    // I'll use a simple approach: direct access or a small sub-component. 
                    // Since I can't easily create sub-components here, I'll use a trick: 
                    // I'll just render inputs that update the global `unitsInfo` state directly on change?
                    // No, that causes re-renders. I'll use a local state for the list? 
                    // Actually, let's just use `unitsInfo` state as the source of truth for inputs.
                    // Updating `unitsInfo` on every keystroke might be slow but acceptable for 27 items.
                    
                    return (
                        <div key={unit} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        {unit}
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${status === 'PAID' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200'}`}>
                                            {status === 'PAID' ? 'পরিশোধিত' : 'বকেয়া'}
                                        </span>
                                    </h3>
                                    {status === 'DUE' && (
                                        <p className="text-xs text-red-500 font-bold mt-1">বকেয়া: ৳ {dueAmount}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Sent Count</p>
                                    <p className="text-lg font-black text-slate-700 dark:text-slate-300">{log?.sent_count || 0}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {/* Phone Number */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                                        {whatsAppTarget === 'tenant' ? 'Tenant' : 'Owner'} WhatsApp (880...)
                                    </label>
                                    <div className="relative">
                                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text" 
                                            value={whatsAppTarget === 'tenant' ? (uInfo.phone || '') : (uInfo.owner_phone || '')}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const newInfo = { ...unitsInfo };
                                                const key = `${unit}-${selectedYear}`;
                                                if (!newInfo[key]) {
                                                    newInfo[key] = { 
                                                        ...DEFAULT_UNIT_INFO,
                                                        unit_text: unit, 
                                                        year_num: selectedYear
                                                    };
                                                }
                                                
                                                if (whatsAppTarget === 'tenant') {
                                                    newInfo[key] = { ...newInfo[key], phone: val };
                                                } else {
                                                    newInfo[key] = { ...newInfo[key], owner_phone: val };
                                                }
                                                setUnitsInfo(newInfo);
                                            }}
                                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg py-2 pl-9 pr-3 text-sm font-mono"
                                            placeholder="171..."
                                        />
                                    </div>
                                </div>

                                {/* Templates */}
                                <div className="grid grid-cols-1 gap-2 mt-2">
                                    {/* Confirm Template */}
                                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 border border-slate-200 dark:border-slate-700">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Confirm Template</label>
                                            <button 
                                                onClick={() => {
                                                    const key = `${unit}-${selectedYear}-confirm`;
                                                    const el = document.getElementById(key);
                                                    if (el) el.classList.toggle('hidden');
                                                }}
                                                className="text-[10px] text-blue-500 hover:underline flex items-center gap-1"
                                            >
                                                <Edit3 size={10} /> এডিট করুন
                                            </button>
                                        </div>
                                        <div id={`${unit}-${selectedYear}-confirm`} className="hidden mt-2">
                                            <textarea 
                                                value={whatsAppTarget === 'tenant' ? (uInfo.confirm_template || `🏢 হলান টাওয়ার

প্রিয় বাসিন্দা,

ইউনিট: {unit}

গত {previous_month} মাসের সার্ভিস চার্জ সফলভাবে গ্রহণ করা হয়েছে।

পরিশোধিত পরিমাণ: ৳{amount}

আপনার সময়মতো পরিশোধ ও সহযোগিতার জন্য আন্তরিক ধন্যবাদ।

— হলান টাওয়ার ব্যবস্থাপনা`) : (uInfo.owner_confirm_template || '')}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const newInfo = { ...unitsInfo };
                                                    const key = `${unit}-${selectedYear}`;
                                                    if (!newInfo[key]) {
                                                        newInfo[key] = { 
                                                            unit_text: unit, 
                                                            year_num: selectedYear, 
                                                            is_occupied: true,
                                                            note: '',
                                                            phone: '',
                                                            confirm_template: '',
                                                            due_template: '',
                                                            owner_phone: '',
                                                            owner_confirm_template: '',
                                                            owner_due_template: ''
                                                        };
                                                    }
                                                    
                                                    if (whatsAppTarget === 'tenant') {
                                                        newInfo[key] = { ...newInfo[key], confirm_template: val };
                                                    } else {
                                                        newInfo[key] = { ...newInfo[key], owner_confirm_template: val };
                                                    }
                                                    setUnitsInfo(newInfo);
                                                }}
                                                placeholder={`Dear ${whatsAppTarget === 'tenant' ? 'Tenant' : 'Owner'}, Payment received...`}
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg py-2 px-3 text-xs h-32"
                                            />
                                        </div>
                                    </div>

                                    {/* Due Template */}
                                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 border border-slate-200 dark:border-slate-700">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Due Template</label>
                                            <button 
                                                onClick={() => {
                                                    const key = `${unit}-${selectedYear}-due`;
                                                    const el = document.getElementById(key);
                                                    if (el) el.classList.toggle('hidden');
                                                }}
                                                className="text-[10px] text-blue-500 hover:underline flex items-center gap-1"
                                            >
                                                <Edit3 size={10} /> এডিট করুন
                                            </button>
                                        </div>
                                        <div id={`${unit}-${selectedYear}-due`} className="hidden mt-2">
                                            <textarea 
                                                value={whatsAppTarget === 'tenant' ? (uInfo.due_template || `চলতি মাসের ইউটিলিটি চার্জ।

🏢 হলান টাওয়ার

প্রিয় বাসিন্দা,

ইউনিট: {unit}

{current_month} মাস শুরু হওয়ার সাথে সাথে
গত {previous_month} মাসের সার্ভিস চার্জ এখন পরিশোধযোগ্য হয়েছে।

পরিশোধযোগ্য পরিমাণ: ৳{due_amount}

অনুগ্রহ করে আগামী ৭ তারিখের মধ্যে পরিশোধ করার জন্য অনুরোধ করা হলো।

আপনার সহযোগিতার জন্য ধন্যবাদ।

— হলান টাওয়ার ব্যবস্থাপনা`) : (uInfo.owner_due_template || '')}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const newInfo = { ...unitsInfo };
                                                    const key = `${unit}-${selectedYear}`;
                                                    if (!newInfo[key]) {
                                                        newInfo[key] = { 
                                                            unit_text: unit, 
                                                            year_num: selectedYear, 
                                                            is_occupied: true,
                                                            note: '',
                                                            phone: '',
                                                            confirm_template: '',
                                                            due_template: '',
                                                            owner_phone: '',
                                                            owner_confirm_template: '',
                                                            owner_due_template: ''
                                                        };
                                                    }
                                                    
                                                    if (whatsAppTarget === 'tenant') {
                                                        newInfo[key] = { ...newInfo[key], due_template: val };
                                                    } else {
                                                        newInfo[key] = { ...newInfo[key], owner_due_template: val };
                                                    }
                                                    setUnitsInfo(newInfo);
                                                }}
                                                placeholder={`Dear ${whatsAppTarget === 'tenant' ? 'Tenant' : 'Owner'}, Payment DUE...`}
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg py-2 px-3 text-xs h-32"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2">
                                    <button 
                                        onClick={async () => {
                                            // Save Logic
                                            const key = `${unit}-${selectedYear}`;
                                            const info = (unitsInfo[key] || unitsInfo[unit] || DEFAULT_UNIT_INFO) as UnitInfo;
                                            
                                            // 1. Save to LocalStorage Backup immediately
                                            try {
                                                const localStr = localStorage.getItem('whatsapp_data_local');
                                                const localData = localStr ? JSON.parse(localStr) : {};
                                                localData[key] = {
                                                    ...localData[key], // Preserve other fields
                                                    phone: info.phone,
                                                    confirm_template: info.confirm_template,
                                                    due_template: info.due_template,
                                                    owner_phone: info.owner_phone,
                                                    owner_confirm_template: info.owner_confirm_template,
                                                    owner_due_template: info.owner_due_template
                                                };
                                                localStorage.setItem('whatsapp_data_local', JSON.stringify(localData));
                                            } catch (e) {
                                                console.error("Local backup failed", e);
                                            }
                                            
                                            try {
                                                // Strategy: 
                                                // 1. Check exact year match -> Update
                                                // 2. Check generic (null year) match -> Update
                                                // 3. Insert new specific year record
                                                // 4. If Insert fails (Unique Constraint), find ANY record for unit and Update it

                                                let targetId = null;

                                                // 1. Exact Match
                                                const { data: exactMatch } = await supabase
                                                    .from('units_info')
                                                    .select('id')
                                                    .eq('unit_text', unit)
                                                    .eq('year_num', selectedYear)
                                                    .maybeSingle();

                                                if (exactMatch) {
                                                    targetId = exactMatch.id;
                                                } else {
                                                    // 2. Generic Match (year is null)
                                                    const { data: genericMatch } = await supabase
                                                        .from('units_info')
                                                        .select('id')
                                                        .eq('unit_text', unit)
                                                        .is('year_num', null)
                                                        .maybeSingle();
                                                    
                                                    if (genericMatch) targetId = genericMatch.id;
                                                }

                                                const payload = {
                                                    phone: info.phone || null,
                                                    confirm_template: info.confirm_template || null,
                                                    due_template: info.due_template || null,
                                                    owner_phone: info.owner_phone || null,
                                                    owner_confirm_template: info.owner_confirm_template || null,
                                                    owner_due_template: info.owner_due_template || null
                                                };

                                                if (targetId) {
                                                    // Update existing
                                                    const { error: upError } = await supabase
                                                        .from('units_info')
                                                        .update(payload)
                                                        .eq('id', targetId);
                                                    if (upError) throw upError;
                                                } else {
                                                    // Insert new
                                                    const { error: inError } = await supabase
                                                        .from('units_info')
                                                        .insert({
                                                            unit_text: unit,
                                                            year_num: selectedYear,
                                                            is_occupied: info.is_occupied !== undefined ? info.is_occupied : (unit.slice(-1) !== 'B'),
                                                            ...payload
                                                        });
                                                    
                                                    if (inError) {
                                                        // 4. Fallback for Unique Constraint on unit_text
                                                        if (inError.code === '23505') {
                                                            const { data: anyMatch } = await supabase
                                                                .from('units_info')
                                                                .select('id')
                                                                .eq('unit_text', unit)
                                                                .limit(1)
                                                                .maybeSingle();
                                                            
                                                            if (anyMatch) {
                                                                const { error: fallbackError } = await supabase
                                                                    .from('units_info')
                                                                    .update(payload)
                                                                    .eq('id', anyMatch.id);
                                                                if (fallbackError) throw fallbackError;
                                                            } else {
                                                                throw inError;
                                                            }
                                                        } else {
                                                            throw inError;
                                                        }
                                                    }
                                                }
                                                
                                                await fetchData(false);
                                                alert("Saved successfully to Supabase!");
                                            } catch (e: any) {
                                                console.error("Save error:", e);
                                                alert(`Saved locally! (Database Error: ${e.message || 'Check connection'})`);
                                            }
                                        }}
                                        className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Save size={14} /> Save
                                    </button>
                                    
                                    <button 
                                        onClick={async () => {
                                            // Send Logic
                                            const key = `${unit}-${selectedYear}`;
                                            // Use same fallback logic as render to ensure we get the phone number if it exists in generic key
                                            const info = (unitsInfo[key] || unitsInfo[unit] || DEFAULT_UNIT_INFO) as UnitInfo;
                                            const ph = whatsAppTarget === 'tenant' ? info.phone : info.owner_phone;
                                            
                                            if (!ph) {
                                                alert("Please enter a phone number first.");
                                                return;
                                            }
                                            
                                            // Sanitize Phone Number
                                            let cleanPhone = ph.replace(/\D/g, ''); // Remove non-digits
                                            if (cleanPhone.startsWith('880')) {
                                                // Already has country code
                                            } else if (cleanPhone.startsWith('01')) {
                                                cleanPhone = '88' + cleanPhone;
                                            } else if (cleanPhone.startsWith('1')) {
                                                cleanPhone = '880' + cleanPhone;
                                            } else {
                                                // Fallback or assume it's just missing 88
                                                cleanPhone = '88' + cleanPhone;
                                            }

                                            const tmpl = status === 'PAID' 
                                                ? (whatsAppTarget === 'tenant' ? (info.confirm_template || `🏢 হলান টাওয়ার

প্রিয় বাসিন্দা,

ইউনিট: {unit}

গত {previous_month} মাসের সার্ভিস চার্জ সফলভাবে গ্রহণ করা হয়েছে।

পরিশোধিত পরিমাণ: ৳{amount}

আপনার সময়মতো পরিশোধ ও সহযোগিতার জন্য আন্তরিক ধন্যবাদ।

— হলান টাওয়ার ব্যবস্থাপনা`) : (info.owner_confirm_template || "Dear Owner, Payment received for Unit {unit}. Month: {month}. Amount: {amount}."))
                                                : (whatsAppTarget === 'tenant' ? (info.due_template || `চলতি মাসের ইউটিলিটি চার্জ।

🏢 হলান টাওয়ার

প্রিয় বাসিন্দা,

ইউনিট: {unit}

{current_month} মাস শুরু হওয়ার সাথে সাথে
গত {previous_month} মাসের সার্ভিস চার্জ এখন পরিশোধযোগ্য হয়েছে।

পরিশোধযোগ্য পরিমাণ: ৳{due_amount}

অনুগ্রহ করে আগামী ৭ তারিখের মধ্যে পরিশোধ করার জন্য অনুরোধ করা হলো।

আপনার সহযোগিতার জন্য ধন্যবাদ।

— হলান টাওয়ার ব্যবস্থাপনা`) : (info.owner_due_template || "Dear Owner, Payment DUE for Unit {unit}. Month: {month}. Amount: {amount}. Total Due: {due_amount}."));

                                            if (!tmpl) {
                                                alert("Please set a message template.");
                                                return;
                                            }

                                            // Dynamic Variables
                                            // Calculate Previous Month
                                            const currentMonthIndex = MONTHS_LOGIC.indexOf(whatsAppMonth);
                                            const prevMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
                                            const prevMonthName = t.months[prevMonthIndex]; // Use translated name

                                            const msg = tmpl
                                                .replace(/{unit}/g, unit)
                                                .replace(/{month}/g, t.months[currentMonthIndex]) // Use translated name for {month} too if needed, or keep whatsAppMonth
                                                .replace(/{current_month}/g, t.months[currentMonthIndex])
                                                .replace(/{previous_month}/g, prevMonthName)
                                                .replace(/{amount}/g, amount.toString())
                                                .replace(/{due_amount}/g, dueAmount.toString())
                                                .replace(/{target}/g, whatsAppTarget === 'tenant' ? 'Tenant' : 'Owner');

                                            // Robust WhatsApp Opening Logic
                                            const isAndroid = /Android/i.test(navigator.userAgent);
                                            const webUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;

                                            if (isAndroid) {
                                                // Android Intent with Fallback
                                                // This tells the Android OS to open WhatsApp directly, or fallback to the web URL if not installed/handled
                                                const intentUrl = `intent://send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}#Intent;scheme=whatsapp;package=com.whatsapp;S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;
                                                window.location.href = intentUrl;
                                            } else {
                                                // iOS / Desktop - Use anchor click which is often more reliable than window.open in WebViews
                                                const link = document.createElement('a');
                                                link.href = webUrl;
                                                link.target = '_blank';
                                                link.rel = 'noopener noreferrer';
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            }

                                            // Log to Supabase
                                            try {
                                                await supabase.from('whatsapp_logs').insert({
                                                    unit_text: unit,
                                                    month_name: whatsAppMonth,
                                                    year_num: selectedYear,
                                                    message_type: status === 'PAID' ? 'confirm' : 'due',
                                                    target_audience: whatsAppTarget,
                                                    sent_count: 1,
                                                    last_sent_at: new Date().toISOString()
                                                });
                                                
                                                // Update local log state
                                                setWhatsAppLogs(prev => [...prev, {
                                                    unit_text: unit,
                                                    month_name: whatsAppMonth,
                                                    year_num: selectedYear,
                                                    message_type: status === 'PAID' ? 'confirm' : 'due',
                                                    target_audience: whatsAppTarget,
                                                    sent_count: 1,
                                                    last_sent_at: new Date().toISOString()
                                                }]);
                                            } catch (e) {
                                                console.error("Log error", e);
                                            }
                                        }}
                                        className={`flex-[2] ${status === 'PAID' ? 'bg-green-500 hover:bg-green-600 shadow-green-200' : 'bg-red-500 hover:bg-red-600 shadow-red-200'} text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-lg dark:shadow-none`}
                                    >
                                        <Send size={14} /> Send WhatsApp
                                    </button>
                                </div>
                                {log?.last_sent_at && (
                                    <p className="text-[9px] text-slate-400 text-center pt-1">
                                        Last sent: {new Date(log.last_sent_at).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
             </div>
        </div>
      ) : showSummaryList ? (
        <div className="animate-in slide-in-from-right duration-300">
             <div className="flex items-center gap-3 mb-4">
                 <button 
                  onClick={() => onSummaryToggle(false)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t.allUnitsCalc}</h2>
                    <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">{t.financialYear}: {selectedYear}</p>
                </div>
             </div>

             {/* Year Selection Tabs - Added for All Units Summary */}
             <div className="bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex mb-4">
                <button 
                    onClick={() => setSelectedYear(2025)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${selectedYear === 2025 ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    <CalendarDays size={16} /> 2025
                </button>
                <button 
                    onClick={() => setSelectedYear(2026)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${selectedYear === 2026 ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    <CalendarDays size={16} /> 2026
                </button>
            </div>

             {/* Replaced Summary Card matching the Dashboard design */}
            <div 
                className="mb-6 relative overflow-hidden rounded-2xl shadow-lg border border-white/10 dark:border-white/5 p-5 text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #6a11cb, #2575fc)' }}
            >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <TrendingUp size={100} />
                </div>
                
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-semibold text-indigo-100 flex items-center gap-2">
                        <Wallet size={18} />
                        {t.total} {t.status} ({selectedYear})
                    </h3>
                </div>
                
                <div className="grid grid-cols-[auto_1fr_1fr] divide-x divide-white/20">
                    <div className="pr-3">
                        <p className="text-[10px] text-indigo-200 font-medium uppercase mb-1">{t.unit}</p>
                        <p className="text-base sm:text-lg font-bold">{ALL_UNITS.length}</p>
                    </div>
                    <div className="px-3 text-center">
                        <p className="text-[10px] text-indigo-200 font-medium uppercase mb-1">{t.totalCollected}</p>
                        <p className="text-base sm:text-lg font-bold whitespace-nowrap">৳ {grandTotalCollected.toLocaleString()}</p>
                    </div>
                    <div className="pl-3 text-right">
                        <p className="text-[10px] text-red-200 font-medium uppercase mb-1">{t.totalDue}</p>
                        <p className="text-base sm:text-lg font-bold text-red-100 whitespace-nowrap">৳ {grandTotalDue.toLocaleString()}</p>
                    </div>
                </div>
            </div>

             {/* Search Bar */}
             <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                <input 
                type="text" 
                placeholder={t.searchUnit}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-all shadow-sm"
                />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-600">
                                <th className="py-3 pl-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.unit}</th>
                                <th className="py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.totalCollected}</th>
                                <th className="py-3 pr-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.totalDue}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredUnitsData.map((data, idx) => (
                                <tr 
                                    key={idx} 
                                    onClick={() => onUnitSelect(data.unit)}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer active:bg-slate-100 dark:active:bg-slate-600 group"
                                >
                                    <td className="py-3 pl-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-col">
                                              <span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2.5 py-1.5 rounded-lg text-sm w-fit">{data.unit}</span>
                                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 ml-1">
                                                {FLAT_OWNERS.find(f => f.flat === data.unit)?.name}
                                              </span>
                                            </div>
                                            <ArrowUpRight size={14} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </td>
                                    <td className="py-3 text-center">
                                        <span className={`text-sm font-semibold ${data.collected > 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                            {data.collected > 0 ? `৳ ${data.collected.toLocaleString()}` : '-'}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-4 text-right">
                                        {data.due > 0 ? (
                                            <span className="text-sm font-bold text-red-500 dark:text-red-400">৳ {data.due.toLocaleString()}</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                                                <CheckCircle2 size={10} /> {t.paid}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      ) : showDueSummary ? (
          <div className="animate-in slide-in-from-right duration-300">
              <div className="flex items-center gap-3 mb-4">
                 <button 
                  onClick={() => setShowDueSummary(false)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">বকেয়া সামারি</h2>
                    <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">২০২৫ ও ২০২৬ সাল</p>
                </div>
             </div>

             {loadingDueSummary ? (
                 <div className="flex justify-center items-center py-20">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                 </div>
             ) : (
                 <>
                     {/* Summary Box */}
                     <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
                         <div className="grid grid-cols-2 gap-3 mb-3">
                             <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center border border-red-100 dark:border-red-800/50 flex flex-col items-center justify-center">
                                 <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">২০২৫ মোট বকেয়া</p>
                                 <div className="flex items-baseline gap-1">
                                     <p className="text-lg sm:text-xl font-black text-red-600 dark:text-red-400 whitespace-nowrap">৳ {dueSummaryData.reduce((sum, item) => sum + item.due2025, 0).toLocaleString()}</p>
                                 </div>
                             </div>
                             <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center border border-orange-100 dark:border-orange-800/50 flex flex-col items-center justify-center">
                                 <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">২০২৬ মোট বকেয়া</p>
                                 <div className="flex items-baseline gap-1">
                                     <p className="text-lg sm:text-xl font-black text-orange-600 dark:text-orange-400 whitespace-nowrap">৳ {dueSummaryData.reduce((sum, item) => sum + item.due2026, 0).toLocaleString()}</p>
                                 </div>
                             </div>
                         </div>
                         <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-3 flex justify-between items-center border border-slate-100 dark:border-slate-700">
                             <div className="flex items-center gap-2">
                                 <div className="bg-indigo-100 dark:bg-indigo-900/30 p-1.5 rounded-full text-indigo-600 dark:text-indigo-400">
                                     <Wallet size={14} />
                                 </div>
                                 <span className="text-xs font-bold text-slate-600 dark:text-slate-300">সর্বমোট বকেয়া</span>
                             </div>
                             <span className="text-base font-black text-indigo-600 dark:text-indigo-400 whitespace-nowrap">৳ {dueSummaryData.reduce((sum, item) => sum + item.due2025 + item.due2026, 0).toLocaleString()}</span>
                         </div>
                     </div>

                     {/* 27 Units List */}
                     <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-8">
                         <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                             <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">ইউনিট ভিত্তিক বকেয়া তালিকা</h3>
                         </div>
                         <div className="divide-y divide-slate-100 dark:divide-slate-700">
                             {dueSummaryData.map((item, idx) => (
                                 <div 
                                     key={idx} 
                                     onClick={() => {
                                         onUnitSelect(item.unit);
                                         setShowDueSummary(false);
                                     }}
                                     className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                                 >
                                     <div className="flex items-center gap-3">
                                         <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                                             {item.unit}
                                         </div>
                                     </div>
                                     <div className="flex gap-4 text-right">
                                         <div>
                                             <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">২০২৫</p>
                                             <p className={`text-sm font-bold ${item.due2025 > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                 {item.due2025 > 0 ? `৳ ${item.due2025.toLocaleString()}` : '0'}
                                             </p>
                                         </div>
                                         <div>
                                             <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">২০২৬</p>
                                             <p className={`text-sm font-bold ${item.due2026 > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                                                 {item.due2026 > 0 ? `৳ ${item.due2026.toLocaleString()}` : '0'}
                                             </p>
                                         </div>
                                         <div className="pl-2 border-l border-slate-200 dark:border-slate-700">
                                             <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">মোট</p>
                                             <p className={`text-sm font-bold ${(item.due2025 + item.due2026) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                 {(item.due2025 + item.due2026) > 0 ? `৳ ${(item.due2025 + item.due2026).toLocaleString()}` : '0'}
                                             </p>
                                         </div>
                                     </div>
                                 </div>
                             ))}
                         </div>
                         <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex justify-between items-center">
                             <h3 className="text-sm font-bold text-slate-800 dark:text-white">সর্বমোট বকেয়া</h3>
                             <div className="flex gap-4 text-right">
                                 <div>
                                     <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">২০২৫</p>
                                     <p className="text-sm font-bold text-red-600 dark:text-red-400">
                                         ৳ {dueSummaryData.reduce((sum, item) => sum + item.due2025, 0).toLocaleString()}
                                     </p>
                                 </div>
                                 <div>
                                     <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">২০২৬</p>
                                     <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                                         ৳ {dueSummaryData.reduce((sum, item) => sum + item.due2026, 0).toLocaleString()}
                                     </p>
                                 </div>
                                 <div className="pl-2 border-l border-slate-200 dark:border-slate-700">
                                     <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">মোট</p>
                                     <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                         ৳ {dueSummaryData.reduce((sum, item) => sum + item.due2025 + item.due2026, 0).toLocaleString()}
                                     </p>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </>
             )}
          </div>
      ) : showMonthlySummary ? (
          <div className="animate-in slide-in-from-right duration-300">
              <div className="flex items-center gap-3 mb-4">
                 <button 
                  onClick={() => setShowMonthlySummary(false)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">মাসিক সামারি</h2>
                    <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">{t.financialYear}: {selectedYear}</p>
                </div>
             </div>

             {/* Year Selection Tabs */}
             <div className="bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex mb-6">
                <button 
                    onClick={() => setSelectedYear(2025)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${selectedYear === 2025 ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    <CalendarDays size={16} /> 2025
                </button>
                <button 
                    onClick={() => setSelectedYear(2026)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${selectedYear === 2026 ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    <CalendarDays size={16} /> 2026
                </button>
            </div>

            <div className="mb-6">
                <button 
                    onClick={() => {
                        setFullYearTableUnitFilter(null);
                        setShowFullYearTable(true);
                    }}
                    className="w-full bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 shadow-lg border border-white/10 flex items-center justify-between group active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl text-white group-hover:scale-110 transition-transform">
                            <CalendarIcon size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-base font-bold text-white">১২ মাসের তথ্য</h3>
                            <p className="text-xs text-indigo-100 font-medium opacity-90">পুরো বছরের বিস্তারিত হিসাব দেখুন</p>
                        </div>
                    </div>
                    <div className="bg-white/20 p-2 rounded-full text-white group-hover:bg-white/30 transition-colors">
                        <ChevronRight size={20} />
                    </div>
                </button>
            </div>

            <div className="mb-6">
                <button 
                    onClick={() => {
                        setShowDueSummary(true);
                        fetchDueSummaryData();
                    }}
                    className="w-full bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl p-5 shadow-lg border border-white/10 flex items-center justify-between group active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl text-white group-hover:scale-110 transition-transform">
                            <Wallet size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-base font-bold text-white">বকেয়া সামারি</h3>
                            <p className="text-xs text-red-100 font-medium opacity-90">২০২৫ ও ২০২৬ সালের বকেয়া হিসাব</p>
                        </div>
                    </div>
                    <div className="bg-white/20 p-2 rounded-full text-white group-hover:bg-white/30 transition-colors">
                        <ChevronRight size={20} />
                    </div>
                </button>
            </div>

            {/* 12 Month Summary Strip - Premium Thin Box */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2 px-1">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <TrendingUp size={16} className="text-indigo-500" />
                        মাসিক সামারি
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {selectedYear}
                    </span>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-2 overflow-x-auto no-scrollbar">
                    <div className="flex gap-2 min-w-max">
                        {monthlyStats.map((stat, idx) => {
                            const isCurrentMonth = new Date().getMonth() === idx && selectedYear === new Date().getFullYear();
                            return (
                                <button 
                                    key={idx}
                                    onClick={() => {
                                        setSelectedMonthStat(stat);
                                        setDetailViewType('SUMMARY');
                                    }}
                                    className={`
                                        group flex flex-col items-center justify-center px-3 py-2 rounded-xl border transition-all min-w-[70px] relative overflow-hidden
                                        ${isCurrentMonth 
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' 
                                            : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'}
                                    `}
                                >
                                    {isCurrentMonth && (
                                        <div className="absolute top-0 right-0 w-2 h-2 bg-indigo-500 rounded-full -mr-0.5 -mt-0.5"></div>
                                    )}
                                    <span className={`text-[10px] font-bold mb-1 ${isCurrentMonth ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>
                                        {stat.month}
                                    </span>
                                    <div className="flex flex-col items-center gap-0.5 w-full">
                                        <div className="h-1 w-full bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-green-500 rounded-full" 
                                                style={{ width: `${stat.collected > 0 ? Math.min((stat.collected / (stat.collected + stat.due)) * 100, 100) : 0}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                                            {stat.collected > 0 ? `${(stat.collected/1000).toFixed(1)}k` : '0'}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Unit Wise Summary List - Horizontal Scrollable Strip */}
            <div>
                <div className="flex items-center justify-between mb-2 px-1">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <ListFilter size={16} className="text-indigo-500" />
                        ইউনিট ভিত্তিক সামারি
                    </h3>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-2 overflow-x-auto no-scrollbar">
                    <div className="flex gap-2 min-w-max">
                        {unitWiseSummary.map((item, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setSelectedUnitSummary(item)}
                                className={`
                                    group flex flex-col items-center justify-center px-3 py-2 rounded-xl border transition-all min-w-[80px] relative overflow-hidden
                                    ${item.totalDue > 0
                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/50 hover:border-red-300 dark:hover:border-red-600' 
                                        : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/50 hover:border-green-300 dark:hover:border-green-600'}
                                `}
                            >
                                <span className={`text-[10px] font-bold mb-1 ${item.totalDue > 0 ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>
                                    {item.unit}
                                </span>
                                <div className="flex flex-col items-center gap-0.5 w-full">
                                    <div className="h-1 w-full bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${item.totalDue > 0 ? 'bg-red-500' : 'bg-green-500'}`}
                                            style={{ width: '100%' }}
                                        ></div>
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                                        {item.totalDue > 0 ? 'বকেয়া' : 'পরিশোধিত'}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Yearly Summary Trigger */}
            <div className="mt-6">
                <button 
                    onClick={() => setShowYearlySummary(true)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 shadow-lg shadow-emerald-200 dark:shadow-none text-white flex items-center justify-between group active:scale-95 transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur-sm">
                            <PieChart size={24} className="text-white" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-base font-bold text-white">বাৎসরিক সামারি</h3>
                            <p className="text-[10px] text-emerald-100 font-medium opacity-90">পুরো বছরের হিসাব দেখুন</p>
                        </div>
                    </div>
                    <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
                        <ChevronRight size={20} className="text-white" />
                    </div>
                </button>
            </div>

            {/* Due Analysis / Aging Report */}
            <div className="mt-6 mb-8">
                <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Clock size={16} className="text-indigo-500" />
                        বকেয়া বিশ্লেষণ (Aging Report)
                    </h3>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 text-center border border-yellow-100 dark:border-yellow-800/50 flex flex-col items-center justify-center">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">১ মাস বকেয়া</p>
                            <div className="flex items-baseline gap-1">
                                <p className="text-xl font-black text-yellow-600 dark:text-yellow-400">{agingStats.oneMonth}</p>
                                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">ইউনিট</p>
                            </div>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center border border-orange-100 dark:border-orange-800/50 flex flex-col items-center justify-center">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">২ মাস বকেয়া</p>
                            <div className="flex items-baseline gap-1">
                                <p className="text-xl font-black text-orange-600 dark:text-orange-400">{agingStats.twoMonths}</p>
                                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">ইউনিট</p>
                            </div>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center border border-red-100 dark:border-red-800/50 flex flex-col items-center justify-center">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">৩+ মাস বকেয়া</p>
                            <div className="flex items-baseline gap-1">
                                <p className="text-xl font-black text-red-600 dark:text-red-400">{agingStats.threePlusMonths}</p>
                                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">ইউনিট</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-3 flex justify-between items-center border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                            <div className="bg-red-100 dark:bg-red-800 p-1.5 rounded-full text-red-600 dark:text-red-300">
                                <Wallet size={14} />
                            </div>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">মোট জমে থাকা বকেয়া</span>
                        </div>
                        <span className="text-base font-black text-red-600 dark:text-red-400">৳ {agingStats.totalAccumulatedDue.toLocaleString()}</span>
                    </div>
                </div>
            </div>
          </div>
      ) : (
        // VIEW 3: MAIN GRID DASHBOARD
        <div>
            {/* Year Selection Tabs */}
            <div className="bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex mb-6">
                <button 
                    onClick={() => setSelectedYear(2025)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${selectedYear === 2025 ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    <CalendarDays size={16} /> 2025
                </button>
                <button 
                    onClick={() => setSelectedYear(2026)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${selectedYear === 2026 ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    <CalendarDays size={16} /> 2026
                </button>
            </div>

            {/* Grand Summary Box (All Units) - CLICKABLE */}
            <div 
                onClick={() => onSummaryToggle(true)}
                className="mb-4 relative overflow-hidden rounded-2xl shadow-lg border border-white/10 dark:border-white/5 p-5 text-white cursor-pointer active:scale-[0.98] transition-all group"
                style={{ background: 'linear-gradient(135deg, #6a11cb, #2575fc)' }}
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp size={100} />
                </div>
                
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-semibold text-indigo-100 flex items-center gap-2">
                        <Wallet size={18} />
                        {t.allUnitsCalc} ({selectedYear})
                    </h3>
                    <div className="bg-white/20 p-1 rounded-lg">
                        <ListFilter size={16} />
                    </div>
                </div>
                
                <div className="grid grid-cols-[auto_1fr_1fr] divide-x divide-white/20">
                    <div className="pr-3">
                        <p className="text-[10px] text-indigo-200 font-medium uppercase mb-1">{t.flatType}</p>
                        <p className="text-base sm:text-lg font-bold">{t.all}</p>
                    </div>
                    <div className="px-3 text-center">
                        <p className="text-[10px] text-indigo-200 font-medium uppercase mb-1">{t.totalCollected}</p>
                        <p className="text-base sm:text-lg font-bold whitespace-nowrap">৳ {grandTotalCollected.toLocaleString()}</p>
                    </div>
                    <div className="pl-3 text-right">
                        <p className="text-[10px] text-red-200 font-medium uppercase mb-1">{t.totalDue}</p>
                        <p className="text-base sm:text-lg font-bold text-red-100 whitespace-nowrap">৳ {grandTotalDue.toLocaleString()}</p>
                    </div>
                </div>
                <p className="text-[10px] text-indigo-200 mt-3 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {t.details}
                </p>
            </div>

            {/* Parking Charge Button */}
            {viewMode === 'SERVICE' ? (
                <button 
                    onClick={() => setShowParkingView(true)}
                    className="mb-4 w-full relative overflow-hidden rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800 flex items-center justify-between group active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-100 dark:bg-orange-900/30 p-2.5 rounded-xl text-orange-600 dark:text-orange-400">
                            <Car size={20} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-base font-bold text-slate-800 dark:text-white">পার্কিং চার্জ</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">বিস্তারিত দেখুন</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded-full text-slate-400 dark:text-slate-500 group-hover:bg-orange-50 dark:group-hover:bg-orange-900/30 group-hover:text-orange-500 transition-colors">
                        <ChevronRight size={20} />
                    </div>
                </button>
            ) : (
                <button 
                    onClick={() => setViewMode('SERVICE')}
                    className="mb-4 w-full relative overflow-hidden rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 p-4 bg-orange-50 dark:bg-orange-900/20 flex items-center justify-between group active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl text-orange-600 dark:text-orange-400 shadow-sm">
                            <ArrowLeft size={20} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-base font-bold text-slate-800 dark:text-white">সার্ভিস চার্জে ফিরে যান</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">বর্তমানে পার্কিং চার্জ দেখছেন</p>
                        </div>
                    </div>
                </button>
            )}

            {/* Monthly Summary Button - New Separate Box */}
            <button 
                onClick={() => setShowMonthlySummary(true)}
                className="mb-6 w-full relative overflow-hidden rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800 flex items-center justify-between group active:scale-[0.98] transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400">
                        <TrendingUp size={20} />
                    </div>
                    <div className="text-left">
                        <h3 className="text-base font-bold text-slate-800 dark:text-white">মাসিক সামারি</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">প্রতি মাসের বিস্তারিত হিসাব দেখুন</p>
                    </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded-full text-slate-400 dark:text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-500 transition-colors">
                    <ChevronRight size={20} />
                </div>
            </button>

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                <input 
                type="text" 
                placeholder={t.searchUnit}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-all shadow-sm"
                />
            </div>

            <div className="flex justify-between items-center mb-4 px-1">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    {viewMode === 'PARKING' ? 'পার্কিং ইউনিট সমূহ' : `${t.all} ${t.unit}`} ({visibleUnits.length})
                </p>
                <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{selectedYear}</span>
            </div>

            {/* Grid View */}
            <div className="grid grid-cols-3 gap-3">
                {filteredUnitsData.map((data) => {
                    const owner = FLAT_OWNERS.find(f => f.flat === data.unit);
                    const externalOwner = externalUnits.find(u => u.name === data.unit)?.owner;
                    const ownerName = owner?.name || externalOwner || '-';

                    return (
                    <button
                        key={data.unit}
                        onClick={() => onUnitSelect(data.unit)}
                        className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-400 rounded-xl p-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95"
                    >
                        <span className={`font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 text-center leading-tight ${data.unit.length > 6 ? 'text-[10px]' : 'text-lg'}`}>{data.unit}</span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 text-center line-clamp-1">
                          {ownerName}
                        </span>
                        
                        {/* Real-time Status Indicator */}
                        <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${data.due > 0 ? 'bg-red-500' : 'bg-green-500'}`}></span>
                    </button>
                    );
                })}
                {filteredUnitsData.length === 0 && (
                    <div className="col-span-3 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                        কোনো ইউনিট পাওয়া যায়নি
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};
