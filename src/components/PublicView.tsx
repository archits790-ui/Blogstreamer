import React, { useState } from 'react';
import { Icon, icons } from './Icons';
import type { PublicConfig } from '../types';

interface PublicViewProps {
  config: PublicConfig;
  onLoginRequest: () => void;
  onSignUpTrigger: () => void;
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
}

export const PublicView: React.FC<PublicViewProps> = ({ config, onLoginRequest, onSignUpTrigger, isDark, setIsDark }) => {
  const { title, subtitle, logoText, logoImage, navItems, heroImage, posts, articles, about, showLoginBtn, layoutTemplate = 'hero', fontFamily = 'sans', accentColor = '#4f46e5' } = config;
  const [view, setView] = useState<'home' | 'articles' | 'about'>('home');

  const getFontClass = () => {
    switch (fontFamily) {
      case 'serif': return 'font-serif';
      case 'mono': return 'font-mono';
      case 'sans':
      default:
        return 'font-sans';
    }
  };

  const handleLogoClick = () => {
    setView('home');
  };

  const toggleTheme = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDark(prev => !prev);
  };

  const renderContent = () => {
    const textClass = isDark ? "text-gray-100" : "text-gray-800";
    const subTextClass = isDark ? "text-gray-400" : "text-gray-600";

    if (view === 'articles') {
      return (
        <div className={`animate-fade-in p-4 md:p-8 max-w-4xl mx-auto w-full ${getFontClass()}`}>
          <h2 className={`text-3xl font-bold mb-6 ${textClass}`}>{navItems.articles || "Articles"}</h2>
          <div className="grid gap-6">
            {articles && articles.map((post) => (
              <article key={post.id} className={`border-b pb-6 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="text-sm text-gray-500 mb-1">{post.date}</div>
                <h2 className={`text-xl font-bold mb-2 hover:opacity-85 cursor-pointer ${textClass}`} style={{ color: accentColor }}>{post.title}</h2>
                <p className={subTextClass}>{post.summary}</p>
              </article>
            ))}
          </div>
        </div>
      );
    }
    
    if (view === 'about') {
      return (
        <div className={`animate-fade-in p-4 md:p-8 max-w-2xl mx-auto w-full text-center ${getFontClass()}`}>
          <h2 className={`text-3xl font-bold mb-4 ${textClass}`}>{about?.title || "About Us"}</h2>
          <p className={`${subTextClass} leading-relaxed whitespace-pre-wrap`}>{about?.content || "No information available."}</p>
        </div>
      );
    }

    // HOME PAGE WITH LAYOUT TEMPLATES
    if (layoutTemplate === 'minimal') {
      return (
        <div className={`animate-fade-in max-w-3xl mx-auto px-6 py-16 w-full ${getFontClass()}`}>
          <header className="mb-12 text-center">
            <h1 className={`text-4xl font-extrabold tracking-tight mb-2 ${textClass}`}>{title}</h1>
            <p className={`text-lg ${subTextClass} italic`}>{subtitle}</p>
          </header>
          <div className="space-y-12">
            {posts.map((post) => (
              <article key={post.id} className="pb-8 border-b border-dashed dark:border-gray-800 border-gray-200">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">{post.date}</div>
                <h2 className={`text-2xl font-bold mb-2 hover:opacity-80 cursor-pointer ${textClass}`} style={{ color: accentColor }}>{post.title}</h2>
                <p className={`text-sm ${subTextClass} leading-relaxed`}>{post.summary}</p>
                <div className="mt-2 text-xs font-semibold cursor-pointer hover:underline" style={{ color: accentColor }}>Read Full Story</div>
              </article>
            ))}
          </div>
        </div>
      );
    }

    if (layoutTemplate === 'grid') {
      return (
        <div className={`animate-fade-in w-full ${getFontClass()}`}>
          <div className="bg-gray-150 py-12 px-6 border-b dark:border-gray-800 dark:bg-gray-850">
            <div className="max-w-6xl mx-auto text-center">
              <h1 className={`text-4xl font-black mb-3 ${textClass}`}>{title}</h1>
              <p className={`text-md ${subTextClass} max-w-md mx-auto`}>{subtitle}</p>
            </div>
          </div>
          <main className="max-w-6xl mx-auto px-6 py-12 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <div key={post.id} className={`p-6 rounded-xl border flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-md ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-800'}`}>
                  <div>
                    <div className="text-xs text-gray-400 mb-2">{post.date}</div>
                    <h3 className="font-bold text-lg mb-3 line-clamp-2 hover:opacity-85 cursor-pointer" style={{ color: accentColor }}>{post.title}</h3>
                    <p className={`text-sm opacity-85 leading-relaxed line-clamp-4 ${subTextClass}`}>{post.summary}</p>
                  </div>
                  <div className="mt-4 text-xs font-bold flex items-center justify-between">
                    <span className="hover:underline cursor-pointer" style={{ color: accentColor }}>Read Post</span>
                    <span className="opacity-55">5 min read</span>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      );
    }

    // Default 'hero' Layout
    return (
      <div className={`animate-fade-in ${getFontClass()}`}>
        <div className="relative h-96 bg-gray-900 flex items-center justify-center text-center text-white">
          <img src={heroImage} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <div className="relative z-10 px-4">
            <h1 className="text-5xl font-extrabold mb-4">{title}</h1>
            <p className="text-xl opacity-90">{subtitle}</p>
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-4 py-12 w-full">
          <div className="grid gap-8">
            {posts.map((post) => (
              <article key={post.id} className={`border-b pb-8 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="text-sm text-gray-500 mb-2">{post.date}</div>
                <h2 className={`text-2xl font-bold mb-2 hover:opacity-85 cursor-pointer ${textClass}`}>{post.title}</h2>
                <p className={`${subTextClass} leading-relaxed`}>{post.summary}</p>
                <div className="mt-4 font-semibold text-sm cursor-pointer" style={{ color: accentColor }}>Read more →</div>
              </article>
            ))}
          </div>
        </main>
      </div>
    );
  };

  const [clickCount, setClickCount] = useState(0);

  const handleLogoClickAction = () => {
    handleLogoClick();
    setClickCount(prev => prev + 1);
    setTimeout(() => setClickCount(0), 1000);
    if (clickCount >= 2) {
      onLoginRequest();
      setClickCount(0);
    }
  };

  return (
    <div className={`h-full flex flex-col font-sans overflow-hidden transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-white'} ${getFontClass()}`}>
      <header className={`border-b sticky top-0 z-10 flex-shrink-0 transition-colors duration-300 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="w-full md:w-auto flex justify-between items-center">
            {logoImage ? (
              <img src={logoImage} alt="Logo" className="h-10 cursor-pointer select-none object-contain" onClick={handleLogoClickAction} />
            ) : (
              <div 
                className="text-2xl font-bold tracking-tighter select-none cursor-pointer"
                style={{ color: accentColor }}
                onClick={handleLogoClickAction}
              >
                {logoText}
              </div>
            )}
          </div>

          <nav className={`flex items-center gap-4 overflow-x-auto no-scrollbar w-full md:w-auto whitespace-nowrap mask-linear-fade ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <button onClick={() => setView('home')} className={`hover:text-black dark:hover:text-white flex-shrink-0 ${view === 'home' ? 'font-semibold' : ''}`} style={view === 'home' ? { color: accentColor } : {}}>{navItems.home || "Home"}</button>
            <button onClick={() => setView('articles')} className={`hover:text-black dark:hover:text-white flex-shrink-0 ${view === 'articles' ? 'font-semibold' : ''}`} style={view === 'articles' ? { color: accentColor } : {}}>{navItems.articles || "Articles"}</button>
            <button onClick={() => setView('about')} className={`hover:text-black dark:hover:text-white flex-shrink-0 ${view === 'about' ? 'font-semibold' : ''}`} style={view === 'about' ? { color: accentColor } : {}}>{navItems.about || "About"}</button>

            {showLoginBtn && (
              <button onClick={onLoginRequest} className={`text-sm font-semibold hover:underline opacity-80 hover:opacity-100 px-3 py-1 rounded flex-shrink-0 ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'}`}>
                Login
              </button>
            )}
            <button onClick={onSignUpTrigger} className="text-sm font-semibold text-white px-4 py-1.5 rounded hover:opacity-90 transition flex-shrink-0" style={{ backgroundColor: accentColor }}>
              Sign Up
            </button>

            <button 
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"} 
              className={`p-1.5 rounded-full flex-shrink-0 ml-2 ${isDark ? 'hover:bg-gray-800 text-yellow-300' : 'hover:bg-gray-200 text-gray-500'}`}
            >
              <Icon path={isDark ? icons.sun : icons.moon} className="w-5 h-5" />
            </button>
          </nav>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scroll">
        {renderContent()}
        <footer className={`py-8 text-center text-sm mt-auto ${isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-500'}`}>
          &copy; {new Date().getFullYear()} {title}. All rights reserved.
        </footer>
      </div>
    </div>
  );
};
export default PublicView;
