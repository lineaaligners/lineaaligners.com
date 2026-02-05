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

// High quality stock medical/dental tech videos
const TECH_VIDEO_URL = "https://player.vimeo.com/external/494252666.hd.mp4?s=2f5c2512183615591b85821774136f4a59513333&profile_id=175";
const SCAN_VIDEO_URL = "https://player.vimeo.com/external/370331493.hd.mp4?s=383077a00aa7c2202b4db499b1397379ef3e5066&profile_id=175";

const ProductSpotlight: React.FC<{ language: 'en' | 'sq' }> = ({ language }) => {
  const isEn = language === 'en';
  return (
    <section className="py-32 bg-slate-950 overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-20">
          <div className="lg:w-1/2">
            <div className="relative group">
              <div className="absolute -inset-10 bg-yellow-400/10 blur-[120px] rounded-full group-hover:bg-yellow-400/20 transition-all duration-1000"></div>
              <img 
                src={ICONIC_DESIGN_ASSET} 
                alt="Linea Aligner Iconic Design" 
                className="relative z-10 w-full max-w-lg mx-auto rounded-[80px] shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-4 border-white/5 transform transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
          <div className="lg:w-1/2 space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-yellow-400 text-slate-950 font-black text-[11px] uppercase tracking-[0.3em]">
              {isEn ? 'Premium Accessory' : 'Aksesor Premium'}
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tighter">
              {isEn ? 'Iconic Design.' : 'Dizajn Ikonik.'}<br />
              <span className="text-yellow-400">{isEn ? 'Unmistakable.' : 'I pagabueshëm.'}</span>
            </h2>
            <p className="text-2xl text-white leading-relaxed font-bold opacity-90">
              {isEn 
                ? "Your journey to a perfect smile comes packaged in excellence. Our signature design is crafted to be as bold and beautiful as your new confidence."
                : "Rrugëtimi juaj drejt një buzëqeshjeje të përsosur vjen i paketuar në përsosmëri. Dizajni ynë karakteristik është i punuar të jetë po aq i guximshëm dhe i bukur sa vetëbesimi juaj i ri."}
            </p>
            <div className="pt-4">
              <div className="flex items-center gap-5 text-white font-black text-lg">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-yellow-400 shadow-xl">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
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

const VideoShowcase: React.FC<{ language: 'en' | 'sq' }> = ({ language }) => {
  const isEn = language === 'en';
  return (
    <section className="py-32 bg-white overflow-hidden relative" aria-labelledby="video-showcase-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-10 order-2 lg:order-1">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-purple-100 text-purple-700 font-black text-[11px] uppercase tracking-[0.3em]">
              {isEn ? 'Precision in Motion' : 'Saktësia në Lëvizje'}
            </div>
            <h2 id="video-showcase-heading" className="text-6xl md:text-8xl font-black text-slate-950 tracking-tighter leading-none">
              {isEn ? 'Digital' : 'Dizajni'} <br /> 
              <span className="text-purple-600">{isEn ? 'Mastery.' : 'Digjital.'}</span>
            </h2>
            <p className="text-2xl text-slate-700 font-bold leading-relaxed max-w-lg">
              {isEn 
                ? "Watch as our advanced 3D algorithms map out your perfect alignment. We combine artificial intelligence with human expertise to craft every single set."
                : "Shikoni se si algoritmet tona të avancuara 3D hartojnë rreshtimin tuaj të përsosur. Ne kombinojmë inteligjencën artificiale me ekspertizën njerëzore."}
            </p>
            <div className="flex gap-8 items-center pt-4">
               <div className="flex flex-col">
                  <span className="text-4xl font-black text-slate-950 tracking-tighter">0.2mm</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isEn ? 'Accuracy' : 'Saktësia'}</span>
               </div>
               <div className="w-px h-12 bg-slate-200"></div>
               <div className="flex flex-col">
                  <span className="text-4xl font-black text-slate-950 tracking-tighter">100%</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isEn ? 'Digital' : 'Digjitale'}</span>
               </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="relative aspect-[4/5] rounded-[80px] overflow-hidden shadow-[0_50px_100px_rgba(109,40,217,0.2)] border-[12px] border-slate-50">
              <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="w-full h-full object-cover grayscale-[0.5] hover:grayscale-0 transition-all duration-1000"
              >
                <source src={TECH_VIDEO_URL} type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-purple-950/40 via-transparent to-transparent"></div>
              <div className="absolute bottom-10 left-10 flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-purple-400 animate-ping"></div>
                 <span className="text-white font-black text-xs uppercase tracking-[0.2em]">{isEn ? 'Real-time Simulation' : 'Simulim në Kohë Reale'}</span>
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
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover opacity-20 scale-110 blur-sm"
        >
          <source src={SCAN_VIDEO_URL} type="video/mp4" />
        </video>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="flex flex-col lg:flex-row gap-20 items-center">
          <div className="lg:w-5/12 space-y-10">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border-2 border-purple-500/50 bg-purple-900/40 text-purple-300 font-black text-[11px] uppercase tracking-[0.3em]">
              {isEn ? 'Precision Lab' : 'Laboratori i Saktësisë'}
            </div>
            <h2 id="story-heading" className="text-6xl md:text-8xl font-black text-white leading-none tracking-tighter">
              {isEn ? 'The Art of' : 'Arti i'}<br />
              <span className="text-purple-500">{isEn ? 'Alignment.' : 'Rreshtimit.'}</span>
            </h2>
            <p className="text-2xl text-slate-100 font-bold leading-relaxed">
              {isEn 
                ? "Step inside our digital workshop where every millimeter is calculated for perfection. Our orthodontic expertise ensures you're part of the process from day one." 
                : "Hyni brenda punishtes sonë digjitale ku çdo milimetër llogaritet për përsosmëri. Ekspertiza jonë ortodontike siguron që ju të jeni pjesë e procesit që nga dita e parë."}
            </p>
            
            <div className="space-y-6 pt-6">
              {[
                { title: isEn ? 'Digital Precision' : 'Saktësi Digjitale', desc: isEn ? '0.2mm incremental movement mapping' : 'Mapimi i lëvizjeve prej 0.2mm' },
                { title: isEn ? 'Human Artistry' : 'Artizanat Njerëzor', desc: isEn ? 'Hand-finished by expert technicians' : 'Përfunduar me dorë nga teknikët ekspertë' }
              ].map((item, i) => (
                <div key={i} className="flex gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center text-purple-400 flex-shrink-0 shadow-2xl" aria-hidden="true">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <h4 className="text-white font-black text-lg">{item.title}</h4>
                    <p className="text-slate-300 font-bold text-base">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:w-7/12 w-full relative group">
            <div className="aspect-[16/9] bg-slate-900 rounded-[50px] overflow-hidden shadow-[0_40px_100px_rgba(109,40,217,0.3)] border-4 border-white/10 relative">
              <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-1000"
              >
                <source src={SCAN_VIDEO_URL} type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <button 
                  className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.3)] transform group-hover:scale-110 transition-all duration-500 relative focus:outline-none focus:ring-4 focus:ring-purple-500"
                  aria-label="Play clinic overview video"
                >
                  <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-30"></div>
                  <div className="w-0 h-0 border-t-[14px] border-t-transparent border-l-[24px] border-l-slate-950 border-b-[14px] border-b-transparent ml-2" aria-hidden="true"></div>
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
              <h2 className="text-purple-900 font-black uppercase tracking-[0.25em] text-[12px]">{isEn ? 'The Transformation' : 'Transformimi'}</h2>
              <h3 id="gallery-heading" className="text-6xl md:text-8xl font-black text-slate-950 tracking-tighter leading-none">
                {isEn ? 'Real results,' : 'Rezultate reale,'} <br /> {isEn ? 'real patients.' : 'pacientë realë.'}
              </h3>
              <p className="text-2xl text-slate-900 font-bold leading-relaxed max-w-lg">
                {isEn 
                  ? "Witness the clarity and precision of our treatments through clinical documentation and lifestyle results."
                  : "Dëshmoni qartësinë dhe saktësinë e trajtimeve tona përmes dokumentacionit klinik dhe rezultateve të stilit të jetesës."}
              </p>
           </div>
           <div className="grid grid-cols-2 gap-6">
              <div className="aspect-[4/5] rounded-[50px] overflow-hidden bg-slate-100 shadow-2xl group border-4 border-slate-950/5">
                 <img 
                    src={BRAND_ASSET} 
                    className="w-full h-full object-cover group-hover:grayscale-0 grayscale-0 transition-all duration-1000" 
                    alt="Close up of clear aligner detail" 
                 />
              </div>
              <div className="aspect-[4/5] rounded-[50px] overflow-hidden bg-slate-100 shadow-2xl mt-16 group border-4 border-slate-950/5">
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
    <div className="min-h-screen flex flex-col selection:bg-purple-900 selection:text-white">
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
            
            <section className="bg-white py-24 border-y-4 border-slate-950 relative overflow-hidden" aria-label="Statistics">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-16 text-center items-center">
                  {[
                    { val: '500+', label: language === 'en' ? 'Happy Patients' : 'Pacientë të Lumtur' },
                    { val: '99%', label: language === 'en' ? 'Clinical Success' : 'Sukses Klinik' },
                    { val: '12', label: language === 'en' ? 'Tech Platforms' : 'Platforma Teknol.' },
                    { val: '0%', label: language === 'en' ? 'Finance Interest' : 'Interes Financiar' }
                  ].map((stat, i) => (
                    <div key={i} className="space-y-4 group">
                      <p className="text-7xl md:text-8xl font-black text-slate-950 tracking-tighter group-hover:text-purple-900 transition-colors duration-500">
                        {stat.val}
                      </p>
                      <p className="text-[12px] font-black text-slate-950 uppercase tracking-[0.3em] font-bold">{stat.label}</p>
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

            <VideoShowcase language={language} />

            <ImageGenerator language={language} />

            <TransformationGallery language={language} />

            <section id="pricing" className="py-40 bg-slate-50 relative" aria-labelledby="pricing-heading">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-24 items-start">
                  <div className="lg:w-1/2 space-y-10 lg:sticky lg:top-32">
                    <div className="space-y-4">
                       <h2 className="text-purple-900 font-black uppercase tracking-[0.25em] text-[12px]">{content.pricing.tag}</h2>
                       <h3 id="pricing-heading" className="text-6xl md:text-8xl font-black text-slate-950 leading-[1] tracking-tighter">
                          {content.pricing.title1} <br /> {content.pricing.title2}
                       </h3>
                    </div>
                    <p className="text-2xl text-slate-950 leading-relaxed font-bold">
                      {content.pricing.desc}
                    </p>
                    <div className="grid grid-cols-2 gap-8 pt-6">
                      {content.pricing.perks.map((item, i) => (
                        <div key={i} className="flex items-center gap-4 text-slate-950 font-black text-base">
                          <div className="w-7 h-7 rounded-full bg-slate-950 flex items-center justify-center text-white flex-shrink-0 shadow-lg" aria-hidden="true">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                          </div>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:w-1/2 w-full">
                    <div className="relative group">
                      <div className="absolute -inset-10 bg-purple-900/10 blur-[100px] opacity-20 -z-10 rounded-full group-hover:opacity-30 transition-opacity"></div>
                      
                      <div className="bg-white rounded-[60px] p-12 lg:p-16 shadow-[0_50px_100px_rgba(0,0,0,0.1)] border-4 border-slate-950 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-14">
                          <div>
                            <p className="text-slate-950 font-black uppercase tracking-widest text-[12px] mb-3 opacity-60">{content.pricing.cardTag}</p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tight">{content.pricing.cardTitle}</h4>
                          </div>
                          <div className="bg-slate-950 text-white px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl">
                            {content.pricing.cardBadge}
                          </div>
                        </div>

                        <div className="space-y-8 mb-14">
                          {content.pricing.details.map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-5 border-b-2 border-slate-100 text-lg">
                              <span className="text-slate-950 font-bold opacity-70">{item.label}</span>
                              <span className="font-black text-slate-950">{item.val}</span>
                            </div>
                          ))}
                        </div>

                        <button 
                          onClick={handleBookScan}
                          className="w-full bg-slate-950 text-white font-black py-7 rounded-[30px] transition-all shadow-2xl shadow-slate-900/40 transform hover:-translate-y-1 active:scale-95 text-xl tracking-widest uppercase focus:outline-none focus:ring-4 focus:ring-purple-900/20"
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
                <div className="bg-slate-950 rounded-[100px] p-20 md:p-32 text-center text-white relative overflow-hidden group border-4 border-white/5 shadow-[0_60px_120px_rgba(0,0,0,0.5)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-slate-950/0"></div>
                  <div className="relative z-10 space-y-14">
                    <h2 id="cta-heading" className="text-6xl md:text-9xl font-black leading-[0.8] tracking-tighter">
                      {language === 'en' ? 'Your evolution' : 'Evolucioni juaj'} <br /> {language === 'en' ? 'starts here.' : 'fillon këtu.'}
                    </h2>
                    <p className="text-2xl md:text-3xl text-slate-200 max-w-3xl mx-auto font-bold leading-relaxed">
                      {language === 'en' ? 'Join the smile revolution at Meident Dental Clinic.' : 'Bashkohuni me revolucionin e buzëqeshjes në Meident Dental Clinic.'}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-8 pt-6">
                      <button 
                        onClick={handleBookScan}
                        className="bg-white text-slate-950 px-16 py-7 rounded-full font-black text-2xl hover:bg-slate-100 transition-all shadow-2xl hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-purple-500"
                      >
                        {language === 'en' ? 'Book Now' : 'Rezervo Tani'}
                      </button>
                      <a 
                        href="https://wa.me/38349772307" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="border-4 border-white text-white px-16 py-7 rounded-full font-black text-2xl hover:bg-white hover:text-slate-950 transition-all flex items-center justify-center gap-4 group focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <span>{language === 'en' ? 'WhatsApp' : 'WhatsApp'}</span>
                        <div className="w-3.5 h-3.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_15px_rgba(74,222,128,0.5)]" aria-hidden="true"></div>
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