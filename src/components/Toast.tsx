import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success' }) => {
  return (
    <div className="fixed top-6 right-6 z-50 animate-bounce">
      <div
        className={`p-4 rounded-xl shadow-xl border flex items-center space-x-3 text-xs font-semibold ${
          type === 'success'
            ? 'bg-[#181716] border-[#61564A] text-[#E4DFD7]'
            : 'bg-red-950 border-red-700 text-red-100'
        }`}
      >
        {type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-[#A59B8F] shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-300 shrink-0" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
};
