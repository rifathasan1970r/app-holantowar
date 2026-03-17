import React from 'react';
import EmergencyNoticeBox from '../src/components/EmergencyNoticeBox';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ServiceLayoutProps {
  children: React.ReactNode;
  setView: (view: string) => void;
}

export const ServiceLayout: React.FC<ServiceLayoutProps> = ({ children, setView }) => {
  return (
    <div className="pb-24 relative min-h-screen">
      {/* Top Emergency Notice */}
      <EmergencyNoticeBox onClick={() => setView('EMERGENCY_NOTICE_DETAIL')} />
      
      {children}

      {/* Bottom Floating Emergency Button */}
      <div className="fixed bottom-24 right-4 z-40">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{ 
            boxShadow: [
              "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              "0 0 20px 5px rgba(245, 158, 11, 0.4)",
              "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          onClick={() => setView('EMERGENCY_NOTICE_DETAIL')}
          className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800"
        >
          <AlertTriangle size={24} />
        </motion.button>
      </div>
    </div>
  );
};
