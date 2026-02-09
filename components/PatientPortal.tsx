
import React, { useState, useEffect } from 'react';
import { BRAND_ASSET } from '../App';

type PortalMode = 'login' | 'signup' | 'forgot' | 'verify';

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
  
  const isEn = language === 'en';

  // Helper to manage mock users in localStorage
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

  const phases = [
    { 
      id: 1, 
      name: isEn ? "Phase 1: Expansion" : "Faza 1: Zgjerimi", 
      weeks: [1, 8], 
      desc: isEn ? "Creating space and correcting primary crowding." : "Krijimi i hapësirës dhe korrigjimi i dendësisë primare.",
      icon: "📐" 
    },
    { 
      id: 2, 
      name: isEn ? "Phase 2: Alignment" : "Faza 2: Rreshtimi", 
      weeks: [9, 16], 
      desc: isEn ? "Active movement into final aesthetic positions." : "Lëvizja aktive drejt pozicioneve finale estetike.",
      icon: "✨" 
    },
    { 
      id: 3, 
      name: isEn ? "Phase 3: Occlusion" : "Faza 3: Okluzioni", 
      weeks: [17, 24], 
      desc: isEn ? "Fine-tuning the bite and stabilizing results." : "Rregullimi i kafshimit dhe stabilizimi i rezultateve.",
      icon: "🦷" 
    }
  ];

  const totalWeeks = 24;
  const currentWeek = currentUser?.currentWeek || 1;
  const currentPhase = phases.find(p => currentWeek >= p.weeks[0] && currentWeek <= p.weeks[1]) || phases[0];
  const progress = (currentWeek / totalWeeks) * 100;

  const handleSignup = () => {
    if (!nameInput.trim()) {
      setValidationError(isEn ? "Full Name is required." : "Emri i plotë është i kërkuar.");
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
    if (users.some(u => u.id === idInput || u.email === emailInput)) {
      setValidationError(isEn ? "User already exists with this ID or Email." : "Përdoruesi ekziston me këtë ID ose Email.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const newUser: User = {
        id: idInput,
        fullName: nameInput,
        email: emailInput,
        passwordHash: passwordInput, // In real world this would be a hash
        currentWeek: 1,
        isVerified: false
      };
      saveUser(newUser);
      setLoading(false);
      setMode('verify');
    }, 1500);
  };

  const handleLogin = () => {
    const users = getStoredUsers();
    const user = users.find(u => (u.id === idInput || u.email === idInput) && u.passwordHash === passwordInput);
    
    if (user) {
      if (!user.isVerified) {
        setMode('verify');
        setEmailInput(user.email);
        return;
      }
      setLoading(true);
      setTimeout(() => {
        setCurrentUser(user);
        setLoading(false);
      }, 1000);
    } else {
      setValidationError(isEn ? "Invalid credentials. Please register first." : "Kredencialet e gabuara. Ju lutem regjistrohuni së pari.");
    }
  };

  const handleVerify = () => {
    setLoading(true);
    setTimeout(() => {
      const users = getStoredUsers();
      const user = users.find(u => u.email === emailInput || u.id === idInput);
      if (user) {
        user.isVerified = true;
        saveUser(user);
        setSuccessMessage(isEn ? "Email confirmed! You can now log in." : "Email-i u konfirmua! Tani mund të kyçeni.");
        setMode('login');
      }
      setLoading(false);
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);

    if (mode === 'signup') handleSignup();
    else if (mode === 'login') handleLogin();
    else if (mode === 'verify') handleVerify();
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
      <div className="min-h-screen pt-20 pb-12 bg-slate-50 relative overflow-hidden flex items-center justify-center px-4">
        <div className="absolute top-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-purple-600/5 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-md w-full relative z-10">
          <button 
            onClick={onBack}
            className="mb-4 md:mb-6 flex items-center gap-2 text-slate-400 font-black hover:text-purple-700 transition-all uppercase text-[10px] tracking-widest focus:outline-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            {isEn ? 'Back to Clinic' : 'Kthehu në Klinikë'}
          </button>

          <div className="bg-white rounded-[24px] md:rounded-[40px] shadow-2xl p-6 md:p-10 border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-purple-gradient"></div>
            
            <div className="text-center mb-6 md:mb-8 pt-4">
              <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight mb-2 uppercase tracking-widest">
                {mode === 'login' && (isEn ? 'Patient Login' : 'Kyçja e Pacientit')}
                {mode === 'signup' && (isEn ? 'Register' : 'Regjistrimi')}
                {mode === 'forgot' && (isEn ? 'Reset Password' : 'Rivendos Fjalëkalimin')}
                {mode === 'verify' && (isEn ? 'Confirm Email' : 'Konfirmo Email-in')}
              </h1>
              <p className="text-slate-500 font-medium text-xs md:text-sm leading-relaxed px-4">
                {mode === 'login' && (isEn ? 'Only registered patients can access their 3D plan' : 'Vetëm pacientët e regjistruar mund të hyjnë në planin 3D')}
                {mode === 'signup' && (isEn ? 'Join the smile revolution. Create your account.' : 'Bashkohuni me revolucionin. Krijoni llogarinë tuaj.')}
                {mode === 'verify' && (isEn ? `A confirmation was sent to ${emailInput || idInput}.` : `Një konfirmim u dërgua në ${emailInput || idInput}.`)}
              </p>
            </div>

            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 text-xs font-bold rounded-xl text-center">
                {successMessage}
              </div>
            )}

            {validationError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-xl text-center">
                {validationError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode !== 'forgot' && mode !== 'verify' && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{isEn ? 'Username or ID' : 'Përdoruesi ose ID'}</label>
                  <input 
                    type="text" 
                    required
                    value={idInput}
                    onChange={(e) => setIdInput(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>
              )}

              {mode === 'signup' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{isEn ? 'Full Name' : 'Emri i Plotë'}</label>
                    <input 
                      type="text" 
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{isEn ? 'Email Address' : 'Adresa e Email-it'}</label>
                    <input 
                      type="email" 
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                  </div>
                </>
              )}

              {(mode === 'login' || mode === 'signup') && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{isEn ? 'Password' : 'Fjalëkalimi'}</label>
                  <input 
                    type="password" 
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>
              )}

              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{isEn ? 'Confirm Password' : 'Konfirmo Fjalëkalimin'}</label>
                  <input 
                    type="password" 
                    required
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>
              )}

              {mode === 'verify' && (
                <div className="p-6 bg-purple-50 rounded-2xl text-center space-y-4">
                  <p className="text-xs font-bold text-purple-700 italic">
                    {isEn ? "Mock Email Step: In a real app, you would click a link in your email. For this demo, please click below to confirm." : "Hapi i Email-it: Në një app real, do të klikonit linkun në email. Për këtë demo, klikoni më poshtë."}
                  </p>
                </div>
              )}
              
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-purple-gradient text-white font-black py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 mt-4 uppercase tracking-widest flex items-center justify-center"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full"></div> : (
                  <>
                    {mode === 'login' && (isEn ? 'Login' : 'Kyçu')}
                    {mode === 'signup' && (isEn ? 'Create Account' : 'Krijo Llogarinë')}
                    {mode === 'verify' && (isEn ? 'Confirm Verification' : 'Konfirmo Verifikimin')}
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 flex flex-col items-center gap-4 text-center border-t border-slate-50 pt-6">
              {mode === 'login' ? (
                <>
                  <button onClick={() => setMode('signup')} className="text-[10px] font-black text-purple-700 uppercase tracking-widest">
                    {isEn ? 'New Patient? Register' : 'Pacient i ri? Regjistrohu'}
                  </button>
                  <button onClick={() => setMode('forgot')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {isEn ? 'Forgot password?' : 'Harruat fjalëkalimin?'}
                  </button>
                </>
              ) : (
                <button onClick={() => setMode('login')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
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
    <div className="min-h-screen pt-24 pb-12 bg-slate-50 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              {isEn ? 'Active Treatment' : 'Trajtim Aktiv'}
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              {isEn ? `Welcome, ${currentUser.fullName || currentUser.id}!` : `Mirësevini, ${currentUser.fullName || currentUser.id}!`}
            </h1>
          </div>
          <button 
            onClick={() => setCurrentUser(null)}
            className="text-slate-400 font-black text-sm hover:text-red-500 transition-all uppercase tracking-widest"
          >
            {isEn ? 'Log out' : 'Çkyçu'}
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[50px] p-12 shadow-xl border border-slate-100">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{isEn ? 'Current Phase' : 'Faza Aktuale'}</p>
                  <h3 className="text-2xl font-black text-slate-900">{currentPhase.name}</h3>
                </div>
                <div className="text-right">
                  <p className="text-5xl font-black text-purple-700 tracking-tighter">{Math.round(progress)}%</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{isEn ? 'Complete' : 'Përfunduar'}</p>
                </div>
              </div>

              <div className="h-6 bg-slate-50 rounded-full mb-12 overflow-hidden border-2 border-slate-100 p-1">
                <div className="h-full bg-purple-gradient rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {phases.map(phase => {
                   const isActive = currentWeek >= phase.weeks[0] && currentWeek <= phase.weeks[1];
                   const isPast = currentWeek > phase.weeks[1];
                   return (
                     <div key={phase.id} className={`p-6 rounded-3xl border-2 transition-all ${isActive ? 'bg-purple-50 border-purple-200 shadow-sm' : isPast ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-50'}`}>
                        <span className="text-2xl mb-4 block">{phase.icon}</span>
                        <h4 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isActive ? 'text-purple-700' : 'text-slate-400'}`}>{phase.name}</h4>
                        <p className={`text-[11px] font-bold leading-relaxed ${isActive ? 'text-purple-900' : 'text-slate-500'}`}>{phase.desc}</p>
                     </div>
                   );
                })}
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-[50px] p-12 flex justify-between items-center group overflow-hidden relative">
              <div className="relative z-10">
                <h4 className="text-xl font-black mb-3 uppercase tracking-widest">{isEn ? '3D Treatment Plan' : 'Plani i Trajtimit 3D'}</h4>
                <p className="text-slate-400 text-sm font-bold max-w-sm mb-8">
                  {isEn ? 'View your full digital transformation simulation calculated by our experts.' : 'Shikoni simulimin e plotë të transformimit tuaj digjital.'}
                </p>
                <a href={PERSONALIZED_PLAN_URL} target="_blank" className="inline-flex items-center gap-3 bg-white text-slate-950 px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:bg-purple-50 transition-all">
                  {isEn ? 'Open Viewer' : 'Hap Shikuesin'}
                </a>
              </div>
              <div className="w-48 h-48 bg-purple-600/20 rounded-full blur-[60px] absolute -right-12 -top-12"></div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-[40px] p-8 shadow-lg border border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">{isEn ? 'Next Visit' : 'Vizita e Ardhshme'}</h4>
              <div className="flex gap-4 mb-8">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="font-black text-slate-900">Nov 12, 14:00</p>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Medident Dental Clinic</p>
                </div>
              </div>
              <button className="w-full py-4 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all">
                {isEn ? 'Request Change' : 'Kërko Ndryshim'}
              </button>
            </div>

            <div className="bg-purple-gradient text-white rounded-[40px] p-8 shadow-xl">
              <h4 className="text-[10px] font-black text-purple-200 uppercase tracking-widest mb-6">{isEn ? 'Daily Tasks' : 'Detyrat Ditore'}</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 flex items-center justify-center text-white/50">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">{isEn ? "22h Wear Goal" : "Synimi 22h"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 flex items-center justify-center text-white/50">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">{isEn ? "Aligner Hygiene" : "Higjiena e Aligner"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
