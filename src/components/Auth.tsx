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
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <AnimatePresence mode="wait">
        {step === 'choice' && (
          <motion.div 
            key="choice"
            variants={containerVariants}
            initial="hidden" animate="visible" exit="exit"
            className="w-full max-w-xl space-y-12 text-center"
          >
            <div className="space-y-4">
              <h1 className="text-6xl font-black tracking-tighter italic text-royal uppercase">Linea</h1>
              <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-xs">Authentic Aligner Management</p>
            </div>

            <div className="space-y-6">
              <p className="text-2xl font-black tracking-tight">Select your professional path</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                  onClick={() => { setRole('doctor'); setStep('register'); }}
                  className="group relative h-64 glass-panel rounded-[32px] overflow-hidden transition-all hover:border-royal/50 hover:shadow-[0_0_50px_rgba(65,105,225,0.2)]"
                >
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-royal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative h-full flex flex-col items-center justify-center space-y-4">
                    <div className="p-5 bg-royal/10 rounded-2xl group-hover:scale-110 transition-transform">
                      <Stethoscope className="w-10 h-10 text-royal" />
                    </div>
                    <span className="text-xl font-black uppercase tracking-widest">I'm a Doctor</span>
                  </div>
                </button>

                <button 
                  onClick={() => { setRole('patient'); setStep('register'); }}
                  className="group relative h-64 glass-panel rounded-[32px] overflow-hidden transition-all hover:border-sky/50 hover:shadow-[0_0_50px_rgba(135,206,235,0.2)]"
                >
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-sky/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative h-full flex flex-col items-center justify-center space-y-4">
                    <div className="p-5 bg-sky/10 rounded-2xl group-hover:scale-110 transition-transform">
                      <User className="w-10 h-10 text-sky" />
                    </div>
                    <span className="text-xl font-black uppercase tracking-widest">I'm a Patient</span>
                  </div>
                </button>
              </div>
              <button 
                onClick={() => setStep('login')}
                className="text-white/40 font-black uppercase tracking-widest text-xs hover:text-royal transition-colors"
              >
                Already registered? <span className="underline">Sign in</span>
              </button>
            </div>
          </motion.div>
        )}

        {(step === 'login' || step === 'register') && (
          <motion.div 
            key={step}
            variants={containerVariants}
            initial="hidden" animate="visible" exit="exit"
            className="w-full max-w-md glass-panel rounded-[40px] p-12 space-y-8 relative overflow-hidden"
          >
            {loading && (
              <div className="absolute top-0 left-0 w-full z-10">
                <ProgressBar progress={progress} height="h-1.5" showPercentage={false} />
              </div>
            )}

            <button 
              onClick={() => { setStep('choice'); setLoading(false); }}
              className="absolute top-8 left-8 p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2 pt-4">
              <h2 className="text-3xl font-black tracking-tight">
                {step === 'login' ? 'Welcome Back' : `New ${role === 'doctor' ? 'Professional' : 'Patient'}`}
              </h2>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest italic">
                {step === 'login' ? 'Authentication Required' : 'Portal Account Setup'}
              </p>
            </div>

            <form onSubmit={step === 'login' ? handleLogin : handleRegister} className="space-y-5">
              {step === 'register' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    required type="text" value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-white/5 border-2 border-white/5 rounded-2xl p-5 text-sm font-medium focus:border-royal/50 transition-all outline-none"
                    placeholder="Dr. John Doe / Patient Name"
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  required type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/5 border-2 border-white/5 rounded-2xl p-5 text-sm font-medium focus:border-royal/50 transition-all outline-none"
                  placeholder="name@email.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Secret Key</label>
                <input 
                  required type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/5 border-2 border-white/5 rounded-2xl p-5 text-sm font-medium focus:border-royal/50 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-red-400 text-[10px] font-bold uppercase text-center bg-red-400/10 p-3 rounded-xl border border-red-400/20">{error}</p>}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-royal hover:bg-royal/80 py-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-royal/20 transition-all flex items-center justify-center"
              >
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : (step === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
