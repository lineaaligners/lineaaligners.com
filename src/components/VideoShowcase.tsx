import React from 'react';

interface VideoShowcaseProps {
  language: 'en' | 'sq';
}

export const VideoShowcase: React.FC<VideoShowcaseProps> = ({ language }) => {
  const isEn = language === 'en';
  return (
    <section className="py-32 bg-[#193D6D] overflow-hidden relative" aria-labelledby="video-showcase-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-10 order-2 lg:order-1">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-[#4169E1]/10 text-[#87CEEB] font-black text-[11px] uppercase tracking-[0.3em]">
              {isEn ? 'Precision in Motion' : 'Saktësia në Lëvizje'}
            </div>
            <h2 id="video-showcase-heading" className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none">
              {isEn ? 'Digital' : 'Dizajni'} <br /> 
              <span className="text-[#4169E1]">{isEn ? 'Mastery.' : 'Digjital.'}</span>
            </h2>
            <p className="text-2xl text-white/80 font-bold leading-relaxed max-w-lg">
              {isEn 
                ? "Watch as our advanced 3D algorithms map out your perfect alignment. We combine artificial intelligence with human expertise to craft every single set."
                : "Shikoni se si algoritmet tona të avancuara 3D hartojnë rreshtimin tuaj të përsosur. Ne kombinojmë inteligjencën artificiale me ekspertizën njerëzore."}
            </p>
            <div className="flex gap-8 items-center pt-4">
               <div className="flex flex-col">
                  <span className="text-4xl font-black text-white tracking-tighter">0.2mm</span>
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{isEn ? 'Accuracy' : 'Saktësia'}</span>
               </div>
               <div className="w-px h-12 bg-white/10"></div>
               <div className="flex flex-col">
                  <span className="text-4xl font-black text-white tracking-tighter">100%</span>
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{isEn ? 'Digital' : 'Digjitale'}</span>
               </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="relative aspect-[4/5] rounded-[80px] overflow-hidden shadow-[0_50px_100px_rgba(65,105,225,0.2)] border-[12px] border-white/10 group">
              <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
              >
                <source src="https://gwzvtrikxkudostserwe.supabase.co/storage/v1/object/public/linea/linea34.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-[#193D6D]/40 via-transparent to-transparent pointer-events-none"></div>
              <div className="absolute bottom-10 left-10 flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-[#87CEEB] animate-ping"></div>
                 <span className="text-white font-black text-xs uppercase tracking-[0.2em]">{isEn ? 'Real-time Simulation' : 'Simulim në Kohë Reale'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
