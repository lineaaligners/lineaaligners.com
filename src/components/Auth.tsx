import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { setDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { ProgressBar } from './ProgressBar';
import { Stethoscope, User, ArrowLeft, Loader2 } from 'lucide-react';

export const Auth: React.FC = () => {
  const [step, setStep] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'doctor' | 'patient'>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleAuthProgress = (val: number) => {
    setLoading(true);
    setProgress(val);
  };

  const handleGoogleLogin = async () => {
    setError('');
    handleAuthProgress(20);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setProgress(60);
      
      // Check if user has a profile, if not create one as patient by default
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          name: result.user.displayName || 'Unnamed User',
          role: 'patient',
          status: 'active',
          createdAt: serverTimestamp(),
          currentAligner: 1,
          totalAligners: 20,
          nextAlignerChange: null,
          clinicName: 'Medident Dental Clinic',
          clinicAddress: 'Prishtina, Kosovo',
          registrationDate: serverTimestamp()
        });
      }
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setLoading(false);
      setProgress(0);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    handleAuthProgress(10);

    try {
      setProgress(30);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setProgress(60);
      
      await updateProfile(userCredential.user, { displayName: name });
      
      setProgress(85);
      const profileData: any = {
        uid: userCredential.user.uid,
        email,
        name,
        role,
        status: 'active',
        createdAt: serverTimestamp(),
        registrationDate: serverTimestamp()
      };

      if (role === 'patient') {
        profileData.currentAligner = 1;
        profileData.totalAligners = 20;
        profileData.clinicName = 'Medident Dental Clinic';
        profileData.clinicAddress = 'Prishtina, Kosovo';
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), profileData);
      
      setProgress(100);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      setProgress(0);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    handleAuthProgress(20);

    try {
      setProgress(60);
      await signInWithEmailAndPassword(auth, email, password);
      setProgress(100);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      setProgress(0);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-white font-sans selection:bg-royal/30 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-royal/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#87CEEB]/5 blur-[150px] rounded-full" />
      </div>

      <AnimatePresence mode="wait">
        {(step === 'login' || step === 'register') && (
          <motion.div 
            key={step}
            variants={containerVariants}
            initial="hidden" animate="visible" exit="exit"
            className="w-full max-w-lg bg-white/5 backdrop-blur-2xl rounded-[50px] p-12 md:p-16 border border-white/5 shadow-2xl relative z-10 overflow-hidden"
          >
            {loading && (
              <div className="absolute top-0 left-0 w-full z-10">
                <ProgressBar progress={progress} height="h-1.5" showPercentage={false} />
              </div>
            )}

            <div className="text-center mb-10">
              <h1 className="text-6xl font-black tracking-tighter italic text-white uppercase leading-none mb-2">LINE<span className="text-royal">A</span></h1>
              <p className="text-white/40 font-bold uppercase tracking-[0.4em] text-[8px]">Managed Aligner Ecosystem</p>
            </div>
            
            <div className="space-y-10">
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tighter italic uppercase text-center">
                  {step === 'login' ? 'Portal Access' : 'Create Account'}
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 italic text-center">
                  {step === 'login' ? 'Credential Verification' : 'Start your smile journey'}
                </p>
              </div>

              <form onSubmit={step === 'login' ? handleLogin : handleRegister} className="space-y-6">
                {step === 'register' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-white/40">Full Name</label>
                    <input 
                      required type="text" value={name} onChange={e => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-[24px] p-6 text-sm font-bold focus:border-royal/50 outline-none"
                      placeholder="Your Full Name"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-white/40">Email Address</label>
                  <input 
                    required type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-[24px] p-6 text-sm font-bold focus:border-royal/50 outline-none"
                    placeholder="name@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-white/40">Secure Password</label>
                  <input 
                    required type="password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-[24px] p-6 text-sm font-bold focus:border-royal/50 outline-none"
                    placeholder="••••••••"
                  />
                </div>
                
                {error && <p className="text-red-400 text-[10px] font-black uppercase tracking-widest text-center bg-red-400/10 p-4 rounded-2xl border border-red-400/20">{error}</p>}

                <button 
                  type="submit" disabled={loading}
                  className="w-full bg-royal text-white py-6 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-2xl shadow-royal/20 transition-all hover:bg-royal/80 hover:scale-[1.02] active:scale-[0.98] mt-4 flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (step === 'login' ? 'AUTHORIZE ACCESS' : 'CREATE PORTAL')}
                </button>
              </form>

              <div className="space-y-6 pt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                  <div className="relative flex justify-center text-[10px] font-black"><span className="bg-[#070B14] px-4 text-white/20 uppercase tracking-widest">or continue with</span></div>
                </div>

                <button 
                  onClick={handleGoogleLogin}
                  className="w-full bg-white text-navy font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/90 transition-all shadow-xl"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                  GOOGLE ACCOUNT
                </button>

                <div className="text-center">
                  <button 
                    onClick={() => setStep(step === 'login' ? 'register' : 'login')}
                    className="text-white/40 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all"
                  >
                    {step === 'login' ? "Don't have an account?" : "Already registered?"} <span className="text-royal">{step === 'login' ? 'Create Journey' : 'Connect Now'}</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
