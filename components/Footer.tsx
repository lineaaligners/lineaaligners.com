import React from 'react';
import { TRANSLATIONS } from '../constants';
import { Instagram, Facebook, MessageCircle } from 'lucide-react';

export const Footer: React.FC<{ language: 'en' | 'sq' }> = ({ language }) => {
  const content = TRANSLATIONS[language];
  const isEn = language === 'en';
  const logoUrl = "https://gwzvtrikxkudostserwe.supabase.co/storage/v1/object/public/linea/linea%20vjollc%20png.png";

  const socialLinks = [
    { id: 'ig', label: isEn ? 'Follow us on Instagram' : 'Na ndiqni në Instagram', href: 'https://instagram.com', icon: Instagram },
    { id: 'fb', label: isEn ? 'Follow us on Facebook' : 'Na ndiqni në Facebook', href: 'https://facebook.com', icon: Facebook },
    { id: 'wa', label: isEn ? 'Contact us on WhatsApp' : 'Na kontaktoni në WhatsApp', href: 'https://wa.me/38349772307', icon: MessageCircle }
  ];

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    const id = href.substring(1);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = href;
    }
  };

  return (
    <footer className="bg-[#111827] text-white pt-24 pb-12 relative overflow-hidden" role="contentinfo">
      {/* Enhanced background glow for more depth */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#4169E1]/10 rounded-full blur-[140px] pointer-events-none" aria-hidden="true"></div>
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#87CEEB]/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-8 mb-20 text-white">
          
          <div className="lg:col-span-5 space-y-8">
            <div className="flex items-center gap-2">
              <img 
                src={logoUrl} 
                alt="Linea Aligners Logo" 
                loading="lazy"
                className="h-24 w-auto object-contain brightness-0 invert" 
              />
            </div>
            <p className="text-xl text-white/80 max-w-md leading-relaxed font-medium">
              {isEn 
                ? "Redefining the smile experience in Kosovo through digital 3D precision and clinical excellence. Invisible paths to visible confidence."
                : "Duke ridizajnuar buzëqeshjen në Kosovë përmes saktësisë digjitale 3D dhe ekselencës klinike. Rrugë të padukshme drejt vetëbesimit të dukshëm."}
            </p>
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-black text-[#87CEEB] uppercase tracking-[0.4em]">{isEn ? 'Directorship' : 'Drejtimi'}</p>
              <p className="text-base font-black text-white">Genis Nallbani & Dr. Fatbardha Mustafa</p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-xs font-black text-[#87CEEB] uppercase tracking-[0.3em]">{isEn ? 'Explore' : 'Eksploro'}</h2>
            <ul className="space-y-4">
              {content.nav.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="text-white/70 hover:text-[#4169E1] transition-colors font-bold text-base tracking-tight focus:outline-none focus:ring-2 focus:ring-[#4169E1] rounded px-1"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-8">
            <h2 className="text-xs font-black text-[#87CEEB] uppercase tracking-[0.3em]">{isEn ? 'The Clinic' : 'Klinika'}</h2>
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-white font-black text-base uppercase">Medident Dental Clinic</p>
                <address className="text-white/70 text-base leading-relaxed not-italic font-medium">
                  {isEn ? 'Peja, Republic of Kosova' : 'Pejë, Republika e Kosovës'}<br />
                  30000 Pejë
                </address>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-[#87CEEB] uppercase tracking-widest">{isEn ? 'Appointment Line' : 'Linja e Rezervimit'}</p>
                <a 
                  href="tel:+38349772307" 
                  className="text-white font-black text-2xl hover:text-[#4169E1] transition-colors focus:outline-none focus:ring-2 focus:ring-[#4169E1] rounded inline-block"
                  aria-label={isEn ? "Call us at +383 49 772 307" : "Na telefononi në +383 49 772 307"}
                >
                  +383 49 772 307
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-xs font-black text-[#87CEEB] uppercase tracking-[0.3em]">{isEn ? 'Operations' : 'Orari'}</h2>
            <ul className="space-y-4 text-base font-bold">
              <li className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">{isEn ? 'Mon - Fri' : 'Hën - Pre'}</span>
                <span className="text-white">09:00 - 18:00</span>
              </li>
              <li className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">{isEn ? 'Saturday' : 'Shtunë'}</span>
                <span className="text-white">10:00 - 15:00</span>
              </li>
              <li className="flex justify-between">
                <span className="text-white/50">{isEn ? 'Sunday' : 'Dielë'}</span>
                <span className="text-[#4169E1] font-black">{isEn ? 'Closed' : 'Mbyllur'}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 text-white">
          <p className="text-white/50 text-sm font-bold">
            © {new Date().getFullYear()} Linea Aligners Kosovo. {isEn ? 'All rights reserved.' : 'Të gjitha të drejtat e rezervuara.'}
          </p>
          <div className="flex items-center gap-4" role="list">
            {socialLinks.map((social) => (
              <div key={social.id} role="listitem">
                <a 
                  href={social.href} 
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label} 
                  className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-[#4169E1] hover:border-[#4169E1] transition-all focus:outline-none focus:ring-2 focus:ring-[#4169E1] shadow-lg shadow-black/20"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};