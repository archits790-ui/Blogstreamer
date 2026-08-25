import React, { useState } from 'react';
import { Icon, icons } from './Icons';
import { generateId, saveSecure, encryptData } from '../utils/crypto';
import { DEFAULT_THEME, STORAGE_KEY } from '../utils/constants';
import type { GlobalData } from '../types';

interface SetupWizardProps {
  isOpen: boolean;
  onComplete: (data: GlobalData) => void;
  notify: (msg: string, type?: 'info' | 'error') => void;
  onClose: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ isOpen, onComplete, notify, onClose }) => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  if (!isOpen) return null;

  const handleFinish = async () => {
    if (password !== confirmPass) return notify("Passwords do not match", "error");
    if (!username || !password) return notify("Please fill in all fields", "error");

    try {
      const payload = JSON.stringify({
        password: password,
        bookmarks: [],
        notes: []
      });

      const { cipherText, iv, salt } = await encryptData(payload, password);

      const initialData: GlobalData = {
        isSetup: true,
        publicConfig: DEFAULT_THEME,
        spaces: [
          {
            id: generateId(),
            username: username,
            role: 'admin',
            cipherText: cipherText,
            iv: iv,
            salt: salt
          }
        ]
      };
      saveSecure(STORAGE_KEY, initialData);
      onComplete(initialData);
    } catch (err: any) {
      notify("Setup encryption failed: " + err.message, "error");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black bg-opacity-70 backdrop-blur-md overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full relative text-gray-800">
          <button onClick={onClose} title="Close Setup" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <Icon path={icons.x} />
          </button>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Setup Wizard</h1>
            <p className="text-gray-500">Configure your private Admin space.</p>
          </div>

          {step === 1 && (
            <div className="space-y-4 fade-in">
              <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                <p><strong>How to use this site:</strong></p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>The site looks like a public blog.</li>
                  <li>Your Data is encrypted in this browser.</li>
                  <li>Create the first <strong>Admin</strong> account now.</li>
                  <li>Remember to export backups!</li>
                  <li>Login to access your private data.</li>
                </ul>
              </div>
              <button 
                onClick={() => setStep(2)} 
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Next Step
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 fade-in">
              <h3 className="font-semibold text-gray-700">Create Admin Account</h3>
              <input 
                type="text" 
                placeholder="Admin Username" 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
              <input 
                type="password" 
                placeholder="Password" 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <input 
                type="password" 
                placeholder="Confirm Password" 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
              />
              <button 
                onClick={handleFinish} 
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <Icon path={icons.check} /> Complete Setup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default SetupWizard;
