
import React, { useState, useEffect } from 'react';
import { BRAND_ASSET } from '../App';

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

  // Persistence Logic: Auto-login
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
    const existingIndex = users.findIndex(u => u.id === user.id || u.email === user.email);
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
        isVerified: true // Set to true directly for prototype ease
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
        // Persist session
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
      <div className="min-h-screen pt-20 pb-12 bg-[#fafafa] relative overflow-hidden flex items-center justify-center px-4">
        {/* Animated background particles for login */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px]"></div>
        
        <div className="max-w-md w-full relative z-10 animate-scale-in">
          <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-400 font-black hover:text-purple-700 transition-all uppercase text-[10px] tracking-widest focus:outline-none group">
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            {isEn ? 'Back to Clinic' : 'Kthehu në Klinikë'}
          </button>
          
          <div className="bg-white rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] p-8 md:p-12 border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-purple-gradient"></div>
            
            <div className="text-center mb-10 pt-4">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3 uppercase tracking-widest">
                {mode === 'login' && (isEn ? 'Patient Login' : 'Kyçja e Pacientit')}
                {mode === 'signup' && (isEn ? 'Register' : 'Regjistrimi')}
                {mode === 'forgot' && (isEn ? 'Reset Password' : 'Rivendos Fjalëkalimin')}
              </h1>
              <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-[280px] mx-auto">
                {mode === 'login' && (isEn ? 'Access your personalized 3D orthodontic roadmap.' : 'Hyni në rrugëtimin tuaj të personalizuar 3D.')}
                {mode === 'signup' && (isEn ? 'Join the smile revolution. Create your account.' : 'Bashkohuni me revolucionin. Krijoni llogarinë tuaj.')}
              </p>
            </div>

            {successMessage && <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 text-xs font-bold rounded-2xl text-center animate-fade-in">{successMessage}</div>}
            {validationError && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-2xl text-center animate-shake">{validationError}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {mode !== 'forgot' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{isEn ? 'Username or ID' : 'Përdoruesi ose ID'}</label>
                  <input type="text" required value={idInput} onChange={(e) => setIdInput(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-purple-500 transition-all placeholder:text-slate-300" placeholder="e.g. Geno21" />
                </div>
              )}
              {mode === 'signup' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{isEn ? 'Full Name' : 'Emri i Plotë'}</label>
                    <input type="text" required value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-purple-500 transition-all" placeholder="e.g. Genis Nallbani" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{isEn ? 'Email Address' : 'Adresa e Email-it'}</label>
                    <input type="email" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-purple-500 transition-all" placeholder="your@email.com" />
                  </div>
                </>
              )}
              {(mode === 'login' || mode === 'signup') && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{isEn ? 'Password' : 'Fjalëkalimi'}</label>
                  <input type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-purple-500 transition-all" />
                </div>
              )}
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{isEn ? 'Confirm Password' : 'Konfirmo Fjalëkalimin'}</label>
                  <input type="password" required value={confirmPasswordInput} onChange={(e) => setConfirmPasswordInput(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-purple-500 transition-all" />
                </div>
              )}
              
              <button type="submit" disabled={loading} className="w-full bg-purple-gradient text-white font-black py-5 rounded-2xl shadow-xl shadow-purple-900/10 transition-all disabled:opacity-50 mt-4 uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95">
                {loading ? <div className="w-6 h-6 border-3 border-white border-t-transparent animate-spin rounded-full"></div> : (
                  <>
                    <span>{mode === 'login' ? (isEn ? 'Sign In' : 'Kyçu') : mode === 'signup' ? (isEn ? 'Create Account' : 'Krijo Llogarinë') : (isEn ? 'Confirm' : 'Konfirmo')}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 flex flex-col items-center gap-4 text-center pt-8 border-t border-slate-50">
              {mode === 'login' ? (
                <>
                  <button onClick={() => { setMode('signup'); setValidationError(null); setSuccessMessage(null); }} className="text-[10px] font-black text-purple-700 uppercase tracking-widest hover:text-purple-900 transition-colors">
                    {isEn ? 'New Patient? Register' : 'Pacient i ri? Regjistrohu'}
                  </button>
                  <button onClick={() => { setMode('forgot'); setValidationError(null); setSuccessMessage(null); }} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-purple-700 transition-colors">
                    {isEn ? 'Forgot password?' : 'Harruat fjalëkalimin?'}
                  </button>
                </>
              ) : (
                <button onClick={() => { setMode('login'); setValidationError(null); setSuccessMessage(null); }} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-purple-700 transition-colors">
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
    <div className="min-h-screen pt-24 pb-12 bg-[#fafafa] animate-fade-in relative">
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-purple-200/20 blur-[100px] rounded-full animate-float"></div>
        <div className="absolute -bottom-20 left-1/4 w-[600px] h-[600px] bg-indigo-100/30 blur-[120px] rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8 animate-stagger-1">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border border-green-100">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              {isEn ? 'Active Treatment' : 'Trajtim Aktiv'}
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none">
              <span className="text-slate-400 block text-2xl mb-2 font-bold">{getGreeting()},</span>
              {currentUser.fullName || currentUser.id}
            </h1>
          </div>
          <button 
            onClick={handleLogout} 
            className="group flex items-center gap-3 text-slate-400 font-black text-xs hover:text-red-500 transition-all uppercase tracking-[0.2em] py-3 px-6 rounded-2xl border-2 border-slate-100 hover:border-red-100 hover:bg-red-50 bg-white shadow-sm"
          >
            <span>{isEn ? 'Log out' : 'Çkyçu'}</span>
            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-10 items-start">
          <div className="lg:col-span-2 space-y-10">
            {/* Core Progress Card */}
            <div className="bg-white rounded-[60px] p-10 md:p-14 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden relative group animate-stagger-2">
              <div className="absolute top-0 right-0 w-80 h-80 bg-purple-50 rounded-full blur-[100px] -z-10 opacity-60 transition-transform group-hover:scale-110 duration-1000"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-10">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.4em] bg-purple-50 w-fit px-4 py-1.5 rounded-full border border-purple-100">{isEn ? 'Current Phase' : 'Faza Aktuale'}</p>
                  <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">{currentPhase.name}</h3>
                  <p className="text-slate-500 font-medium text-lg mt-2 max-w-sm">{currentPhase.desc}</p>
                </div>
                <div className="text-right flex items-end gap-3 md:flex-col md:items-end">
                   <div className="flex items-baseline gap-1">
                      <p className="text-8xl font-black text-purple-700 tracking-tighter leading-none">{Math.round(progress)}</p>
                      <span className="text-4xl font-black text-purple-300">%</span>
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isEn ? 'Journey progress' : 'Përparimi i rrugëtimit'}</p>
                </div>
              </div>

              {/* Enhanced Interactive Progress Bar */}
              <div className="relative mb-24 px-2">
                <div className="h-8 bg-slate-50 rounded-full overflow-hidden border-2 border-slate-100 p-1 shadow-inner relative">
                  <div 
                    className="h-full bg-purple-gradient rounded-full transition-all duration-[1.5s] relative shadow-lg" 
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute top-0 right-0 h-full w-4 bg-white/40 blur-md"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:40px_40px] animate-[progress-stripe_3s_linear_infinite]"></div>
                  </div>
                </div>
                <div className="absolute -bottom-12 left-0 w-full flex justify-between px-3">
                   {[0, 6, 12, 18, 24].map(w => (
                     <div key={w} className="flex flex-col items-center">
                        <div className={`w-1 h-4 rounded-full mb-3 ${currentWeek >= w ? 'bg-purple-400 shadow-[0_0_10px_rgba(167,139,250,0.5)]' : 'bg-slate-200'}`}></div>
                        <span className={`text-[11px] font-black transition-colors duration-500 ${currentWeek >= w ? 'text-purple-700' : 'text-slate-300'} uppercase tracking-widest`}>
                          {isEn ? `Week ${w}` : `Java ${w}`}
                        </span>
                     </div>
                   ))}
                </div>
              </div>

              {/* Roadmap Phases Grid */}
              <div className="grid md:grid-cols-3 gap-8 pt-12 border-t border-slate-50">
                {phases.map(phase => {
                   const isActive = currentWeek >= phase.weeks[0] && currentWeek <= phase.weeks[1];
                   const isPast = currentWeek > phase.weeks[1];
                   return (
                     <div 
                       key={phase.id} 
                       className={`relative p-8 rounded-[48px] border-2 transition-all duration-700 group/phase ${
                         isActive 
                           ? 'bg-white border-purple-400 shadow-2xl shadow-purple-900/10 scale-[1.03] z-10 ring-[12px] ring-purple-50' 
                           : isPast 
                             ? 'bg-slate-50 border-slate-100 opacity-60 grayscale-[0.5]' 
                             : 'bg-white border-slate-100 hover:border-purple-200'
                       }`}
                     >
                        {isActive && (
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-purple-700 text-white text-[9px] font-black uppercase tracking-[0.3em] py-2 px-6 rounded-full shadow-2xl animate-bounce whitespace-nowrap">
                            {isEn ? 'Current Phase' : 'Faza Aktuale'}
                          </div>
                        )}
                        
                        <div className="flex flex-col items-center text-center mb-10 mt-2">
                          <div className={`w-16 h-16 rounded-[28px] flex items-center justify-center text-3xl shadow-xl transition-all duration-700 group-hover/phase:scale-110 group-hover/phase:rotate-6 mb-4 ${isActive ? 'bg-purple-gradient text-white ring-4 ring-purple-100' : 'bg-slate-100 text-slate-400 grayscale'}`}>
                            {phase.icon}
                          </div>
                          <div>
                            <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 ${isActive ? 'text-purple-600' : 'text-slate-400'}`}>
                              {isEn ? `Phase ${phase.id}` : `Faza ${phase.id}`}
                            </p>
                            <h4 className={`text-xl font-black tracking-tight ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>{phase.name}</h4>
                          </div>
                        </div>

                        <div className="space-y-6 relative">
                          <div className="absolute left-3 top-3 bottom-3 w-px bg-slate-100"></div>
                          {phase.milestones.map((m, idx) => {
                            const isDone = currentWeek > m.week;
                            const isCurrent = currentWeek === m.week;
                            return (
                              <div key={idx} className="flex items-center gap-5 relative z-10 group/m">
                                <div className={`w-6 h-6 rounded-full border-2 transition-all duration-500 flex-shrink-0 flex items-center justify-center ${
                                  isDone 
                                    ? 'bg-green-500 border-green-500 scale-105' 
                                    : isCurrent 
                                      ? 'bg-white border-purple-600 shadow-[0_0_20px_rgba(109,40,217,0.4)] animate-pulse' 
                                      : 'bg-white border-slate-200'
                                }`}>
                                  {isDone && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7"/></svg>}
                                  {isCurrent && <div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div>}
                                </div>
                                <div className="flex flex-col">
                                  <span className={`text-[13px] font-black tracking-tight leading-none ${isCurrent ? 'text-purple-900' : isDone ? 'text-slate-400 line-through' : 'text-slate-500'}`}>
                                    {m.label}
                                  </span>
                                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">
                                    {isEn ? `Week ${m.week}` : `Java ${m.week}`}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                     </div>
                   );
                })}
              </div>
            </div>

            {/* 3D Simulation CTA Card */}
            <div className="bg-slate-950 text-white rounded-[60px] p-10 md:p-16 flex flex-col md:flex-row justify-between items-center group overflow-hidden relative shadow-2xl border-4 border-white/5 animate-stagger-3">
              <div className="relative z-10 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-purple-300 border border-white/10 backdrop-blur-md">
                   {isEn ? 'Clinical 3D Data' : 'Të Dhënat Klinike 3D'}
                </div>
                <h4 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter leading-tight">{isEn ? 'Interactive' : 'Evolucioni'}<br/>{isEn ? 'Simulation.' : 'Interaktiv.'}</h4>
                <p className="text-slate-400 text-lg font-bold max-w-sm mb-12 leading-relaxed opacity-80">
                  {isEn ? 'Experience the digital blueprint of your transformation through our clinical cloud viewer.' : 'Përjetoni hartën digjitale të transformimit tuaj përmes shikuesit tonë në cloud.'}
                </p>
                <a 
                  href={PERSONALIZED_PLAN_URL} 
                  target="_blank" 
                  className="inline-flex items-center gap-5 bg-white text-slate-950 px-14 py-7 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] hover:bg-purple-50 transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(0,0,0,0.4)] group/btn"
                >
                  <span>{isEn ? 'Launch Viewer' : 'Hap Shikuesin'}</span>
                  <svg className="w-6 h-6 transition-transform group-hover/btn:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </a>
              </div>
              
              <div className="absolute -right-20 -top-20 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
              
              <div className="mt-20 md:mt-0 relative hidden lg:block transform group-hover:rotate-0 rotate-6 transition-transform duration-1000">
                 <div className="w-[320px] aspect-square bg-white/5 rounded-[60px] border-2 border-white/10 backdrop-blur-2xl p-6 relative group/render shadow-inner">
                    <img 
                      src={BRAND_ASSET} 
                      className="w-full h-full object-cover rounded-[40px] opacity-30 grayscale group-hover/render:grayscale-0 transition-all duration-1000" 
                      alt="3D model preview" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-3xl border border-white/20 flex items-center justify-center text-white shadow-3xl animate-float">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          <div className="space-y-10 animate-stagger-2">
            {/* Visit Card */}
            <div className="bg-white rounded-[48px] p-10 shadow-2xl shadow-slate-200 border border-slate-100 group hover:border-purple-200 transition-all duration-700 hover:-translate-y-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-12 border-b border-slate-50 pb-5">{isEn ? 'Next Clinic Visit' : 'Vizita e Ardhshme'}</h4>
              <div className="flex gap-6 mb-12">
                <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center text-purple-700 shadow-sm transition-all duration-700 group-hover:scale-110 group-hover:rotate-12 group-hover:bg-purple-600 group-hover:text-white">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="font-black text-3xl text-slate-900 leading-none mb-3">Nov 12, 14:00</p>
                  <p className="text-sm text-slate-500 font-black uppercase tracking-[0.15em] opacity-80">Medident Dental Clinic</p>
                </div>
              </div>
              <button className="w-full py-6 bg-slate-50 text-slate-900 text-[11px] font-black uppercase tracking-[0.3em] rounded-3xl hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-100">
                {isEn ? 'Request Change' : 'Ndrysho Orarin'}
              </button>
            </div>

            {/* Interactive Habit Tracker */}
            <div className="bg-purple-gradient text-white rounded-[50px] p-10 md:p-12 shadow-[0_40px_100px_-30px_rgba(109,40,217,0.4)] relative overflow-hidden group transition-all duration-1000">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[100px] group-hover:scale-150 transition-transform duration-1000"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-12">
                  <h4 className="text-[10px] font-black text-purple-200 uppercase tracking-[0.4em]">{isEn ? 'Daily Tasks' : 'Detyrat Ditore'}</h4>
                  <div className="text-[10px] font-black bg-white/15 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                    {habits.filter(h => h.done).length}/3 {isEn ? 'Completed' : 'Kryer'}
                  </div>
                </div>

                <div className="space-y-6">
                  {[
                    { label: isEn ? "22h Wear Goal" : "Synimi 22h", icon: "🕒", sub: isEn ? "Current: 18h" : "Aktual: 18h" },
                    { label: isEn ? "Aligner Hygiene" : "Higjiena e Aligner", icon: "✨", sub: isEn ? "Last: 09:00" : "Fundit: 09:00" },
                    { label: isEn ? "Progress Photo" : "Foto e Rastit", icon: "📸", sub: isEn ? "Weekly Check" : "Kontrolli javor" }
                  ].map((task, i) => {
                    const isDone = habits[i]?.done;
                    return (
                      <button 
                        key={i} 
                        onClick={() => toggleHabit(i)}
                        className={`w-full flex items-center gap-6 p-6 rounded-[32px] transition-all duration-500 group/task relative overflow-hidden active:scale-95 ${isDone ? 'bg-white/20 border border-white/10' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-700 ${isDone ? 'bg-white shadow-xl' : 'bg-white/10'}`}>
                           <span className={isDone ? 'grayscale-0' : 'grayscale'}>{task.icon}</span>
                        </div>
                        <div className="text-left flex flex-col">
                          <span className={`text-sm font-black uppercase tracking-[0.1em] ${isDone ? 'text-white' : 'text-purple-100'}`}>{task.label}</span>
                          <span className="text-[10px] text-purple-300 font-bold opacity-70">{task.sub}</span>
                        </div>
                        <div className={`ml-auto w-8 h-8 rounded-full border-2 transition-all duration-500 flex items-center justify-center ${isDone ? 'bg-green-400 border-green-400' : 'border-white/20'}`}>
                           {isDone ? <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7"/></svg> : <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover/task:bg-white/60 transition-colors"></div>}
                        </div>
                        {isDone && <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none"></div>}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-16 p-8 bg-white/5 rounded-[40px] border border-white/5 text-center shadow-inner">
                  <p className="text-xs font-bold text-purple-100 leading-relaxed italic opacity-80">
                    "{isEn ? 'The secret to a beautiful smile is hidden in your daily routine.' : 'Sekreti i një buzëqeshjeje të bukur fshihet në rutinën tuaj ditore.'}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress-stripe {
          from { background-position: 0 0; }
          to { background-position: 80px 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
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
