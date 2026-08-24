import React, { useState } from 'react';
import { Icon, icons } from './Icons';
import type { Space } from '../types';

interface SecuritySettingsProps {
  user: Space;
  onUpdatePass: (pass: string) => void;
  notify: (msg: string, type?: 'info' | 'error') => void;
  isDark: boolean;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({ onUpdatePass, notify, isDark }) => {
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleUpdate = () => {
    if (!pass) return notify("Password cannot be empty", "error");
    if (pass !== confirm) return notify("Passwords do not match", "error");
    onUpdatePass(pass);
    setPass("");
    setConfirm("");
    notify("Password updated successfully");
  };

  return (
    <div className={`p-6 rounded-xl shadow-sm max-w-lg mx-auto mt-10 ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Icon path={icons.lock} /> Change Password
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">New Password</label>
          <input 
            type="password"
            className={`w-full border p-2 rounded ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-black'}`} 
            value={pass} 
            onChange={e => setPass(e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Confirm New Password</label>
          <input 
            type="password"
            className={`w-full border p-2 rounded ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-black'}`} 
            value={confirm} 
            onChange={e => setConfirm(e.target.value)} 
          />
        </div>
        <button onClick={handleUpdate} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full">Update Password</button>
      </div>
    </div>
  );
};
export default SecuritySettings;
