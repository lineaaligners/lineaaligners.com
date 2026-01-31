import React from 'react';
import { FEATURES } from '../constants';

const FeatureIcon: React.FC<{ type: string }> = ({ type }) => {
  const baseClass = "w-8 h-8 text-purple-600";
  
  switch (type) {
    case 'invisible':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" style={{ opacity: 0 }} />
        </svg>
      );
    case 'removable':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
        </svg>
      );
    case 'precision':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v3m0 0l-2-2m2 2l2-2" />
        </svg>
      );
    case 'results':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    default:
      return null;
  }
};

export const Features: React.FC = () => {
  return (
    <section id="benefits" className="py-32 bg-white relative overflow-hidden">
      {/* Decorative Gradient Auras */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-purple-50 rounded-full blur-[120px] opacity-40 -z-10"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] opacity-40 -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          <div className="space-y-6">
            <h2 className="text-purple-600 font-black uppercase tracking-[0.25em] text-[10px]">The Linea Difference</h2>
            <h3 className="text-5xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter">
              Advanced <span className="text-purple-600">Orthodontics</span> <br />
              for the Modern Life.
            </h3>
          </div>
          <div className="lg:border-l lg:border-slate-100 lg:pl-16">
            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-xl">
              We've redesigned the dental experience to be entirely digital, comfortable, and patient-focused. No messy molds, just clear clinical precision.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((feature, idx) => (
            <div 
              key={idx}
              className="relative p-10 rounded-[45px] bg-white border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.02)] hover:shadow-[0_50px_90px_rgba(109,40,217,0.1)] transition-all duration-700 group overflow-hidden"
            >
              {/* Animated subtle backdrop */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/0 via-white to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

              <div className="relative z-10 flex flex-col h-full">
                {/* Modern Glass Icon Container */}
                <div className="w-16 h-16 bg-slate-50 rounded-[22px] border border-white flex items-center justify-center mb-10 transform group-hover:rotate-12 group-hover:scale-110 group-hover:bg-white group-hover:shadow-xl transition-all duration-500 ease-out">
                  <div className="relative">
                    <FeatureIcon type={feature.icon} />
                    {/* Small pulsing element to add "tech" feel */}
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 animate-pulse"></div>
                  </div>
                </div>

                <h4 className="text-2xl font-black text-slate-900 mb-5 tracking-tight group-hover:text-purple-700 transition-colors duration-300">
                  {feature.title}
                </h4>
                
                <p className="text-slate-500 leading-relaxed font-medium text-[15px] opacity-90 group-hover:opacity-100 transition-opacity">
                  {feature.description}
                </p>

                {/* Bottom decorative bar */}
                <div className="mt-auto pt-10">
                  <div className="w-8 h-1 bg-slate-100 group-hover:w-full group-hover:bg-purple-600 transition-all duration-700 rounded-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};