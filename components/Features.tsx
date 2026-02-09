
import React from 'react';
import { TRANSLATIONS } from '../constants';

const FeatureIcon: React.FC<{ type: string }> = ({ type }) => {
  const baseClass = "w-8 h-8 text-purple-600";
  
  switch (type) {
    case 'invisible':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

export const Features: React.FC<{ language: 'en' | 'sq' }> = ({ language }) => {
  const content = TRANSLATIONS[language].features;

  return (
    <section id="benefits" className="py-32 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-purple-50 rounded-full blur-[120px] opacity-40 -z-10"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] opacity-40 -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          <div className="space-y-6">
            <h2 className="text-purple-600 font-black uppercase tracking-[0.25em] text-[12px]">{content.tag}</h2>
            <h3 className="text-5xl md:text-6xl lg:text-8xl font-black text-slate-900 leading-[1] tracking-tighter">
              {content.title}
            </h3>
          </div>
          <div className="lg:border-l-4 lg:border-slate-950 lg:pl-16">
            <p className="text-2xl text-slate-700 font-bold leading-relaxed max-w-xl">
              {content.desc}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {content.items.map((feature, idx) => {
            return (
              <div 
                key={idx}
                className="relative p-10 rounded-[60px] border-4 border-slate-950 bg-white text-slate-950 transition-all duration-700 group overflow-hidden flex flex-col h-full shadow-xl hover:shadow-purple-500/20"
              >
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-20 h-20 rounded-[28px] bg-slate-100 flex items-center justify-center mb-10 transform group-hover:rotate-12 transition-all duration-500 text-purple-600">
                    <FeatureIcon type={feature.icon} />
                  </div>

                  <h4 className="text-3xl font-black mb-5 tracking-tight text-slate-950">
                    {feature.title}
                  </h4>
                  
                  <p className="leading-relaxed font-bold text-base text-slate-700 opacity-80">
                    {feature.description}
                  </p>

                  <div className="mt-auto pt-10">
                    <div className="w-12 h-2 rounded-full transition-all duration-700 bg-slate-200 group-hover:bg-purple-600 group-hover:w-full"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
