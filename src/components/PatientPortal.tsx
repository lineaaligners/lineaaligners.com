import React, { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  orderBy,
  doc
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, 
  Activity, 
  Calendar, 
  ShieldCheck, 
  FileText, 
  Download,
  Stethoscope,
  ChevronRight,
  Clock
} from 'lucide-react';
import { ScreenLoader, ProgressBar } from './ProgressBar';

interface Scan {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadDate: any;
  fileType: string;
}

export const PatientPortal: React.FC<{ currentUser: any }> = ({ currentUser }) => {
  const [assignedScans, setAssignedScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!currentUser) return;

    // Load patient profile
    const unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), (doc) => {
      setProfile(doc.data());
    });

    // Load assigned scans through query
    const q = query(
      collection(db, 'scans'),
      where('assignedTo', 'array-contains', currentUser.uid),
      orderBy('uploadDate', 'desc')
    );

    const unsubScans = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Scan));
      setAssignedScans(docs);
      setLoading(false);
    });

    return () => {
      unsubProfile();
      unsubScans();
    };
  }, [currentUser]);

  if (loading) return <ScreenLoader message="Fetching your clinical journey..." />;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative group/header">
        {/* Floating Accent for selected area */}
        <div className="absolute -left-12 top-0 bottom-0 w-1 hidden xl:block overflow-hidden rounded-full py-2">
            <div className="w-full h-12 bg-sky animate-float shadow-[0_0_15px_rgba(135,206,235,0.6)]" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-sky" />
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">My Journey</h1>
          </div>
          <p className="text-white/40 text-xs font-black uppercase tracking-[0.3em]">Patient Clinical Monitoring Portal</p>
        </div>
        
        <button 
          onClick={() => auth.signOut()}
          className="group flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
        >
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Terminate Session</span>
          <LogOut className="w-4 h-4 text-white/40" />
        </button>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel rounded-[40px] p-10 flex flex-col md:flex-row gap-10 items-center overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-royal/10 blur-[100px] -z-10" />
          <div className="w-32 h-32 rounded-full border-4 border-royal/20 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full border-4 border-royal border-t-transparent animate-spin" />
            <span className="text-3xl font-black italic">65<span className="text-xs">%</span></span>
          </div>
          <div className="flex-1 space-y-4 text-center md:text-left">
            <h2 className="text-3xl font-black tracking-tight">Active Treatment <span className="text-royal">Phase 02</span></h2>
            <p className="text-white/60 text-sm font-medium leading-relaxed">
              Your alignment is proceeding as planned. Next appointment: 12th May.
            </p>
            <div className="pt-2">
              <ProgressBar progress={65} label="Alignment Completion" statusText="Moving" />
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-[40px] p-10 flex flex-col justify-between space-y-8">
          <div className="space-y-4 text-center">
            <div className="p-4 bg-sky/10 rounded-3xl w-fit mx-auto">
              <ShieldCheck className="w-8 h-8 text-sky" />
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter">Secure Vault</h3>
            <p className="text-[10px] font-black text-white/40 tracking-widest uppercase">HIPAA Compliant Records</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">System Ready</span>
          </div>
        </div>
      </div>

      {/* Scan Display */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase tracking-widest italic flex items-center gap-3">
             Assigned <span className="text-sky">Records</span>
          </h2>
          <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">{assignedScans.length} Items Total</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <AnimatePresence>
            {assignedScans.map((scan, i) => (
              <motion.div 
                key={scan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group glass-panel rounded-[36px] overflow-hidden hover:bg-white/[0.07] transition-all flex flex-col p-2"
              >
                <div className="aspect-video bg-navy/40 rounded-[28px] overflow-hidden relative">
                   <div className="absolute inset-0 flex items-center justify-center">
                      <FileText className="w-12 h-12 text-white/5" />
                   </div>
                   <div className="absolute inset-0 bg-gradient-to-t from-navy to-transparent opacity-60" />
                   <div className="absolute bottom-4 left-6">
                      <p className="text-xs font-black uppercase tracking-widest text-sky">{scan.fileType}</p>
                   </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                       <h3 className="font-black text-sm uppercase tracking-tight truncate w-48">{scan.fileName}</h3>
                       <div className="flex items-center gap-2 text-[10px] font-black uppercase text-white/20 tracking-widest">
                         <Calendar className="w-3 h-3" />
                         {new Date(scan.uploadDate?.toDate()).toLocaleDateString()}
                       </div>
                    </div>
                  </div>

                  <a 
                    href={scan.fileUrl} 
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-4 bg-white/5 hover:bg-sky/20 border border-white/5 rounded-2xl transition-all group/btn"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-xl group-hover/btn:bg-white/10">
                        <Download className="w-4 h-4 text-white/60" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Download Record</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover/btn:text-sky transition-all" />
                  </a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {assignedScans.length === 0 && (
            <div className="col-span-full py-20 glass-panel rounded-[40px] flex flex-col items-center justify-center space-y-4 border-dashed">
               <div className="p-6 bg-white/5 rounded-full">
                  <Clock className="w-8 h-8 text-white/20" />
               </div>
               <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Clinical scans awaiting doctor assignment</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
