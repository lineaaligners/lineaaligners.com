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
  const logoUrl = "https://gwzvtrikxkudostserwe.supabase.co/storage/v1/object/public/linea/linea%20vjollc%20png.png";

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
    <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-xl border-b border-purple-200 border-t-[6px] border-t-purple-700 shadow-2xl shadow-purple-900/10" aria-label={language === 'en' ? "Main Navigation" : "Navigimi Kryesor"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-28 items-center">
          <div className="flex items-center">
            <button 
              onClick={handleLogoClick} 
              className="relative flex items-center justify-center p-3 md:p-4 rounded-[28px] transition-all duration-500 group focus:outline-none focus:ring-4 focus:ring-purple-300 ring-2 ring-purple-100/50"
              aria-label={language === 'en' ? "Linea Aligners Home" : "Linea Aligners Kreu"}
            >
              <div className="absolute inset-0 bg-purple-50 rounded-[28px] opacity-20 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -inset-1 bg-purple-600/30 blur-2xl rounded-full opacity-40 group-hover:opacity-80 transition-all duration-700 pointer-events-none"></div>
              
              <img 
                src={logoUrl} 
                alt="Linea Aligners Logo" 
                className="h-16 md:h-20 w-auto object-contain relative z-10 transition-all duration-500 group-hover:scale-110 drop-shadow-[0_12px_30px_rgba(109,40,217,0.5)]"
              />
              
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-2 bg-purple-700 rounded-full opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 transition-all duration-500"></div>
            </button>
          </div>

          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-1 bg-purple-50/50 p-1.5 rounded-2xl border border-purple-100" role="list">
              {content.nav.map((item) => {
                const isActive = view === 'home' && typeof window !== 'undefined' && window.location.hash === item.href;
                return (
                  <div key={item.label} role="listitem" className="relative">
                    <a
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      aria-current={isActive ? "page" : undefined}
                      className={`relative text-slate-700 hover:text-purple-800 transition-all font-black text-[10px] xl:text-[11px] tracking-[0.2em] uppercase cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-xl px-4 py-3 flex flex-col items-center hover:bg-white hover:shadow-md ${isActive ? 'text-purple-900 bg-white shadow-md ring-2 ring-purple-200' : ''}`}
                    >
                      {item.label}
                      <span className={`absolute bottom-1 w-0 h-1 bg-purple-700 rounded-full transition-all duration-300 group-hover:w-1/3 ${isActive ? 'w-1/2' : ''}`}></span>
                    </a>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center border-2 border-purple-200 rounded-full p-1 bg-white shadow-sm" role="group" aria-label={language === 'en' ? "Language selection" : "Zgjedhja e gjuhës"}>
                <button 
                  onClick={() => setLanguage('en')}
                  aria-pressed={language === 'en'}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${language === 'en' ? 'bg-purple-800 text-white shadow-lg' : 'text-slate-500 hover:text-purple-700'}`}
                >
                  EN
                </button>
                <button 
                  onClick={() => setLanguage('sq')}
                  aria-pressed={language === 'sq'}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${language === 'sq' ? 'bg-purple-800 text-white shadow-lg' : 'text-slate-500 hover:text-purple-700'}`}
                >
                  SQ
                </button>
              </div>

              <button 
                onClick={onPortalClick}
                className="text-purple-800 hover:text-purple-900 font-black text-[11px] uppercase tracking-[0.25em] px-6 py-3 border-2 border-purple-200 hover:border-purple-800 hover:bg-purple-100/50 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {language === 'en' ? 'Portal' : 'Portali'}
              </button>
              
              <button 
                onClick={(e) => { e.preventDefault(); onBookClick?.(); setIsOpen(false); }}
                className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl shadow-purple-900/40 border-2 border-purple-400 hover:shadow-purple-600/80 hover:-translate-y-1 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-500"
              >
                {language === 'en' ? 'Book Free Scan' : 'Skanim Falas'}
              </button>
            </div>
          </div>

          <div className="lg:hidden flex items-center gap-3">
            <div className="flex items-center border-2 border-purple-200 rounded-full p-0.5 bg-white shadow-sm" role="group">
              <button onClick={() => setLanguage('en')} className={`px-2.5 py-1 rounded-full text-[9px] font-black ${language === 'en' ? 'bg-purple-800 text-white' : 'text-slate-400'}`}>EN</button>
              <button onClick={() => setLanguage('sq')} className={`px-2.5 py-1 rounded-full text-[9px] font-black ${language === 'sq' ? 'bg-purple-800 text-white' : 'text-slate-400'}`}>SQ</button>
            </div>
            <button onClick={onPortalClick} className="text-[10px] font-black uppercase tracking-widest text-purple-800 px-4 py-2.5 bg-purple-100 border-2 border-purple-300 rounded-full shadow-sm">
              {language === 'en' ? 'Portal' : 'Portali'}
            </button>
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="text-purple-900 p-3 focus:outline-none focus:ring-2 focus:ring-purple-600 rounded-2xl bg-purple-100/50 border-2 border-purple-300"
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              {isOpen ? (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16m-7 6h7" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div id="mobile-menu" className="lg:hidden bg-white border-b border-purple-200 animate-fade-in">
          <div className="px-6 pt-6 pb-12 space-y-4">
            {content.nav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="block px-4 py-5 text-2xl font-black text-slate-900 uppercase tracking-widest hover:text-purple-900 hover:bg-purple-50 rounded-2xl transition-all border-l-8 border-transparent hover:border-purple-700"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-8 grid gap-4">
              <button 
                onClick={(e) => { e.preventDefault(); onBookClick?.(); setIsOpen(false); }}
                className="w-full bg-gradient-to-r from-purple-700 to-indigo-900 text-white px-8 py-6 rounded-3xl font-black text-xl uppercase tracking-widest shadow-2xl shadow-purple-900/40 border-2 border-purple-400"
              >
                {language === 'en' ? 'Book Free Scan' : 'Skanim Falas'}
              </button>
              <button 
                onClick={onPortalClick}
                className="w-full border-2 border-purple-400 text-purple-900 px-8 py-6 rounded-3xl font-black text-xl uppercase tracking-widest bg-purple-50/50"
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