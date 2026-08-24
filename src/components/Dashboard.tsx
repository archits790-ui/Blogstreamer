import React, { useState } from 'react';
import { Icon, icons } from './Icons';
import type { Space, GlobalData } from '../types';
import BookmarkManager from './BookmarkManager';
import NoteManager from './NoteManager';
import PublicEditor from './PublicEditor';
import SpaceManager from './SpaceManager';
import BackupRestore from './BackupRestore';
import SecuritySettings from './SecuritySettings';

interface DashboardProps {
  activeUser: Space;
  globalData: GlobalData;
  onUpdateData: (data: GlobalData) => void;
  onUpdateUserSpace: (bookmarks: any[], notes: any[]) => Promise<void>;
  onUpdatePassword: (pass: string) => Promise<void>;
  onAdminCreateSpace: (username: string, pass: string, role: 'admin' | 'regular') => Promise<void>;
  onAdminResetPassword: (spaceId: string, newPass: string) => Promise<void>;
  onAdminUpdateRole: (spaceId: string, role: 'admin' | 'regular') => void;
  onAdminDeleteSpace: (spaceId: string) => void;
  onLogout: () => void;
  notify: (msg: string, type?: 'info' | 'error') => void;
  askConfirm: (msg: string, onConfirm: () => void) => void;
  onReset: () => void;
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  expanded: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick, expanded }) => (
  <button 
    onClick={onClick} 
    title={!expanded ? label : ""}
    className={`w-full flex items-center gap-4 px-4 py-3 transition-colors ${active ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
  >
    <div className={`${active ? 'text-white' : 'opacity-70'} flex-shrink-0`}>
      <Icon path={icon} />
    </div>
    {expanded && <span className="font-medium whitespace-nowrap">{label}</span>}
  </button>
);

export const Dashboard: React.FC<DashboardProps> = ({ 
  activeUser, 
  globalData, 
  onUpdateData,
  onUpdateUserSpace,
  onUpdatePassword,
  onAdminCreateSpace,
  onAdminResetPassword,
  onAdminUpdateRole,
  onAdminDeleteSpace,
  onLogout, 
  notify, 
  askConfirm, 
  onReset, 
  isDark, 
  setIsDark 
}) => {
  const [tab, setTab] = useState("bookmarks"); 
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [searchTerm, setSearchTerm] = useState("");

  const updateGlobalConfig = (newConfig: any) => {
    onUpdateData({ ...globalData, publicConfig: newConfig });
  };

  const toggleTheme = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDark(prev => !prev);
  };

  const sidebarMobileClass = isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64";
  const sidebarDesktopClass = isSidebarOpen ? "md:w-64 md:translate-x-0" : "md:w-20 md:translate-x-0";

  return (
    <div className={`flex h-full ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-800'} font-sans transition-colors duration-300`}>
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 md:relative bg-gray-800 text-gray-300 transition-all duration-300 flex flex-col shadow-2xl flex-shrink-0 ${sidebarMobileClass} ${sidebarDesktopClass}`}>
        <div className="p-4 flex items-center justify-between border-b border-gray-700 h-16">
          <img 
            src="logo1.png" 
            alt="Logo" 
            onClick={onLogout} 
            title="Return to Blog" 
            className="h-9 w-9 cursor-pointer object-contain" 
          />
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)} 
            title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"} 
            className="p-1 hover:bg-gray-700 rounded flex-shrink-0"
          >
            <Icon path={isSidebarOpen ? icons.x : icons.plus} className="w-5 h-5 transform rotate-45" /> 
          </button>
        </div>
        <nav className="flex-1 py-6 space-y-2 overflow-y-auto custom-scroll overflow-x-hidden">
          <SidebarItem icon={icons.bookmark} label="Bookmarks" active={tab === 'bookmarks'} onClick={() => setTab('bookmarks')} expanded={isSidebarOpen} />
          <SidebarItem icon={icons.fileText} label="Notes" active={tab === 'notes'} onClick={() => setTab('notes')} expanded={isSidebarOpen} />
          <div className="my-4 border-t border-gray-700 opacity-50"></div>
          
          <SidebarItem icon={icons.key} label="Security" active={tab === 'security'} onClick={() => setTab('security')} expanded={isSidebarOpen} />

          {/* Admin Only Items */}
          {activeUser.role === 'admin' && (
            <>
              <SidebarItem icon={icons.globe} label="Public Site Look" active={tab === 'public'} onClick={() => setTab('public')} expanded={isSidebarOpen} />
              <SidebarItem icon={icons.users} label="Manage Spaces" active={tab === 'spaces'} onClick={() => setTab('spaces')} expanded={isSidebarOpen} />
            </>
          )}
          
          <SidebarItem icon={icons.save} label="Backup & Data" active={tab === 'backup'} onClick={() => setTab('backup')} expanded={isSidebarOpen} />
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button onClick={onLogout} title="Logout" className="flex items-center gap-3 w-full p-2 rounded hover:bg-red-900/50 text-red-400 hover:text-red-300 transition overflow-hidden">
            <div className="flex-shrink-0">
              <Icon path={icons.logOut} />
            </div>
            {isSidebarOpen && <span className="whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Overlay for Sidebar - Click to close */}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 bg-black/50 z-20" onClick={() => setSidebarOpen(false)}></div>
        )}

        <div className={`h-16 flex items-center justify-between px-6 shadow-sm z-10 flex-shrink-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-b border-gray-200'}`}>
          <div className="flex items-center gap-3">
            {/* Mobile Menu Trigger */}
            <button className="md:hidden p-2 -ml-2 text-gray-500" onClick={() => setSidebarOpen(!isSidebarOpen)}>
              <Icon path={icons.grid} />
            </button>
            <h2 className="text-xl font-bold capitalize flex items-center gap-4 truncate">
              {tab.replace('-', ' ')}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme} 
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"} 
              className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700 text-yellow-300' : 'hover:bg-gray-200 text-gray-500'}`}
            >
              <Icon path={isDark ? icons.sun : icons.moon} />
            </button>

            {(tab === 'bookmarks' || tab === 'notes') && (
              <div className="relative hidden sm:block">
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className={`pl-9 pr-4 py-1.5 border rounded-full text-sm outline-none w-48 transition-all focus:w-64 ${isDark ? 'bg-gray-700 border-gray-600 focus:bg-gray-600 text-white' : 'bg-gray-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-black'}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-3 top-2.5 opacity-50">
                  <Icon path={icons.search} className="w-4 h-4" />
                </div>
              </div>
            )}
            <div className="text-sm opacity-70 hidden md:block">
              <span className="font-semibold text-blue-500">{activeUser.username}</span> 
              <span className={`text-xs px-2 py-0.5 rounded ml-2 uppercase ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>{activeUser.role}</span>
            </div>
          </div>
        </div>

        <div className={`flex-1 overflow-auto p-4 md:p-6 custom-scroll ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-6xl mx-auto">
            {tab === 'bookmarks' && (
              <BookmarkManager 
                data={activeUser.bookmarks || []} 
                onUpdate={b => onUpdateUserSpace(b, activeUser.notes)} 
                notify={notify} 
                filter={searchTerm} 
                isDark={isDark} 
              />
            )}
            {tab === 'notes' && (
              <NoteManager 
                data={activeUser.notes || []} 
                onUpdate={n => onUpdateUserSpace(activeUser.bookmarks, n)} 
                notify={notify} 
                askConfirm={askConfirm} 
                filter={searchTerm} 
                isDark={isDark} 
              />
            )}
            {tab === 'public' && activeUser.role === 'admin' && (
              <PublicEditor 
                config={globalData.publicConfig} 
                onUpdate={updateGlobalConfig} 
                notify={notify} 
                isDark={isDark} 
              />
            )}
            {tab === 'spaces' && activeUser.role === 'admin' && (
              <SpaceManager 
                spaces={globalData.spaces || []} 
                currentId={activeUser.id} 
                onUpdateRole={onAdminUpdateRole}
                onCreateSpace={onAdminCreateSpace}
                onResetPassword={onAdminResetPassword}
                onDeleteSpace={onAdminDeleteSpace}
                notify={notify} 
                askConfirm={askConfirm} 
                onReset={onReset} 
                isDark={isDark} 
              />
            )}
            {tab === 'backup' && (
              <BackupRestore 
                data={globalData} 
                onImport={onUpdateData} 
                notify={notify} 
                askConfirm={askConfirm} 
                isDark={isDark} 
              />
            )}
            {tab === 'security' && (
              <SecuritySettings 
                user={activeUser} 
                onUpdatePass={onUpdatePassword} 
                notify={notify} 
                isDark={isDark} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
