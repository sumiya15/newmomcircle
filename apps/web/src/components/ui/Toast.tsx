"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
  message: string | null;
  type?: 'error' | 'success' | 'info';
  onClose?: () => void;
}

const icons = {
  error: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  success: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const styles = {
  error:   { bg: 'bg-[#E85555]/15', border: 'border-[#E85555]/30', icon: 'bg-[#E85555] text-white' },
  success: { bg: 'bg-[#4CAF7D]/12', border: 'border-[#4CAF7D]/30', icon: 'bg-[#4CAF7D] text-white' },
  info:    { bg: 'bg-white/8',       border: 'border-white/15',      icon: 'bg-white/15 text-white' },
};

export const Toast: React.FC<ToastProps> = ({ message, type = 'error', onClose }) => {
  const s = styles[type];

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={`fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 sm:max-w-[360px] z-[60] flex items-start gap-3 p-3.5 ${s.bg} backdrop-blur-xl border ${s.border} text-white rounded-2xl shadow-2xl`}
        >
          <div className={`flex-shrink-0 w-7 h-7 rounded-lg ${s.icon} flex items-center justify-center`}>
            {icons[type]}
          </div>
          <p className="text-[13px] font-medium leading-snug flex-1 pt-0.5">{message}</p>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 text-white/40 hover:text-white/80 transition-colors rounded"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
