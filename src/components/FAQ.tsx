import React, { useState } from 'react';
import { FAQS_CONTENT } from '../constants';

export const FAQSection: React.FC<{ language: 'en' | 'sq' }> = ({ language }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const faqs = FAQS_CONTENT[language];

  return (
    <section id="faq" className="py-24 bg-[#142A4D]" aria-labelledby="faq-heading">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <h2 id="faq-heading" className="text-[#87CEEB] font-bold uppercase tracking-wider text-sm">
            {language === 'en' ? 'Common Questions' : 'Pyetjet e Shpeshta'}
          </h2>
          <h3 className="text-4xl font-black text-white tracking-tight">
            {language === 'en' ? 'Frequently Asked Questions' : 'Pyetjet që ju interesojnë'}
          </h3>
        </div>

        <div className="space-y-4" role="tablist">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="bg-[#193D6D] rounded-2xl border border-white/5 overflow-hidden transition-all shadow-xl hover:border-[#4169E1]/30"
            >
              <button
                id={`faq-trigger-${idx}`}
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full px-8 py-6 text-left flex justify-between items-center group focus:outline-none focus:ring-2 focus:ring-[#4169E1] focus:ring-inset"
                aria-expanded={openIdx === idx}
                aria-controls={`faq-content-${idx}`}
                role="tab"
              >
                <span className="text-lg font-bold text-white group-hover:text-[#4169E1] transition-colors">
                  {faq.question}
                </span>
                <span className={`transform transition-transform duration-300 ${openIdx === idx ? 'rotate-180' : ''}`} aria-hidden="true">
                  <svg className="w-6 h-6 text-[#4169E1]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </span>
              </button>
              <div 
                id={`faq-content-${idx}`}
                role="tabpanel"
                aria-labelledby={`faq-trigger-${idx}`}
                hidden={openIdx !== idx}
                className={`px-8 pb-8 text-white/70 leading-relaxed font-medium ${openIdx === idx ? 'animate-fade-in' : ''}`}
              >
                {faq.answer}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};