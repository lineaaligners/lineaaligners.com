import React, { useState } from 'react';
import { FAQS_CONTENT } from '../constants';

export const FAQSection: React.FC<{ language: 'en' | 'sq' }> = ({ language }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const faqs = FAQS_CONTENT[language];

  return (
    <section id="faq" className="py-24 bg-slate-50" aria-labelledby="faq-heading">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <h2 id="faq-heading" className="text-purple-700 font-bold uppercase tracking-wider text-sm">
            {language === 'en' ? 'Common Questions' : 'Pyetjet e Shpeshta'}
          </h2>
          <h3 className="text-4xl font-bold text-slate-900">
            {language === 'en' ? 'Frequently Asked Questions' : 'Pyetjet që ju interesojnë'}
          </h3>
        </div>

        <div className="space-y-4" role="tablist">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all shadow-sm hover:shadow-md"
            >
              <button
                id={`faq-trigger-${idx}`}
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full px-8 py-6 text-left flex justify-between items-center group focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset"
                aria-expanded={openIdx === idx}
                aria-controls={`faq-content-${idx}`}
                role="tab"
              >
                <span className="text-lg font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
                  {faq.question}
                </span>
                <span className={`transform transition-transform duration-300 ${openIdx === idx ? 'rotate-180' : ''}`} aria-hidden="true">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </span>
              </button>
              <div 
                id={`faq-content-${idx}`}
                role="tabpanel"
                aria-labelledby={`faq-trigger-${idx}`}
                hidden={openIdx !== idx}
                className={`px-8 pb-8 text-slate-600 leading-relaxed ${openIdx === idx ? 'animate-fade-in' : ''}`}
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