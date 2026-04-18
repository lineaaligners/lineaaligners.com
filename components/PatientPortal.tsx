
import React, { useState, useEffect } from 'react';
import { WHATSAPP_URL } from '../constants';

type PortalMode = 'login' | 'signup' | 'forgot';

interface Milestone {
  label: string;
  week: number;
}

interface Phase {
  id: number;
  name: string;
  weeks: [number, number];
  desc: string;
  icon: string;
  milestones: Milestone[];
}

interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  currentWeek: number;
  isVerified: boolean;
}

const PERSONALIZED_PLAN_URL = "https://webviewer2.archform.com/?name=Leart_Tredhaku&data=eyJtb2RlIjoiQWR2YW5jZWQiLCJkb3dubG9hZFVybCI6ImFIUjBjSE02THk5aGNtTm9abTl5YlMxM1pXSXRjMmhoY21WaFlteGxMbk16TFdGalkyVnSaWEpoZEdVdVlXMWhlbTl1WVhkekxtTnZiUzkzWldJdGRtbGxkMlZ5TDNWekxXVmhjM1F0TWpvNVpUVmlNMlV6T1MwMlpHSmlMV015WWpndE1qZ3paQzB3WlRNd1lqRTRNemc0Tmpndk16aFJZek5IY2pCMVVuZDVOVGhuYjFGQmVWUlJRMlU0YlhkMkwzTmxkSFZ3WDJacGJHVXZNemhSWXpOS1FXOVVaRXR4VjBaRFVVaHhkM2d6WWxoSFNuZDZMbnBwY0E9PSJ9";

