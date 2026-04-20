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
                className="relative z-10 w-full max-w-lg mx-auto rounded-[80px] shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-4 border-white/10 transform transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
          <div className="lg:w-1/2 space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#4169E1] text-white font-black text-[11px] uppercase tracking-[0.3em]">
              {isEn ? 'Premium Accessory' : 'Aksesor Premium'}
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tighter">
              {isEn ? 'Iconic Design.' : 'Dizajn Ikonik.'}<br />
              <span className="text-[#87CEEB]">{isEn ? 'Unmistakable.' : 'I pagabueshëm.'}</span>
            </h2>
            <p className="text-2xl text-white leading-relaxed font-bold opacity-90">
              {isEn 
                ? "Your journey to a perfect smile comes packaged in excellence. Our signature design is crafted to be as bold and beautiful as your new confidence."
                : "Rrugëtimi juaj drejt një buzëqeshjeje të përsosur vjen i paketuar në përsosmëri. Dizajni ynë karakteristik është i punuar të jetë po aq i guximshëm dhe i bukur sa vetëbesimi juaj i ri."}
            </p>
            <div className="pt-4">
              <div className="flex items-center gap-5 text-white font-black text-lg">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#87CEEB] shadow-xl">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <span>{isEn ? 'Shock-resistant Protection' : 'Mbrojtje kundër goditjeve'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
