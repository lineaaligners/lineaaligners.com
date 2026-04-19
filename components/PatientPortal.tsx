
import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut 
} from 'firebase/auth';
import { 
  CheckCircle,
  FileText,
  Download,
  ExternalLink,
  Eye,
  File,
  Settings
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp, collection, onSnapshot, query, orderBy, where, getDocs, addDoc } from 'firebase/firestore';
import { WHATSAPP_URL, ALIGNMENT_ASSET } from '../constants';

type PortalMode = 'login' | 'signup' | 'forgot' | 'roleSelection';

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

interface UserData {
  name: string;
  email: string;
  status: string;
  role?: string;
  createdAt: any;
}

const PERSONALIZED_PLAN_URL = "https://webviewer2.archform.com/?name=Leart_Tredhaku&data=eyJtb2RlIjoiQWR2YW5jZWQiLCJkb3dubG9hZFVybCI6ImFIUjBjSE02THk5aGNtTm9abTl5YlMxM1pXSXRjMmhoY21WaFlteGxMbk16TFdGalkyVnSaWEpoZEdVdVlXMWhlbTl1WVhkekxtTnZiUzkzWldJdGRtbGxkMlZ5TDNWekxXVmhjM1F0TWpvNVpUVmlNMlV6T1MwMlpHSmlMV015WWpndE1qZ3paQzB3WlRNd1lqRTRNemc0Tmpndk16aFJZek5IY2pCMVVuZDVOVGhuYjFGQmVWUlJRMlU0YlhkMkwzTmxkSFZ3WDJacGJHVXZNemhSWXpOS1FXOVVaRXR4VjBaRFVVaHhkM2d6WWxoSFNuZDZMbnBwY0E9PSJ9";

interface DocumentRecord {
  id: string;
  name: string;
  fileName: string;
  fileType: string;
  category: string;
  fileSize: number;
  downloadUrl: string;
  uploadedBy: string;
  createdAt: any;
}