export const PatientPortal: React.FC<{ onBack: () => void; language: 'en' | 'sq' }> = ({ onBack, language }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mode, setMode] = useState<PortalMode>('login');
  const [loading, setLoading] = useState(false);
  const [idInput, setIdInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [habits, setHabits] = useState<{id: number, done: boolean}[]>([
    { id: 0, done: false },
    { id: 1, done: true },
    { id: 2, done: false }
  ]);
  
  const isEn = language === 'en';

  useEffect(() => {
    const savedSession = localStorage.getItem('linea_active_session');
    if (savedSession) {
      try {
        const user = JSON.parse(savedSession);
        setCurrentUser(user);
      } catch (e) {
        localStorage.removeItem('linea_active_session');
      }
    }
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return isEn ? "Good Morning" : "Mirëmëngjes";
    if (hour < 18) return isEn ? "Good Afternoon" : "Mirdita";
    return isEn ? "Good Evening" : "Mirmbrëma";
  };

  const toggleHabit = (id: number) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, done: !h.done } : h));
  };

  const getStoredUsers = (): User[] => {
    const users = localStorage.getItem('linea_users');
    return users ? JSON.parse(users) : [];
  };

  const saveUser = (user: User) => {
    const users = getStoredUsers();
    const existingIndex = users.findIndex(u => u.id.toLowerCase() === user.id.toLowerCase() || u.email.toLowerCase() === user.email.toLowerCase());
    if (existingIndex > -1) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem('linea_users', JSON.stringify(users));
  };

  const handleLogout = () => {
    localStorage.removeItem('linea_active_session');
    setCurrentUser(null);
  };

  const phases: Phase[] = [
    { 
      id: 1, 
      name: isEn ? "Phase 1: Expansion" : "Faza 1: Zgjerimi", 
      weeks: [1, 8], 
      desc: isEn ? "Correcting crowding and expanding the arch." : "Korrigjimi i dendësisë dhe zgjerimi i harkut.",
      icon: "📐",
      milestones: [
        { label: isEn ? "Initial Alignment" : "Rreshtimi Fillestar", week: 2 },
        { label: isEn ? "Arch Expansion" : "Zgjerimi i Harkut", week: 5 },
        { label: isEn ? "Crowding Relief" : "Lirimi i Dendësisë", week: 8 },
      ]
    },
    { 
      id: 2, 
      name: isEn ? "Phase 2: Alignment" : "Faza 2: Rreshtimi", 
      weeks: [9, 16], 
      desc: isEn ? "Active vertical and horizontal alignment." : "Rreshtimi aktiv vertikal dhe horizontal.",
      icon: "✨",
      milestones: [
        { label: isEn ? "Midline Correction" : "Korrigjimi i Mesit", week: 10 },
        { label: isEn ? "Rotation Fix" : "Rregullimi i Rrotullimit", week: 13 },
        { label: isEn ? "Vertical Leveling" : "Nivelimi Vertikal", week: 16 },
      ]
    },
    { 
      id: 3, 
      name: isEn ? "Phase 3: Occlusion" : "Faza 3: Okluzioni", 
      weeks: [17, 24], 
      desc: isEn ? "Perfecting the bite and stabilization." : "Përsosja e kafshimit dhe stabilizimi.",
      icon: "🦷",
      milestones: [
        { label: isEn ? "Bite Closure" : "Mbyllja e Kafshimit", week: 19 },
        { label: isEn ? "Final Detailing" : "Detajimi Final", week: 22 },
        { label: isEn ? "Result Stabilization" : "Stabilizimi i Rezultatit", week: 24 },
      ]
    }
  ];

  const totalWeeks = 24;
  const currentWeek = currentUser?.currentWeek || 1;
  const progress = (currentWeek / totalWeeks) * 100;
  const currentPhase = phases.find(p => currentWeek >= p.weeks[0] && currentWeek <= p.weeks[1]) || phases[0];

  const handleSignup = () => {
    if (!idInput.trim()) {
      setValidationError(isEn ? "Username/ID is required." : "Përdoruesi/ID është i kërkuar.");
      return;
    }
    if (!nameInput.trim()) {
      setValidationError(isEn ? "Full Name is required." : "Emri i plotë është i kërkuar.");
      return;
    }
    if (!emailInput.trim()) {
      setValidationError(isEn ? "Email is required." : "Email-i është i kërkuar.");
      return;
    }
    if (passwordInput.length < 6) {
      setValidationError(isEn ? "Password must be at least 6 characters." : "Fjalëkalimi duhet të jetë së paku 6 karaktere.");
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setValidationError(isEn ? "Passwords do not match." : "Fjalëkalimet nuk përputhen.");
      return;
    }

    const users = getStoredUsers();
    if (users.some(u => u.id.toLowerCase() === idInput.toLowerCase() || u.email.toLowerCase() === emailInput.toLowerCase())) {
      setValidationError(isEn ? "User already exists with this ID or Email." : "Përdoruesi ekziston me këtë ID ose Email.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const newUser: User = {
        id: idInput,
        fullName: nameInput,
        email: emailInput,
        passwordHash: passwordInput,
        currentWeek: 1,
        isVerified: true 
      };
      saveUser(newUser);
      localStorage.setItem('linea_active_session', JSON.stringify(newUser));
      setCurrentUser(newUser);
      setLoading(false);
    }, 1500);
  };

  const handleLogin = () => {
    const users = getStoredUsers();
    const user = users.find(u => (u.id.toLowerCase() === idInput.toLowerCase() || u.email.toLowerCase() === idInput.toLowerCase()) && u.passwordHash === passwordInput);
    
    if (user) {
      setLoading(true);
      setTimeout(() => {
        setCurrentUser(user);
        localStorage.setItem('linea_active_session', JSON.stringify(user));
        setLoading(false);
      }, 1000);
    } else {
      setValidationError(isEn ? "Invalid credentials. Please check your username and password." : "Kredencialet e gabuara. Ju lutem kontrolloni emrin e përdoruesit dhe fjalëkalimin.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);
    if (mode === 'signup') handleSignup();
    else if (mode === 'login') handleLogin();
    else if (mode === 'forgot') {
      setLoading(true);
      setTimeout(() => {
        setSuccessMessage(isEn ? "Reset link sent to your email." : "Linku i rivendosjes u dërgua.");
        setMode('login');
        setLoading(false);
      }, 1200);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen pt-20 pb-12 bg-[#193D6D] relative overflow-hidden flex items-center justify-center px-4">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4169E1]/5 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#87CEEB]/5 rounded-full blur-[80px]"></div>
        
        <div className="max-w-md w-full relative z-10 animate-scale-in">
          <button onClick={onBack} className="mb-6 flex items-center gap-2 text-white/50 font-black hover:text-[#87CEEB] transition-all uppercase text-[10px] tracking-widest focus:outline-none group">
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            {isEn ? 'Back to Clinic' : 'Kthehu në Klinikë'}
          </button>
          
          <div className="bg-[#142A4D] rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] p-8 md:p-12 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#4169E1]"></div>
            
            <div className="text-center mb-10 pt-4">
              <h1 className="text-3xl font-black text-white tracking-tight mb-3 uppercase tracking-widest">
                {mode === 'login' && (isEn ? 'Patient Login' : 'Kyçja e Pacientit')}
                {mode === 'signup' && (isEn ? 'Register' : 'Regjistrimi')}
                {mode === 'forgot' && (isEn ? 'Reset Password' : 'Rivendos Fjalëkalimin')}
              </h1>
              <p className="text-white/60 font-medium text-sm leading-relaxed max-w-[280px] mx-auto">
                {mode === 'login' && (isEn ? 'Access your personalized 3D orthodontic roadmap.' : 'Hyni në rrugëtimin tuaj të personalizuar 3D.')}
                {mode === 'signup' && (isEn ? 'Join the smile revolution. Create your account.' : 'Bashkohuni me revolucionin. Krijoni llogarinë tuaj.')}
              </p>
            </div>

            {successMessage && <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-2xl text-center animate-fade-in">{successMessage}</div>}
            {validationError && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-2xl text-center animate-shake">{validationError}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {mode !== 'forgot' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">{isEn ? 'Username or ID' : 'Përdoruesi ose ID'}</label>
                  <input type="text" required value={idInput} onChange={(e) => setIdInput(e.target.value)} className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-5 py-4 text-sm font-black text-white outline-none focus:border-[#4169E1] transition-all placeholder:text-white/20" placeholder="e.g. Geno21" />
                </div>
              )}
              {mode === 'signup' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">{isEn ? 'Full Name' : 'Emri i Plotë'}</label>
                    <input type="text" required value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-5 py-4 text-sm font-black text-white outline-none focus:border-[#4169E1] transition-all placeholder:text-white/20" placeholder="e.g. Genis Nallbani" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">{isEn ? 'Email Address' : 'Adresa e Email-it'}</label>
                    <input type="email" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-5 py-4 text-sm font-black text-white outline-none focus:border-[#4169E1] transition-all placeholder:text-white/20" placeholder="your@email.com" />
                  </div>
                </>
              )}
              {(mode === 'login' || mode === 'signup') && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">{isEn ? 'Password' : 'Fjalëkalimi'}</label>
                  <input type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-5 py-4 text-sm font-black text-white outline-none focus:border-[#4169E1] transition-all" />
                </div>
              )}
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">{isEn ? 'Confirm Password' : 'Konfirmo Fjalëkalimin'}</label>
                  <input type="password" required value={confirmPasswordInput} onChange={(e) => setConfirmPasswordInput(e.target.value)} className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-5 py-4 text-sm font-black text-white outline-none focus:border-[#4169E1] transition-all" />
                </div>
              )}
              
              <button type="submit" disabled={loading} className="w-full bg-[#4169E1] text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-900/40 transition-all disabled:opacity-50 mt-4 uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95">
                {loading ? <div className="w-6 h-6 border-3 border-white border-t-transparent animate-spin rounded-full"></div> : (
                  <>
                    <span>{mode === 'login' ? (isEn ? 'Sign In' : 'Kyçu') : mode === 'signup' ? (isEn ? 'Create Account' : 'Krijo Llogarinë') : (isEn ? 'Confirm' : 'Konfirmo')}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 flex flex-col items-center gap-4 text-center pt-8 border-t border-white/5">
              {mode === 'login' ? (
                <>
                  <button onClick={() => { setMode('signup'); setValidationError(null); setSuccessMessage(null); }} className="text-[10px] font-black text-[#87CEEB] uppercase tracking-widest hover:text-white transition-colors">
                    {isEn ? 'New Patient? Register' : 'Pacient i ri? Regjistrohu'}
                  </button>
                  <button onClick={() => { setMode('forgot'); setValidationError(null); setSuccessMessage(null); }} className="text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-[#4169E1] transition-colors">
                    {isEn ? 'Forgot password?' : 'Harruat fjalëkalimin?'}
                  </button>
                </>
              ) : (
                <button onClick={() => { setMode('login'); setValidationError(null); setSuccessMessage(null); }} className="text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-[#4169E1] transition-colors">
                  {isEn ? 'Back to Login' : 'Kthehu te Kyçja'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#193D6D] animate-fade-in relative text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8 animate-stagger-1">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              {isEn ? 'Active Treatment' : 'Trajtim Aktiv'}
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-none">
              <span className="text-white/40 block text-2xl mb-2 font-bold">{getGreeting()},</span>
              {currentUser.fullName || currentUser.id}
            </h1>
          </div>
          <button 
            onClick={handleLogout} 
            className="group flex items-center gap-3 text-white/50 font-black text-xs hover:text-red-400 transition-all uppercase tracking-[0.2em] py-3 px-6 rounded-2xl border-2 border-white/10 hover:border-red-500/30 hover:bg-red-500/10 bg-white/5 shadow-sm"
          >
            <span>{isEn ? 'Log out' : 'Çkyçu'}</span>
            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-10 items-start">
          <div className="lg:col-span-2 space-y-10">
            <div className="bg-[#142A4D] rounded-[60px] p-10 md:p-14 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden relative group animate-stagger-2">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-10">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-[#87CEEB] uppercase tracking-[0.4em] bg-[#4169E1]/10 w-fit px-4 py-1.5 rounded-full border border-white/10">{isEn ? 'Current Phase' : 'Faza Aktuale'}</p>
                  <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">{currentPhase.name}</h3>
                  <p className="text-white/60 font-medium text-lg mt-2 max-w-sm">{currentPhase.desc}</p>
                </div>
                <div className="text-right flex items-end gap-3 md:flex-col md:items-end">
                   <div className="flex items-baseline gap-1">
                      <p className="text-8xl font-black text-[#4169E1] tracking-tighter leading-none">{Math.round(progress)}</p>
                      <span className="text-4xl font-black text-[#87CEEB] opacity-50">%</span>
                   </div>
                   <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{isEn ? 'Journey progress' : 'Përparimi i rrugëtimit'}</p>
                </div>
              </div>
              <div className="relative mb-24 px-2">
                <div className="h-8 bg-white/5 rounded-full overflow-hidden border-2 border-white/10 p-1 shadow-inner relative">
                  <div 
                    className="h-full bg-[#4169E1] rounded-full transition-all duration-[1.5s] relative shadow-lg" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="absolute -bottom-12 left-0 w-full flex justify-between px-3">
                   {[0, 6, 12, 18, 24].map(w => (
                     <div key={w} className="flex flex-col items-center">
                        <span className={`text-[11px] font-black transition-colors duration-500 ${currentWeek >= w ? 'text-[#87CEEB]' : 'text-white/20'} uppercase tracking-widest`}>
                          {isEn ? `Week ${w}` : `Java ${w}`}
                        </span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
            
            <div className="bg-[#111827] text-white rounded-[60px] p-10 md:p-16 flex flex-col md:flex-row justify-between items-center group overflow-hidden relative shadow-2xl border-4 border-white/5 animate-stagger-3">
              <div className="relative z-10 text-center md:text-left">
                <h4 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter leading-tight">{isEn ? 'Interactive' : 'Evolucioni'}<br/>{isEn ? 'Simulation.' : 'Interaktiv.'}</h4>
                <p className="text-white/60 text-lg font-bold max-w-sm mb-12 leading-relaxed opacity-80">
                  {isEn ? 'Experience the digital blueprint of your transformation.' : 'Përjetoni hartën digjitale të transformimit tuaj.'}
                </p>
                <a 
                  href={PERSONALIZED_PLAN_URL} 
                  target="_blank" 
                  className="inline-flex items-center gap-5 bg-white text-[#193D6D] px-14 py-7 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] hover:bg-[#87CEEB] transition-all shadow-xl"
                >
                  {isEn ? 'Launch Viewer' : 'Hap Shikuesin'}
                </a>
              </div>
            </div>
          </div>
          
          <div className="space-y-10 animate-stagger-2">
            <div className="bg-[#142A4D] rounded-[48px] p-10 shadow-2xl border border-white/5">
              <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-12 border-b border-white/5 pb-5">{isEn ? 'Next Clinic Visit' : 'Vizita e Ardhshme'}</h4>
              <p className="font-black text-3xl text-white leading-none mb-3">Nov 12, 14:00</p>
              <p className="text-sm text-white/50 font-black uppercase tracking-[0.15em] opacity-80 mb-8">Medident Dental Clinic</p>
              <button 
                onClick={() => window.open(WHATSAPP_URL, '_blank')}
                className="w-full py-6 bg-white/5 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-3xl hover:bg-[#4169E1] hover:text-white transition-all border border-white/5"
              >
                {isEn ? 'Request Change' : 'Ndrysho Orarin'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .animate-stagger-1 { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-stagger-2 { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both; }
        .animate-stagger-3 { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both; }
        @keyframes slide-up {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out infinite; animation-iteration-count: 2; }
      `}</style>
    </div>
  );
};
