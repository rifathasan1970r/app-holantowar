import React, { useState } from 'react';
import { 
  Phone, 
  Copy, 
  Trash2, 
  Zap, 
  Droplets, 
  PaintBucket, 
  Wifi, 
  Tv, 
  Flame, 
  Hammer, 
  ShieldAlert, 
  User, 
  Wrench,
  Siren,
  Plus,
  X,
  Edit,
  LogOut,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from '../src/hooks/useLocalStorage';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.101-.472-.149-.671.149-.198.297-.767.967-.94 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.607.134-.133.297-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.671-1.616-.92-2.214-.242-.58-.487-.502-.671-.511-.173-.009-.372-.011-.571-.011-.198 0-.52.074-.792.372-.272.297-1.042 1.018-1.042 2.481 0 1.462 1.066 2.875 1.214 3.074.149.198 2.103 3.213 5.1 4.504.714.307 1.27.491 1.704.628.717.228 1.369.196 1.883.119.575-.085 1.758-.712 2.006-1.402.248-.69.248-1.283.173-1.406-.074-.123-.27-.197-.567-.346zM12.003 22.002h-.003a9.953 9.953 0 0 1-5.073-1.381l-.364-.216-3.77.989 1.006-3.674-.237-.377a9.957 9.957 0 1 1 18.557-5.52 9.928 9.928 0 0 1-2.914 7.047 9.9 9.9 0 0 1-7.202 3.132z" />
  </svg>
);

const initialContacts = [
  {
    id: 'cat-1',
    category: 'বিল্ডিং ম্যানেজমেন্ট',
    icon: 'ShieldAlert',
    colorClass: 'bg-green-100',
    iconColor: 'text-green-600 dark:text-green-400',
    people: [
      { id: '1', name: 'মোঃ মোজাম্মেল হক', role: 'সেক্রেটারি', phone: '01718635845', wa: true },
      { id: '2', name: 'মো: শাহীন', role: 'ক্যাশিয়ার', phone: '01822532977', wa: true },
      { id: '3', name: 'মো গোলাম ফারুক', role: 'কার্যকরী সদস্য', phone: '01822940728', wa: true },
      { id: '4', name: 'রিফাত', role: 'নিরাপত্তা ও তত্ত্বাবধান', phone: '+8801310-988954', wa: true },
    ]
  },
  {
    id: 'cat-2',
    category: 'নির্মাণ ও মেরামত',
    icon: 'Hammer',
    colorClass: 'bg-amber-100',
    iconColor: 'text-amber-600 dark:text-amber-400',
    people: [
      { id: '5', name: 'সম্রাট', role: 'নির্মাণ ঠিকাদার', phone: '01648-496150', wa: true },
      { id: '6', name: 'সুমন', role: 'বিদ্যুৎ ঠিকাদার', phone: '01674-200082', wa: true },
      { id: '7', name: 'ইউসুফ', role: 'পয়ঃনিষ্কাশন ঠিকাদার', phone: '01826-535683', wa: true },
      { id: '8', name: 'এরশাদ', role: 'প্লাম্বিং সার্ভিস', phone: '01946500016', wa: false },
    ]
  },
  {
    id: 'cat-3',
    category: 'দৈনিক সেবা',
    icon: 'Wrench',
    colorClass: 'bg-indigo-100',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    people: [
      { id: '9', name: 'পরিচ্ছন্নতা কর্মী', role: 'ময়লা ফেলার সার্ভিস', phone: '01797550346', wa: false },
      { id: '10', name: 'গ্যাস সরবরাহকারী', role: 'গ্যাস সিলিন্ডার', phone: '01660183718', wa: false },
    ]
  },
  {
    id: 'cat-4',
    category: 'ইন্টারনেট ও টিভি',
    icon: 'Wifi',
    colorClass: 'bg-sky-100',
    iconColor: 'text-sky-600 dark:text-sky-400',
    people: [
      { id: '11', name: 'সার্কেল নেটওয়ার্ক', role: 'ISP হটলাইন', phone: '16237', wa: false },
      { id: '12', name: 'সার্কেল নেটওয়ার্ক', role: 'ISP সাপোর্ট', phone: '09611-800900', wa: false },
      { id: '13', name: 'নেট 3 লিংক', role: 'ISP বিকল্প', phone: '09639179384', wa: false },
      { id: '14', name: 'টাস কেবল', role: 'ডিস / কেবল টিভি', phone: '01951498883', wa: false },
      { id: '15', name: 'সোহান', role: 'ডিস বিল কালেক্টর', phone: '01329727781', wa: false },
    ]
  },
];

const icons: { [key: string]: React.ElementType } = {
  Phone, Copy, Trash2, Zap, Droplets, PaintBucket, Wifi, Tv, Flame, Hammer, 
  ShieldAlert, User, Wrench, Siren, Plus, X, Edit, LogOut, Settings
};

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '1966';

