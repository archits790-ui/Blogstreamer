import React, { useState } from 'react';
import { Icon, icons } from './Icons';
import type { Space } from '../types';

interface SecuritySettingsProps {
  user: Space;
  onUpdatePass: (pass: string) => void;
  onUpdateAutoLock?: (minutes: number) => void;
  notify: (msg: string, type?: 'info' | 'error') => void;
  isDark: boolean;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({ user, onUpdatePass, onUpdateAutoLock, notify, isDark }) => {
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [autoLock, setAutoLock] = useState<number>(user.autoLockMinutes ?? 0);

  const handleUpdate = () => {
    if (!pass) return notify("Password cannot be empty", "error");
    if (pass !== confirm) return notify("Passwords do not match", "error");
    onUpdatePass(pass);
    setPass("");
    setConfirm("");
    notify("Password updated successfully");
  };

  const handleAutoLockChange = (mins: number) => {
    setAutoLock(mins);
    if (onUpdateAutoLock) {
      onUpdateAutoLock(mins);
      notify(mins > 0 ? `Auto-Lock set to ${mins} minutes` : "Auto-Lock disabled");
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto mt-6">
      {/* Panic Key Notice */}
      <div className={`p-5 rounded-2xl border flex items-start gap-4 ${isDark ? 'bg-indigo-950/30 border-indigo-800/60 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-900'}`}>
        <div className="p-2 rounded-xl bg-indigo-600 text-white flex-shrink-0">
          <Icon path={icons.shield} className="w-5 h-5" />
        </div>
        <div className="text-sm space-y-1">
          <h4 className="font-bold text-base">Stealth Mode & Panic Key</h4>
          <p className="opacity-90 leading-relaxed">
            Press <kbd className="px-2 py-0.5 rounded font-mono text-xs font-bold border border-current">Esc</kbd> or <kbd className="px-2 py-0.5 rounded font-mono text-xs font-bold border border-current">Alt + X</kbd> anywhere in the dashboard to instantly wipe the view and jump back to the innocent public blog.
          </p>
        </div>
      </div>

      {/* Auto-Lock Inactivity Timer */}
      <div className={`p-6 rounded-2xl shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Icon path={icons.timer} className="w-5 h-5 text-amber-500" /> Auto-Lock Inactivity Timer
        </h3>
        <p className="text-xs opacity-70 mb-4">Automatically log out and lock your private dashboard when no mouse or keyboard activity is detected.</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Off / Never', val: 0 },
            { label: '2 Minutes', val: 2 },
            { label: '5 Minutes', val: 5 },
            { label: '10 Minutes', val: 10 },
            { label: '15 Minutes', val: 15 },
            { label: '30 Minutes', val: 30 },
          ].map(opt => (
            <button
              key={opt.val}
              type="button"
              onClick={() => handleAutoLockChange(opt.val)}
              className={`p-2.5 text-xs font-semibold rounded-xl border transition flex items-center justify-center gap-2 ${autoLock === opt.val ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 opacity-80'}`}
            >
              {autoLock === opt.val && <Icon path={icons.check} className="w-3.5 h-3.5" />}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Change Password Card */}
      <div className={`p-6 rounded-2xl shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Icon path={icons.lock} className="w-5 h-5 text-blue-500" /> Change Space Password
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase opacity-70 mb-1">New Password</label>
            <input 
              type="password"
              className={`w-full border p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`} 
              value={pass} 
              onChange={e => setPass(e.target.value)} 
              placeholder="Enter new strong password"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase opacity-70 mb-1">Confirm New Password</label>
            <input 
              type="password"
              className={`w-full border p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`} 
              value={confirm} 
              onChange={e => setConfirm(e.target.value)} 
              placeholder="Re-enter new password"
            />
          </div>
          <button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-xl w-full text-sm shadow transition">
            Update & Re-encrypt Space
          </button>
        </div>
      </div>
    </div>
  );
};
export default SecuritySettings;
