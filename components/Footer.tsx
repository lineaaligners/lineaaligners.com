import React from 'react';
import { TRANSLATIONS } from '../constants';

export const Footer: React.FC<{ language: 'en' | 'sq' }> = ({ language }) => {
  const content = TRANSLATIONS[language];
  const isEn = language === 'en';
  const logoUrl = "https://gwzvtrikxkudostserwe.supabase.co/storage/v1/object/public/linea/linea%20pa%20back.png";

  const socialLinks = [
    { id: 'ig', label: isEn ? 'Follow us on Instagram' : 'Na ndiqni në Instagram', href: 'https://instagram.com' },
    { id: 'fb', label: isEn ? 'Follow us on Facebook' : 'Na ndiqni në Facebook', href: 'https://facebook.com' },
    { id: 'wa', label: isEn ? 'Contact us on WhatsApp' : 'Na kontaktoni në WhatsApp', href: 'https://wa.me/38349772307' }
  ];

  return (
    <footer className="bg-slate-950 text-white pt-24 pb-12 relative overflow-hidden" role="contentinfo">
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" aria-hidden="true"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-8 mb-20">
          
          <div className="lg:col-span-5 space-y-8">
            <div className="flex items-center gap-2">
              <img 
                src={logoUrl} 
                alt="Linea Aligners Logo" 
                className="h-12 w-auto object-contain brightness-0 invert" 
              />
            </div>
            <p className="text-lg text-slate-400 max-w-md leading-relaxed font-medium">
              {isEn 
                ? "Redefining the smile experience in Kosovo through digital 3D precision and clinical excellence. Invisible paths to visible confidence."
                : "Duke ridizajnuar buzëqeshjen në Kosovë përmes saktësisë digjitale 3D dhe ekselencës klinike. Rrugë të padukshme drejt vetëbesimit të dukshëm."}
            </p>
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{isEn ? 'Directorship' : 'Drejtimi'}</p>
              <p className="text-sm font-bold text-slate-200">Genis Nallbani & Dr. Fatbardha Mustafa</p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-xs font-black text-purple-400 uppercase tracking-[0.3em]">{isEn ? 'Explore' : 'Eksploro'}</h2>
            <ul className="space-y-4">
              {content.nav.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="text-slate-400 hover:text-white transition-colors font-bold text-sm tracking-tight focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-1"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-8">
            <h2 className="text-xs font-black text-purple-400 uppercase tracking-[0.3em]">{isEn ? 'The Clinic' : 'Klinika'}</h2>
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-slate-100 font-black text-sm uppercase">Meident Dental Clinic</p>
                <address className="text-slate-400 text-sm leading-relaxed not-italic">
                  {isEn ? 'Peja, Republic of Kosova' : 'Pejë, Republika e Kosovës'}<br />
                  30000 Pejë
                </address>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isEn ? 'Appointment Line' : 'Linja e Rezervimit'}</p>
                <a 
                  href="tel:+38349772307" 
                  className="text-white font-black text-lg hover:text-purple-400 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                  aria-label={isEn ? "Call us at +383 49 772 307" : "Na telefononi në +383 49 772 307"}
                >
                  +383 49 772 307
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-xs font-black text-purple-400 uppercase tracking-[0.3em]">{isEn ? 'Operations' : 'Orari'}</h2>
            <ul className="space-y-4 text-sm font-medium">
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-500">{isEn ? 'Mon - Fri' : 'Hën - Pre'}</span>
                <span className="text-slate-200">09:00 - 18:00</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-500">{isEn ? 'Saturday' : 'Shtunë'}</span>
                <span className="text-slate-200">10:00 - 15:00</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">{isEn ? 'Sunday' : 'Dielë'}</span>
                <span className="text-purple-500 font-bold">{isEn ? 'Closed' : 'Mbyllur'}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-slate-500 text-xs font-medium">
            © {new Date().getFullYear()} Linea Aligners Kosovo. {isEn ? 'All rights reserved.' : 'Të gjitha të drejtat e rezervuara.'}
          </p>
          <div className="flex items-center gap-4" role="list">
            {socialLinks.map((social) => (
              <div key={social.id} role="listitem">
                <a 
                  href={social.href} 
                  aria-label={social.label} 
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-purple-600 hover:border-purple-500 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <div className="w-4 h-4 bg-current rounded-sm opacity-60" aria-hidden="true"></div>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};