export const PatientPortal: React.FC<{ 
  onBack: () => void; 
  language: 'en' | 'sq';
  isAdmin?: boolean;
  onAdminClick?: () => void;
}> = ({ onBack, language, isAdmin, onAdminClick }) => {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [assignedScans, setAssignedScans] = useState<any[]>([]);
  const [mode, setMode] = useState<PortalMode>('login');
  const [selectedRole, setSelectedRole] = useState<'doctor' | 'patient'>('patient');
  const [loading, setLoading] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const isEn = language === 'en';

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const uData = docSnap.data() as UserData;
          setUserData(uData);
        }

        // Fetch specifically assigned scans
        const scansQuery = query(collection(db, 'scans'), where('assignedTo', 'array-contains', u.uid));
        const unsubscribeScans = onSnapshot(scansQuery, (snapshot) => {
          setAssignedScans(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Fetch patient-specific documents
        try {
          const patientsQuery = query(collection(db, 'patients'), where('userId', '==', u.uid));
          const patientsSnap = await getDocs(patientsQuery);
          
          if (!patientsSnap.empty) {
            const patientId = patientsSnap.docs[0].id;
            const docsQuery = query(collection(db, 'patients', patientId, 'documents'), orderBy('createdAt', 'desc'));
            const unsubscribeDocs = onSnapshot(docsQuery, (snapshot) => {
              setDocuments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DocumentRecord)));
            });
            return () => {
              unsubscribeDocs();
              unsubscribeScans();
            };
          }
        } catch (err) {
          console.error("Error fetching docs:", err);
        }
      } else {
        setUserData(null);
        setDocuments([]);
        setAssignedScans([]);
      }
    });
    return unsubscribe;
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, emailInput, passwordInput);
    } catch (err: any) {
      console.error(err);
      setError(isEn ? "Invalid credentials. Please contact clinic if you haven't registered." : "Kredencialet e gabuara. Na kontaktoni nëse nuk jeni regjistruar.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userRef = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userRef.user.uid), {
        name: nameInput || 'New User',
        email: emailInput,
        status: 'active',
        role: selectedRole,
        createdAt: serverTimestamp()
      });

      // If user is a patient, also create a patient record for doctor relation
      if (selectedRole === 'patient') {
        const pRelData = {
          patientId: userRef.user.uid,
          doctorId: 'default_admin', // Initially unassigned or linked to admin
          patientName: nameInput || 'New Patient',
          patientEmail: emailInput,
          assignedScans: [],
          registrationDate: serverTimestamp()
        };
        await addDoc(collection(db, 'doctor_patients'), pRelData);
      }

      setSuccessMessage(isEn ? "Account created successfully!" : "Llogaria u krijua me sukses!");
      setMode('login');
      window.location.reload(); // Refresh to trigger App role check
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/weak-password') {
        setError(isEn ? "Password must be at least 6 characters long." : "Fjalëkalimi duhet të jetë së paku 6 karaktere.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError(isEn ? "This email is already registered. Try logging in." : "Ky email është regjistruar tashmë. Provoni të kyçeni.");
      } else {
        setError(err.message || (isEn ? "Registration failed." : "Regjistrimi dështoi."));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, emailInput);
      setSuccessMessage(isEn ? "Password reset link sent! Check your inbox." : "Linku i rivendosjes u dërgua! Kontrolloni email-in.");
      setMode('login');
    } catch (err: any) {
      console.error(err);
      setError(isEn ? "Failed to send reset email." : "Dërgimi i email-it dështoi.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
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

  const currentWeek = 1; 
  const totalWeeks = 24;
  const progress = (currentWeek / totalWeeks) * 100;
  const currentPhase = phases.find(p => currentWeek >= p.weeks[0] && currentWeek <= p.weeks[1]) || phases[0];

  if (!user) {
    return (
      <div className="min-h-screen pt-20 pb-12 bg-[#193D6D] relative overflow-hidden flex items-center justify-center px-4">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4169E1]/5 rounded-full blur-[100px] animate-pulse"></div>
        
        <div className="max-w-md w-full relative z-10 animate-scale-in">
          <button onClick={onBack} className="mb-6 flex items-center gap-2 text-white/50 font-black hover:text-[#87CEEB] transition-all uppercase text-[10px] tracking-widest focus:outline-none group">
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            {isEn ? 'Back to Home' : 'Kthehu në Kreu'}
          </button>
          
          <div className="bg-[#142A4D] rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] p-8 md:p-12 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#4169E1]"></div>
            
            <div className="text-center mb-10 pt-4">
              <h1 className="text-3xl font-black text-white tracking-tight mb-3 uppercase tracking-widest">
                {mode === 'login' && (isEn ? 'Portal Access' : 'Hyrja në Portal')}
                {mode === 'roleSelection' && (isEn ? 'Choose Role' : 'Zgjidhni Rolin')}
                {mode === 'signup' && (isEn ? 'Registration' : 'Regjistrimi')}
                {mode === 'forgot' && (isEn ? 'Reset Password' : 'Rivendos Fjalëkalimin')}
              </h1>
              <p className="text-white/60 font-medium text-sm leading-relaxed max-w-[280px] mx-auto">
                {mode === 'login' && (isEn ? 'Access your personalized dashboard.' : 'Hyni në panelin tuaj të personalizuar.')}
                {mode === 'roleSelection' && (isEn ? 'Are you a Doctor or a Patient?' : 'Jeni Mjek apo Pacient?')}
                {mode === 'signup' && (isEn ? `Registering as a ${selectedRole}` : `Po regjistroheni si ${selectedRole === 'doctor' ? 'Mjek' : 'Pacient'}`)}
                {mode === 'forgot' && (isEn ? 'Enter your email to receive a reset link.' : 'Shënoni email-in për të pranuar linkun.')}
              </p>
            </div>

            {successMessage && <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-2xl text-center animate-fade-in">{successMessage}</div>}
            {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-2xl text-center animate-shake">{error}</div>}
            
            {mode === 'roleSelection' ? (
              <div className="space-y-4">
                <button 
                  onClick={() => { setSelectedRole('doctor'); setMode('signup'); }}
                  className="w-full flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-[#4169E1]/20 hover:border-[#4169E1] transition-all group"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 bg-[#4169E1] rounded-2xl flex items-center justify-center text-white">
                       <Settings className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-white tracking-tight">{isEn ? "I'm a Doctor" : "Jam Mjek"}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">{isEn ? "Manage Scans" : "Menaxhoni Skanimet"}</p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-[#4169E1] opacity-0 group-hover:opacity-100" />
                </button>

                <button 
                  onClick={() => { setSelectedRole('patient'); setMode('signup'); }}
                  className="w-full flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-[#4169E1]/20 hover:border-[#4169E1] transition-all group"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 bg-[#87CEEB] rounded-2xl flex items-center justify-center text-[#193D6D]">
                       <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-white tracking-tight">{isEn ? "I'm a Patient" : "Jam Pacient"}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">{isEn ? "View Progress" : "Shihni Përparimin"}</p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-[#87CEEB] opacity-0 group-hover:opacity-100" />
                </button>

                <button 
                  onClick={() => setMode('login')}
                  className="w-full py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.4em] hover:text-[#87CEEB] transition-colors"
                >
                  {isEn ? "Already have an account?" : "Keni një llogari?"}
                </button>
              </div>
            ) : (
              <form onSubmit={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleResetPassword} className="space-y-5">
                {mode === 'signup' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">{isEn ? 'Full Name' : 'Emri i Plotë'}</label>
                    <input type="text" required value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-5 py-4 text-sm font-black text-white outline-none focus:border-[#4169E1] transition-all" placeholder="John Doe" />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">{isEn ? 'Email Address' : 'Adresa e Email-it'}</label>
                  <input type="email" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-5 py-4 text-sm font-black text-white outline-none focus:border-[#4169E1] transition-all" placeholder="your@email.com" />
                </div>
                {mode !== 'forgot' && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">{isEn ? 'Password' : 'Fjalëkalimi'}</label>
                      <span className={`text-[9px] font-black uppercase tracking-tighter ${passwordInput.length < 6 ? 'text-red-400' : 'text-green-400 opacity-60'}`}>
                        {passwordInput.length < 6 ? (isEn ? 'Min. 6 chars' : 'Min. 6 karaktere') : (isEn ? 'Valid length' : 'Gjatësi valide')}
                      </span>
                    </div>
                    <input type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-5 py-4 text-sm font-black text-white outline-none focus:border-[#4169E1] transition-all" placeholder="••••••••" />
                  </div>
                )}
                
                <button 
                  type="submit" 
                  disabled={loading || (mode !== 'forgot' && passwordInput.length < 6)} 
                  className="w-full bg-[#4169E1] text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-900/40 transition-all disabled:opacity-50 mt-4 uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95"
                >
                  {loading ? <div className="w-6 h-6 border-3 border-white border-t-transparent animate-spin rounded-full"></div> : (
                    <>
                      <span>{mode === 'login' ? (isEn ? 'Sign In' : 'Kyçu') : mode === 'signup' ? (isEn ? 'Complete Sign Up' : 'Përfundo Regjistrimin') : (isEn ? 'Send Link' : 'Dërgo Linkun')}</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-12 pt-10 border-t border-white/10 flex flex-col gap-8 w-full">
              {mode === 'login' ? (
                <>
                  <button 
                    onClick={() => { setMode('roleSelection'); setError(null); setSuccessMessage(null); }} 
                    className="group w-full py-5 rounded-2xl border-2 border-[#87CEEB]/10 text-[#87CEEB] hover:text-white font-black text-xs uppercase tracking-[0.25em] transition-all hover:bg-[#4169E1]/10 hover:border-[#87CEEB]/40 flex items-center justify-center gap-3 active:scale-[0.98] shadow-2xl shadow-black/20"
                  >
                    <span>{isEn ? 'Create New Account' : 'Krijoni Llogari të Re'}</span>
                    <svg className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </button>
                  <button 
                    onClick={() => { setMode('forgot'); setError(null); setSuccessMessage(null); }} 
                    className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] hover:text-[#87CEEB] transition-all text-center self-center"
                  >
                    {isEn ? 'Forgot password?' : 'Harruat fjalëkalimin?'}
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => { setMode('login'); setError(null); setSuccessMessage(null); }} 
                  className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] hover:text-[#87CEEB] transition-all text-center self-center"
                >
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8 animate-stagger-1 text-white">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              {userData?.status === 'active' ? (isEn ? 'Active Treatment' : 'Trajtim Aktiv') : (isEn ? 'Treatment Pending' : 'Trajtimi në Pritje')}
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-none">
              {userData?.name || user.email}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {isAdmin && (
              <button 
                onClick={onAdminClick}
                className="group flex items-center gap-3 text-red-400 font-black text-xs hover:text-white transition-all uppercase tracking-[0.2em] py-4 px-8 rounded-3xl border-2 border-red-500/30 hover:border-red-500 hover:bg-red-500 transition-all bg-red-500/10 shadow-[0_20px_40px_rgba(239,68,68,0.2)]"
              >
                <Settings className="w-4 h-4" />
                <span>{isEn ? 'Admin Panel' : 'Paneli Admin'}</span>
              </button>
            )}
            <button 
              onClick={handleLogout} 
              className="group flex items-center gap-3 text-white/50 font-black text-sm hover:text-red-400 transition-all uppercase tracking-[0.2em] py-3 px-6 rounded-2xl border-2 border-white/10 hover:border-red-500/30 hover:bg-red-500/10 bg-white/5 shadow-sm"
            >
            <span>{isEn ? 'Log out' : 'Çkyçu'}</span>
            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
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
              </div>
            </div>
            
            <div className="bg-[#111827] text-white rounded-[60px] p-10 md:p-16 flex flex-col md:flex-row justify-between items-center group overflow-hidden relative shadow-2xl border-4 border-white/5 animate-stagger-3">
              <div className="relative z-10 text-center md:text-left">
                <h4 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter leading-tight">{isEn ? 'Interactive' : 'Evolucioni'}<br/>{isEn ? 'Simulation.' : 'Interaktiv.'}</h4>
                <p className="text-white/60 text-lg font-bold max-w-sm mb-12 leading-relaxed opacity-80">
                  {isEn ? 'Experience the digital blueprint of your transformation.' : 'Përjetoni hartën digjitale të transformimit tuaj.'}
                </p>
                <a 
                  href={ALIGNMENT_ASSET} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-5 bg-white text-[#193D6D] px-14 py-7 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] hover:bg-[#87CEEB] transition-all shadow-xl"
                >
                  {isEn ? 'Launch Viewer' : 'Hap Shikuesin'}
                </a>
              </div>
            </div>

            <div className="bg-[#142A4D]/50 rounded-[60px] p-10 md:p-14 border border-white/5 animate-stagger-4">
              <h4 className="text-[10px] font-black text-[#87CEEB] uppercase tracking-[0.4em] mb-12 flex items-center gap-4">
                <span className="w-8 h-px bg-[#87CEEB]/30"></span>
                {isEn ? 'Treatment Roadmap' : 'Rrugëtimi i Trajtimit'}
              </h4>
              <div className="space-y-12">
                {phases.map((phase) => (
                  <div key={phase.id} className={`relative pl-12 border-l-2 ${currentPhase.id >= phase.id ? 'border-[#4169E1]' : 'border-white/10'}`}>
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${currentPhase.id >= phase.id ? 'bg-[#4169E1] border-[#4169E1]' : 'bg-[#193D6D] border-white/20'}`}></div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                          {isEn ? `Week ${phase.weeks[0]} - ${phase.weeks[1]}` : `Java ${phase.weeks[0]} - ${phase.weeks[1]}`}
                        </span>
                        <h5 className="text-2xl font-black text-white tracking-tight">{phase.name}</h5>
                        <p className="text-white/60 text-sm font-medium leading-relaxed max-w-md">{phase.desc}</p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                         {phase.milestones.map((ms, idx) => (
                           <div key={idx} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black text-white/60 uppercase tracking-widest whitespace-nowrap">
                             {ms.label}
                           </div>
                         ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-10 animate-stagger-2">
            <div className="bg-[#142A4D] rounded-[48px] p-10 shadow-2xl border border-white/5">
              <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-12 border-b border-white/5 pb-5 uppercase tracking-widest">{isEn ? 'Clinic Status' : 'Statusi i Klinikës'}</h4>
              <p className="font-black text-3xl text-white leading-none mb-3">Medident Peja</p>
              <p className="text-sm text-white/50 font-black uppercase tracking-[0.15em] opacity-80 mb-8">{isEn ? 'Authorized Center' : 'Qendra e Autorizuar'}</p>
              <button 
                onClick={() => window.open(WHATSAPP_URL, '_blank')}
                className="w-full py-6 bg-white/5 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-3xl hover:bg-[#4169E1] hover:text-white transition-all border border-white/5"
              >
                {isEn ? 'Contact Support' : 'Kontakto Mbështetjen'}
              </button>
            </div>

            {/* Documents Section */}
            <div className="bg-[#0F172A] rounded-[48px] p-10 shadow-2xl border border-white/10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#4169E1]/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#4169E1]/20 transition-all"></div>
               <h4 className="text-[10px] font-black text-[#87CEEB] uppercase tracking-[0.3em] mb-10 flex items-center justify-between">
                 {isEn ? 'Shared Documents' : 'Dokumentet e Ndara'}
                 <FileText className="w-4 h-4 opacity-50" />
               </h4>
               
               <div className="space-y-4">
                 {assignedScans.length === 0 && documents.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center gap-4 text-center px-6">
                       <div className="p-4 bg-white/5 rounded-2xl">
                         <File className="w-8 h-8 text-white/20" />
                       </div>
                       <p className="text-sm font-medium text-white/30 max-w-[200px]">
                         {isEn ? 'Your clinical scans and records will appear here.' : 'Dokumentet tuaja do të shfaqen këtu.'}
                       </p>
                    </div>
                  ) : (
                    <>
                      {assignedScans.map((scan) => (
                        <div 
                          key={scan.id} 
                          className="p-4 bg-white/5 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all hover:bg-white/[0.07] group/doc cursor-pointer animate-fade-in"
                          onClick={() => window.open(scan.fileUrl, '_blank')}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500">
                                  {scan.fileType === 'pdf' ? <FileText size={20} /> : <Eye size={20} />}
                               </div>
                               <div>
                                  <p className="font-bold text-sm text-white">{scan.fileName}</p>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-[#87CEEB] mt-0.5">Clinical Scan • {scan.fileType}</p>
                               </div>
                            </div>
                            <Download className="w-4 h-4 text-white/20" />
                          </div>
                        </div>
                      ))}
                      {documents.map((doc, idx) => (
                        <div 
                         key={doc.id} 
                         className="p-4 bg-white/5 rounded-3xl border border-white/5 hover:border-[#4169E1]/30 transition-all hover:bg-white/[0.07] group/doc cursor-pointer animate-fade-in"
                         style={{ animationDelay: `${idx * 0.1}s` }}
                         onClick={() => {
                           const win = window.open();
                           win?.document.write(`
                             <html>
                               <head><title>${doc.name}</title></head>
                               <body style="margin:0; padding:0; background:#193D6D">
                                 <iframe src="${doc.downloadUrl}" frameborder="0" style="width:100%; height:100vh;" allowfullscreen></iframe>
                               </body>
                             </html>
                           `);
                         }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-[#4169E1]/20 rounded-2xl flex items-center justify-center text-[#4169E1] group-hover/doc:bg-[#4169E1] group-hover/doc:text-white transition-all">
                                <FileText size={20} />
                              </div>
                              <div>
                                <p className="font-black text-sm text-white/90 group-hover/doc:text-white transition-colors">{doc.name}</p>
                                <p className="text-[9px) font-black uppercase tracking-widest text-white/30 mt-0.5">{doc.fileName}</p>
                              </div>
                            </div>
                            <Eye className="w-4 h-4 text-white/20 group-hover/doc:text-[#87CEEB] transition-all" />
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
