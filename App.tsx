import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Process } from './components/Process';
import { FAQSection } from './components/FAQ';
import { Footer } from './components/Footer';
import { Testimonials } from './components/Testimonials';
import { TreatmentPlanner } from './components/TreatmentPlanner';
import { ImageGenerator } from './components/ImageGenerator';
import { AIAssistant } from './components/AIAssistant';
import { PatientPortal } from './components/PatientPortal';
import { TRANSLATIONS } from './constants';

export const GOOGLE_CALENDAR_URL = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2eP6uFm-7rY-M8Nn4R-JqXvY-M8Nn4R-JqXvY-M8Nn4R-JqXv';
export const BRAND_ASSET = "https://gwzvtrikxkudostserwe.supabase.co/storage/v1/object/public/linea/202241%20-%20Copy.jpg";
export const ICONIC_DESIGN_ASSET = "https://gwzvtrikxkudostserwe.supabase.co/storage/v1/object/public/linea/572628579_18084691715316830_1228185980579187523_n.jpg";
export const ALIGNMENT_ASSET = "https://gwzvtrikxkudostserwe.supabase.co/storage/v1/object/public/linea/sddefault.jpg";

const ProductSpotlight: React.FC<{ language: 'en' | 'sq' }> = ({ language }) => {
  const isEn = language === 'en';
  return (
    <section className="py-32 bg-purple-900 overflow-hidden relative">
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-20">
          <div className="lg:w-1/2">
            <div className="relative group">
              <div className="absolute -inset-10 bg-yellow-400/20 blur-[100px] rounded-full group-hover:bg-yellow-400/30 transition-all duration-1000"></div>
              <img 
                src={ICONIC_DESIGN_ASSET} 
                alt="Linea Aligner Iconic Design" 
                className="relative z-10 w-full max-w-lg mx-auto rounded-[80px] shadow-[0_50px_100px_rgba(0,0,0,0.3)] transform transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
          <div className="lg:w-1/2 space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-yellow-400 text-purple-900 font-black text-[10px] uppercase tracking-[0.3em]">
              {isEn ? 'Premium Accessory' : 'Aksesor Premium'}
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tighter">
              {isEn ? 'Iconic Design.' : 'Dizajn Ikonik.'}<br />
              <span className="text-yellow-400">{isEn ? 'Unmistakable.' : 'I pagabueshëm.'}</span>
            </h2>
            <p className="text-xl text-purple-100 font-medium leading-relaxed">
              {isEn 
                ? "Your journey to a perfect smile comes packaged in excellence. Our signature design is crafted to be as bold and beautiful as your new confidence."
                : "Rrugëtimi juaj drejt një buzëqeshjeje të përsosur vjen i paketuar në përsosmëri. Dizajni ynë karakteristik është i punuar të jetë po aq i guximshëm dhe i bukur sa vetëbesimi juaj i ri."}
            </p>
            <div className="pt-4">
              <div className="flex items-center gap-4 text-white font-bold">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-yellow-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <span>{isEn ? 'Shock-resistant Protection' : 'Mbrojtje kundër goditjeve'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const CinematicStory: React.FC<{ language: 'en' | 'sq' }> = ({ language }) => {
  const isEn = language === 'en';
  return (
    <section id="cinematic-story" className="py-32 bg-slate-950 overflow-hidden relative" aria-labelledby="story-heading">
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10"></div>
        <img 
          src={ALIGNMENT_ASSET} 
          className="w-full h-full object-cover opacity-20 scale-110 blur-sm"
          alt=""
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="flex flex-col lg:flex-row gap-20 items-center">
          <div className="lg:w-5/12 space-y-10">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 font-bold text-[10px] uppercase tracking-[0.3em]">
              {isEn ? 'Precision Lab' : 'Laboratori i Saktësisë'}
            </div>
            <h2 id="story-heading" className="text-6xl md:text-7xl font-black text-white leading-none tracking-tighter">
              {isEn ? 'The Art of' : 'Arti i'}<br />
              <span className="text-purple-500">{isEn ? 'Alignment.' : 'Rreshtimit.'}</span>
            </h2>
            <p className="text-xl text-slate-400 font-medium leading-relaxed">
              {isEn 
                ? "Step inside our digital workshop where every millimeter is calculated for perfection. Our orthodontic expertise ensures you're part of the process from day one." 
                : "Hyni brenda punishtes sonë digjitale ku çdo milimetër llogaritet për përsosmëri. Ekspertiza jonë ortodontike siguron që ju të jeni pjesë e procesit që nga dita e parë."}
            </p>
            
            <div className="space-y-6 pt-6">
              {[
                { title: isEn ? 'Digital Precision' : 'Saktësi Digjitale', desc: isEn ? '0.2mm incremental movement mapping' : 'Mapimi i lëvizjeve prej 0.2mm' },
                { title: isEn ? 'Human Artistry' : 'Artizanat Njerëzor', desc: isEn ? 'Hand-finished by expert technicians' : 'Përfunduar me dorë nga teknikët ekspertë' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-500 flex-shrink-0" aria-hidden="true">
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
                src={ALIGNMENT_ASSET} 
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000"
                alt="3D Dental Scanning technology at Meident"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <button 
                  className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-500 relative focus:outline-none focus:ring-4 focus:ring-purple-500"
                  aria-label="Play clinic overview video"
                >
                  <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-20"></div>
                  <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-purple-600 border-b-[12px] border-b-transparent ml-2" aria-hidden="true"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const TransformationGallery: React.FC<{ language: 'en' | 'sq' }> = ({ language }) => {
  const isEn = language === 'en';
  return (
    <section className="py-32 bg-white relative overflow-hidden" aria-labelledby="gallery-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-24 items-center mb-24">
           <div className="space-y-6">
              <h2 className="text-purple-700 font-black uppercase tracking-[0.25em] text-[10px]">{isEn ? 'The Transformation' : 'Transformimi'}</h2>
              <h3 id="gallery-heading" className="text-6xl font-black text-slate-900 tracking-tighter leading-none">
                {isEn ? 'Real results,' : 'Rezultate reale,'} <br /> {isEn ? 'real patients.' : 'pacientë realë.'}
              </h3>
              <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-lg">
                {isEn 
                  ? "Witness the clarity and precision of our treatments through clinical documentation and lifestyle results."
                  : "Dëshmoni qartësinë dhe saktësinë e trajtimeve tona përmes dokumentacionit klinik dhe rezultateve të stilit të jetesës."}
              </p>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="aspect-[4/5] rounded-[40px] overflow-hidden bg-slate-100 shadow-xl group border border-slate-100">
                 <img 
                    src={BRAND_ASSET} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" 
                    alt="Close up of clear aligner detail" 
                 />
              </div>
              <div className="aspect-[4/5] rounded-[40px] overflow-hidden bg-slate-100 shadow-xl mt-12 group border border-slate-100">
                 <img 
                    src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&q=80&w=800" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                    alt="Happy patient with perfect smile" 
                 />
              </div>
           </div>
        </div>
      </div>
    </section>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'planner' | 'portal'>('home');
  const [language, setLanguage] = useState<'en' | 'sq'>('en');
  const content = TRANSLATIONS[language];

  useEffect(() => {
    if (view === 'home' && window.location.hash) {
      const id = window.location.hash.substring(1);
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [view]);

  const startDigitalAssessment = () => {
    setView('planner');
    window.scrollTo(0, 0);
  };

  const openPortal = () => {
    setView('portal');
    window.scrollTo(0, 0);
  };

  const handleBookScan = () => {
    window.open(GOOGLE_CALENDAR_URL, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-purple-100 selection:text-purple-700">
      <header role="banner">
        <Navbar 
          setView={setView} 
          view={view} 
          onBookClick={handleBookScan} 
          onPortalClick={openPortal}
          language={language}
          setLanguage={setLanguage}
        />
      </header>
      
      <main id="main-content" className="flex-grow" role="main">
        {view === 'home' ? (
          <>
            <Hero 
              onStartPlanner={startDigitalAssessment} 
              onBookScan={handleBookScan} 
              language={language}
            />
            
            <section className="bg-white py-24 border-y border-slate-50 relative overflow-hidden" aria-label="Statistics">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-16 text-center items-center">
                  {[
                    { val: '500+', label: language === 'en' ? 'Happy Patients' : 'Pacientë të Lumtur' },
                    { val: '99%', label: language === 'en' ? 'Clinical Success' : 'Sukses Klinik' },
                    { val: '12', label: language === 'en' ? 'Tech Platforms' : 'Platforma Teknol.' },
                    { val: '0%', label: language === 'en' ? 'Finance Interest' : 'Interes Financiar' }
                  ].map((stat, i) => (
                    <div key={i} className="space-y-3 group">
                      <p className="text-7xl font-black text-slate-900 tracking-tighter group-hover:text-purple-700 transition-colors duration-500">
                        {stat.val}
                      </p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <Features language={language} />
            
            <CinematicStory language={language} />

            <Process 
              onStartPlanner={startDigitalAssessment} 
              onBookScan={handleBookScan} 
              language={language}
            />

            <ProductSpotlight language={language} />

            <ImageGenerator language={language} />

            <TransformationGallery language={language} />

            <section id="pricing" className="py-40 bg-slate-50 relative" aria-labelledby="pricing-heading">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-24 items-start">
                  <div className="lg:w-1/2 space-y-10 lg:sticky lg:top-32">
                    <div className="space-y-4">
                       <h2 className="text-purple-700 font-black uppercase tracking-[0.25em] text-[10px]">{content.pricing.tag}</h2>
                       <h3 id="pricing-heading" className="text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter">
                          {content.pricing.title1} <br /> {content.pricing.title2}
                       </h3>
                    </div>
                    <p className="text-xl text-slate-500 leading-relaxed font-medium">
                      {content.pricing.desc}
                    </p>
                    <div className="grid grid-cols-2 gap-8 pt-4">
                      {content.pricing.perks.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-slate-800 font-bold text-sm">
                          <div className="w-5 h-5 rounded-full bg-purple-700 flex items-center justify-center text-white flex-shrink-0" aria-hidden="true">
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
                            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mb-2">{content.pricing.cardTag}</p>
                            <h4 className="text-3xl font-black text-slate-900 tracking-tight">{content.pricing.cardTitle}</h4>
                          </div>
                          <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {content.pricing.cardBadge}
                          </div>
                        </div>

                        <div className="space-y-6 mb-12">
                          {content.pricing.details.map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-4 border-b border-slate-50 text-sm">
                              <span className="text-slate-500 font-medium">{item.label}</span>
                              <span className="font-black text-slate-900">{item.val}</span>
                            </div>
                          ))}
                        </div>

                        <button 
                          onClick={handleBookScan}
                          className="w-full bg-purple-gradient text-white font-black py-6 rounded-[25px] transition-all shadow-xl shadow-purple-200 transform hover:scale-[1.01] active:scale-95 text-lg focus:outline-none focus:ring-4 focus:ring-purple-200"
                          aria-label="Book a free 3D scan appointment"
                        >
                          {content.pricing.btn}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <FAQSection language={language} />

            <section className="py-32 bg-white" aria-labelledby="cta-heading">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-slate-900 rounded-[100px] p-20 md:p-32 text-center text-white relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-800/30 to-slate-900/0"></div>
                  <div className="relative z-10 space-y-12">
                    <h2 id="cta-heading" className="text-6xl md:text-8xl font-black leading-[0.85] tracking-tighter">
                      {language === 'en' ? 'Your evolution' : 'Evolucioni juaj'} <br /> {language === 'en' ? 'starts here.' : 'fillon këtu.'}
                    </h2>
                    <p className="text-2xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
                      {language === 'en' ? 'Join the smile revolution at Meident Dental Clinic.' : 'Bashkohuni me revolucionin e buzëqeshjes në Meident Dental Clinic.'}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-8 pt-4">
                      <button 
                        onClick={handleBookScan}
                        className="bg-white text-slate-900 px-16 py-6 rounded-full font-black text-xl hover:bg-purple-50 transition-all shadow-2xl hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-purple-500"
                      >
                        {language === 'en' ? 'Book via Google Calendar' : 'Rezervo përmes Kalendarit'}
                      </button>
                      <a 
                        href="https://wa.me/38349772307" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="border-2 border-purple-500/50 text-purple-100 px-16 py-6 rounded-full font-black text-xl hover:bg-purple-500/10 transition-all flex items-center justify-center gap-3 group focus:outline-none focus:ring-2 focus:ring-white"
                      >
                        <span>{language === 'en' ? 'WhatsApp Specialist' : 'Specialisti në WhatsApp'}</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true"></div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <Testimonials language={language} />
          </>
        ) : view === 'planner' ? (
          <TreatmentPlanner onBack={() => setView('home')} onBookScan={handleBookScan} language={language} />
        ) : (
          <PatientPortal onBack={() => setView('home')} language={language} />
        )}
      </main>
      <Footer language={language} />
      <AIAssistant language={language} />
    </div>
  );
};

export default App;