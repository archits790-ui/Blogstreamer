import React, { useState, useEffect } from 'react';
import { loadSecure, saveSecure, encryptData, decryptData, generateId } from './utils/crypto';
import { STORAGE_KEY, THEME_PREF_KEY, DEFAULT_THEME } from './utils/constants';
import type { GlobalData, Space, EncryptedSpace } from './types';
import SetupWizard from './components/SetupWizard';
import FakeSignUpModal from './components/FakeSignUpModal';
import LoginModal from './components/LoginModal';
import PublicView from './components/PublicView';
import Dashboard from './components/Dashboard';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';

export const App: React.FC = () => {
  const [data, setData] = useState<GlobalData | null>(null);
  const [currentUser, setCurrentUser] = useState<Space | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  
  // Stealth Setup State
  const [showSetup, setShowSetup] = useState(false);
  const [showFakeSignUp, setShowFakeSignUp] = useState(false);
  
  // Global Theme State
  const [isDark, setIsDark] = useState(false);

  // UI Global State
  const [toast, setToast] = useState<{ msg: string; type?: 'info' | 'error' } | null>(null);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; msg: string; onConfirm: (() => void) | null }>({ 
    isOpen: false, 
    msg: "", 
    onConfirm: null 
  });

  const notify = (msg: string, type: 'info' | 'error' = 'info') => {
    setToast({ msg, type });
  };

  const askConfirm = (msg: string, onConfirm: () => void) => {
    setConfirmState({ isOpen: true, msg, onConfirm });
  };

  const handleConfirm = () => {
    if (confirmState.onConfirm) confirmState.onConfirm();
    setConfirmState({ ...confirmState, isOpen: false });
  };

  const handleCancelConfirm = () => {
    setConfirmState({ ...confirmState, isOpen: false });
  };

  useEffect(() => {
    const loaded = loadSecure<GlobalData>(STORAGE_KEY);
    const savedTheme = localStorage.getItem(THEME_PREF_KEY);
    if (savedTheme) {
      setIsDark(savedTheme === 'true');
    }

    if (loaded) {
      const needsMigration = loaded.spaces && loaded.spaces.some((s: any) => s.password && !s.cipherText);
      if (needsMigration && loaded.spaces) {
        const migrate = async () => {
          try {
            const migratedSpaces = await Promise.all(loaded.spaces!.map(async (s: any) => {
              if (s.password && !s.cipherText) {
                const payload = JSON.stringify({
                  password: s.password,
                  bookmarks: s.bookmarks || [],
                  notes: s.notes || []
                });
                const { cipherText, iv, salt } = await encryptData(payload, s.password);
                return {
                  id: s.id,
                  username: s.username,
                  role: s.role,
                  cipherText,
                  iv,
                  salt,
                  bookmarksCount: (s.bookmarks || []).length,
                  notesCount: (s.notes || []).length
                };
              }
              return s;
            }));
            const migratedData = { ...loaded, spaces: migratedSpaces };
            setData(migratedData);
            saveSecure(STORAGE_KEY, migratedData);
          } catch (e) {
            console.error("Migration failed", e);
            setData(loaded);
          }
        };
        migrate();
      } else {
        setData(loaded);
      }
    } else {
      setData({ 
        isSetup: false,
        publicConfig: DEFAULT_THEME 
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_PREF_KEY, String(isDark));
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  const saveData = (newData: GlobalData) => {
    setData(newData);
    saveSecure(STORAGE_KEY, newData);
  };

  const handleLogin = async (user: string, pass: string, callback: (success: boolean) => void) => {
    if (!data || !data.spaces) return callback(false);
    const foundSpace = data.spaces.find(s => s.username === user);
    if (foundSpace) {
      try {
        const decryptedPayload = await decryptData(foundSpace.cipherText, foundSpace.iv, foundSpace.salt, pass);
        const parsed = JSON.parse(decryptedPayload);
        
        if (parsed.password === pass) {
          const loadedUser: Space = {
            id: foundSpace.id,
            username: foundSpace.username,
            password: parsed.password,
            role: foundSpace.role,
            bookmarks: parsed.bookmarks || [],
            notes: parsed.notes || [],
            autoLockMinutes: parsed.autoLockMinutes || 0
          };
          setCurrentUser(loadedUser);
          setShowLogin(false);
          callback(true);
          notify(`Welcome back, ${user}!`);
        } else {
          callback(false);
        }
      } catch (err) {
        console.error("Decryption failed", err);
        callback(false);
      }
    } else {
      callback(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    notify("Logged out successfully");
  };

  const handleResetApp = () => {
    setCurrentUser(null);
    setData({ isSetup: false, publicConfig: DEFAULT_THEME });
  };

  const handleSignUpTrigger = () => {
    if (data && !data.isSetup) {
      setShowSetup(true);
    } else {
      setShowFakeSignUp(true);
    }
  };

  // --- CRYPTO DATA HANDLERS FOR DASHBOARD PANEL ---

  const handleUpdateUserSpace = async (updatedBookmarks: any[], updatedNotes: any[]) => {
    if (!currentUser || !data || !data.spaces) return;

    try {
      const updatedUser: Space = {
        ...currentUser,
        bookmarks: updatedBookmarks,
        notes: updatedNotes
      };
      setCurrentUser(updatedUser);

      const payload = JSON.stringify({
        password: currentUser.password,
        bookmarks: updatedBookmarks,
        notes: updatedNotes
      });

      const { cipherText, iv, salt } = await encryptData(payload, currentUser.password);

      const updatedSpaces = data.spaces.map(s => 
        s.id === currentUser.id 
          ? { 
              ...s, 
              cipherText, 
              iv, 
              salt, 
              bookmarksCount: updatedBookmarks.length, 
              notesCount: updatedNotes.length 
            } 
          : s
      );

      saveData({ ...data, spaces: updatedSpaces });
    } catch (err: any) {
      notify("Failed to save changes: " + err.message, "error");
    }
  };

  const handleUpdatePassword = async (newPass: string) => {
    if (!currentUser || !data || !data.spaces) return;

    try {
      const updatedUser: Space = {
        ...currentUser,
        password: newPass
      };
      setCurrentUser(updatedUser);

      const payload = JSON.stringify({
        password: newPass,
        bookmarks: currentUser.bookmarks,
        notes: currentUser.notes
      });

      const { cipherText, iv, salt } = await encryptData(payload, newPass);

      const updatedSpaces = data.spaces.map(s => 
        s.id === currentUser.id 
          ? { ...s, cipherText, iv, salt } 
          : s
      );

      saveData({ ...data, spaces: updatedSpaces });
    } catch (err: any) {
      notify("Failed to change password: " + err.message, "error");
    }
  };

  const handleUpdateAutoLock = async (minutes: number) => {
    if (!currentUser || !data || !data.spaces) return;

    try {
      const updatedUser: Space = {
        ...currentUser,
        autoLockMinutes: minutes
      };
      setCurrentUser(updatedUser);

      const payload = JSON.stringify({
        password: currentUser.password,
        bookmarks: currentUser.bookmarks,
        notes: currentUser.notes,
        autoLockMinutes: minutes
      });

      const { cipherText, iv, salt } = await encryptData(payload, currentUser.password);

      const updatedSpaces = data.spaces.map(s => 
        s.id === currentUser.id 
          ? { ...s, cipherText, iv, salt } 
          : s
      );

      saveData({ ...data, spaces: updatedSpaces });
    } catch (err: any) {
      notify("Failed to update auto-lock: " + err.message, "error");
    }
  };

  const handleAdminCreateSpace = async (username: string, pass: string, role: 'admin' | 'regular') => {
    if (!data || !data.spaces) return;

    try {
      const payload = JSON.stringify({
        password: pass,
        bookmarks: [],
        notes: []
      });

      const { cipherText, iv, salt } = await encryptData(payload, pass);

      const newSpace: EncryptedSpace = {
        id: generateId(),
        username: username,
        role: role,
        cipherText,
        iv,
        salt,
        bookmarksCount: 0,
        notesCount: 0
      };

      saveData({ ...data, spaces: [...data.spaces, newSpace] });
      notify("Space created successfully");
    } catch (err: any) {
      notify("Failed to create space: " + err.message, "error");
    }
  };

  const handleAdminResetPassword = async (spaceId: string, newPass: string) => {
    if (!data || !data.spaces) return;

    try {
      const payload = JSON.stringify({
        password: newPass,
        bookmarks: [],
        notes: []
      });

      const { cipherText, iv, salt } = await encryptData(payload, newPass);

      const updatedSpaces = data.spaces.map(s => 
        s.id === spaceId 
          ? { ...s, cipherText, iv, salt, bookmarksCount: 0, notesCount: 0 } 
          : s
      );

      saveData({ ...data, spaces: updatedSpaces });
      notify("User password reset and space initialized");
    } catch (err: any) {
      notify("Failed to reset password: " + err.message, "error");
    }
  };

  const handleAdminUpdateRole = (spaceId: string, role: 'admin' | 'regular') => {
    if (!data || !data.spaces) return;
    const updatedSpaces = data.spaces.map(s => 
      s.id === spaceId ? { ...s, role } : s
    );
    saveData({ ...data, spaces: updatedSpaces });
    notify("User role updated");
  };

  const handleAdminDeleteSpace = (spaceId: string) => {
    if (!data || !data.spaces) return;
    const updatedSpaces = data.spaces.filter(s => s.id !== spaceId);
    saveData({ ...data, spaces: updatedSpaces });
    notify("Space deleted");
  };

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-sm opacity-70">Loading space database...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Stealth Setup Wizard */}
      <SetupWizard 
        isOpen={showSetup} 
        onClose={() => setShowSetup(false)}
        onComplete={(initialData) => {
          saveData(initialData);
          setShowSetup(false);
          notify("Setup Complete. Please log in.");
          setShowLogin(true);
        }} 
        notify={notify} 
      />
      
      {/* Fake Sign Up for Stealth */}
      <FakeSignUpModal isOpen={showFakeSignUp} onClose={() => setShowFakeSignUp(false)} notify={notify} />

      {/* PUBLIC VIEW (The Disguise) */}
      {!currentUser && (
        <>
          <PublicView 
            config={data.publicConfig} 
            onLoginRequest={() => setShowLogin(true)} 
            onSignUpTrigger={handleSignUpTrigger}
            isDark={isDark}
            setIsDark={setIsDark}
          />
          <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onLogin={handleLogin} notify={notify} />
        </>
      )}

      {/* PRIVATE DASHBOARD */}
      {data.isSetup && currentUser && (
        <Dashboard 
          activeUser={currentUser} 
          globalData={data} 
          onUpdateData={(newData) => {
            saveData(newData);
          }}
          onUpdateUserSpace={handleUpdateUserSpace}
          onUpdatePassword={handleUpdatePassword}
          onUpdateAutoLock={handleUpdateAutoLock}
          onAdminCreateSpace={handleAdminCreateSpace}
          onAdminResetPassword={handleAdminResetPassword}
          onAdminUpdateRole={handleAdminUpdateRole}
          onAdminDeleteSpace={handleAdminDeleteSpace}
          onLogout={handleLogout} 
          notify={notify}
          askConfirm={askConfirm}
          onReset={handleResetApp}
          isDark={isDark}
          setIsDark={setIsDark}
        />
      )}

      {/* Global UI Overlays */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmModal 
        isOpen={confirmState.isOpen} 
        msg={confirmState.msg} 
        onConfirm={handleConfirm} 
        onCancel={handleCancelConfirm} 
      />
    </>
  );
};

export default App;
