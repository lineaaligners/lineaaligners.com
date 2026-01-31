
import React from 'react';
import { TESTIMONIALS } from '../constants';

export const Testimonials: React.FC = () => {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-purple-600 font-bold uppercase tracking-wider text-sm">Success Stories</h2>
          <h3 className="text-4xl font-bold text-slate-900">What our patients say</h3>
          <p className="text-lg text-slate-600">
            Real transformations from real people in Kosovo who chose Linea Aligners.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <div 
              key={idx} 
              className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-purple-100 hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="flex gap-1 text-yellow-400">
                  {[...Array(t.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="text-slate-700 italic leading-relaxed text-sm">
                  "{t.text}"
                </p>
              </div>
              <div className="mt-8 flex items-center gap-4">
                <img 
                  src={t.image} 
                  alt={t.name} 
                  className="w-16 h-16 rounded-full border-2 border-purple-200 object-cover shadow-sm"
                  loading="lazy"
                  width="64"
                  height="64"
                  decoding="async"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                  <p className="text-xs text-slate-500 font-medium">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
