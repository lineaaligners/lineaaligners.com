import React, { useState } from 'react';
import { BRAND_ASSET } from '../App';

type PortalMode = 'login' | 'signup' | 'forgot';

const PERSONALIZED_PLAN_URL = "https://webviewer2.archform.com/?name=Leart_Tredhaku&data=eyJtb2RlIjoiQWR2YW5jZWQiLCJkb3dubG9hZFVybCI6ImFIUjBjSE02THk5aGNtTm9abTl5YlMxM1pXSXRjMmhoY21WaFlteGxMbk16TFdGalkyVnNaWEpoZEdVdVlXMWhlbTl1WVhkekxtTnZiUzkzWldJdGRtbGxkMlZ5TDNWekxXVmhjM1F0TWpvNVpUVmlNMlV6T1MwMlpHSmlMV015WWpndE1qZ3paQzB3WlRNd1lqRTRNemc0Tmpndk16aFJZek5IY2pCMVVuZDVOVGhuYjFGQmVWUlJRMlU0YlhkMkwzTmxkSFZ3WDJacGJHVXZNemhSWXpOS1FXOVVaRXR4VjBaRFVVaHhkM2d6WWxoSFNuZDZMbnBwY0E9PSJ9";

export const PatientPortal: React.FC<{ onBack: () => void; language: 'en' | 'sq' }> = ({ onBack, language }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mode, setMode] = useState<PortalMode>('login');
  const [loading, setLoading] = useState(false);
  const [idInput, setIdInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [patientName, setPatientName] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const isEn = language === 'en';

  // Mock treatment data
  const treatment = {
    currentWeek: 12,
    totalWeeks: 24,
    nextChangeDate: "Oct 24, 2024",
    treatmentPhase: isEn ? "Alignment Phase II" : "Faza e Rreshtimit II",
    daysLeftInCurrentAligner: 3,
    doctor: "Dr. Fatbardha Mustafa"
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

  const currentPhase = phases.find(p => treatment.currentWeek >= p.weeks[0] && treatment.currentWeek <= p.weeks[1]) || phases[0];
  const progress = (treatment.currentWeek / treatment.totalWeeks) * 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);

    if (mode === 'signup') {
      if (passwordInput.length < 6) {
        setValidationError(isEn ? "Password must be at least 6 characters." : "Fjalëkalimi duhet të jetë së paku 6 karaktere.");
        return;
      }
      if (passwordInput !== confirmPasswordInput) {
        setValidationError(isEn ? "Passwords do not match. Please confirm your new password." : "Fjalëkalimet nuk përputhen. Ju lutem konfirmoni fjalëkalimin e ri.");
        return;
      }
    }

    if (mode === 'forgot' && !emailInput.includes('@')) {
      setValidationError(isEn ? "Please enter a valid email address." : "Ju lutem shënoni një email valide.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (mode === 'login') {
        if (idInput.trim() && passwordInput.trim()) {
          setPatientName(idInput.trim());
          setIsLoggedIn(true);
        } else {
          setValidationError(isEn ? "Invalid credentials." : "Kredencialet e gabuara.");
        }
      } else if (mode === 'signup') {
        setSuccessMessage(isEn 
          ? "Account created! You can now log in with your new password." 
          : "Llogaria u krijua! Tani mund të kyçeni me fjalëkalimin tuaj të ri.");
        setMode('login');
        setPasswordInput("");
        setConfirmPasswordInput("");
      } else if (mode === 'forgot') {
        setSuccessMessage(isEn 
          ? `A reset link has been sent to ${emailInput}. Please check your inbox.` 
          : `Një vegëz e rivendosjes u dërgua në ${emailInput}. Kontrolloni postën tuaj.`);
        setMode('login');
      }
      setLoading(false);
    }, 1800);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen pt-20 pb-12 bg-slate-50 relative overflow-hidden flex items-center justify-center px-4">
        <div className="absolute top-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-purple-600/5 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-indigo-600/5 rounded-full blur-[60px] md:blur-[100px] pointer-events-none"></div>
        
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
                {mode === 'signup' && (isEn ? 'Create Account' : 'Krijo Llogarinë')}
                {mode === 'forgot' && (isEn ? 'Reset Password' : 'Rivendos Fjalëkalimin')}
              </h1>
              <p className="text-slate-500 font-medium text-xs md:text-sm leading-relaxed px-4">
                {mode === 'login' && (isEn ? 'Access your treatment journey and 3D plan' : 'Aksesoni rrugëtimin tuaj dhe planin 3D')}
                {mode === 'signup' && (isEn ? 'Sign up to track your smile transformation' : 'Regjistrohuni për të ndjekur transformimin tuaj')}
                {mode === 'forgot' && (isEn ? 'Enter your email to receive a secure reset link' : 'Shënoni emailin për të marrë linkun e rivendosjes')}
              </p>
            </div>

            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 text-xs font-bold rounded-xl animate-scale-in text-center flex flex-col gap-2">
                <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                {successMessage}
              </div>
            )}

            {validationError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-xl animate-scale-in text-center flex flex-col gap-2">
                <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {validationError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode !== 'forgot' && (
                <div className="space-y-1">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {mode === 'login' ? (isEn ? 'Full Name or ID' : 'Emri i Plotë ose ID') : (isEn ? 'Choose an ID/Name' : 'Zgjidhni një ID/Emër')}
                  </label>
                  <input 
                    type="text" 
                    required
                    value={idInput}
                    onChange={(e) => setIdInput(e.target.value)}
                    placeholder={isEn ? "e.g., Geno21" : "p.sh., Geno21"}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 md:py-4 text-slate-900 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm font-black"
                  />
                </div>
              )}

              {mode !== 'login' && (
                <div className="space-y-1">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{isEn ? 'Email Address' : 'Adresa e Email-it'}</label>
                  <input 
                    type="email" 
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 md:py-4 text-slate-900 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm font-black"
                  />
                </div>
              )}

              {mode !== 'forgot' && (
                <div className="space-y-1">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {mode === 'signup' ? (isEn ? 'Create Password' : 'Krijo Fjalëkalimin') : (isEn ? 'Password' : 'Fjalëkalimi')}
                  </label>
                  <input 
                    type="password" 
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 md:py-4 text-slate-900 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm font-black"
                  />
                </div>
              )}

              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{isEn ? 'Confirm Password' : 'Konfirmo Fjalëkalimin'}</label>
                  <input 
                    type="password" 
                    required
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full bg-slate-50 border-2 rounded-xl px-4 py-3 md:py-4 text-slate-900 placeholder:text-slate-300 outline-none transition-all text-sm font-black ${confirmPasswordInput && confirmPasswordInput !== passwordInput ? 'border-red-300 focus:ring-red-500' : 'border-slate-100 focus:ring-purple-500'}`}
                  />
                </div>
              )}
              
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-purple-gradient text-white font-black py-4 md:py-5 rounded-xl shadow-xl shadow-purple-600/20 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 mt-4 text-sm md:text-base flex items-center justify-center gap-3 uppercase tracking-widest"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2 loader-dots">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                ) : (
                  <>
                    {mode === 'login' && (isEn ? 'Secure Login' : 'Kyçje e Sigurt')}
                    {mode === 'signup' && (isEn ? 'Create Account' : 'Krijo Llogarinë')}
                    {mode === 'forgot' && (isEn ? 'Send Reset Link' : 'Dërgo Vegëzën')}
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 flex flex-col items-center gap-4 text-center border-t border-slate-50 pt-6">
              {mode === 'login' ? (
                <>
                  <button 
                    onClick={() => { setMode('forgot'); setValidationError(null); setSuccessMessage(null); }}
                    className="text-[10px] md:text-xs font-black text-slate-400 hover:text-purple-600 transition-colors uppercase tracking-widest"
                  >
                    {isEn ? 'Forgot your password?' : 'Keni harruar fjalëkalimin?'}
                  </button>
                  <div className="flex items-center gap-4 w-full px-10">
                    <div className="h-px flex-1 bg-slate-100"></div>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{isEn ? 'or' : 'ose'}</span>
                    <div className="h-px flex-1 bg-slate-100"></div>
                  </div>
                  <button 
                    onClick={() => { setMode('signup'); setValidationError(null); setSuccessMessage(null); }}
                    className="text-[10px] md:text-xs font-black text-purple-700 uppercase tracking-widest hover:text-purple-900 flex items-center gap-2"
                  >
                    {isEn ? 'New patient? Sign Up' : 'Pacient i ri? Regjistrohu'}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7"/></svg>
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => { setMode('login'); setValidationError(null); setSuccessMessage(null); }}
                  className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest hover:text-purple-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7 7-7" /></svg>
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
    <div className="min-h-screen pt-24 pb-12 bg-slate-50 animate-fade-in overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-12">
          <div className="w-full sm:w-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              {isEn ? 'Active Treatment' : 'Trajtim Aktiv'}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight break-words">
              {isEn ? `Welcome, ${patientName}!` : `Mirësevini, ${patientName}!`}
            </h1>
          </div>
          <button 
            onClick={() => { setIsLoggedIn(false); setPatientName(""); setIdInput(""); setPasswordInput(""); setMode('login'); }}
            className="text-slate-400 font-black text-xs md:text-sm hover:text-red-500 transition-all flex items-center gap-2 bg-white sm:bg-transparent px-4 py-2 rounded-full sm:p-0 border border-slate-100 sm:border-none shadow-sm sm:shadow-none self-end sm:self-auto uppercase tracking-widest"
          >
            {isEn ? 'Log out' : 'Çkyçu'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <div className="bg-white rounded-[24px] md:rounded-[50px] p-5 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 md:w-64 h-24 md:h-64 bg-purple-gradient opacity-[0.02] md:opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="flex flex-row justify-between items-end gap-2 mb-6 md:mb-8 relative z-10">
                <div className="flex-1">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{isEn ? 'Current Status' : 'Statusi Aktual'}</p>
                  <h3 className="text-base md:text-2xl font-black text-slate-900 leading-tight">{treatment.treatmentPhase}</h3>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-3xl md:text-5xl font-black text-purple-700 tracking-tighter leading-none">{Math.round(progress)}%</p>
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{isEn ? 'Complete' : 'Përfunduar'}</p>
                </div>
              </div>

              <div className="relative h-4 md:h-7 bg-slate-50 rounded-full mb-8 md:mb-12 overflow-hidden border-2 border-slate-100 p-1 md:p-1.5 shadow-inner">
                <div 
                  className="h-full bg-purple-gradient rounded-full shadow-[0_4px_12px_rgba(109,40,217,0.3)] transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-10">
                {phases.map(phase => {
                   const isActive = treatment.currentWeek >= phase.weeks[0] && treatment.currentWeek <= phase.weeks[1];
                   const isPast = treatment.currentWeek > phase.weeks[1];
                   return (
                     <div key={phase.id} className={`p-5 rounded-3xl border-2 transition-all duration-500 ${isActive ? 'bg-purple-50 border-purple-200 shadow-sm' : isPast ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-50'}`}>
                        <div className="flex items-center gap-3 mb-3">
                           <span className="text-2xl">{phase.icon}</span>
                           <h4 className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-purple-700' : 'text-slate-400'}`}>{phase.name}</h4>
                        </div>
                        <p className={`text-[11px] font-black leading-relaxed ${isActive ? 'text-purple-900' : 'text-slate-500'}`}>{phase.desc}</p>
                        {isActive && (
                           <div className="mt-3 inline-flex items-center gap-2 text-[9px] font-black text-purple-600 bg-white px-3 py-1 rounded-full shadow-sm border border-purple-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse"></span>
                              {isEn ? 'CURRENT STAGE' : 'STAZHA AKTUALE'}
                           </div>
                        )}
                     </div>
                   );
                })}
              </div>

              <div className="mb-10 md:mb-14 pt-6 md:pt-10 border-t border-slate-50 relative">
                <h4 className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2">{isEn ? 'Journey Timeline' : 'Linja Kohore'}</h4>
                
                <div className="relative pt-10 md:pt-14 pb-4 px-2">
                  <div className="h-1.5 md:h-2 w-full bg-slate-100 rounded-full relative">
                    <div 
                      className="absolute top-0 left-0 h-full bg-purple-gradient rounded-full shadow-[0_0_15px_rgba(109,40,217,0.2)]"
                      style={{ width: `${progress}%` }}
                    ></div>
                    
                    {phases.map((p, idx) => (
                      <div 
                        key={idx} 
                        className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                        style={{ left: `${(p.weeks[0] / treatment.totalWeeks) * 100}%` }}
                      >
                         <div className={`w-1.5 md:w-2 h-1.5 md:h-2 rounded-full border border-white ${treatment.currentWeek >= p.weeks[0] ? 'bg-purple-800' : 'bg-slate-300'}`}></div>
                         <span className="text-[6px] md:text-[8px] font-black text-slate-400 uppercase mt-2">{isEn ? `W${p.weeks[0]}` : `J${p.weeks[0]}`}</span>
                      </div>
                    ))}

                    <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 flex flex-col items-center">
                       <div className="w-2 md:w-3.5 h-2 md:h-3.5 rounded-full bg-slate-200 ring-2 md:ring-4 ring-white shadow-md"></div>
                       <span className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-2 md:mt-3">{isEn ? 'Finish' : 'Finalja'}</span>
                    </div>

                    <div 
                      className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-out z-20"
                      style={{ 
                        left: `${progress}%`,
                        transform: `translate(${progress < 15 ? '0%' : progress > 85 ? '-100%' : '-50%'}, -50%)`
                      }}
                    >
                       <div className="flex flex-col items-center">
                          <div className="relative">
                            <div className="w-4 md:w-6 h-4 md:h-6 rounded-full bg-white shadow-2xl flex items-center justify-center ring-2 ring-purple-600">
                               <div className="w-2 md:w-3 h-2 md:w-3 rounded-full bg-purple-gradient animate-pulse"></div>
                            </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 md:pt-10 border-t border-slate-50 relative z-10">
                <div className="flex flex-row justify-between items-center mb-6 md:mb-8">
                  <div>
                    <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">{isEn ? 'Phase-Based Roadmap' : 'Rrugëtimi i Bazuar në Faza'}</p>
                    <p className="text-[9px] md:text-xs font-black text-slate-500">{isEn ? 'Your structured path to perfection' : 'Rruga juaj e strukturuar drejt përsosmërisë'}</p>
                  </div>
                  <span className="text-[9px] md:text-[11px] font-black text-purple-700 bg-purple-50 px-2.5 py-1.5 md:px-4 md:py-2 rounded-full uppercase tracking-widest border-2 border-purple-100">
                    {treatment.currentWeek} <span className="opacity-40">/</span> {treatment.totalWeeks}
                  </span>
                </div>
                
                <div className="space-y-10">
                  {phases.map(phase => (
                    <div key={phase.id} className="space-y-4">
                      <div className="flex items-center gap-3">
                         <div className={`h-px flex-1 ${treatment.currentWeek >= phase.weeks[0] ? 'bg-purple-200' : 'bg-slate-100'}`}></div>
                         <h5 className={`text-[9px] font-black uppercase tracking-[0.3em] ${treatment.currentWeek >= phase.weeks[0] ? 'text-purple-800' : 'text-slate-300'}`}>
                           {phase.name}
                         </h5>
                         <div className={`h-px flex-1 ${treatment.currentWeek >= phase.weeks[1] ? 'bg-purple-200' : 'bg-slate-100'}`}></div>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 sm:gap-2.5">
                        {Array.from({ length: phase.weeks[1] - phase.weeks[0] + 1 }, (_, i) => {
                          const weekNum = phase.weeks[0] + i;
                          const isCompleted = weekNum < treatment.currentWeek;
                          const isCurrent = weekNum === treatment.currentWeek;
                          
                          return (
                            <div 
                              key={weekNum}
                              className={`aspect-square rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center text-[9px] sm:text-[10px] md:text-xs font-black transition-all duration-500 border-2 relative ${
                                isCompleted ? 'bg-purple-50 text-purple-400 border-purple-50 scale-95 opacity-70' :
                                isCurrent ? 'bg-purple-gradient text-white border-transparent shadow-xl scale-110 z-10 ring-2 ring-purple-100' :
                                'bg-slate-50 text-slate-300 border-slate-100'
                              }`}
                            >
                              {weekNum}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 md:gap-8">
              <div className="bg-slate-900 text-white rounded-[24px] md:rounded-[40px] p-6 md:p-10 flex flex-col justify-between group overflow-hidden relative min-h-[160px] md:min-h-[220px] shadow-2xl">
                <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <h4 className="text-base md:text-xl font-black mb-1.5 md:mb-3 uppercase tracking-widest">{isEn ? 'Personalized Plan' : 'Plani i Personalizuar'}</h4>
                  <p className="text-slate-400 text-[10px] md:text-sm font-black leading-relaxed max-w-[200px]">
                    {isEn ? 'View your full digital treatment simulation.' : 'Shikoni simulimin tuaj të plotë digjital.'}
                  </p>
                </div>
                <a 
                  href={PERSONALIZED_PLAN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-10 mt-4 md:mt-8 flex items-center gap-2 font-black text-[10px] md:text-sm text-purple-400 hover:text-white transition-colors group/link uppercase tracking-widest"
                >
                  {isEn ? 'Open 3D Viewer' : 'Hap Shikuesin 3D'}
                  <svg className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </a>
              </div>

              <div className="bg-white border-2 border-slate-100 rounded-[24px] md:rounded-[40px] p-6 md:p-10 flex flex-col justify-between group min-h-[160px] md:min-h-[220px] shadow-sm">
                <div>
                  <h4 className="text-base md:text-xl font-black text-slate-900 mb-1.5 md:mb-3 uppercase tracking-widest">{isEn ? 'Specialist Care' : 'Kujdesi Specialist'}</h4>
                  <p className="text-slate-500 text-[10px] md:text-sm font-black leading-relaxed max-w-[200px]">
                    {isEn ? 'Direct line to our orthodontic team.' : 'Linjë direkte me ekipin tonë.'}
                  </p>
                </div>
                <a 
                  href="https://wa.me/38349772307" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-4 md:mt-8 flex items-center gap-2 font-black text-[10px] md:text-sm text-green-600 hover:text-green-700 transition-all uppercase tracking-widest"
                >
                  {isEn ? 'Contact WhatsApp' : 'Kontakto në WhatsApp'}
                  <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-6 md:space-y-8">
            <div className="bg-white rounded-[24px] md:rounded-[40px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.02)] border-2 border-slate-50">
              <h4 className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 md:mb-8">{isEn ? 'Upcoming Visit' : 'Vizita e Ardhshme'}</h4>
              <div className="flex items-start gap-4 md:gap-5 mb-6 md:mb-8">
                <div className="w-10 md:w-12 h-10 md:h-12 bg-purple-50 rounded-xl md:rounded-[20px] flex items-center justify-center text-purple-700 flex-shrink-0 shadow-sm border border-purple-100">
                  <svg className="w-5 md:w-6 h-5 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="font-black text-slate-900 text-sm md:text-base leading-tight mb-1">{isEn ? 'Clinical Progress' : 'Progresi Klinik'}</p>
                  <p className="text-[10px] md:text-xs text-slate-500 font-black tracking-tight">Nov 12, 14:00 • Meident</p>
                </div>
              </div>
              <button className="w-full py-3.5 md:py-4 bg-slate-50 text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 hover:text-purple-700 transition-all border border-transparent">
                {isEn ? 'Reschedule' : 'Ndrysho Oraren'}
              </button>
            </div>

            <div className="bg-purple-gradient rounded-[24px] md:rounded-[40px] p-6 text-white shadow-xl shadow-purple-600/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 md:w-24 h-20 md:h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <h4 className="text-[8px] md:text-[10px] font-black text-purple-200 uppercase tracking-widest mb-5 md:mb-6">{isEn ? 'Daily Success' : 'Suksesi Ditore'}</h4>
              <ul className="space-y-4">
                {[
                  { text: isEn ? "22h Daily Wear" : "22h Mbajtje" },
                  { text: isEn ? "Aligner Rinse" : "Pastrimi i Aligner" },
                  { text: isEn ? "Case Storage" : "Ruajtja në Kuti" }
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 md:gap-4 text-[10px] md:text-[11px] font-black items-center">
                    <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-2.5 h-2.5 md:w-3 md:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="opacity-90">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};