
import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';

interface StepDetail {
  title: string;
  description: string;
  longDesc: string;
  imageUrl: string;
  tag: string;
}

const BRAND_ASSET = "https://gwzvtrikxkudostserwe.supabase.co/storage/v1/object/public/linea/202241%20-%20Copy.jpg";

const GET_STEP_DETAILS = (lang: 'en' | 'sq'): Record<string, StepDetail> => ({
  '01': {
    title: lang === 'en' ? 'Free 3D Scan' : 'Skanimi 3D Falas',
    description: lang === 'en' ? 'Come by our clinic in Peja for a quick digital scan.' : 'Ejani në klinikën tonë në Pejë për një skanim digjital të shpejtë.',
    longDesc: lang === 'en'
      ? "We take a detailed 3D scan of your teeth right in the chair — no gooey molds, no mess. It takes about 5 minutes, and you'll see the scan on screen right after."
      : 'Bëjmë një skanim 3D të detajuar të dhëmbëve tuaj direkt në karrige — pa llum, pa siklet. Zgjat rreth 5 minuta, dhe e shihni skanimin në ekran menjëherë pas.',
    imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1200',
    tag: lang === 'en' ? 'Clinical Visit' : 'Vizita Klinike'
  },
  '02': {
    title: lang === 'en' ? 'See Your New Smile First' : 'Shihni Buzëqeshjen e Re Para',
    description: lang === 'en' ? 'We design your treatment plan and show you the simulation.' : 'Dizajnojmë planin tuaj të trajtimit dhe ju tregojmë simulimin.',
    longDesc: lang === 'en'
      ? "Dr. Fatbardha Mustafa and Genis Nallbani map out exactly how your teeth will move, step by step. Before you decide on anything, you'll see a simulation of what your finished smile will look like."
      : 'Dr. Fatbardha Mustafa dhe Genis Nallbani planifikojnë saktësisht se si do të lëvizin dhëmbët tuaj, hap pas hapi. Para se të vendosni për diçka, do ta shihni simulimin e buzëqeshjes suaj përfundimtare.',
    imageUrl: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=1200',
    tag: lang === 'en' ? 'Your Plan' : 'Plani Juaj'
  },
  '03': {
    title: lang === 'en' ? 'Get Your Aligners, Start Smiling' : 'Merrni Aligner-at, Filloni të Buzëqeshni',
    description: lang === 'en' ? 'Receive your custom aligners and start your treatment.' : 'Merrni aligner-at tuaj të personalizuar dhe filloni trajtimin.',
    longDesc: lang === 'en'
      ? "You'll get your full series of custom-made aligners in one box, each one numbered and ready to go. Wear each set for 1-2 weeks, and we're always a WhatsApp message away if you have questions."
      : 'Merrni serinë tuaj të plotë të aligner-ave të personalizuar në një kuti, secili i numëruar dhe gati për t\'u vendosur. Mbajeni çdo set për 1-2 javë, dhe jemi gjithmonë një mesazh larg në WhatsApp nëse keni pyetje.',
    imageUrl: BRAND_ASSET,
    tag: lang === 'en' ? 'Your Aligners' : 'Aligner-at Tuaj'
  }
});

