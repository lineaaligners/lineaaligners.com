import React from 'react';

interface CinematicStoryProps {
  language: 'en' | 'sq';
  onPlayVideo: () => void;
  videoUrl: string;
}

export const CinematicStory: React.FC<CinematicStoryProps> = ({ language, onPlayVideo, videoUrl }) => {
  const isEn = language === 'en';
  return (
    <section id="cinematic-story" className="py-32 bg-[#193D6D] overflow-hidden relative" aria-labelledby="story-heading">
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-r from-[#193D6D] via-[#193D6D]/80 to-transparent z-10"></div>
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover opacity-20 scale-110 blur-sm"
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="flex flex-col lg:flex-row gap-20 items-center">
          <div className="lg:w-5/12 space-y-10">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border-2 border-[#4169E1]/50 bg-[#4169E1]/20 text-[#87CEEB] font-black text-[11px] uppercase tracking-[0.3em]">
              {isEn ? 'Precision Lab' : 'Laboratori i Saktësisë'}
            </div>
            <h2 id="story-heading" className="text-6xl md:text-8xl font-black text-white leading-none tracking-tighter">
              {isEn ? 'The Art of' : 'Arti i'}<br />
              <span className="text-[#4169E1]">{isEn ? 'Alignment.' : 'Rreshtimit.'}</span>
            </h2>
            <p className="text-2xl text-slate-100 font-bold leading-relaxed">
              {isEn 
                ? "Step inside our digital workshop where every millimeter is calculated for perfection. Our orthodontic expertise ensures you're part of the process from day one." 
                : "Hyni brenda punishtes sonë digjitale ku çdo milimetër llogaritet për përsosmëri. Ekspertiza jonë ortodontike siguron që ju të jeni pjesë e procesit që nga dita e parë."}
            </p>
            
            <div className="space-y-6 pt-6">
              {[
                { title: isEn ? 'Digital Precision' : 'Saktësi Digjitale', desc: isEn ? '0.2mm incremental movement mapping' : 'Mapimi i lëvizjeve prej 0.2mm' },
                { title: isEn ? 'Human Artistry' : 'Artizanat Njerëzor', desc: isEn ? 'Hand-finished by expert technicians' : 'Përfunduar me dorë nga teknikët ekspertë' }
              ].map((item, i) => (
                <div key={i} className="flex gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center text-[#4169E1] flex-shrink-0 shadow-2xl" aria-hidden="true">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <h4 className="text-white font-black text-lg">{item.title}</h4>
                    <p className="text-slate-300 font-bold text-base">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:w-7/12 w-full relative group">
            <div className="aspect-[16/9] bg-[#193D6D] rounded-[50px] overflow-hidden shadow-[0_40px_100px_rgba(65,105,225,0.3)] border-4 border-white/10 relative">
              <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-1000"
              >
                <source src={videoUrl} type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-[#193D6D] via-transparent to-transparent"></div>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <button 
                  onClick={onPlayVideo}
                  className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.3)] transform group-hover:scale-110 transition-all duration-500 relative focus:outline-none focus:ring-4 focus:ring-blue-500"
                  aria-label="Play clinic overview video"
                >
                  <div className="absolute inset-0 bg-[#4169E1] rounded-full animate-ping opacity-30"></div>
                  <div className="w-0 h-0 border-t-[14px] border-t-transparent border-l-[24px] border-l-[#193D6D] border-b-[14px] border-b-transparent ml-2" aria-hidden="true"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
