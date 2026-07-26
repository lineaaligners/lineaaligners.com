import React from 'react';
import { ICONIC_DESIGN_ASSET } from '../constants';

interface ProductSpotlightProps {
  language: 'en' | 'sq';
}

export const ProductSpotlight: React.FC<ProductSpotlightProps> = ({ language }) => {
  const isEn = language === 'en';
  return (
    <section className="py-32 bg-[#193D6D] overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-20">
          <div className="lg:w-1/2">
            <div className="relative group">
              <div className="absolute -inset-10 bg-[#4169E1]/10 blur-[120px] rounded-full group-hover:bg-[#4169E1]/20 transition-all duration-1000"></div>
              <img 
                src={ICONIC_DESIGN_ASSET} 
                alt="Linea Aligner Iconic Design" 
                loading="lazy"
                referrerPolicy="no-referrer"
                className="relative z-10 w-full max-w-lg mx-auto rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-4 border-white/10 transform transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
          <div className="lg:w-1/2 space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#4169E1] text-white font-bold text-[11px] uppercase tracking-[0.3em]">
              {isEn ? 'Comes With Every Set' : 'Vjen me Çdo Set'}
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white leading-none tracking-tighter">
              {isEn ? 'A case that' : 'Një kuti që'}<br />
              <span className="text-[#87CEEB]">{isEn ? "actually protects them." : 'i mbron vërtet.'}</span>
            </h2>
            <p className="text-lg text-white/70 leading-relaxed font-normal max-w-md">
              {isEn 
                ? "Every set of Linea Aligners comes in a sturdy, good-looking case — so you always have somewhere safe to put them when you take them out to eat."
                : "Çdo set i Linea Aligners vjen në një kuti solide dhe të bukur — kështu gjithmonë keni ku t'i vendosni kur i hiqni për të ngrënë."}
            </p>
            <div className="pt-4">
              <div className="flex items-center gap-5 text-white font-bold text-base">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#87CEEB] shadow-xl">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <span>{isEn ? 'Shock-resistant' : 'Rezistente ndaj goditjeve'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
