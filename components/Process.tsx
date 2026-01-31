
import React, { useState } from 'react';
import { STEPS } from '../constants';

interface StepDetail {
  title: string;
  description: string;
  longDesc: string;
  imageUrl: string;
  tag: string;
}

const STEP_DETAILS: Record<string, StepDetail> = {
  '01': {
    title: 'Free 3D Scan',
    description: 'Visit our clinic in Peja for a state-of-the-art digital scan.',
    longDesc: 'Our iTero Element scanning technology captures 6,000 frames per second, creating a high-resolution 3D map of your teeth in under 5 minutes. No messy molds, just digital precision at Meident Dental Clinic.',
    imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1200',
    tag: 'Clinical Phase'
  },
  '02': {
    title: 'Personalized Plan',
    description: 'Our expert orthodontists design your perfect smile.',
    longDesc: 'Using advanced AI-driven software, Dr. Fatbardha Mustafa and Genis Nallbani map out every tooth movement. You will see a cinematic 4D simulation of your transformation before the first aligner is even printed.',
    imageUrl: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=1200',
    tag: 'Design Phase'
  },
  '03': {
    title: 'Start Your Journey',
    description: 'Receive your custom aligners and start your transformation.',
    longDesc: 'Receive your series of custom-engineered clear aligners. Wear each set for about 1-2 weeks. Track your progress digitally with our remote monitoring app, ensuring you are never alone on your way to perfection.',
    imageUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=1200',
    tag: 'Lifestyle Phase'
  }
};

export const Process: React.FC<{ onStartPlanner: () => void; onBookScan?: () => void }> = ({ onStartPlanner, onBookScan }) => {
  const [activeStep, setActiveStep] = useState<string | null>(null);

  const closeModal = () => setActiveStep(null);

  return (
    <section id="how-it-works" className="py-32 bg-purple-gradient text-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-400/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-24 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 border border-white/20 text-purple-200 font-black text-[10px] uppercase tracking-[0.3em]">
            Step by Step
          </div>
          <h3 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
            The Path to <br />
            <span className="text-white/40 italic">Perfection.</span>
          </h3>
          <p className="text-xl text-purple-100/70 font-medium">
            Discover the seamless fusion of technology and clinical expertise at Linea Aligners.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line for desktop */}
          <div className="hidden md:block absolute top-[4.5rem] left-0 w-full h-px bg-white/10 -z-0"></div>
          
          {STEPS.map((step, idx) => (
            <button 
              key={idx} 
              onClick={() => setActiveStep(step.number)}
              className="group relative z-10 text-center space-y-8 p-10 rounded-[50px] transition-all hover:bg-white/5 border border-transparent hover:border-white/10 outline-none"
            >
              <div className="w-20 h-20 bg-white text-purple-700 rounded-[30px] flex items-center justify-center text-3xl font-black mx-auto shadow-2xl ring-8 ring-white/5 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                {step.number}
              </div>
              <div className="space-y-4">
                <h4 className="text-2xl font-black tracking-tight group-hover:text-purple-300 transition-colors">
                  {step.title}
                </h4>
                <p className="text-purple-100/60 leading-relaxed font-medium text-sm group-hover:text-purple-50 transition-colors">
                  {step.description}
                </p>
              </div>
              <div className="pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 border-b border-purple-300/30 pb-1">Explore Details</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-32 flex flex-col items-center gap-16">
          <div className="w-px h-24 bg-gradient-to-b from-white/0 via-white/40 to-white/0"></div>
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-12 md:p-16 rounded-[80px] max-w-4xl w-full text-center space-y-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            
            <div className="relative z-10 space-y-6">
              <h4 className="text-3xl font-black text-white tracking-tight">Ready for your digital twin?</h4>
              <p className="text-purple-100/70 max-w-xl mx-auto font-medium leading-relaxed">
                Take the first step toward your new smile. Book a session via Google Calendar or start your AI assessment.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
                <button 
                  onClick={onBookScan}
                  className="inline-flex items-center justify-center gap-3 bg-white text-purple-900 px-12 py-5 rounded-full font-black text-lg hover:bg-purple-50 transition-all shadow-2xl hover:-translate-y-1 active:scale-95"
                >
                  <span>Google Calendar Booking</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>
                <button 
                  onClick={onStartPlanner}
                  className="inline-flex items-center justify-center gap-3 bg-purple-500/20 hover:bg-purple-500/40 text-white px-12 py-5 rounded-full font-black text-lg transition-all border border-white/20 backdrop-blur-md"
                >
                  <span>AI Digital Assessment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Modal / Expanded View Overlay */}
      {activeStep && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl" onClick={closeModal}></div>
          <div className="relative bg-white w-full max-w-6xl rounded-[60px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col lg:flex-row animate-scale-in">
            {/* Image Section */}
            <div className="lg:w-1/2 relative min-h-[300px] lg:min-h-full overflow-hidden">
              <img 
                src={STEP_DETAILS[activeStep].imageUrl} 
                className="absolute inset-0 w-full h-full object-cover" 
                alt={STEP_DETAILS[activeStep].title} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-10 left-10">
                <div className="bg-purple-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] w-fit mb-4">
                  {STEP_DETAILS[activeStep].tag}
                </div>
                <h5 className="text-4xl font-black text-white tracking-tighter">Step {activeStep}</h5>
              </div>
            </div>

            {/* Content Section */}
            <div className="lg:w-1/2 p-12 md:p-16 lg:p-24 flex flex-col">
              <button 
                onClick={closeModal}
                className="absolute top-8 right-8 w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-purple-600 hover:text-white transition-all group"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="space-y-8">
                <h4 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
                  {STEP_DETAILS[activeStep].title}
                </h4>
                <p className="text-xl text-slate-500 font-medium leading-relaxed">
                  {STEP_DETAILS[activeStep].description}
                </p>
                <div className="w-16 h-1 bg-purple-600 rounded-full"></div>
                <p className="text-slate-600 leading-relaxed">
                  {STEP_DETAILS[activeStep].longDesc}
                </p>
              </div>

              <div className="mt-auto pt-16 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => { onBookScan ? onBookScan() : window.open('https://calendar.google.com', '_blank'); closeModal(); }}
                  className="bg-slate-900 text-white px-10 py-4 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
                >
                  Book via Google Calendar
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
                <button 
                  onClick={closeModal}
                  className="border-2 border-slate-100 text-slate-400 px-10 py-4 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
