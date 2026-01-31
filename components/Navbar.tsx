import React, { useState } from 'react';
import { NAV_ITEMS } from '../constants';

export const Navbar: React.FC<{ 
  setView: (v: 'home' | 'planner') => void; 
  view: 'home' | 'planner';
  onBookClick?: () => void;
}> = ({ setView, view, onBookClick }) => {
  const [isOpen, setIsOpen] = useState(false);

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
      // Wait for home view to render before scrolling
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
    <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md border-b border-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <button onClick={handleLogoClick} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-2xl font-black text-purple-700 tracking-tight">LINEA</span>
              <span className="text-2xl font-light text-slate-400 tracking-tight">ALIGNERS</span>
            </button>
          </div>

          {/* Center Stats (Desktop only) */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex -space-x-2">
              {[
                '1494790108377-be9c29b29330',
                '1500648767791-00dcc994a43e',
                '1534528741775-53994a69daeb',
                '1506794778202-cad84cf45f1d'
              ].map((id, i) => (
                <img
                  key={i}
                  src={`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=64`}
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  alt="Patient"
                />
              ))}
            </div>
            <div className="text-left border-l border-slate-100 pl-4">
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter leading-none">500+ Happy Patients</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Average treatment: 6 months</p>
            </div>
          </div>

          {/* Links and Button */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-6 mr-4">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="text-slate-500 hover:text-purple-600 transition-colors font-bold text-[13px] tracking-tight cursor-pointer"
                >
                  {item.label}
                </a>
              ))}
            </div>
            <button 
              onClick={(e) => { e.preventDefault(); onBookClick?.(); setIsOpen(false); }}
              className="bg-purple-gradient hover:opacity-90 text-white px-8 py-2.5 rounded-full font-bold text-sm transition-all shadow-[0_10px_20px_rgba(109,40,217,0.3)] active:scale-95"
            >
              Book Free Scan
            </button>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 p-2">
              {isOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-purple-100 animate-fade-in-down">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="block px-3 py-3 text-base font-medium text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-4">
              <button 
                onClick={(e) => { e.preventDefault(); onBookClick?.(); setIsOpen(false); }}
                className="w-full bg-purple-600 text-white px-6 py-4 rounded-xl font-bold transition-colors active:scale-95 shadow-lg"
              >
                Book Free Scan
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};