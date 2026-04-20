import React from 'react';
import { BRAND_ASSET } from '../constants';

interface TransformationGalleryProps {
  language: 'en' | 'sq';
}

export const TransformationGallery: React.FC<TransformationGalleryProps> = ({ language }) => {
  const isEn = language === 'en';
  return (
    <section className="py-32 bg-[#193D6D] relative overflow-hidden" aria-labelledby="gallery-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-24 items-center mb-24">
           <div className="space-y-6">
              <h2 className="text-[#87CEEB] font-black uppercase tracking-[0.25em] text-[12px]">{isEn ? 'The Transformation' : 'Transformimi'}</h2>
              <h3 id="gallery-heading" className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none">
                {isEn ? 'Real results,' : 'Rezultate reale,'} <br /> {isEn ? 'real patients.' : 'pacientë realë.'}
              </h3>
              <p className="text-2xl text-white/80 font-bold leading-relaxed max-w-lg">
                {isEn 
                  ? "Witness the clarity and precision of our treatments through clinical documentation and lifestyle results."
                  : "Dëshmoni qartësinë dhe saktësinë e trajtimeve tona përmes dokumentacionit klinik dhe rezultateve të stilit të jetesës."}
              </p>
           </div>
           <div className="grid grid-cols-2 gap-6">
              <div className="aspect-[4/5] rounded-[50px] overflow-hidden bg-white/5 shadow-2xl group border-4 border-white/10">
                 <img 
                    src={BRAND_ASSET} 
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:grayscale-0 grayscale-0 transition-all duration-1000" 
                    alt="Close up of clear aligner detail" 
                 />
              </div>
              <div className="aspect-[4/5] rounded-[50px] overflow-hidden bg-white/5 shadow-2xl mt-16 group border-4 border-white/10">
                 <img 
                    src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&q=80&w=800" 
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                    alt="Happy patient with perfect smile" 
                 />
              </div>
           </div>
        </div>
      </div>
    </section>
  );
};
