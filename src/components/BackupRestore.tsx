import React, { useState, useRef } from 'react';
import { Icon, icons } from './Icons';
import { Modal } from './Modal';
import { encryptData, decryptData } from '../utils/crypto';
import type { GlobalData } from '../types';

interface BackupRestoreProps {
  data: GlobalData;
  onImport: (data: GlobalData) => void;
  notify: (msg: string, type?: 'info' | 'error') => void;
  askConfirm: (msg: string, onConfirm: () => void) => void;
  isDark: boolean;
}

export const BackupRestore: React.FC<BackupRestoreProps> = ({ data, onImport, notify, askConfirm, isDark }) => {
  // Modal states for Encryption Passcode
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPass, setExportPass] = useState("");
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPass, setImportPass] = useState("");
  
  const importFileRef = useRef<any>(null);

  const handleExport = async () => {
    if (!exportPass) return notify("Passcode cannot be empty", "error");
    try {
      const dataStr = JSON.stringify(data);
      const encrypted = await encryptData(dataStr, exportPass);
      const backupPayload = {
        ...encrypted,
        isEncryptedBackup: true
      };

      const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `encrypted_backup_secure_site_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      notify("Encrypted backup downloaded successfully");
      setShowExportModal(false);
      setExportPass("");
    } catch (err: any) {
      notify("Export failed: " + err.message, "error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        if (parsed.isEncryptedBackup) {
          // Encrypted backup requires passcode modal
          importFileRef.current = parsed;
          setShowImportModal(true);
        } else {
          // Legacy unencrypted backup
          if (!parsed.spaces || !parsed.publicConfig) throw new Error("Invalid format");
          askConfirm("This will overwrite all current data. Are you sure?", () => {
            onImport(parsed);
            notify("Import successful! Data updated.");
          });
        }
      } catch (err: any) {
        notify("Error reading backup file: " + err.message, "error");
      }
    };
    reader.readAsText(file);
  };

  const handleImportDecrypt = async () => {
    if (!importPass) return notify("Enter passcode to decrypt", "error");
    try {
      const encryptedData = importFileRef.current;
      if (!encryptedData) return;

      const decryptedStr = await decryptData(
        encryptedData.cipherText,
        encryptedData.iv,
        encryptedData.salt,
        importPass
      );

      const parsed = JSON.parse(decryptedStr);
      if (!parsed.spaces || !parsed.publicConfig) throw new Error("Decrypted data is invalid format");

      askConfirm("Decrypted successfully! This will overwrite all current data. Proceed?", () => {
        onImport(parsed);
        notify("Import successful! Data updated.");
        setShowImportModal(false);
        setImportPass("");
        importFileRef.current = null;
      });
    } catch (err) {
      notify("Decryption failed. Invalid passcode.", "error");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-800 dark:text-gray-100">
      
      {/* Export Passcode Modal */}
      <Modal isOpen={showExportModal} onClose={() => setShowExportModal(false)} title="Set Backup Passcode">
        <div className="space-y-4 text-gray-800 dark:text-gray-100">
          <p className="text-sm text-gray-600 dark:text-gray-300">Choose a passcode to encrypt your backup file. You will need this passcode to restore it.</p>
          <input 
            type="password" 
            className={`w-full border p-2 rounded ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-black'}`} 
            value={exportPass}
            placeholder="Backup Passcode"
            onChange={e => setExportPass(e.target.value)}
          />
          <button onClick={handleExport} className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700">
            Encrypt & Download
          </button>
        </div>
      </Modal>

      {/* Import Passcode Modal */}
      <Modal isOpen={showImportModal} onClose={() => { setShowImportModal(false); importFileRef.current = null; }} title="Enter Backup Passcode">
        <div className="space-y-4 text-gray-800 dark:text-gray-100">
          <p className="text-sm text-gray-600 dark:text-gray-300">This backup is password-protected. Enter the passcode used to export it:</p>
          <input 
            type="password" 
            className={`w-full border p-2 rounded ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-black'}`} 
            value={importPass}
            placeholder="Enter Backup Passcode"
            onChange={e => setImportPass(e.target.value)}
          />
          <button onClick={handleImportDecrypt} className="w-full bg-orange-600 text-white py-2 rounded font-semibold hover:bg-orange-700">
            Decrypt & Restore
          </button>
        </div>
      </Modal>

      <div className={`p-6 rounded-xl shadow-sm text-center ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        <div className="text-blue-500 mb-4 flex justify-center">
          <Icon path={icons.download} className="w-12 h-12" />
        </div>
        <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Export Encrypted Data</h3>
        <p className="text-sm mb-6 text-gray-600 dark:text-gray-300">Download a secure AES-encrypted file containing all spaces, notes, bookmarks, and site configuration.</p>
        <button onClick={() => setShowExportModal(true)} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full font-semibold">
          Export Backup
        </button>
      </div>

      <div className={`p-6 rounded-xl shadow-sm text-center ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        <div className="text-orange-500 mb-4 flex justify-center">
          <Icon path={icons.upload} className="w-12 h-12" />
        </div>
        <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Import Data</h3>
        <p className="text-sm mb-6 text-gray-600 dark:text-gray-300">Restore your data from your backup file. Encrypted backups will prompt for their passcode.</p>
        <label className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 w-full cursor-pointer inline-block font-semibold">
          Select File
          <input type="file" className="hidden" accept=".json" onChange={handleFileChange} onClick={(e: any) => { e.target.value = null; }} />
        </label>
      </div>
    </div>
  );
};
export default BackupRestore;
