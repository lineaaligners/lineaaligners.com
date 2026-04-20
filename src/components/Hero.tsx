
import React from 'react';
import { TRANSLATIONS } from '../constants';
import { motion } from 'motion/react';
import { ArrowRight, Star } from 'lucide-react';

export const Hero: React.FC<{ 
  onStartPlanner?: () => void;
  onBookScan?: () => void;
  language: 'en' | 'sq';
}> = ({ onStartPlanner, onBookScan, language }) => {
  const content = TRANSLATIONS[language].hero;
  const heroImage = "https://gwzvtrikxkudostserwe.supabase.co/storage/v1/object/public/linea/freepik_anamorphic-lens-photograp_2698310219.jpeg";

  return (
    <section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#19376D]"
      aria-label="Hero Section"
    >
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Modern Dental Technology" 
          className="w-full h-full object-cover object-center"
        />
        {/* Royal Blue Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#19376D]/90 via-[#19376D]/60 to-transparent"></div>
        <div className="absolute inset-0 bg-[#4169E1]/20 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 w-full pt-20">
        <div className="max-w-3xl space-y-10">
          {/* Badge Animation */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-4"
          >
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#87CEEB] font-black text-[10px] uppercase tracking-[0.3em] w-fit shadow-2xl">
              <span className="flex h-2 w-2 rounded-full bg-[#87CEEB] animate-pulse"></span>
              {content.badge}
            </div>
            <p className="text-[12px] font-black text-white/50 uppercase tracking-[0.4em] ml-1">
              {content.founders}
            </p>
          </motion.div>

          {/* Main Title Animation */}
          <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-6xl md:text-8xl lg:text-9xl font-black text-white leading-[0.85] tracking-tighter"
            >
              <span className="text-white">{content.title1}</span> <br />
              <span className="text-white">{content.title2}</span><br />
              <span className="text-white">{content.title3}</span> <br />
              <span className="text-white italic underline decoration-white/20 underline-offset-8">
                {content.title4}
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-white/80 leading-relaxed max-w-xl font-medium"
            >
              {content.description}
            </motion.p>
          </div>

          {/* Action Buttons Animation */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center gap-6 pt-6"
          >
            <button 
              onClick={() => onBookScan?.()}
              className="group w-full sm:w-auto bg-[#4169E1] text-white px-12 py-5 rounded-2xl font-black text-lg uppercase tracking-widest transition-all shadow-[0_20px_50px_rgba(65,105,225,0.4)] flex items-center justify-center gap-4 hover:bg-[#5A8DFF] hover:-translate-y-1 active:translate-y-0"
            >
              <span>{content.btnPrimary}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => onStartPlanner?.()}
              className="w-full sm:w-auto bg-white/10 backdrop-blur-md border-2 border-white/20 text-white hover:bg-white/20 px-12 py-5 rounded-2xl font-black text-lg uppercase tracking-widest transition-all hover:shadow-[0_15px_35px_rgba(255,255,255,0.1)] hover:-translate-y-1 active:translate-y-0"
            >
              {content.btnSecondary}
            </button>
          </motion.div>

          {/* Trust Indicators Animation */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex items-center gap-6 pt-10"
          >
            <div className="flex -space-x-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-12 h-12 rounded-2xl border-4 border-[#19376D] overflow-hidden bg-white/10 shadow-2xl skew-x-[-10deg]">
                  <img src={`https://i.pravatar.cc/150?u=${i + 20}`} alt="Patient" className="w-full h-full object-cover skew-x-[10deg] scale-125" />
                </div>
              ))}
            </div>
            <div className="text-sm">
              <div className="flex gap-1 text-[#87CEEB] mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="font-bold text-white tracking-wide uppercase text-[10px]">{content.trust}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative vertical lines for a technical feel */}
      <div className="absolute top-0 right-1/4 w-px h-full bg-white/5 hidden lg:block"></div>
      <div className="absolute top-0 right-2/4 w-px h-full bg-white/5 hidden lg:block"></div>
      
      {/* Scroll Indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-6 h-10 border-2 border-white/20 rounded-full flex justify-center p-2 hidden md:flex"
      >
        <div className="w-1 h-2 bg-white/40 rounded-full"></div>
      </motion.div>
    </section>
  );
};