const Card = ({ 
  title, 
  icon: Icon, 
  desc, 
  colorClass, 
  iconColor,
  children 
}: { 
  title: string, 
  icon: any, 
  desc: string, 
  colorClass: string, 
  iconColor: string, 
  children: React.ReactNode 
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg p-5 rounded-2xl border border-white/40 dark:border-slate-700 shadow-sm relative overflow-hidden transition-colors duration-300`}
  >
    <div className="flex items-start justify-between mb-3">
      <div>
         <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
           <Icon size={18} className={iconColor} /> {title}
         </h3>
         <div className="bg-slate-100/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-md inline-block mt-1">
           {desc}
         </div>
      </div>
    </div>
    {children}
  </motion.div>
);

export const EmergencyView = () => {
  const [contacts, setContacts] = useLocalStorage('emergencyContacts_v4', initialContacts);
  const [isAdmin, setIsAdmin] = useLocalStorage('isAdmin_v4', false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('কপি হয়েছে: ' + text);
    } catch (err) {
      alert('কপি করা যায়নি');
    }
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowLogin(false);
      setError('');
      setPassword('');
    } else {
      setError('ভুল পাসওয়ার্ড');
    }
  };
  
  const handleLogout = () => {
    setIsAdmin(false);
  };

  const handleEdit = (category: any, person: any) => {
    setEditingContact({ ...person, categoryId: category.id });
    setShowEditor(true);
  };

  const handleAdd = (category: any) => {
    setEditingContact({ id: null, name: '', role: '', phone: '', wa: false, categoryId: category.id });
    setShowEditor(true);
  };

  const handleDelete = (personId: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে আপনি এই নম্বরটি মুছে ফেলতে চান?')) {
      const newContacts = contacts.map(cat => ({
        ...cat,
        people: cat.people.filter(p => p.id !== personId)
      }));
      setContacts(newContacts);
    }
  }

  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে আপনি এই সম্পূর্ণ ডিপার্টমেন্টটি মুছে ফেলতে চান? এর অন্তর্গত সমস্ত নম্বর মুছে যাবে।')) {
      const newContacts = contacts.filter(cat => cat.id !== categoryId);
      setContacts(newContacts);
    }
  };

  const handleSave = (contactData: any) => {
    const { categoryId, ...personData } = contactData;
    let newContacts;

    if (personData.id) { // Editing existing
      newContacts = contacts.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            people: cat.people.map(p => p.id === personData.id ? personData : p)
          }
        }
        return cat;
      });
    } else { // Adding new
      personData.id = Date.now().toString();
      newContacts = contacts.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            people: [...cat.people, personData]
          }
        }
        return cat;
      });
    }

    setContacts(newContacts);
    setShowEditor(false);
    setEditingContact(null);
  };

  const handleSaveCategory = (categoryName: string) => {
    const newCategory = {
      id: `cat-${Date.now()}`,
      category: categoryName,
      icon: 'Wrench', // Default icon
      colorClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
      iconColor: 'text-slate-500 dark:text-slate-400',
      people: []
    };
    setContacts([...contacts, newCategory]);
    setShowCategoryEditor(false);
  };

  const ActionButtons = ({ phone, wa = true }: { phone: string, wa?: boolean }) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    
    // Prepare WhatsApp number
    let waNumber = phone.replace(/[^0-9]/g, '');
    if (waNumber.startsWith('01')) {
      waNumber = '88' + waNumber;
    }
    
    return (
      <div className="flex gap-2 mt-4">
        <a 
          href={`tel:${cleanPhone}`} 
          className="flex-1 px-3 py-2.5 bg-blue-600 rounded-xl text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Phone size={14} /> কল
        </a>
        {wa && (
          <a 
            href={`whatsapp://send?phone=${waNumber}`} 
            className="flex-1 px-3 py-2.5 bg-[#25D366] rounded-xl text-white text-xs font-bold hover:bg-[#20b85a] transition-colors shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
          >
            <WhatsAppIcon /> WhatsApp
          </a>
        )}
        <button 
          onClick={() => copyText(phone)} 
          className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Copy size={14} /> কপি
        </button>
      </div>
    );
  };

  const ContactEditor = ({ contact, onSave, onClose }: { contact: any, onSave: (data: any) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState(contact);
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };
  
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: -20 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl relative"
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onClose} className='absolute top-3 right-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600'>
            <X size={16}/>
          </button>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
            {contact.id ? 'নম্বর এডিট করুন' : 'নতুন নম্বর যোগ করুন'}
          </h3>
          <form onSubmit={handleSubmit} className='space-y-3'>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="নাম" className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400" required />
            <input type="text" name="role" value={formData.role} onChange={handleChange} placeholder="ভূমিকা" className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400" required />
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="মোবাইল নম্বর" className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400" required />
            <div className='flex items-center gap-2'>
              <input type="checkbox" name="wa" id="wa" checked={formData.wa} onChange={handleChange} className='h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500' />
              <label htmlFor="wa" className='text-sm font-medium text-slate-700 dark:text-slate-300'>WhatsApp আছে</label>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors">
              সেভ করুন
            </button>
          </form>
        </motion.div>
      </motion.div>
    )
  }
  
  const CategoryEditor = ({ onSave, onClose }: { onSave: (name: string) => void, onClose: () => void }) => {
    const [name, setName] = useState('');
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (name.trim()) {
        onSave(name.trim());
      }
    };
  
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: -20 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl relative"
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onClose} className='absolute top-3 right-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600'>
            <X size={16}/>
          </button>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">নতুন ডিপার্টমেন্ট যোগ করুন</h3>
          <form onSubmit={handleSubmit} className='space-y-3'>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="ডিপার্টমেন্টের নাম"
              className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400" 
              required 
            />
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors">
              তৈরি করুন
            </button>
          </form>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500 pb-6">
      <AnimatePresence>
        {showLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowLogin(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: -20 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">অ্যাডমিন লগইন</h3>
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="পাসওয়ার্ড দিন"
                className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg mb-2 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400"
              />
              {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
              <button onClick={handleLogin} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors">
                লগইন
              </button>
            </motion.div>
          </motion.div>
        )}
        {showEditor && editingContact && (
          <ContactEditor 
            contact={editingContact}
            onSave={handleSave}
            onClose={() => setShowEditor(false)}
          />
        )}
        {showCategoryEditor && (
          <CategoryEditor 
            onSave={handleSaveCategory}
            onClose={() => setShowCategoryEditor(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center pr-2">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white px-1 border-l-4 border-red-500 pl-3">
          জরুরী সার্ভিস ও কন্ট্রাক্টর
        </h2>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={() => setShowCategoryEditor(true)} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
              নতুন ডিপার্টমেন্ট
            </button>
          )}
          {!isAdmin ? (
            <button onClick={() => setShowLogin(true)} className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
              <Settings size={20}/>
            </button>
          ) : (
            <button onClick={handleLogout} className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline flex items-center gap-1">
              <LogOut size={14}/> লগআউট
            </button>
          )}
        </div>
      </div>

      {/* Emergency 999 */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card rounded-2xl p-5 shadow-lg border border-red-100 dark:border-red-900/30 bg-gradient-to-r from-red-50 to-white dark:from-red-900/20 dark:to-slate-800"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-red-200 dark:shadow-none">
            <Siren size={28} className="animate-pulse" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-red-600 dark:text-red-400 leading-none mb-1">জরুরী জাতীয় হেল্পলাইন</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">বাংলাদেশের যে কোনো জরুরী সহায়তা</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between bg-white dark:bg-slate-700 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
           <span className="text-3xl font-black tracking-widest text-red-600 dark:text-red-400 pl-2">৯৯৯</span>
           <a className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-bold text-sm shadow hover:bg-red-700 active:scale-95 transition-all flex items-center gap-2" href="tel:999">
             <Phone size={16} /> কল করুন
           </a>
        </div>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-4">
        {contacts.map(category => {
          const Icon = icons[category.icon] || Wrench;
          return (
            <div key={category.id} className="mb-4 sm:mb-0">
            <Card 
              title={category.category}
              icon={Icon}
              desc={`${category.people.length} contacts`}
              colorClass={category.colorClass || 'bg-white'}
              iconColor={category.iconColor || 'text-slate-500'}
            >
              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <button onClick={() => handleAdd(category)} className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50">
                    <Plus size={12}/>
                  </button>
                  <button onClick={() => handleDeleteCategory(category.id)} className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1.5 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50">
                    <Trash2 size={12}/>
                  </button>
                </div>
              )}
              <div className="space-y-3 mt-2">
                {category.people.map(person => (
                  <div key={person.id} className="relative border-t border-slate-100 dark:border-slate-700 pt-3">
                    {isAdmin && (
                      <div className="absolute top-3 right-0 flex gap-1">
                        <button onClick={() => handleEdit(category, person)} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600">
                          <Edit size={12}/>
                        </button>
                        <button onClick={() => handleDelete(person.id)} className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50">
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{person.role}</p>
                      <p className="font-bold text-red-600 dark:text-red-400 text-base">{person.name}</p>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="font-bold text-slate-800 dark:text-white text-base">নম্বর</p>
                      <p className="font-mono font-extrabold text-red-600 dark:text-red-400 text-lg">{person.phone}</p>
                    </div>
                    <ActionButtons phone={person.phone} wa={person.wa} />
                  </div>
                ))}
              </div>
            </Card>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default EmergencyView;
