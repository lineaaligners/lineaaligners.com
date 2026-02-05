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

  const progress = (treatment.currentWeek / treatment.totalWeeks) * 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);

    // Specific Validation for Signup (Password Creation)
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

    // Specific Validation for Forgot Password
    if (mode === 'forgot' && !emailInput.includes('@')) {
      setValidationError(isEn ? "Please enter a valid email address." : "Ju lutem shënoni një email valide.");
      return;
    }

    setLoading(true);

    // Simulate Network Request
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
        // Clear sensitive inputs
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
        {/* Background Decorative Elements */}
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
            <div className="absolute top-0 left-0 w-full h-1.5 bg-purple-gradient"></div>
            
            <div className="text-center mb-6 md:mb-8">
              <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">
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
              {/* Identity Field - Used for Login and Signup */}
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
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 md:py-4 text-slate-900 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm font-medium"
                  />
                </div>
              )}

              {/* Email Field - Used for Signup and Forgot Password */}
              {mode !== 'login' && (
                <div className="space-y-1">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{isEn ? 'Email Address' : 'Adresa e Email-it'}</label>
                  <input 
                    type="email" 
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 md:py-4 text-slate-900 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm font-medium"
                  />
                </div>
              )}

              {/* Password Fields - Logic for Login vs Signup */}
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
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 md:py-4 text-slate-900 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm font-medium"
                  />
                </div>
              )}

              {/* Confirm Password - ONLY for Signup */}
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{isEn ? 'Confirm Password' : 'Konfirmo Fjalëkalimin'}</label>
                  <input 
                    type="password" 
                    required
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 md:py-4 text-slate-900 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm font-medium"
                  />
                </div>
              )}
              
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-purple-gradient text-white font-black py-4 md:py-5 rounded-xl shadow-xl shadow-purple-100 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 mt-2 text-sm md:text-base flex items-center justify-center gap-3"
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

            {/* Navigation between modes */}
            <div className="mt-8 flex flex-col items-center gap-4 text-center border-t border-slate-50 pt-6">
              {mode === 'login' ? (
                <>
                  <button 
                    onClick={() => { setMode('forgot'); setValidationError(null); setSuccessMessage(null); }}
                    className="text-[10px] md:text-xs font-bold text-slate-400 hover:text-purple-600 transition-colors"
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

  // PORTAL LOGGED IN VIEW
  return (
    <div className="min-h-screen pt-24 pb-12 bg-slate-50 animate-fade-in overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Mobile Header Optimization */}
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
            className="text-slate-400 font-bold text-xs md:text-sm hover:text-red-500 transition-colors flex items-center gap-2 bg-white sm:bg-transparent px-4 py-2 rounded-full sm:p-0 border border-slate-100 sm:border-none shadow-sm sm:shadow-none self-end sm:self-auto"
          >
            {isEn ? 'Log out' : 'Çkyçu'}
            <svg className="w-3.5 md:w-4 h-3.5 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Main Progress Card - Mobile Optimized Padding */}
            <div className="bg-white rounded-[24px] md:rounded-[50px] p-4 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 md:w-64 h-24 md:h-64 bg-purple-gradient opacity-[0.02] md:opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="flex flex-row justify-between items-end gap-2 mb-6 md:mb-8 relative z-10">
                <div className="flex-1">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{isEn ? 'Current Status' : 'Statusi Aktual'}</p>
                  <h3 className="text-base md:text-2xl font-black text-slate-900 leading-tight">{treatment.treatmentPhase}</h3>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-3xl md:text-5xl font-black text-purple-700 tracking-tighter leading-none">{Math.round(progress)}%</p>
                  <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{isEn ? 'Complete' : 'Përfunduar'}</p>
                </div>
              </div>

              {/* Progress Bar - Height optimized for mobile */}
              <div className="relative h-4 md:h-7 bg-slate-50 rounded-full mb-8 md:mb-12 overflow-hidden border border-slate-100 p-1 md:p-1.5 shadow-inner">
                <div 
                  className="h-full bg-purple-gradient rounded-full shadow-[0_4px_12px_rgba(109,40,217,0.3)] transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
                <div className="absolute inset-0 flex justify-between px-3 md:px-4 pointer-events-none opacity-10">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-px h-full bg-white"></div>
                  ))}
                </div>
              </div>

              {/* Stats Grid - Fluid sizing */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12 relative z-10">
                <div className="space-y-0.5 md:space-y-1">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{isEn ? 'Current Week' : 'Java Aktuale'}</p>
                  <p className="text-base md:text-2xl font-black text-slate-900">{treatment.currentWeek} <span className="text-slate-300 font-medium">/ {treatment.totalWeeks}</span></p>
                </div>
                <div className="space-y-0.5 md:space-y-1">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{isEn ? 'Weeks Left' : 'Javë të Mbetura'}</p>
                  <p className="text-base md:text-2xl font-black text-slate-900">{treatment.totalWeeks - treatment.currentWeek}</p>
                </div>
                <div className="space-y-0.5 md:space-y-1 col-span-2 md:col-span-1 border-t md:border-t-0 border-slate-50 pt-3 md:pt-0">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{isEn ? 'Days to Swap' : 'Ditë deri te ndërrimi'}</p>
                  <p className="text-base md:text-2xl font-black text-green-600">{treatment.daysLeftInCurrentAligner} {isEn ? 'Days' : 'Ditë'}</p>
                </div>
              </div>

              {/* Timeline - Adjusted for narrow screens */}
              <div className="mb-10 md:mb-14 pt-6 md:pt-10 border-t border-slate-50 relative">
                <h4 className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2">{isEn ? 'Journey Timeline' : 'Linja Kohore'}</h4>
                
                <div className="relative pt-8 md:pt-14 pb-4 px-1">
                  <div className="h-1.5 md:h-2 w-full bg-slate-100 rounded-full relative">
                    <div 
                      className="absolute top-0 left-0 h-full bg-purple-gradient rounded-full shadow-[0_0_15px_rgba(109,40,217,0.2)]"
                      style={{ width: `${progress}%` }}
                    ></div>
                    
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center">
                       <div className="w-2 md:w-3.5 h-2 md:h-3.5 rounded-full bg-purple-800 ring-2 md:ring-4 ring-white shadow-md"></div>
                       <span className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1 md:mt-3">{isEn ? 'Day 1' : 'Dita 1'}</span>
                    </div>

                    <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 flex flex-col items-center">
                       <div className="w-2 md:w-3.5 h-2 md:h-3.5 rounded-full bg-slate-200 ring-2 md:ring-4 ring-white shadow-md"></div>
                       <span className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1 md:mt-3">{isEn ? 'Finish' : 'Finalja'}</span>
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
                            <div className="absolute -top-7 md:-top-10 left-1/2 -translate-x-1/2 bg-purple-900 text-white text-[7px] md:text-[9px] font-black py-1 px-2 md:py-1.5 md:px-3 rounded-lg md:rounded-xl shadow-xl whitespace-nowrap">
                              {isEn ? 'HERE' : 'KËTU'}
                              <div className="absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-purple-900 rotate-45"></div>
                            </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Roadmap - Optimized touch targets and grid flow */}
              <div className="pt-6 md:pt-10 border-t border-slate-50 relative z-10">
                <div className="flex flex-row justify-between items-center mb-6 md:mb-8">
                  <div>
                    <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">{isEn ? 'Treatment Roadmap' : 'Rrugëtimi i Trajtimit'}</p>
                    <p className="text-[9px] md:text-xs font-bold text-slate-500">{isEn ? 'Week-by-week plan' : 'Plani javë pas jave'}</p>
                  </div>
                  <span className="text-[9px] md:text-[11px] font-black text-purple-700 bg-purple-50 px-2.5 py-1.5 md:px-4 md:py-2 rounded-full uppercase tracking-widest border border-purple-100">
                    {treatment.currentWeek} <span className="opacity-40">/</span> {treatment.totalWeeks}
                  </span>
                </div>
                
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-1.5 sm:gap-2 md:gap-3">
                  {[...Array(treatment.totalWeeks)].map((_, i) => {
                    const weekNum = i + 1;
                    const isCompleted = weekNum < treatment.currentWeek;
                    const isCurrent = weekNum === treatment.currentWeek;
                    
                    return (
                      <div 
                        key={i}
                        className={`aspect-square rounded-lg md:rounded-2xl flex items-center justify-center text-[8px] sm:text-[10px] md:text-xs font-black transition-all duration-500 border relative ${
                          isCompleted ? 'bg-purple-50 text-purple-400 border-purple-50 scale-95 opacity-70' :
                          isCurrent ? 'bg-purple-gradient text-white border-transparent shadow-xl scale-110 z-10 ring-2 ring-purple-100 animate-pulse' :
                          'bg-slate-50 text-slate-300 border-slate-100'
                        }`}
                      >
                        {weekNum}
                        {isCurrent && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 md:w-3 h-2 md:h-3 bg-green-500 rounded-full border border-white shadow-sm"></span>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex flex-row flex-wrap gap-3 mt-8 p-3 md:p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 md:w-3 md:h-3 rounded-full bg-purple-100 border border-purple-200"></div>
                    <span className="text-[7px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">{isEn ? 'Done' : 'Kryer'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 md:w-3 md:h-3 rounded-full bg-purple-600"></div>
                    <span className="text-[7px] md:text-[10px] font-black text-purple-700 uppercase tracking-widest">{isEn ? 'Active' : 'Aktive'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 md:w-3 md:h-3 rounded-full bg-slate-200"></div>
                    <span className="text-[7px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{isEn ? 'E Ardhme' : 'Future'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Tiles - Balanced sizing for mobile */}
            <div className="grid sm:grid-cols-2 gap-4 md:gap-8">
              <div className="bg-slate-900 text-white rounded-[24px] md:rounded-[40px] p-5 md:p-10 flex flex-col justify-between group overflow-hidden relative min-h-[160px] md:min-h-[220px]">
                <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <h4 className="text-base md:text-xl font-black mb-1.5 md:mb-3">{isEn ? 'Personalized Plan' : 'Plani i Personalizuar'}</h4>
                  <p className="text-slate-400 text-[10px] md:text-sm font-medium leading-relaxed max-w-[180px]">
                    {isEn ? 'View your full digital treatment simulation.' : 'Shikoni simulimin tuaj të plotë digjital.'}
                  </p>
                </div>
                <a 
                  href={PERSONALIZED_PLAN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-10 mt-4 md:mt-8 flex items-center gap-2 font-black text-[10px] md:text-sm text-purple-400 hover:text-white transition-colors"
                >
                  {isEn ? 'Open 3D Viewer' : 'Hap Shikuesin 3D'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </a>
              </div>

              <div className="bg-white border border-slate-100 rounded-[24px] md:rounded-[40px] p-5 md:p-10 flex flex-col justify-between group min-h-[160px] md:min-h-[220px] shadow-sm">
                <div>
                  <h4 className="text-base md:text-xl font-black text-slate-900 mb-1.5 md:mb-3">{isEn ? 'Specialist Care' : 'Kujdesi Specialist'}</h4>
                  <p className="text-slate-500 text-[10px] md:text-sm font-medium leading-relaxed max-w-[180px]">
                    {isEn ? 'Direct line to our orthodontic team.' : 'Linjë direkte me ekipin tonë.'}
                  </p>
                </div>
                <a 
                  href="https://wa.me/38349772307" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-4 md:mt-8 flex items-center gap-2 font-black text-[10px] md:text-sm text-green-600 hover:text-green-700 transition-colors"
                >
                  {isEn ? 'Contact WhatsApp' : 'Kontakto në WhatsApp'}
                  <div className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-6 md:space-y-8">
            {/* Appointment Widget - Touch optimized */}
            <div className="bg-white rounded-[24px] md:rounded-[40px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.02)] border border-slate-100">
              <h4 className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 md:mb-8">{isEn ? 'Upcoming Visit' : 'Vizita e Ardhshme'}</h4>
              <div className="flex items-start gap-4 md:gap-5 mb-6 md:mb-8">
                <div className="w-10 md:w-12 h-10 md:h-12 bg-purple-50 rounded-xl md:rounded-[20px] flex items-center justify-center text-purple-700 flex-shrink-0 shadow-sm border border-purple-100">
                  <svg className="w-5 md:w-6 h-5 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="font-black text-slate-900 text-sm md:text-base leading-tight mb-1">{isEn ? 'Clinical Progress' : 'Progresi Klinik'}</p>
                  <p className="text-[10px] md:text-xs text-slate-500 font-bold tracking-tight">Nov 12, 14:00 • Meident</p>
                </div>
              </div>
              <button className="w-full py-3.5 md:py-4 bg-slate-50 text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 hover:text-purple-700 transition-all border border-transparent">
                {isEn ? 'Reschedule' : 'Ndrysho Oraren'}
              </button>
            </div>

            {/* Checklist Widget */}
            <div className="bg-purple-gradient rounded-[24px] md:rounded-[40px] p-6 text-white shadow-xl shadow-purple-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 md:w-24 h-20 md:h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <h4 className="text-[8px] md:text-[10px] font-black text-purple-200 uppercase tracking-widest mb-5 md:mb-6">{isEn ? 'Daily Success' : 'Suksesi Ditore'}</h4>
              <ul className="space-y-4">
                {[
                  { text: isEn ? "22h Daily Wear" : "22h Mbajtje" },
                  { text: isEn ? "Aligner Rinse" : "Pastrimi i Aligner" },
                  { text: isEn ? "Case Storage" : "Ruajtja në Kuti" }
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 md:gap-4 text-[10px] md:text-[11px] font-bold items-center">
                    <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-2.5 h-2.5 md:w-3 md:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="opacity-90">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tip - Hidden on smallest mobile if space is tight, or just kept small */}
            <div className="relative group overflow-hidden rounded-[24px] md:rounded-[40px] border border-slate-100">
              <img src={BRAND_ASSET} className="w-full aspect-[4/3] sm:aspect-square object-cover grayscale opacity-80" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-950/95 via-purple-900/40 to-transparent flex flex-col justify-end p-5 md:p-8">
                <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-purple-400 animate-pulse"></div>
                  <p className="text-[8px] md:text-[10px] font-black text-purple-200 uppercase tracking-[0.2em]">{isEn ? 'Specialist Tip' : 'Këshillë'}</p>
                </div>
                <p className="text-white font-bold text-[10px] md:text-sm leading-relaxed italic">
                  "{isEn ? 'Consistency is the key to your perfect smile.' : 'Konsistenca është çelësi i buzëqeshjes tënde.'}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};