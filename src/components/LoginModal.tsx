import React, { useState } from 'react';
import { Icon, icons } from './Icons';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: string, pass: string, callback: (success: boolean) => void) => void;
  notify: (msg: string, type?: 'info' | 'error') => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(user, pass, (success) => {
      if (!success) {
        setError("Invalid credentials.");
      } else {
        setUser("");
        setPass("");
        setError("");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-fade-in relative border border-transparent dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Login</h3>
            <button onClick={onClose} title="Close" className="text-gray-400 hover:text-red-500 dark:hover:text-red-400">
              <Icon path={icons.x} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && <div className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 p-2 rounded">{error}</div>}
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Username</label>
              <input 
                autoFocus 
                type="text" 
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400 dark:placeholder-gray-500" 
                value={user} 
                onChange={e => setUser(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Password</label>
              <input 
                type="password" 
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400 dark:placeholder-gray-500" 
                value={pass} 
                onChange={e => setPass(e.target.value)} 
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default LoginModal;
