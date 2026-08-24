import React from 'react';
import { Icon, icons } from './Icons';

interface FakeSignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  notify: (msg: string) => void;
}

export const FakeSignUpModal: React.FC<FakeSignUpModalProps> = ({ isOpen, onClose, notify }) => {
  if (!isOpen) return null;

  const handleFakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    notify("Sign up request received. We will contact you.");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in relative text-gray-800">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50 sticky top-0 bg-white z-10">
            <h3 className="font-semibold text-gray-700">Join our Newsletter</h3>
            <button onClick={onClose} title="Close" className="text-gray-400 hover:text-red-500">
              <Icon path={icons.x} />
            </button>
          </div>
          <form onSubmit={handleFakeSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">First Name</label>
                <input required type="text" className="w-full border p-2 rounded outline-none focus:border-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Last Name</label>
                <input required type="text" className="w-full border p-2 rounded outline-none focus:border-blue-500 bg-white" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
              <input required type="email" className="w-full border p-2 rounded outline-none focus:border-blue-500 bg-white" />
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-semibold"
            >
              Sign Up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default FakeSignUpModal;
