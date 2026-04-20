
import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Globe, User } from 'lucide-react';

export const Navbar: React.FC<{ 
  setView: (v: 'home' | 'planner' | 'portal' | 'admin') => void; 
  view: 'home' | 'planner' | 'portal' | 'admin';
  onBookClick?: () => void;
  onPortalClick?: () => void;
  language: 'en' | 'sq';
  setLanguage: (l: 'en' | 'sq') => void;
  isAdmin?: boolean;
  onAdminClick?: () => void;
}> = ({ setView, view, onBookClick, onPortalClick, language, setLanguage, isAdmin, onAdminClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const content = TRANSLATIONS[language];
  const logoUrl = "https://gwzvtrikxkudostserwe.supabase.co/storage/v1/object/public/linea/linea%20vjollc%20png.png";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsOpen(false);
  };

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    const id = href === '#' ? null : href.substring(1);
    
    if (view !== 'home') {
      setView('home');
      if (id) {
        setTimeout(() => {
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      if (id) {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    setIsOpen(false);
  };

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#19376D]/90 backdrop-blur-xl py-4 shadow-xl' 
          : 'bg-[#19376D]/40 backdrop-blur-md py-6'
      }`}
      aria-label={language === 'en' ? "Main Navigation" : "Navigimi Kryesor"}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <div className="flex items-center">
            <button 
              onClick={handleLogoClick} 
              className="relative flex items-center group transition-transform hover:scale-105"
              aria-label={language === 'en' ? "Linea Aligners Home" : "Linea Aligners Kreu"}
            >
              <div className="bg-white/10 p-2 rounded-2xl backdrop-blur-sm border border-white/10 group-hover:bg-white/20 transition-colors shadow-lg">
                <img 
                  src={logoUrl} 
                  alt="Linea Aligners Logo" 
                  className="h-10 md:h-12 w-auto object-contain brightness-0 invert" 
                />
              </div>
            </button>
          </div>

          {/* Nav Links - Desktop */}
          <div className="hidden lg:flex items-center space-x-10">
            <div className="flex items-center space-x-8">
              {content.nav.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="text-sm font-bold text-white hover:text-[#87CEEB] transition-colors tracking-wide uppercase"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="h-6 w-px bg-white/20"></div>

            <div className="flex items-center gap-6">
              {/* Patient Portal and Language Group */}
              <div className="flex items-center gap-4 bg-white/5 p-1 rounded-xl border border-white/10 px-3">
                {isAdmin && (
                  <div className="flex items-center">
                    <button 
                      onClick={onAdminClick}
                      className="bg-red-500/10 border-2 border-red-500/20 text-red-400 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all shadow-lg flex items-center gap-2"
                    >
                      <Menu className="w-3.5 h-3.5" />
                      {language === 'en' ? 'Admin Portal' : 'Portali Admin'}
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-6"></div>
                  </div>
                )}
                <button 
                  onClick={onPortalClick}
                  className="flex items-center gap-2 group px-4 py-2 hover:bg-white/5 rounded-lg transition-all"
                >
                  <User className="w-3.5 h-3.5 text-white/40 group-hover:text-[#87CEEB] transition-colors" />
                  <span className="text-[10px] font-black text-white/50 uppercase tracking-widest group-hover:text-white transition-colors">
                    {language === 'en' ? 'Sign In' : 'Identifikohu'}
                  </span>
                </button>
                <div className="w-px h-4 bg-white/10"></div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setLanguage('en')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${language === 'en' ? 'bg-[#4169E1] text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                  >
                    EN
                  </button>
                  <button 
                    onClick={() => setLanguage('sq')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${language === 'sq' ? 'bg-[#4169E1] text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                  >
                    SQ
                  </button>
                </div>
              </div>
              
              {/* Primary CTA */}
              <button 
                onClick={(e) => { e.preventDefault(); onBookClick?.(); }}
                className="bg-[#4169E1] text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40 hover:bg-[#5A8DFF] hover:-translate-y-0.5 active:translate-y-0"
              >
                {language === 'en' ? 'Get Started' : 'Filloni Tani'}
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-4">
             <button 
                onClick={onPortalClick}
                className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white"
                aria-label={language === 'en' ? "Patient Portal" : "Portali i Pacientit"}
              >
                <div className="text-[10px] font-black">{language === 'en' ? 'PORT' : 'PORT'}</div>
              </button>
             <button 
              onClick={() => setLanguage(language === 'en' ? 'sq' : 'en')}
              className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white"
            >
              <Globe className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="w-10 h-10 rounded-xl bg-[#4169E1] flex items-center justify-center text-white shadow-lg border border-white/10"
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - AnimatePresence */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-[#19376D] border-t border-white/10 shadow-2xl p-6 lg:hidden"
          >
            <div className="flex flex-col space-y-4">
              {content.nav.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="px-4 py-4 text-lg font-bold text-white/80 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-4 flex flex-col gap-4">
                 {isAdmin && (
                    <button 
                      onClick={() => { onAdminClick?.(); setIsOpen(false); }}
                      className="w-full py-4 rounded-2xl border-2 border-[#4169E1]/30 bg-[#4169E1]/10 text-[#87CEEB] font-black uppercase tracking-widest text-center"
                    >
                      {language === 'en' ? 'Admin Portal' : 'Portali Admin'}
                    </button>
                 )}
                 <button 
                  onClick={() => { onPortalClick?.(); setIsOpen(false); }}
                  className="w-full py-4 rounded-2xl border border-white/10 text-white font-bold text-center hover:bg-white/5"
                >
                  {language === 'en' ? 'Patient Portal' : 'Portali i Pacientit'}
                </button>
                <button 
                  onClick={(e) => { e.preventDefault(); onBookClick?.(); setIsOpen(false); }}
                  className="w-full bg-[#4169E1] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl"
                >
                  {language === 'en' ? 'Get Started' : 'Filloni Tani'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
