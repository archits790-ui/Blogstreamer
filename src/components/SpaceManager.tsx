import React, { useState } from 'react';
import { Icon, icons } from './Icons';
import { Modal } from './Modal';
import type { EncryptedSpace } from '../types';

interface SpaceManagerProps {
  spaces: EncryptedSpace[];
  currentId: string;
  onUpdateRole: (spaceId: string, role: 'admin' | 'regular') => void;
  onCreateSpace: (username: string, pass: string, role: 'admin' | 'regular') => Promise<void>;
  onResetPassword: (spaceId: string, newPass: string) => Promise<void>;
  onDeleteSpace: (spaceId: string) => void;
  notify: (msg: string, type?: 'info' | 'error') => void;
  askConfirm: (msg: string, onConfirm: () => void) => void;
  onReset: () => void;
  isDark: boolean;
}

export const SpaceManager: React.FC<SpaceManagerProps> = ({ 
  spaces, 
  currentId, 
  onUpdateRole, 
  onCreateSpace, 
  onResetPassword, 
  onDeleteSpace, 
  notify, 
  askConfirm, 
  onReset, 
  isDark 
}) => {
  const [newSpace, setNewSpace] = useState({ username: "", password: "", role: "regular" as 'admin' | 'regular' });
  const [resetPassId, setResetPassId] = useState<string | null>(null);
  const [newResetPass, setNewResetPass] = useState("");

  const createSpace = async () => {
    if (!newSpace.username || !newSpace.password) return notify("Fill in all fields", "error");
    if (spaces.some(s => s.username === newSpace.username)) return notify("Username taken", "error");
    
    await onCreateSpace(newSpace.username, newSpace.password, newSpace.role);
    setNewSpace({ username: "", password: "", role: "regular" });
  };

  const handleAdminResetPass = async () => {
    if (!newResetPass) return notify("Password cannot be empty", "error");
    if (resetPassId) {
      await onResetPassword(resetPassId, newResetPass);
      setResetPassId(null);
      setNewResetPass("");
    }
  };

  const deleteSpace = (id: string) => {
    if (id === currentId) {
      const admins = spaces.filter(s => s.role === 'admin');
      if (admins.length > 1) {
        askConfirm("Are you sure you want to delete YOUR own Admin space?", () => {
          onDeleteSpace(id);
          onReset(); 
        });
        return;
      }
      if (spaces.length === 1) {
        askConfirm("WARNING: You are the only space left. Deleting this will reset the entire application to the setup wizard. Proceed?", () => {
          localStorage.clear();
          window.location.reload();
        });
      } else {
        return notify("You are the only Admin. Promote another user to Admin before deleting yourself.", "error");
      }
      return;
    }

    askConfirm("Are you sure? This will delete all data in that space permanently.", () => {
      onDeleteSpace(id);
    });
  };

  return (
    <div className="space-y-6 pb-20 text-gray-800 dark:text-gray-100">
      <div className={`border p-4 rounded-lg text-sm ${isDark ? 'bg-blue-900/30 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
        <h4 className="font-bold flex items-center gap-2">
          <Icon path={icons.users} /> How Spaces Work
        </h4>
        <p className="mt-1">Use "Admin" spaces to manage other accounts. Only Admins can create new spaces.</p>
      </div>

      <Modal isOpen={!!resetPassId} onClose={() => setResetPassId(null)} title="Reset User Password">
        <div className="space-y-4 text-gray-800 dark:text-gray-100">
          <p className="text-sm opacity-70">Enter new password for selected user (this will reset their space data):</p>
          <input 
            type="password" 
            className={`w-full border p-2 rounded ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-black'}`} 
            value={newResetPass}
            placeholder="New Password"
            onChange={e => setNewResetPass(e.target.value)}
          />
          <button onClick={handleAdminResetPass} className="w-full bg-red-600 text-white py-2 rounded">Force Change Password</button>
        </div>
      </Modal>

      <div className={`p-6 rounded-xl shadow-sm ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        <h3 className="text-lg font-bold mb-4">Create New Space</h3>
        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold opacity-70 uppercase mb-1">New Username</label>
            <input className={`w-full border p-2 rounded ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-black'}`} value={newSpace.username} onChange={e => setNewSpace({...newSpace, username: e.target.value})} />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold opacity-70 uppercase mb-1">New Password</label>
            <input className={`w-full border p-2 rounded ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-black'}`} type="password" value={newSpace.password} onChange={e => setNewSpace({...newSpace, password: e.target.value})} />
          </div>
          <div className="min-w-[150px]">
            <label className="block text-xs font-bold opacity-70 uppercase mb-2">Space Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="role" checked={newSpace.role === 'regular'} onChange={() => setNewSpace({...newSpace, role: 'regular'})} />
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Regular</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="role" checked={newSpace.role === 'admin'} onChange={() => setNewSpace({...newSpace, role: 'admin'})} />
                <span className="text-sm font-bold text-indigo-600">Admin</span>
              </label>
            </div>
          </div>
          <button onClick={createSpace} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 h-10">Create</button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold">Existing Spaces</h3>
        {spaces.map(s => (
          <div key={s.id} className={`p-4 rounded border flex justify-between items-center flex-wrap gap-y-2 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white text-gray-800'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${s.id === currentId ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="font-bold">{s.username}</span>
              {s.id === currentId && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Current (You)</span>}
            </div>
            
            <div className="flex gap-4 items-center flex-1 justify-end">
              <button 
                onClick={() => setResetPassId(s.id)} 
                className="text-xs text-blue-500 hover:underline"
              >
                Reset Password
              </button>

              <select 
                className={`text-xs border p-1 rounded ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-black'}`} 
                value={s.role} 
                onChange={(e) => onUpdateRole(s.id, e.target.value as 'admin' | 'regular')}
                disabled={s.id === currentId} 
              >
                <option value="regular">Regular</option>
                <option value="admin">Admin</option>
              </select>

              <div className="text-sm opacity-70">
                {s.bookmarksCount || 0} B • {s.notesCount || 0} N
              </div>
              
              <button onClick={() => deleteSpace(s.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition" title="Delete Space">
                <Icon path={icons.trash} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default SpaceManager;
