
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Process } from './components/Process';
import { FAQSection } from './components/FAQ';
import { Footer } from './components/Footer';
import { AIAssistant } from './components/AIAssistant';
import { Testimonials } from './components/Testimonials';
import { TreatmentPlanner } from './components/TreatmentPlanner';

// Placeholder for the brand's Google Calendar booking link
const GOOGLE_CALENDAR_URL = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2eP6uFm-7rY-M8Nn4R-JqXvY-M8Nn4R-JqXvY-M8Nn4R-JqXv';

const CinematicStory: React.FC = () => {
  return (
    <section id="cinematic-story" className="py-32 bg-slate-950 overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=2000" 
          className="w-full h-full object-cover opacity-30 scale-105"
          alt="Clinic atmosphere"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="flex flex-col lg:flex-row gap-20 items-center">
          <div className="lg:w-5/12 space-y-10">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 font-bold text-[10px] uppercase tracking-[0.3em]">
              Precision Lab
            </div>
            <h2 className="text-6xl md:text-7xl font-black text-white leading-none tracking-tighter">
              The Art of <br />
              <span className="text-purple-500">Alignment.</span>
            </h2>
            <p className="text-xl text-slate-400 font-medium leading-relaxed">
              Step inside our digital workshop where every millimeter is calculated for perfection. Our cinematic approach to orthodontics ensures you're part of the process from day one.
            </p>
            
            <div className="space-y-6 pt-6">
              {[
                { title: 'Digital Precision', desc: '0.2mm incremental movement mapping' },
                { title: 'Human Artistry', desc: 'Hand-finished by expert technicians' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-500 flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{item.title}</h4>
                    <p className="text-slate-500 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:w-7/12 w-full relative group">
            <div className="aspect-[16/9] bg-slate-900 rounded-[50px] overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.15)] border border-white/10 relative">
              <img 
                src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=1200" 
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000"
                alt="3D Dental Scanning"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-500 relative">
                  <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-20"></div>
                  <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-purple-600 border-b-[12px] border-b-transparent ml-2"></div>
                </button>
              </div>

              <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Featured Story</p>
                  <p className="text-lg font-bold text-white">How Meident is changing smiles</p>
                </div>
                <div className="flex gap-2">
                   <div className="w-1 h-1 rounded-full bg-white animate-pulse"></div>
                   <div className="w-1 h-1 rounded-full bg-white animate-pulse delay-75"></div>
                   <div className="w-1 h-1 rounded-full bg-white animate-pulse delay-150"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const TransformationGallery: React.FC = () => {
  return (
    <section className="py-32 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-24 items-center mb-24">
           <div className="space-y-6">
              <h2 className="text-purple-600 font-black uppercase tracking-[0.25em] text-[10px]">The Transformation</h2>
              <h3 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">Real results, <br /> real patients.</h3>
              <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-lg">
                Witness the clarity and precision of our treatments through professional clinical documentation and lifestyle results.
              </p>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="aspect-[4/5] rounded-[40px] overflow-hidden bg-slate-100 shadow-xl group">
                 <img src="https://images.unsplash.com/photo-1593054941142-554116035118?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" alt="Clinic Detail" />
              </div>
              <div className="aspect-[4/5] rounded-[40px] overflow-hidden bg-slate-100 shadow-xl mt-12 group">
                 <img src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Smiley Patient" />
              </div>
           </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { img: 'https://images.unsplash.com/photo-1516195851888-6f1a981a862e?auto=format&fit=crop&q=80&w=800', title: 'Clinical Precision', tag: 'Lab' },
            { img: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&q=80&w=800', title: 'Invisible Tech', tag: 'Detail' },
            { img: 'https://images.unsplash.com/photo-1559839734-2b71f153673f?auto=format&fit=crop&q=80&w=800', title: 'Expert Guidance', tag: 'Meident' }
          ].map((item, i) => (
            <div key={i} className="group relative aspect-square rounded-[50px] overflow-hidden bg-slate-100 shadow-lg">
              <img src={item.img} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={item.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-8 left-8 text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-500 opacity-0 group-hover:opacity-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">{item.tag}</span>
                <h4 className="text-xl font-bold">{item.title}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'planner'>('home');

  useEffect(() => {
    if (view === 'home' && window.location.hash) {
      const id = window.location.hash.substring(1);
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [view]);

  // Handler for the AI Digital Planner
  const startDigitalAssessment = () => {
    setView('planner');
    window.scrollTo(0, 0);
  };

  // Centralized handler for Booking a Scan via Google Calendar
  const handleBookScan = () => {
    window.open(GOOGLE_CALENDAR_URL, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-purple-100 selection:text-purple-700">
      <Navbar setView={setView} view={view} onBookClick={handleBookScan} />
      
      <main className="flex-grow">
        {view === 'home' ? (
          <>
            <Hero onStartPlanner={startDigitalAssessment} onBookScan={handleBookScan} />
            
            {/* Elegant Statistics Section */}
            <section className="bg-white py-24 border-y border-slate-50 relative overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-16 text-center items-center">
                  {[
                    { val: '500+', label: 'Happy Patients' },
                    { val: '99%', label: 'Clinical Success' },
                    { val: '12', label: 'Tech Platforms' },
                    { val: '0%', label: 'Finance Interest' }
                  ].map((stat, i) => (
                    <div key={i} className="space-y-3 group">
                      <p className="text-7xl font-black text-slate-900 tracking-tighter group-hover:text-purple-600 transition-colors duration-500">
                        {stat.val.replace(/[0-9]/g, '') === '' ? stat.val : <>{stat.val.slice(0,-1)}<span className="text-purple-600">{stat.val.slice(-1)}</span></>}
                      </p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <Features />
            
            <CinematicStory />

            <Process onStartPlanner={startDigitalAssessment} onBookScan={handleBookScan} />

            <TransformationGallery />

            {/* Pricing Section - Restructured for Elegance */}
            <section id="pricing" className="py-40 bg-slate-50 relative">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-24 items-start">
                  <div className="lg:w-1/2 space-y-10 lg:sticky lg:top-32">
                    <div className="space-y-4">
                       <h2 className="text-purple-600 font-black uppercase tracking-[0.25em] text-[10px]">Transparent Value</h2>
                       <h3 className="text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter">Invest in <br /> your future self.</h3>
                    </div>
                    <p className="text-xl text-slate-500 leading-relaxed font-medium">
                      At Meident, we believe world-class orthodontic care should be accessible. Our clear pricing model removes any financial anxiety from your journey.
                    </p>
                    <div className="grid grid-cols-2 gap-8 pt-4">
                      {['In-Clinic Supervision', 'Digital Simulation', 'All Retainers', 'Flexible Payments'].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-slate-800 font-bold text-sm">
                          <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-white flex-shrink-0">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:w-1/2 w-full">
                    <div className="relative group">
                      <div className="absolute -inset-8 bg-purple-200 blur-[80px] opacity-20 -z-10 rounded-full group-hover:opacity-30 transition-opacity"></div>
                      
                      <div className="bg-white rounded-[60px] p-12 lg:p-16 shadow-[0_50px_100px_rgba(0,0,0,0.06)] border border-slate-100 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-12">
                          <div>
                            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mb-2">Financing</p>
                            <h4 className="text-3xl font-black text-slate-900 tracking-tight">Flexible Plans</h4>
                          </div>
                          <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
                            0% Interest
                          </div>
                        </div>

                        <div className="space-y-6 mb-12">
                          {[
                            { label: 'Treatment Time', val: '4 - 9 Months' },
                            { label: 'Initial Deposit', val: 'Minimal' },
                            { label: 'Support', val: '24/7 Digital + In-Clinic' },
                            { label: 'Retainers', val: 'Included' }
                          ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-4 border-b border-slate-50 text-sm">
                              <span className="text-slate-500 font-medium">{item.label}</span>
                              <span className="font-black text-slate-900">{item.val}</span>
                            </div>
                          ))}
                        </div>

                        <button 
                          onClick={handleBookScan}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-6 rounded-[25px] transition-all shadow-xl shadow-purple-100 transform hover:scale-[1.01] active:scale-95 text-lg"
                        >
                          Book via Google Calendar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <FAQSection />

            {/* Premium Final CTA */}
            <section className="py-32 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-slate-900 rounded-[100px] p-20 md:p-32 text-center text-white relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-800/30 to-slate-900/0"></div>
                  <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[150px] animate-pulse"></div>
                  
                  <div className="relative z-10 space-y-12">
                    <h2 className="text-6xl md:text-8xl font-black leading-[0.85] tracking-tighter">Your evolution <br /> starts here.</h2>
                    <p className="text-2xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
                      Join the smile revolution at Meident Dental Clinic. Expertly planned, virtually invisible.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-8 pt-4">
                      <button 
                        onClick={handleBookScan}
                        className="bg-white text-slate-900 px-16 py-6 rounded-full font-black text-xl hover:bg-purple-50 transition-all shadow-2xl hover:-translate-y-1"
                      >
                        Book via Google Calendar
                      </button>
                      <a 
                        href="https://wa.me/38349772307" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="border-2 border-white/20 px-16 py-6 rounded-full font-black text-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 group"
                      >
                        <span>WhatsApp Specialist</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <Testimonials />
          </>
        ) : (
          <TreatmentPlanner onBack={() => setView('home')} onBookScan={handleBookScan} />
        )}
      </main>
      <Footer />
      <AIAssistant />
    </div>
  );
};

export default App;
