import React, { useState, useEffect } from 'react';
import { Footer } from './components/Footer';
import { Landing } from './components/home/Landing';
const TreatmentPlanner = React.lazy(() => import('./components/TreatmentPlanner').then(m => ({ default: m.TreatmentPlanner })));
const AIAssistant = React.lazy(() => import('./components/AIAssistant').then(m => ({ default: m.AIAssistant })));
const UserPortal = React.lazy(() => import('./components/UserPortal').then(m => ({ default: m.UserPortal })));
const DoctorPortal = React.lazy(() => import('./components/DoctorPortal').then(m => ({ default: m.DoctorPortal })));
const AdminPortal = React.lazy(() => import('./components/AdminPortal').then(m => ({ default: m.AdminPortal })));
const Auth = React.lazy(() => import('./components/Auth').then(m => ({ default: m.Auth })));
const Lazy: React.FC<{ children: React.ReactNode }> = ({ children }) => <React.Suspense fallback={<div className="min-h-screen bg-[#06101F]" />}>{children}</React.Suspense>;
import { VideoModal } from './components/VideoModal';
import { auth, db } from './lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, LayoutGrid, UserCircle } from 'lucide-react';
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
  const [isAdminMode, setIsAdminMode] = useState(false);
  // Lets the admin explicitly view the patient portal instead of auto-landing in admin
  const [adminViewsPatient, setAdminViewsPatient] = useState(false);
  // Language: remember the user's manual choice; otherwise auto-detect the
  // browser language (Albanian browsers get SQ, everyone else EN).
  const [language, setLanguageState] = useState<'en' | 'sq'>(() => {
    try {
      const saved = localStorage.getItem('linea-lang');
      if (saved === 'en' || saved === 'sq') return saved;
      const nav = (navigator.language || '').toLowerCase();
      if (nav.startsWith('sq')) return 'sq';
    } catch { /* SSR / privacy mode */ }
    return 'en';
  });
  const setLanguage = (l: 'en' | 'sq') => {
    setLanguageState(l);
    try { localStorage.setItem('linea-lang', l); } catch { /* ignore */ }
  };
  const [authInitialStep, setAuthInitialStep] = useState<'login' | 'register'>('login');
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
          // Auto-enable admin mode if desired, or let user toggle
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

  const toggleAdminMode = () => {
    if (isAdmin) {
      if (view === 'admin') {
        setView('home');
      } else {
        setView('admin');
      }
    }
  };

  // Keep <html lang>, <title> and meta description in sync with the selected
  // language — improves accessibility and local SEO for Albanian searches.
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = language === 'en'
      ? 'Clear Aligners in Pejë, Kosovo | Linea Aligners — Invisible Teeth Straightening'
      : 'Aligner Transparentë në Pejë, Kosovë | Linea Aligners — Drejtimi i Dhëmbëve pa Tela';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', language === 'en'
        ? 'Clear aligners in Pejë, Kosovo — straighten your teeth without wires, planned in 3D. Free 3D scan, 0% interest, 4–9 months. Made in Kosovo.'
        : 'Aligner transparentë në Pejë, Kosovë — drejtimi i dhëmbëve pa tela, me plan 3D. Skanim 3D falas, 0% interes, 4–9 muaj. Bërë në Kosovë.');
    }
  }, [language]);

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

  const openPortal = (step: 'login' | 'register' = 'login') => {
    setAuthInitialStep(step);
    setView('portal');
    window.scrollTo(0, 0);
  };

  const handleBookScan = () => {
    // window.open can be blocked by popup blockers (especially in in-app browsers
    // like Instagram/TikTok). Fall back to same-tab navigation so the CTA never dies.
    const win = window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer');
    if (!win || win.closed) {
      window.location.href = WHATSAPP_URL;
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUserRole(null);
    setIsAdmin(false);
    setView('home');
  };

  if (view === 'portal' && !currentUser) {
    return <Lazy><Auth initialStep={authInitialStep} onBack={() => setView('home')} /></Lazy>;
  }

  if (view === 'admin' && isAdmin) {
    return <Lazy><AdminPortal onLogout={handleLogout} onSwitchToPatient={() => setView('portal')} /></Lazy>;
  }

  if (view === 'home') {
    return (
      <>
        <Landing lang={language} setLang={setLanguage} isAdmin={isAdmin} onAdmin={toggleAdminMode} onPlayVideo={() => setIsVideoModalOpen(true)} />
        <VideoModal isOpen={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} videoUrl={SCAN_VIDEO_URL} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-[#4169E1] selection:text-white bg-[#193D6D] text-[#F5F7FA]">
      {/* Site navbar only on the public homepage — portal & planner have their own top bars */}
      
      <main id="main-content" className="flex-grow" role="main"><Lazy>
        {view === 'planner' ? (
          <TreatmentPlanner onBack={() => setView('home')} onBookScan={handleBookScan} language={language} />
        ) : view === 'admin' ? (
           <AdminPortal onLogout={handleLogout} onSwitchToPatient={() => setView('portal')} />
        ) : isAdmin && !adminViewsPatient ? (
          <AdminPortal
            onLogout={handleLogout}
            onSwitchToPatient={() => setAdminViewsPatient(true)}
          />
        ) : userRole === 'doctor' ? (
          <DoctorPortal
            currentUser={currentUser}
            onBack={() => setView('home')}
            language={language}
          />
        ) : (
          <UserPortal
            currentUser={currentUser}
            onBack={() => { setAdminViewsPatient(false); setView('home'); }}
            language={language}
          />
        )}
      </Lazy></main>
      <Footer language={language} />
      <React.Suspense fallback={null}><AIAssistant language={language} /></React.Suspense>
      
      {/* Floating Admin Control Panel Trigger */}
      {isAdmin && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleAdminMode}
          className="fixed bottom-8 left-8 z-[100] bg-gradient-to-br from-[#FFD700] to-[#FF8C00] text-navy p-5 rounded-[22px] shadow-[0_15px_40px_rgba(255,215,0,0.4)] border-4 border-navy/20 group hover:shadow-[0_20px_50px_rgba(255,215,0,0.6)] transition-all"
          title="Toggle Admin Mode"
        >
          <div className="relative">
            <ShieldCheck className="w-8 h-8" />
            <motion.div 
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-white"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileHover={{ opacity: 1, x: 10 }}
            className="absolute left-full top-1/2 -translate-y-1/2 bg-navy text-[#FFD700] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] pointer-events-none whitespace-nowrap border border-[#FFD700]/30 shadow-2xl"
          >
            {view === 'admin' ? 'Exit Admin Mode' : 'Enter Admin Control'}
          </motion.div>
        </motion.button>
      )}

      <VideoModal 
        isOpen={isVideoModalOpen} 
        onClose={() => setIsVideoModalOpen(false)} 
        videoUrl={SCAN_VIDEO_URL} 
      />
    </div>
  );
};

export default App;
