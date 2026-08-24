import React from 'react';
import { Icon, icons } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in flex flex-col max-h-[85vh] relative">
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 flex-shrink-0">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
            <button onClick={onClose} title="Close Modal" className="text-gray-400 hover:text-red-500">
              <Icon path={icons.x} />
            </button>
          </div>
          <div className="p-4 overflow-y-auto custom-scroll flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Modal;
