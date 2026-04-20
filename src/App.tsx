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
import { DoctorPortal } from './components/DoctorPortal';
import { AdminPortal } from './components/AdminPortal';
import { Auth } from './components/Auth';
import { ProductSpotlight } from './components/ProductSpotlight';
import { VideoShowcase } from './components/VideoShowcase';
import { CinematicStory } from './components/CinematicStory';
import { TransformationGallery } from './components/TransformationGallery';
import { VideoModal } from './components/VideoModal';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { 
  TRANSLATIONS, 
  WHATSAPP_URL, 
  GOOGLE_CALENDAR_URL,
  SCAN_VIDEO_URL
} from './constants';

export { WHATSAPP_URL, GOOGLE_CALENDAR_URL };

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'planner' | 'portal' | 'admin'>('home');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'doctor' | 'patient' | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [language, setLanguage] = useState<'en' | 'sq'>('en');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const content = TRANSLATIONS[language];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch user profile to check role
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserRole(data.role as 'doctor' | 'patient');
        }

        if (user.email === 'nallbanigeno@gmail.com') {
          setIsAdmin(true);
        } else {
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          const adminExists = adminDoc.exists();
          setIsAdmin(adminExists);
        }
      } else {
        setUserRole(null);
        setIsAdmin(false);
      }
    });
    return unsubscribe;
  }, []);

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
    window.open(WHATSAPP_URL, '_blank');
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUserRole(null);
    setIsAdmin(false);
    setView('home');
  };

  if (view === 'portal' && !currentUser) {
    return <Auth />;
  }

  if (view === 'portal' && userRole === 'doctor') {
    return <DoctorPortal currentUser={currentUser} />;
  }

  if (view === 'admin' && isAdmin) {
    return <AdminPortal onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-[#4169E1] selection:text-white bg-[#193D6D] text-[#F5F7FA]">
      <header role="banner">
        <Navbar 
          setView={setView} 
          view={view} 
          onBookClick={() => window.open(WHATSAPP_URL, '_blank')} 
          onPortalClick={openPortal}
          language={language}
          setLanguage={setLanguage}
          isAdmin={isAdmin}
          onAdminClick={() => setView('admin')}
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
            
            <section className="bg-[#193D6D] py-24 border-y-4 border-white/10 relative overflow-hidden" aria-label="Statistics">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-16 text-center items-center">
                  {[
                    { val: '500+', label: language === 'en' ? 'Happy Patients' : 'Pacientë të Lumtur' },
                    { val: '99%', label: language === 'en' ? 'Clinical Success' : 'Sukses Klinik' },
                    { val: '12', label: language === 'en' ? 'Tech Platforms' : 'Platforma Teknol.' },
                    { val: '0%', label: language === 'en' ? 'Finance Interest' : 'Interes Financiar' }
                  ].map((stat, i) => (
                    <div key={i} className="space-y-4 group">
                      <p className="text-7xl md:text-8xl font-black text-white tracking-tighter group-hover:text-[#4169E1] transition-colors duration-500">
                        {stat.val}
                      </p>
                      <p className="text-[12px] font-black text-[#87CEEB] uppercase tracking-[0.3em] font-bold">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <Features language={language} />
            
            <CinematicStory language={language} onPlayVideo={() => setIsVideoModalOpen(true)} videoUrl={SCAN_VIDEO_URL} />

            <Process 
              onStartPlanner={startDigitalAssessment} 
              onBookScan={handleBookScan} 
              language={language}
            />

            <ProductSpotlight language={language} />

            <VideoShowcase language={language} />

            <ImageGenerator language={language} />

            <TransformationGallery language={language} />

            <section id="pricing" className="py-40 bg-[#142A4D] relative" aria-labelledby="pricing-heading">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-24 items-start">
                  <div className="lg:w-1/2 space-y-10 lg:sticky lg:top-32">
                    <div className="space-y-4">
                       <h2 className="text-[#87CEEB] font-black uppercase tracking-[0.25em] text-[12px]">{content.pricing.tag}</h2>
                       <h3 id="pricing-heading" className="text-6xl md:text-8xl font-black text-white leading-[1] tracking-tighter">
                          {content.pricing.title1} <br /> {content.pricing.title2}
                       </h3>
                    </div>
                    <p className="text-2xl text-white/90 leading-relaxed font-bold">
                      {content.pricing.desc}
                    </p>
                    <div className="grid grid-cols-2 gap-8 pt-6">
                      {content.pricing.perks.map((item, i) => (
                        <div key={i} className="flex items-center gap-4 text-white font-black text-base">
                          <div className="w-7 h-7 rounded-full bg-[#4169E1] flex items-center justify-center text-white flex-shrink-0 shadow-lg" aria-hidden="true">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                          </div>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:w-1/2 w-full">
                    <div className="relative group">
                      <div className="absolute -inset-10 bg-[#4169E1]/10 blur-[100px] opacity-20 -z-10 rounded-full group-hover:opacity-30 transition-opacity"></div>
                      
                      <div className="bg-[#193D6D] rounded-[60px] p-12 lg:p-16 shadow-[0_50px_100px_rgba(0,0,0,0.3)] border-4 border-white/10 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-14">
                          <div>
                            <p className="text-white font-black uppercase tracking-widest text-[12px] mb-3 opacity-60">{content.pricing.cardTag}</p>
                            <h4 className="text-4xl font-black text-white tracking-tight">{content.pricing.cardTitle}</h4>
                          </div>
                          <div className="bg-[#4169E1] text-white px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl">
                            {content.pricing.cardBadge}
                          </div>
                        </div>

                        <div className="space-y-8 mb-14">
                          {content.pricing.details.map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-5 border-b-2 border-white/5 text-lg">
                              <span className="text-white/70 font-bold">{item.label}</span>
                              <span className="font-black text-white">{item.val}</span>
                            </div>
                          ))}
                        </div>

                        <button 
                          onClick={handleBookScan}
                          className="w-full bg-[#4169E1] text-white font-black py-7 rounded-[30px] transition-all shadow-2xl shadow-blue-900/40 transform hover:-translate-y-1 active:scale-95 text-xl tracking-widest uppercase focus:outline-none focus:ring-4 focus:ring-blue-500/20"
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

            <section className="py-32 bg-[#193D6D]" aria-labelledby="cta-heading">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-[#142A4D] rounded-[100px] p-20 md:p-32 text-center text-white relative overflow-hidden group border-4 border-white/10 shadow-[0_60px_120px_rgba(0,0,0,0.5)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#4169E1]/40 to-[#193D6D]/0"></div>
                  <div className="relative z-10 space-y-14">
                    <h2 id="cta-heading" className="text-6xl md:text-9xl font-black leading-[0.8] tracking-tighter">
                      {language === 'en' ? 'Your evolution' : 'Evolucioni juaj'} <br /> {language === 'en' ? 'starts here.' : 'fillon këtu.'}
                    </h2>
                    <p className="text-2xl md:text-3xl text-white/80 max-w-3xl mx-auto font-bold leading-relaxed">
                      {language === 'en' ? 'Join the smile revolution at Medident Dental Clinic.' : 'Bashkohuni me revolucionin e buzëqeshjes në Medident Dental Clinic.'}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-8 pt-6">
                      <button 
                        onClick={handleBookScan}
                        className="bg-[#4169E1] text-white px-16 py-7 rounded-full font-black text-2xl hover:bg-[#5A8DFF] transition-all shadow-2xl hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-500"
                      >
                        {language === 'en' ? 'Book Now' : 'Rezervo Tani'}
                      </button>
                      <a 
                        href={WHATSAPP_URL} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="border-4 border-white/20 text-white px-16 py-7 rounded-full font-black text-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-4 group focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <span>{language === 'en' ? 'WhatsApp' : 'WhatsApp'}</span>
                        <div className="w-3.5 h-3.5 rounded-full bg-[#87CEEB] animate-pulse shadow-[0_0_15px_rgba(135,206,235,0.5)]" aria-hidden="true"></div>
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
        ) : view === 'admin' ? (
           <AdminPortal onLogout={handleLogout} />
        ) : (
          <PatientPortal 
            currentUser={currentUser}
            onBack={() => setView('home')}
            language={language}
          />
        )}
      </main>
      <Footer language={language} />
      <AIAssistant language={language} />
      <VideoModal 
        isOpen={isVideoModalOpen} 
        onClose={() => setIsVideoModalOpen(false)} 
        videoUrl={SCAN_VIDEO_URL} 
      />
    </div>
  );
};

export default App;
