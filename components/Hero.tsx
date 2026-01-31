import React from 'react';

export const Hero: React.FC<{ 
  onStartPlanner?: () => void;
  onBookScan?: () => void;
}> = ({ onStartPlanner, onBookScan }) => {
  const currentImage = "202241.jpg";

  const scrollToStory = () => {
    const el = document.getElementById('cinematic-story');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section 
      className="relative pt-32 pb-32 overflow-hidden min-h-[90vh] flex items-center bg-slate-50"
    >
      {/* Background Image Container with Parallax-ready styling */}
      <div className="absolute inset-0 z-0">
        <div 
          className="w-full h-full bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{ backgroundImage: `url('${currentImage}')` }}
        />
        {/* Elegant Multi-layered Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-40"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl space-y-10">
            {/* Top Tagline */}
            <div className="flex flex-col gap-4">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-purple-100 text-purple-700 font-black text-[10px] uppercase tracking-[0.2em] w-fit animate-fade-in">
                <span className="flex h-2 w-2 rounded-full bg-purple-500"></span>
                Kosovo's Digital Smile Lab
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">
                Genis Nallbani & Dr. Fatbardha Mustafa
              </p>
            </div>

            {/* Main Header */}
            <div className="space-y-6">
              <h1 className="text-7xl md:text-8xl font-black text-slate-900 leading-[0.85] tracking-tighter">
                Invisible <br />
                <span className="text-purple-600">Precision.</span><br />
                Visible <br />
                <span className="italic font-light text-slate-400">Smiles.</span>
              </h1>
              <p className="text-xl text-slate-500 leading-relaxed max-w-lg font-medium">
                Premium clear aligner technology tailored for the modern lifestyle. Expert care by Meident Dental Clinic, Peja.
              </p>
            </div>

            {/* Action Area */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
              <button 
                onClick={() => onBookScan?.()}
                className="w-full sm:w-auto bg-slate-900 hover:bg-purple-700 text-white px-10 py-5 rounded-full font-bold text-lg transition-all transform hover:-translate-y-1 shadow-2xl flex items-center justify-center gap-3 group active:scale-95"
              >
                <span>Book via Google Calendar</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
              </button>
              <button 
                onClick={() => onStartPlanner?.()}
                className="w-full sm:w-auto bg-white/80 backdrop-blur-md border-2 border-slate-200 text-slate-700 hover:bg-white hover:border-purple-300 px-10 py-5 rounded-full font-bold text-lg transition-all shadow-sm active:scale-95"
              >
                Digital AI Assessment
              </button>
            </div>
          </div>

          {/* Floating Elegant Badge (Desktop) */}
          <div className="hidden lg:flex flex-col items-end gap-6 animate-fade-in-up">
            <div className="glass-card p-8 rounded-[40px] shadow-2xl max-w-xs space-y-4 border border-white/40 group hover:border-purple-200 transition-colors">
              <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h4 className="text-xl font-black text-slate-900 tracking-tight">Clinical Excellence</h4>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Every treatment is overseen by certified orthodontists in our Peja headquarters.
              </p>
            </div>
            
            <div className="flex items-center gap-4 pr-6">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trust Pilot</p>
                <p className="text-lg font-black text-slate-900">4.9 / 5.0 Rating</p>
              </div>
              <div className="flex gap-1 text-purple-600">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};