export const Process: React.FC<{ onStartPlanner: () => void; onBookScan?: () => void; language: 'en' | 'sq' }> = ({ onStartPlanner, onBookScan, language }) => {
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const content = TRANSLATIONS[language].process;
  const stepDetails = GET_STEP_DETAILS(language);

  const closeModal = () => setActiveStep(null);

  return (
    <section id="how-it-works" className="py-32 bg-[#193D6D] text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#4169E1]/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-24 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 border border-white/20 text-[#87CEEB] font-black text-[10px] uppercase tracking-[0.3em]">
            {content.tag}
          </div>
          <h3 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
            {content.title1} <br />
            <span className="text-white/40 italic">{content.title2}</span>
          </h3>
          <p className="text-lg text-white/70 font-normal">
            {content.desc}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-[4.5rem] left-0 w-full h-px bg-white/10 -z-0"></div>
          
          {content.items.map((step, idx) => (
            <button 
              key={idx} 
              onClick={() => setActiveStep(step.number)}
              className="group relative z-10 text-center space-y-8 p-10 rounded-3xl transition-all hover:bg-white/5 border border-transparent hover:border-white/10 outline-none"
            >
              <div className="w-20 h-20 bg-white text-[#193D6D] rounded-[30px] flex items-center justify-center text-3xl font-black mx-auto shadow-2xl ring-8 ring-white/5 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                {step.number}
              </div>
              <div className="space-y-4">
                <h4 className="text-xl font-bold tracking-tight group-hover:text-[#4169E1] transition-colors text-white">
                  {step.title}
                </h4>
                <p className="text-white/60 leading-relaxed font-normal text-sm group-hover:text-white/90 transition-colors">
                  {step.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-32 flex flex-col items-center gap-16">
          <div className="w-px h-24 bg-gradient-to-b from-white/0 via-white/20 to-white/0"></div>
          
          <div className="bg-[#142A4D] backdrop-blur-xl border border-white/10 p-12 md:p-16 rounded-[2.5rem] max-w-4xl w-full text-center space-y-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#4169E1]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            
            <div className="relative z-10 space-y-6">
              <h4 className="text-3xl font-black text-white tracking-tight">{content.ctaTitle}</h4>
              <p className="text-white/70 max-w-xl mx-auto font-normal leading-relaxed">
                {content.ctaDesc}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
                <button 
                  onClick={onBookScan}
                  className="inline-flex items-center justify-center gap-3 bg-[#4169E1] text-white px-12 py-5 rounded-full font-black text-lg hover:bg-[#5A8DFF] transition-all shadow-2xl hover:-translate-y-1 active:scale-95"
                >
                  <span>{content.ctaBtn1}</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>
                <button 
                  onClick={onStartPlanner}
                  className="inline-flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white px-12 py-5 rounded-full font-black text-lg transition-all border border-white/20 backdrop-blur-md"
                >
                  <span>{content.ctaBtn2}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeStep && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" onClick={closeModal}></div>
          <div className="relative bg-[#193D6D] w-full max-w-6xl rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col lg:flex-row animate-scale-in border border-white/10">
            <div className="lg:w-1/2 relative min-h-[300px] lg:min-h-full overflow-hidden">
              <img src={stepDetails[activeStep].imageUrl} loading="lazy" className="absolute inset-0 w-full h-full object-cover" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#193D6D]/90 via-transparent to-transparent"></div>
              <div className="absolute bottom-10 left-10">
                <div className="bg-[#4169E1] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] w-fit mb-4">
                  {stepDetails[activeStep].tag}
                </div>
                <h5 className="text-4xl font-black text-white tracking-tighter">Step {activeStep}</h5>
              </div>
            </div>
            <div className="lg:w-1/2 p-12 md:p-16 lg:p-24 flex flex-col">
              <button onClick={closeModal} className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#4169E1] transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="space-y-8">
                <h4 className="text-5xl font-black text-white tracking-tighter leading-none">{stepDetails[activeStep].title}</h4>
                <p className="text-lg text-white/80 font-normal leading-relaxed">{stepDetails[activeStep].description}</p>
                <div className="w-16 h-1 bg-[#4169E1] rounded-full"></div>
                <p className="text-white/60 leading-relaxed font-normal text-[15px]">{stepDetails[activeStep].longDesc}</p>
              </div>
              <div className="mt-auto pt-16">
                <button 
                  onClick={() => { onBookScan?.(); closeModal(); }}
                  className="bg-[#4169E1] text-white px-10 py-4 rounded-full font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 hover:bg-[#5A8DFF] shadow-xl"
                >
                  {language === 'en' ? 'Book via WhatsApp' : 'Rezervo përmes WhatsApp'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
