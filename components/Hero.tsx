import React from 'react';
import { TRANSLATIONS } from '../constants';

export const Hero: React.FC<{ 
  onStartPlanner?: () => void;
  onBookScan?: () => void;
  language: 'en' | 'sq';
}> = ({ onStartPlanner, onBookScan, language }) => {
  const content = TRANSLATIONS[language].hero;
  // Updated with the new high-premium product shoot asset
  const lifestyleAsset = "https://gwzvtrikxkudostserwe.supabase.co/storage/v1/object/public/linea/freepik__create-a-high-premium-shoot-of-this-product-for-we__39134.jpeg";

  return (
    <section 
      className="relative pt-32 pb-24 md:pb-32 overflow-hidden min-h-screen flex items-center bg-white"
      aria-label="Welcome section"
    >
      {/* Dynamic Background Auras */}
      <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-5%] w-[70%] h-[90%] bg-purple-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[70%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      </div>

      {/* Decorative background texture for the right side */}
      <div className="absolute inset-y-0 right-0 w-full lg:w-1/2 z-0 hidden lg:block" aria-hidden="true">
        <div 
          className="w-full h-full bg-cover bg-center opacity-5 mix-blend-multiply"
          style={{ backgroundImage: `url('${lifestyleAsset}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="max-w-2xl space-y-10">
            <div className="flex flex-col gap-4">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-purple-100 border border-purple-200 text-purple-700 font-black text-[10px] uppercase tracking-[0.25em] w-fit shadow-sm">
                <span className="flex h-2.5 w-2.5 rounded-full bg-purple-600 animate-pulse" aria-hidden="true"></span>
                {content.badge}
              </div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                {content.founders}
              </p>
            </div>

            <div className="space-y-6">
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-slate-900 leading-[0.85] tracking-tighter">
                {content.title1} <br />
                <span className="text-purple-600">{content.title2}</span><br />
                {content.title3} <br />
                <span className="italic font-medium text-purple-gradient">{content.title4}</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-lg font-medium">
                {content.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 pt-4">
              <button 
                onClick={() => onBookScan?.()}
                className="w-full sm:w-auto bg-purple-gradient text-white px-10 py-5 rounded-full font-black text-base uppercase tracking-widest transition-all transform hover:-translate-y-1 shadow-[0_20px_40px_rgba(109,40,217,0.4)] flex items-center justify-center gap-3 active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-200"
              >
                <span>{content.btnPrimary}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <button 
                onClick={() => onStartPlanner?.()}
                className="w-full sm:w-auto bg-white border-2 border-purple-100 text-purple-700 hover:bg-purple-50 px-10 py-5 rounded-full font-black text-base uppercase tracking-widest transition-all hover:shadow-[0_10px_25px_rgba(109,40,217,0.1)] active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-100"
              >
                {content.btnSecondary}
              </button>
            </div>

            <div className="flex items-center gap-5 pt-6" aria-label="Customer trust and ratings">
              <div className="flex -space-x-3" aria-hidden="true">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-white overflow-hidden bg-slate-100 shadow-sm">
                    <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <div className="flex gap-0.5 text-yellow-500 mb-0.5" aria-label="5 star rating">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20" aria-hidden="true"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="font-bold text-slate-900 tracking-tight">{content.trust}</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-center justify-center relative" aria-hidden="true">
            <div className="relative group">
              {/* Massive Purple Glow Effect to highlight the premium asset */}
              <div className="absolute -inset-24 bg-purple-600/20 blur-[180px] rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-1000"></div>
              
              <div className="relative transform transition-all duration-1000 hover:rotate-1 hover:scale-105">
                <div className="w-[550px] aspect-[4/5] rounded-[80px] overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,0.25)] border-[12px] border-white p-1 bg-white">
                  <img 
                    src={lifestyleAsset} 
                    alt="Linea Premium Clear Aligner Aligner Case" 
                    className="w-full h-full object-cover rounded-[70px]" 
                  />
                </div>
                
                {/* Floating info tag */}
                <div className="absolute -bottom-8 -left-8 bg-white/95 backdrop-blur-md p-8 rounded-[40px] shadow-2xl border border-purple-50 animate-bounce-slow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Premium Quality</p>
                  </div>
                  <p className="text-lg font-black text-slate-900 leading-tight">Designed for <br/>Perfect Results</p>
                  <p className="text-xs font-bold text-slate-400 mt-2">Made in Peja, Kosova</p>
                </div>

                {/* Second floating tag */}
                <div className="absolute -top-6 -right-6 bg-purple-700 p-6 rounded-[32px] shadow-xl text-white transform rotate-6">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Tech Driven</p>
                  <p className="text-sm font-black mt-1">3D Precision</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom slow bounce animation for the floating tag */}
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};