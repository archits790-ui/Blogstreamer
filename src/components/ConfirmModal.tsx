import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  msg: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, msg, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[110] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6 animate-fade-in text-gray-800 dark:text-gray-100 relative">
          <h3 className="text-lg font-bold mb-2">Confirm Action</h3>
          <p className="opacity-80 mb-6">{msg}</p>
          <div className="flex justify-end gap-3">
            <button 
              onClick={onCancel} 
              className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm} 
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ConfirmModal;
