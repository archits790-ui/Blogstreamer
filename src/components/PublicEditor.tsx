import React, { useState, useRef, useEffect } from 'react';
import { Icon, icons } from './Icons';
import type { PublicConfig, Post } from '../types';

interface PublicEditorProps {
  config: PublicConfig;
  onUpdate: (config: PublicConfig) => void;
  notify: (msg: string, type?: 'info' | 'error') => void;
  isDark: boolean;
}

export const PublicEditor: React.FC<PublicEditorProps> = ({ config, onUpdate, notify, isDark: dashboardIsDark }) => {
  // Local states for visual editor workspace
  const [editorTab, setEditorTab] = useState<'home' | 'articles' | 'about'>('home');
  const [previewIsDark, setPreviewIsDark] = useState(dashboardIsDark);
  
  // Inline editing state
  // tracks which element is currently being edited
  // e.g. { type: 'global', field: 'title' } or { type: 'post', id: 123, field: 'title' }
  const [activeEdit, setActiveEdit] = useState<{
    type: 'global' | 'nav' | 'post' | 'article' | 'about';
    field: string;
    id?: string | number;
  } | null>(null);

  // Image editing modal state
  const [imageEditTarget, setImageEditTarget] = useState<'logoImage' | 'heroImage' | null>(null);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState("");

  const editInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Automatically focus the input/textarea when editing starts
  useEffect(() => {
    if (activeEdit && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [activeEdit]);

  const handleChange = (key: keyof PublicConfig, val: any) => {
    onUpdate({ ...config, [key]: val });
  };

  const handleNavChange = (key: keyof PublicConfig['navItems'], val: string) => {
    onUpdate({
      ...config,
      navItems: { ...config.navItems, [key]: val }
    });
  };

  const updateAbout = (field: keyof PublicConfig['about'], val: string) => {
    handleChange('about', { ...config.about, [field]: val });
  };

  const addPost = (type: 'posts' | 'articles') => {
    const newPost: Post = { 
      id: Date.now(), 
      title: type === 'posts' ? "New Blog Title" : "New Article Title", 
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), 
      summary: "Click to write some summary content for this card..." 
    };
    if (type === 'posts') handleChange('posts', [newPost, ...config.posts]);
    if (type === 'articles') handleChange('articles', [newPost, ...(config.articles || [])]);
    notify("New item added to layout!");
  };

  const removePost = (type: 'posts' | 'articles', id: number | string) => {
    if (type === 'posts') handleChange('posts', config.posts.filter(p => p.id !== id));
    if (type === 'articles') handleChange('articles', (config.articles || []).filter(p => p.id !== id));
    notify("Item removed");
  };

  const editPost = (type: 'posts' | 'articles', id: number | string, field: keyof Post, val: string) => {
    if (type === 'posts') handleChange('posts', config.posts.map(p => p.id === id ? { ...p, [field]: val } : p));
    if (type === 'articles') handleChange('articles', (config.articles || []).map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'logoImage' | 'heroImage') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) return notify("Image too large for local storage (Max 500KB)", "error");
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          handleChange(target, ev.target.result as string);
          setImageEditTarget(null);
          notify("Image updated successfully");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const saveImageUrl = () => {
    if (imageEditTarget) {
      handleChange(imageEditTarget, tempImageUrl);
      setImageEditTarget(null);
      setTempImageUrl("");
      notify("Image URL updated");
    }
  };

  const getFontClass = () => {
    switch (config.fontFamily) {
      case 'serif': return 'font-serif';
      case 'mono': return 'font-mono';
      default: return 'font-sans';
    }
  };

  // Helper renderer for inline text inputs
  const renderEditableText = (
    value: string,
    type: 'global' | 'nav' | 'post' | 'article' | 'about',
    field: string,
    id?: string | number,
    isMultiline = false,
    placeholder = "Click to edit text",
    className = ""
  ) => {
    const isEditing = activeEdit && activeEdit.type === type && activeEdit.field === field && activeEdit.id === id;

    if (isEditing) {
      if (isMultiline) {
        return (
          <textarea
            ref={editInputRef as any}
            className={`w-full p-1 border border-blue-500 rounded bg-white text-black resize-y outline-none z-20 relative font-normal text-base ${className}`}
            value={value}
            onChange={(e) => {
              if (type === 'global') handleChange(field as any, e.target.value);
              else if (type === 'nav') handleNavChange(field as any, e.target.value);
              else if (type === 'about') updateAbout(field as any, e.target.value);
              else if (type === 'post') editPost('posts', id!, field as any, e.target.value);
              else if (type === 'article') editPost('articles', id!, field as any, e.target.value);
            }}
            onBlur={() => setActiveEdit(null)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setActiveEdit(null);
            }}
          />
        );
      }
      return (
        <input
          ref={editInputRef as any}
          type="text"
          className={`p-1 border border-blue-500 rounded bg-white text-black outline-none z-20 relative max-w-full font-normal ${className}`}
          value={value}
          onChange={(e) => {
            if (type === 'global') handleChange(field as any, e.target.value);
            else if (type === 'nav') handleNavChange(field as any, e.target.value);
            else if (type === 'about') updateAbout(field as any, e.target.value);
            else if (type === 'post') editPost('posts', id!, field as any, e.target.value);
            else if (type === 'article') editPost('articles', id!, field as any, e.target.value);
          }}
          onBlur={() => setActiveEdit(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setActiveEdit(null);
            if (e.key === 'Escape') setActiveEdit(null);
          }}
        />
      );
    }

    return (
      <span
        onClick={(e) => {
          e.stopPropagation();
          setActiveEdit({ type, field, id });
        }}
        className={`group/edit cursor-pointer hover:bg-blue-500/10 hover:outline-dashed hover:outline-1 hover:outline-blue-500 p-0.5 rounded transition duration-150 inline-block relative ${!value ? 'italic opacity-60' : ''} ${className}`}
        title="Click to edit inline"
      >
        {value || placeholder}
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] px-1 py-0.5 rounded shadow opacity-0 group-hover/edit:opacity-100 transition pointer-events-none z-30 whitespace-nowrap">
          Click to Edit
        </span>
      </span>
    );
  };

  const textClass = previewIsDark ? "text-gray-100" : "text-gray-800";
  const subTextClass = previewIsDark ? "text-gray-400" : "text-gray-600";
  const accentColor = config.accentColor || '#4f46e5';

  return (
    <div className="flex flex-col gap-6 mb-24">
      
      {/* Editor Controls Bar */}
      <div className={`p-4 rounded-xl border shadow-sm ${dashboardIsDark ? 'bg-gray-850 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'} flex flex-wrap gap-4 items-center justify-between`}>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase opacity-60 mb-1">Layout Template</span>
            <select 
              value={config.layoutTemplate || 'hero'} 
              onChange={e => handleChange('layoutTemplate', e.target.value)}
              className={`p-1.5 border rounded text-sm outline-none ${dashboardIsDark ? 'bg-gray-800 border-gray-750 text-white' : 'bg-gray-50 border-gray-200 text-black'}`}
            >
              <option value="hero">Hero Banner Template</option>
              <option value="grid">Grid Magazine Layout</option>
              <option value="minimal">Minimalist Layout</option>
            </select>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase opacity-60 mb-1">Font Family</span>
            <select 
              value={config.fontFamily || 'sans'} 
              onChange={e => handleChange('fontFamily', e.target.value)}
              className={`p-1.5 border rounded text-sm outline-none ${dashboardIsDark ? 'bg-gray-800 border-gray-750 text-white' : 'bg-gray-50 border-gray-200 text-black'}`}
            >
              <option value="sans">Sans-Serif (Inter)</option>
              <option value="serif">Serif (Georgia)</option>
              <option value="mono">Monospace (Consolas)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase opacity-60 mb-1">Accent Color</span>
              <input 
                type="text" 
                value={config.accentColor || '#4f46e5'} 
                onChange={e => handleChange('accentColor', e.target.value)}
                className={`p-1 border rounded text-xs w-20 outline-none ${dashboardIsDark ? 'bg-gray-800 border-gray-750 text-white' : 'bg-gray-50 border-gray-200 text-black'}`}
              />
            </div>
            <input 
              type="color" 
              value={config.accentColor || '#4f46e5'} 
              onChange={e => handleChange('accentColor', e.target.value)}
              className="w-8 h-8 rounded border cursor-pointer mt-5"
            />
          </div>

          <div className="flex items-center gap-2 mt-5">
            <input 
              type="checkbox" 
              id="showLoginCheck"
              checked={config.showLoginBtn} 
              onChange={e => handleChange('showLoginBtn', e.target.checked)} 
              className="rounded"
            />
            <label htmlFor="showLoginCheck" className="text-xs font-semibold cursor-pointer">Show Login in Nav</label>
          </div>
        </div>

        {/* Workspace Theme Toggle & Add section */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setPreviewIsDark(prev => !prev)}
            title="Toggle preview template theme"
            className={`p-2 rounded border flex items-center gap-2 text-sm ${dashboardIsDark ? 'border-gray-750 hover:bg-gray-800 text-yellow-300' : 'border-gray-200 hover:bg-gray-100 text-gray-700'}`}
          >
            <Icon path={previewIsDark ? icons.sun : icons.moon} className="w-4 h-4" />
            <span>Preview in {previewIsDark ? 'Day' : 'Night'} Mode</span>
          </button>
          
          {(editorTab === 'home' || editorTab === 'articles') && (
            <button 
              onClick={() => addPost(editorTab === 'home' ? 'posts' : 'articles')}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold flex items-center gap-1 shadow-sm"
            >
              <Icon path={icons.plus} className="w-4 h-4" />
              <span>Add Post/Section</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Visual Editor Workspace */}
      <div className={`rounded-xl border shadow-xl overflow-hidden flex flex-col min-h-[500px] transition-colors duration-300 ${previewIsDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} ${getFontClass()}`}>
        
        {/* Editor Live Header (Navigation) */}
        <header className={`border-b flex-shrink-0 transition-colors duration-300 ${previewIsDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            
            {/* Logo area */}
            <div 
              onClick={() => {
                setTempImageUrl(config.logoImage || "");
                setShowLogoModal(true);
              }}
              className="flex items-center gap-3 cursor-pointer group/logo relative p-1 rounded hover:bg-blue-500/10 hover:outline-dashed hover:outline-1 hover:outline-blue-500 transition duration-150"
              title="Click to edit logo settings"
            >
              {config.logoImage ? (
                <img src={config.logoImage} alt="Logo" className="h-10 object-contain" />
              ) : (
                <div className="text-2xl font-bold tracking-tighter" style={{ color: accentColor }}>
                  {config.logoText || "CS"}
                </div>
              )}
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] px-1 py-0.5 rounded shadow opacity-0 group-hover/logo:opacity-100 transition pointer-events-none z-30 whitespace-nowrap">
                Edit Logo
              </span>
            </div>

            {/* Nav Items (Page Nav + Rename Popover) */}
            <nav className={`flex items-center gap-6 ${previewIsDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <div className="flex items-center gap-1 group/nav relative">
                <button 
                  onClick={() => setEditorTab('home')} 
                  className={`hover:text-black dark:hover:text-white flex-shrink-0 text-sm cursor-pointer ${editorTab === 'home' ? 'font-bold' : ''}`} 
                  style={editorTab === 'home' ? { color: accentColor } : {}}
                >
                  {config.navItems.home || "Home"}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveEdit({ type: 'nav', field: 'home' }); }}
                  className="p-1 text-gray-400 hover:text-blue-500 opacity-0 group-hover/nav:opacity-100 transition"
                  title="Rename Home navigation item"
                >
                  <Icon path={icons.edit} className="w-3 h-3" />
                </button>
                {activeEdit?.type === 'nav' && activeEdit?.field === 'home' && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 dark:border-gray-700 shadow-lg rounded p-2 z-50 flex gap-1 items-center">
                    <input 
                      ref={editInputRef as any}
                      type="text" 
                      className="border p-1 text-xs rounded text-black outline-none w-24 bg-white"
                      value={config.navItems.home} 
                      onChange={e => handleNavChange('home', e.target.value)}
                      onBlur={() => setActiveEdit(null)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setActiveEdit(null); }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 group/nav relative">
                <button 
                  onClick={() => setEditorTab('articles')} 
                  className={`hover:text-black dark:hover:text-white flex-shrink-0 text-sm cursor-pointer ${editorTab === 'articles' ? 'font-bold' : ''}`} 
                  style={editorTab === 'articles' ? { color: accentColor } : {}}
                >
                  {config.navItems.articles || "Articles"}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveEdit({ type: 'nav', field: 'articles' }); }}
                  className="p-1 text-gray-400 hover:text-blue-500 opacity-0 group-hover/nav:opacity-100 transition"
                  title="Rename Articles navigation item"
                >
                  <Icon path={icons.edit} className="w-3 h-3" />
                </button>
                {activeEdit?.type === 'nav' && activeEdit?.field === 'articles' && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 dark:border-gray-700 shadow-lg rounded p-2 z-50 flex gap-1 items-center">
                    <input 
                      ref={editInputRef as any}
                      type="text" 
                      className="border p-1 text-xs rounded text-black outline-none w-24 bg-white"
                      value={config.navItems.articles} 
                      onChange={e => handleNavChange('articles', e.target.value)}
                      onBlur={() => setActiveEdit(null)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setActiveEdit(null); }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 group/nav relative">
                <button 
                  onClick={() => setEditorTab('about')} 
                  className={`hover:text-black dark:hover:text-white flex-shrink-0 text-sm cursor-pointer ${editorTab === 'about' ? 'font-bold' : ''}`} 
                  style={editorTab === 'about' ? { color: accentColor } : {}}
                >
                  {config.navItems.about || "About"}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveEdit({ type: 'nav', field: 'about' }); }}
                  className="p-1 text-gray-400 hover:text-blue-500 opacity-0 group-hover/nav:opacity-100 transition"
                  title="Rename About navigation item"
                >
                  <Icon path={icons.edit} className="w-3 h-3" />
                </button>
                {activeEdit?.type === 'nav' && activeEdit?.field === 'about' && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 dark:border-gray-700 shadow-lg rounded p-2 z-50 flex gap-1 items-center">
                    <input 
                      ref={editInputRef as any}
                      type="text" 
                      className="border p-1 text-xs rounded text-black outline-none w-24 bg-white"
                      value={config.navItems.about} 
                      onChange={e => handleNavChange('about', e.target.value)}
                      onBlur={() => setActiveEdit(null)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setActiveEdit(null); }}
                    />
                  </div>
                )}
              </div>

              {config.showLoginBtn && (
                <span className={`text-xs font-semibold px-3 py-1 rounded opacity-80 cursor-default ${previewIsDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'}`}>
                  Login (Static)
                </span>
              )}
              <span className="text-xs font-semibold text-white px-4 py-1.5 rounded opacity-90 cursor-default" style={{ backgroundColor: accentColor }}>
                Sign Up (Static)
              </span>
            </nav>
          </div>
        </header>

        {/* Editor Live Content Area */}
        <div className="flex-1 overflow-y-auto min-h-[400px]">
          {editorTab === 'about' ? (
            /* ABOUT PAGE BUILDER */
            <div className="p-8 max-w-2xl mx-auto w-full text-center space-y-4">
              <h2 className={`text-3xl font-bold ${textClass}`}>
                {renderEditableText(config.about?.title || "About Us", 'about', 'title', undefined, false, "About Us Title")}
              </h2>
              <div className={`leading-relaxed text-lg ${subTextClass} text-left max-w-lg mx-auto`}>
                {renderEditableText(config.about?.content || "No information available.", 'about', 'content', undefined, true, "About text content...")}
              </div>
            </div>
          ) : editorTab === 'articles' ? (
            /* ARTICLES PAGE BUILDER */
            <div className="p-8 max-w-4xl mx-auto w-full">
              <h2 className={`text-3xl font-bold mb-6 ${textClass}`}>
                {config.navItems.articles || "Articles"}
              </h2>
              <div className="grid gap-6">
                {(!config.articles || config.articles.length === 0) && (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl border-gray-300 dark:border-gray-700">
                    <p className={subTextClass}>No articles added yet. Click "+ Add Post/Section" in the bar above to create one!</p>
                  </div>
                )}
                {config.articles && config.articles.map((post) => (
                  <article key={post.id} className={`border-b pb-6 relative group ${previewIsDark ? 'border-gray-800' : 'border-gray-200'}`}>
                    <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition flex gap-2">
                      <button 
                        onClick={() => removePost('articles', post.id)} 
                        title="Delete article" 
                        className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 dark:bg-red-950/40 dark:text-red-400"
                      >
                        <Icon path={icons.trash} className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-xs text-gray-500 mb-1">
                      {renderEditableText(post.date || "June 17, 2026", 'article', 'date', post.id, false, "Date")}
                    </div>
                    <h3 className="text-xl font-bold mb-2 inline-block" style={{ color: accentColor }}>
                      {renderEditableText(post.title || "Article Title", 'article', 'title', post.id, false, "Article Title")}
                    </h3>
                    <div className={subTextClass}>
                      {renderEditableText(post.summary || "Summary text...", 'article', 'summary', post.id, true, "Summary content")}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            /* HOME PAGE BUILDER WITH SELECTED LAYOUT */
            <>
              {config.layoutTemplate === 'minimal' && (
                <div className="max-w-3xl mx-auto px-6 py-16 w-full">
                  <header className="mb-12 text-center">
                    <h1 className={`text-4xl font-extrabold tracking-tight mb-2 ${textClass}`}>
                      {renderEditableText(config.title || "CodeStream", 'global', 'title', undefined, false, "Site Title")}
                    </h1>
                    <p className={`text-lg ${subTextClass} italic`}>
                      {renderEditableText(config.subtitle || "Insights into Modern Development", 'global', 'subtitle', undefined, false, "Subtitle text")}
                    </p>
                  </header>

                  <div className="space-y-12">
                    {config.posts.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed rounded-xl border-gray-300 dark:border-gray-700">
                        <p className={subTextClass}>No blog posts added yet. Click "+ Add Post/Section" in the bar above to create one!</p>
                      </div>
                    )}
                    {config.posts.map((post) => (
                      <article key={post.id} className="pb-8 border-b border-dashed dark:border-gray-800 border-gray-200 relative group">
                        <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition flex gap-2">
                          <button 
                            onClick={() => removePost('posts', post.id)} 
                            title="Delete post" 
                            className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 dark:bg-red-950/40 dark:text-red-400"
                          >
                            <Icon path={icons.trash} className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                          {renderEditableText(post.date || "June 17, 2026", 'post', 'date', post.id, false, "Date")}
                        </div>
                        <h2 className="text-2xl font-bold mb-2" style={{ color: accentColor }}>
                          {renderEditableText(post.title || "Blog Post Title", 'post', 'title', post.id, false, "Post Title")}
                        </h2>
                        <div className={`text-sm ${subTextClass} leading-relaxed`}>
                          {renderEditableText(post.summary || "Summary text...", 'post', 'summary', post.id, true, "Summary content")}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {config.layoutTemplate === 'grid' && (
                <div className="w-full">
                  <div className={`py-12 px-6 border-b ${previewIsDark ? 'bg-gray-850 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="max-w-6xl mx-auto text-center">
                      <h1 className={`text-4xl font-black mb-3 ${textClass}`}>
                        {renderEditableText(config.title || "CodeStream", 'global', 'title', undefined, false, "Site Title")}
                      </h1>
                      <p className={`text-md ${subTextClass} max-w-md mx-auto`}>
                        {renderEditableText(config.subtitle || "Insights into Modern Development", 'global', 'subtitle', undefined, false, "Subtitle text")}
                      </p>
                    </div>
                  </div>

                  <main className="max-w-6xl mx-auto px-6 py-12 w-full">
                    {config.posts.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed rounded-xl border-gray-300 dark:border-gray-700">
                        <p className={subTextClass}>No blog posts added yet. Click "+ Add Post/Section" in the bar above to create one!</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {config.posts.map((post) => (
                        <div key={post.id} className={`p-6 rounded-xl border flex flex-col justify-between transition-all hover:shadow-md relative group ${previewIsDark ? 'bg-gray-850 border-gray-800 text-white' : 'bg-white border-gray-150 text-gray-800'}`}>
                          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition flex gap-1 z-10">
                            <button 
                              onClick={() => removePost('posts', post.id)} 
                              title="Delete post" 
                              className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 dark:bg-red-950/50 dark:text-red-400"
                            >
                              <Icon path={icons.trash} className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <div>
                            <div className="text-xs text-gray-400 mb-2">
                              {renderEditableText(post.date || "June 17, 2026", 'post', 'date', post.id, false, "Date")}
                            </div>
                            <h3 className="font-bold text-lg mb-3 line-clamp-2" style={{ color: accentColor }}>
                              {renderEditableText(post.title || "Post Title", 'post', 'title', post.id, false, "Post Title")}
                            </h3>
                            <div className={`text-sm opacity-85 leading-relaxed ${subTextClass}`}>
                              {renderEditableText(post.summary || "Summary text...", 'post', 'summary', post.id, true, "Summary content")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </main>
                </div>
              )}

              {(config.layoutTemplate === 'hero' || !config.layoutTemplate) && (
                <div className="w-full">
                  {/* Hero banner with Image Edit Trigger */}
                  <div className="relative h-96 bg-gray-900 flex items-center justify-center text-center text-white group/hero">
                    <img 
                      src={config.heroImage || "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=1000"} 
                      alt="Cover" 
                      className="absolute inset-0 w-full h-full object-cover opacity-45" 
                    />
                    
                    {/* Hover trigger for change banner */}
                    <button 
                      onClick={() => { setImageEditTarget('heroImage'); setTempImageUrl(config.heroImage || ""); }}
                      className="absolute inset-0 bg-black/50 text-white font-bold opacity-0 group-hover/hero:opacity-100 transition flex items-center justify-center gap-2 cursor-pointer z-10"
                    >
                      <Icon path={icons.edit} className="w-6 h-6 animate-pulse" />
                      <span>Click to Change Cover Image</span>
                    </button>

                    <div className="relative z-10 px-4">
                      <h1 className="text-5xl font-extrabold mb-4">
                        {renderEditableText(config.title || "CodeStream", 'global', 'title', undefined, false, "Site Title")}
                      </h1>
                      <p className="text-xl opacity-90">
                        {renderEditableText(config.subtitle || "Insights into Modern Development", 'global', 'subtitle', undefined, false, "Subtitle text")}
                      </p>
                    </div>
                  </div>

                  <main className="max-w-4xl mx-auto px-6 py-12 w-full">
                    {config.posts.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed rounded-xl border-gray-300 dark:border-gray-700">
                        <p className={subTextClass}>No blog posts added yet. Click "+ Add Post/Section" in the bar above to create one!</p>
                      </div>
                    )}
                    <div className="grid gap-8">
                      {config.posts.map((post) => (
                        <article key={post.id} className={`border-b pb-8 relative group ${previewIsDark ? 'border-gray-800' : 'border-gray-200'}`}>
                          <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition flex gap-2">
                            <button 
                              onClick={() => removePost('posts', post.id)} 
                              title="Delete post" 
                              className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 dark:bg-red-950/40 dark:text-red-400"
                            >
                              <Icon path={icons.trash} className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-sm text-gray-500 mb-2">
                            {renderEditableText(post.date || "June 17, 2026", 'post', 'date', post.id, false, "Date")}
                          </div>
                          <h2 className="text-2xl font-bold mb-2 text-inherit">
                            {renderEditableText(post.title || "Blog Post Title", 'post', 'title', post.id, false, "Post Title")}
                          </h2>
                          <div className={`${subTextClass} leading-relaxed`}>
                            {renderEditableText(post.summary || "Summary text...", 'post', 'summary', post.id, true, "Summary content")}
                          </div>
                        </article>
                      ))}
                    </div>
                  </main>
                </div>
              )}
            </>
          )}
        </div>

        {/* Editor Live Footer */}
        <footer className={`py-8 text-center text-sm mt-auto ${previewIsDark ? 'bg-gray-850 text-gray-500' : 'bg-gray-100 text-gray-500'}`}>
          &copy; {new Date().getFullYear()} {config.title}. All rights reserved.
        </footer>
      </div>

      {/* Floating Image Edit Dialog / Modal */}
      {imageEditTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className={`p-6 rounded-2xl shadow-2xl max-w-md w-full border ${dashboardIsDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-150 text-gray-800'} animate-fade-in`}>
            <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-gray-700">
              <h4 className="font-bold text-lg">Change {imageEditTarget === 'logoImage' ? 'Logo Image' : 'Hero Cover Image'}</h4>
              <button onClick={() => { setImageEditTarget(null); setTempImageUrl(""); }} className="text-gray-400 hover:text-red-500">
                <Icon path={icons.x} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Image URL</label>
                <input 
                  type="text" 
                  value={tempImageUrl} 
                  placeholder="https://..."
                  onChange={e => setTempImageUrl(e.target.value)}
                  className={`w-full border p-2 rounded text-sm ${dashboardIsDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-black'}`}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 border-t dark:border-gray-700"></div>
                <span className="text-xs uppercase font-bold opacity-60">OR</span>
                <div className="flex-1 border-t dark:border-gray-700"></div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Upload Local Image</label>
                <label className="cursor-pointer bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2">
                  <Icon path={icons.upload} className="w-4 h-4" />
                  <span>Choose File...</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={e => handleImageUpload(e, imageEditTarget)} 
                  />
                </label>
                <span className="text-[10px] text-gray-400 block mt-1">Maximum file size: 500KB</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-3 border-t dark:border-gray-700">
              <button 
                onClick={() => { setImageEditTarget(null); setTempImageUrl(""); }} 
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                Cancel
              </button>
              <button 
                onClick={saveImageUrl}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
              >
                Save URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Logo Config Dialog / Modal */}
      {showLogoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className={`p-6 rounded-2xl shadow-2xl max-w-md w-full border ${dashboardIsDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-150 text-gray-800'} animate-fade-in`}>
            <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-gray-700">
              <h4 className="font-bold text-lg">Change Logo</h4>
              <button onClick={() => setShowLogoModal(false)} className="text-gray-400 hover:text-red-500">
                <Icon path={icons.x} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Logo Text</label>
                <input 
                  type="text" 
                  value={config.logoText || ""} 
                  placeholder="e.g. CodeStream"
                  onChange={e => handleChange('logoText', e.target.value)}
                  className={`w-full border p-2 rounded text-sm ${dashboardIsDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-black'}`}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 border-t dark:border-gray-700"></div>
                <span className="text-xs uppercase font-bold opacity-60">AND / OR IMAGE</span>
                <div className="flex-1 border-t dark:border-gray-700"></div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Logo Image URL (Leave empty to use text only)</label>
                <input 
                  type="text" 
                  value={config.logoImage || ""} 
                  placeholder="https://..."
                  onChange={e => handleChange('logoImage', e.target.value)}
                  className={`w-full border p-2 rounded text-sm ${dashboardIsDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white text-black'}`}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 border-t dark:border-gray-700"></div>
                <span className="text-xs uppercase font-bold opacity-60">OR</span>
                <div className="flex-1 border-t dark:border-gray-700"></div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Upload Local Logo Image</label>
                <label className="cursor-pointer bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2 w-full">
                  <Icon path={icons.upload} className="w-4 h-4" />
                  <span>Choose File...</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 500000) return notify("Image too large for local storage (Max 500KB)", "error");
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            handleChange('logoImage', ev.target.result as string);
                            notify("Logo image uploaded!");
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }} 
                  />
                </label>
                <span className="text-[10px] text-gray-400 block mt-1">Maximum file size: 500KB</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-3 border-t dark:border-gray-700">
              <button 
                onClick={() => setShowLogoModal(false)}
                className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicEditor;
