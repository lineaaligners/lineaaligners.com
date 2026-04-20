import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile 
} from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { ProgressBar } from './ProgressBar';
import { Stethoscope, User, ArrowLeft, Loader2 } from 'lucide-react';

export const Auth: React.FC = () => {
  const [step, setStep] = useState<'choice' | 'login' | 'register'>('choice');
  const [role, setRole] = useState<'doctor' | 'patient' | null>(null);
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
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email,
        name,
        role,
        createdAt: serverTimestamp()
      });
      
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
        {step === 'choice' && (
          <motion.div 
            key="choice"
            variants={containerVariants}
            initial="hidden" animate="visible" exit="exit"
            className="w-full max-w-xl space-y-12 text-center relative z-10"
          >
            <div className="space-y-4">
              <h1 className="text-8xl font-black tracking-tighter italic text-white uppercase leading-none">LINE<span className="text-royal">A</span></h1>
              <p className="text-white/40 font-bold uppercase tracking-[0.4em] text-[10px]">Managed Aligner Ecosystem</p>
            </div>

            <div className="space-y-8">
              <p className="text-3xl font-black tracking-tighter italic">Select your professional path</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <button 
                  onClick={() => { setRole('doctor'); setStep('register'); }}
                  className="group relative h-80 bg-white/5 backdrop-blur-2xl rounded-[40px] border border-white/5 overflow-hidden transition-all hover:border-royal/50 hover:bg-white/10 flex flex-col items-center justify-center gap-6"
                >
                  <div className="p-8 bg-royal/10 rounded-[32px] group-hover:scale-110 transition-transform">
                    <Stethoscope className="w-12 h-12 text-royal" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xl font-black uppercase italic">Surgeon</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 italic">Provider Access</p>
                  </div>
                </button>

                <button 
                  onClick={() => { setRole('patient'); setStep('register'); }}
                  className="group relative h-80 bg-white/5 backdrop-blur-2xl rounded-[40px] border border-white/5 overflow-hidden transition-all hover:border-[#87CEEB]/50 hover:bg-white/10 flex flex-col items-center justify-center gap-6"
                >
                  <div className="p-8 bg-[#87CEEB]/10 rounded-[32px] group-hover:scale-110 transition-transform">
                    <User className="w-12 h-12 text-[#87CEEB]" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xl font-black uppercase italic">Patient</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 italic">Journey Portal</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-6">
              <button 
                onClick={() => setStep('login')}
                className="text-white/40 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all"
              >
                Already registered? <span className="text-royal">Connect Now</span>
              </button>
            </div>
          </motion.div>
        )}

        {(step === 'login' || step === 'register') && (
          <motion.div 
            key={step}
            variants={containerVariants}
            initial="hidden" animate="visible" exit="exit"
            className="w-full max-w-lg bg-white/5 backdrop-blur-2xl rounded-[50px] p-16 border border-white/5 shadow-2xl relative z-10 overflow-hidden"
          >
            {loading && (
              <div className="absolute top-0 left-0 w-full z-10">
                <ProgressBar progress={progress} height="h-1.5" showPercentage={false} />
              </div>
            )}

            <button 
              onClick={() => { setStep('choice'); setLoading(false); }}
              className="mb-10 p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-white/40 hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            
            <div className="space-y-10">
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tighter italic uppercase">
                  {step === 'login' ? 'Portal Access' : `New ${role === 'doctor' ? 'Professional' : 'Patient'}`}
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">
                  {step === 'login' ? 'Credential Verification' : 'Portal Account Setup'}
                </p>
              </div>

              <form onSubmit={step === 'login' ? handleLogin : handleRegister} className="space-y-6">
                {step === 'register' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-white/40">Full Name</label>
                    <input 
                      required type="text" value={name} onChange={e => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-[24px] p-6 text-sm font-bold focus:border-royal/50 outline-none"
                      placeholder="Dr. John Doe / Patient Name"
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
