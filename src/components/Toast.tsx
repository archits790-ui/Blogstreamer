import React, { useEffect } from 'react';
import { Icon, icons } from './Icons';

interface ToastProps {
  msg: string;
  type?: 'info' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ msg, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgClass = type === 'error' ? 'bg-red-500' : 'bg-gray-800';

  return (
    <div className={`fixed bottom-4 right-4 ${bgClass} text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 toast-slide z-[120]`}>
      <span>{msg}</span>
      <button onClick={onClose} title="Close" className="opacity-70 hover:opacity-100">
        <Icon path={icons.x} className="w-4 h-4" />
      </button>
    </div>
  );
};
export default Toast;
