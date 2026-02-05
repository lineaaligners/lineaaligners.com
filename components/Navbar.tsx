import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';

export const Navbar: React.FC<{ 
  setView: (v: 'home' | 'planner' | 'portal') => void; 
  view: 'home' | 'planner' | 'portal';
  onBookClick?: () => void;
  onPortalClick?: () => void;
  language: 'en' | 'sq';
  setLanguage: (l: 'en' | 'sq') => void;
}> = ({ setView, view, onBookClick, onPortalClick, language, setLanguage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const content = TRANSLATIONS[language];
  const logoUrl = "https://gwzvtrikxkudostserwe.supabase.co/storage/v1/object/public/linea/linea%20pa%20back.png";

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsOpen(false);
  };

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    const id = href.substring(1);
    
    if (view !== 'home') {
      setView('home');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  return (
    <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md border-b border-purple-100" aria-label={language === 'en' ? "Main Navigation" : "Navigimi Kryesor"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-24">
          <div className="flex items-center">
            <button 
              onClick={handleLogoClick} 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg p-1"
              aria-label={language === 'en' ? "Linea Aligners Home" : "Linea Aligners Kreu"}
            >
              <img 
                src={logoUrl} 
                alt="Linea Aligners Logo" 
                className="h-14 w-auto object-contain"
              />
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-6" role="list">
              {content.nav.map((item) => {
                const isActive = view === 'home' && typeof window !== 'undefined' && window.location.hash === item.href;
                return (
                  <div key={item.label} role="listitem">
                    <a
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      aria-current={isActive ? "page" : undefined}
                      className={`text-slate-500 hover:text-purple-700 transition-colors font-bold text-xs tracking-widest uppercase cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1 ${isActive ? 'text-purple-700' : ''}`}
                    >
                      {item.label}
                    </a>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center border border-purple-100 rounded-full p-1 bg-slate-50" role="group" aria-label={language === 'en' ? "Language selection" : "Zgjedhja e gjuhës"}>
              <button 
                onClick={() => setLanguage('en')}
                aria-pressed={language === 'en'}
                className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${language === 'en' ? 'bg-purple-700 text-white shadow-md' : 'text-slate-400 hover:text-purple-600'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLanguage('sq')}
                aria-pressed={language === 'sq'}
                className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${language === 'sq' ? 'bg-purple-700 text-white shadow-md' : 'text-slate-400 hover:text-purple-600'}`}
              >
                SQ
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={onPortalClick}
                className="text-slate-500 hover:text-purple-700 font-black text-xs uppercase tracking-widest px-4 py-2 border border-slate-200 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 hover:bg-slate-50"
              >
                {language === 'en' ? 'Portal' : 'Portali'}
              </button>
              <button 
                onClick={(e) => { e.preventDefault(); onBookClick?.(); setIsOpen(false); }}
                className="btn-modern-primary text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest focus:outline-none"
              >
                {language === 'en' ? 'Book Free Scan' : 'Skanim Falas'}
              </button>
            </div>
          </div>

          <div className="md:hidden flex items-center gap-4">
            <button onClick={onPortalClick} className="text-[10px] font-black uppercase text-purple-600 px-3 py-1 bg-purple-50 rounded-full">
              {language === 'en' ? 'Portal' : 'Portali'}
            </button>
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="text-slate-600 p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg"
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              {isOpen ? (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div id="mobile-menu" className="md:hidden bg-white border-b border-purple-50 animate-fade-in">
          <div className="px-4 pt-4 pb-10 space-y-4">
            {content.nav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="block px-4 py-4 text-lg font-black text-slate-800 uppercase tracking-widest hover:text-purple-700 hover:bg-purple-50 rounded-2xl transition-all"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-6 grid gap-4">
              <button 
                onClick={(e) => { e.preventDefault(); onBookClick?.(); setIsOpen(false); }}
                className="btn-modern-primary text-white px-8 py-5 rounded-2xl font-black text-lg uppercase tracking-widest shadow-xl"
              >
                {language === 'en' ? 'Book Free Scan' : 'Skanim Falas'}
              </button>
              <button 
                onClick={onPortalClick}
                className="w-full border-2 border-slate-100 text-slate-500 px-8 py-5 rounded-2xl font-black text-lg uppercase tracking-widest"
              >
                {language === 'en' ? 'Patient Portal' : 'Portali i Pacientit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};