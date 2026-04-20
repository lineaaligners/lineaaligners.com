import React, { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  doc,
  addDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, 
  Home, 
  Upload, 
  Calendar, 
  Settings, 
  Search,
  MessageSquare,
  HelpCircle,
  Clock,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  User,
  Shield,
  CreditCard,
  FileText,
  Menu,
  X,
  Stethoscope,
  Info,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { ScreenLoader } from './ProgressBar';

// --- Types ---
interface Scan {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadDate: any;
  fileType: string;
  fileSize?: number;
  thumbnailUrl?: string;
}

interface UserProfile {
  name: string;
  email: string;
  role: 'patient';
  status: string;
  currentAligner?: number;
  totalAligners?: number;
  nextAlignerChange?: any;
  nextAppointmentDate?: any;
  nextVisitUrl?: string;
  doctorName?: string;
  clinicAddress?: string;
  appointmentType?: string;
  treatmentStartDate?: any;
}

// --- Sub-components ---

const ModernProgressBar: React.FC<{ progress: number; label?: string; showPercentage?: boolean }> = ({ 
  progress, 
  label,
  showPercentage = true 
}) => {
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-white">
        {label && <span className="text-sm font-medium opacity-80">{label}</span>}
        {showPercentage && <span className="text-sm font-bold">{Math.round(progress)}% Complete</span>}
      </div>
      <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden relative border border-white/5 shadow-inner">
        <motion.div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#4169E1] to-[#87CEEB] animate-moving-bar rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      </div>
    </div>
  );
};

const SectionCard: React.FC<{ title: string; children: React.ReactNode; className?: string; icon?: any }> = ({ 
  title, 
  children, 
  className = "",
  icon: Icon
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.01, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
    className={`bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 transition-all duration-300 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] ${className}`}
  >
    <div className="flex items-center gap-3 mb-8">
      {Icon && <div className="p-3 bg-white/10 rounded-2xl border border-white/5 shadow-lg"><Icon className="w-6 h-6 text-white" /></div>}
      <h3 className="text-xl font-black text-white tracking-tight uppercase">{title}</h3>
    </div>
    {children}
  </motion.div>
);

const CountdownItem: React.FC<{ value: number; label: string; urgent?: boolean }> = ({ value, label, urgent }) => (
  <div className="text-center group">
    <motion.div 
      key={value}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`text-5xl font-black italic tracking-tighter ${urgent ? 'text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]' : 'text-white'}`}
    >
      {value}
    </motion.div>
    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mt-2 group-hover:text-white transition-colors">{label}</div>
  </div>
);

// --- Main Component ---

export const PatientPortal: React.FC<{ 
  currentUser: any;
  onBack: () => void;
  language: 'en' | 'sq';
}> = ({ currentUser, onBack, language }) => {
  const isEn = language === 'en';
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    // Load patient profile
    const unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setProfile({
          ...data,
          // Mocks for development if missing
          currentAligner: data.currentAligner || 12,
          totalAligners: data.totalAligners || 22,
          nextAlignerChange: data.nextAlignerChange || { toDate: () => new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) },
          nextAppointmentDate: data.nextAppointmentDate || { toDate: () => new Date(Date.now() + 6 * 24 * 60 * 60 * 1000) },
          doctorName: data.doctorName || "Dr. Sarah Smith",
          clinicAddress: data.clinicAddress || "Smile Clinic, Downtown Center",
          appointmentType: data.appointmentType || "Check-up & Adjustment",
          treatmentStartDate: data.treatmentStartDate || { toDate: () => new Date(Date.now() - 84 * 24 * 60 * 60 * 1000) }
        } as UserProfile);
      }
    });

    // Load assigned scans
    const q = query(
      collection(db, 'scans'),
      where('assignedTo', 'array-contains', currentUser.uid),
      orderBy('uploadDate', 'desc')
    );

    const unsubScans = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Scan));
      setScans(docs);
      setLoading(false);
    });

    return () => {
      unsubProfile();
      unsubScans();
    };
  }, [currentUser]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileId = Math.random().toString(36).substring(7);
      const storagePath = `patient_scans/${currentUser.uid}/${fileId}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          console.error("Upload failed", error);
          alert("Upload failed. Please try again.");
          setIsUploading(false);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          await addDoc(collection(db, 'scans'), {
            fileName: file.name,
            fileUrl: downloadURL,
            fileSize: file.size,
            fileType: file.type.startsWith('image/') ? 'image' : 'pdf',
            uploadDate: serverTimestamp(),
            uploadedBy: currentUser.uid,
            assignedTo: [currentUser.uid],
            isProcessed: false
          });
          
          setIsUploading(false);
          alert("Scan uploaded successfully! Your doctor will review it shortly.");
        }
      );
    } catch (err) {
      console.error("Upload failed", err);
      setIsUploading(false);
    }
  };

  if (loading) return <ScreenLoader message="Building your journey..." />;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'upload', label: 'Upload Scan', icon: Upload },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'appointment', label: 'Appointment', icon: Calendar },
    { id: 'instructions', label: 'Instructions', icon: HelpCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const calculateProgress = () => {
    if (!profile) return 0;
    return (profile.currentAligner! / profile.totalAligners!) * 100;
  };

  const getDaysDiff = (date: any) => {
    if (!date) return 0;
    const d = date.toDate();
    const diff = d.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // --- Page Components ---

  const Dashboard = () => (
    <div className="space-y-8 pb-20">
      {/* Hero Header */}
      <div className="space-y-3">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-8xl font-black text-white italic tracking-tighter leading-[0.8]"
        >
          Your Smile<br /><span className="text-[#87CEEB]">Journey.</span>
        </motion.h2>
        <p className="text-white/60 font-black uppercase tracking-widest text-xs">
          Patient Portal • Welcome back, {profile?.name || 'Patient'}
        </p>
      </div>

      {/* Progress Keeper Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Next Aligner Change */}
        <SectionCard title="Aligner Phase" icon={Clock} className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-royal/10 blur-[100px] rounded-full group-hover:bg-royal/30 transition-colors" />
          <div className="flex flex-col h-full justify-between gap-8 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-white italic tracking-tighter">Aligner {profile?.currentAligner}</p>
                <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] mt-2">Stage {profile?.currentAligner} of {profile?.totalAligners}</p>
                <p className="text-sm font-bold text-[#87CEEB] mt-4">Change on {profile?.nextAlignerChange?.toDate().toLocaleDateString()}</p>
              </div>
              <div className="flex gap-4">
                <CountdownItem value={getDaysDiff(profile?.nextAlignerChange)} label="Days Left" urgent={getDaysDiff(profile?.nextAlignerChange) <= 2} />
              </div>
            </div>
            <div className="bg-white/5 border border-white/5 p-6 rounded-[24px] backdrop-blur-md">
              <div className="text-xs font-bold text-white leading-relaxed flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-royal animate-pulse shadow-[0_0_10px_rgba(65,105,225,0.8)]" />
                Your next aligner set is ready for transition.
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Next Appointment */}
        <SectionCard title="Clinical Visit" icon={Calendar} className="relative overflow-hidden group">
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full group-hover:bg-emerald-500/20 transition-colors" />
          <div className="flex flex-col h-full justify-between gap-8 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-white italic tracking-tighter truncate max-w-[200px]">{profile?.doctorName}</p>
                <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] mt-2">{profile?.appointmentType}</p>
              </div>
              <CountdownItem value={getDaysDiff(profile?.nextAppointmentDate)} label="Countdown" urgent={getDaysDiff(profile?.nextAppointmentDate) <= 1} />
            </div>
            <div className="space-y-6 pt-6 border-t border-white/10">
              <div className="space-y-2">
                <p className="text-lg font-black text-[#87CEEB] tracking-tight">{profile?.nextAppointmentDate?.toDate().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                <p className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em]">{profile?.clinicAddress}</p>
              </div>
              <div className="flex flex-wrap gap-4">
                {profile?.nextVisitUrl && (
                  <button 
                    onClick={() => window.open(profile.nextVisitUrl, '_blank')}
                    className="flex-1 min-w-[140px] px-6 py-4 bg-royal text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-royal/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Visit Link
                  </button>
                )}
                <button className="flex-1 min-w-[140px] px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all">Reschedule</button>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Main Stats and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {/* Treatment Progress */}
          <SectionCard title="Overall Progress">
            <div className="space-y-6">
              <ModernProgressBar progress={calculateProgress()} label={`Week ${Math.floor(profile!.currentAligner! * 7 / 7)} of ${profile?.totalAligners}`} />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest italic">Days Completed</p>
                  <p className="text-xl font-black text-white italic tracking-tighter">84 DAYS</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest italic">Journey Assets</p>
                  <p className="text-xl font-black text-white italic tracking-tighter">68 DAYS</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-white/40 font-bold uppercase tracking-wider">Estimated Date</p>
                  <p className="text-xl font-black text-royal">Sept 15</p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Last Scan Section */}
          <SectionCard title="Your Last Scan" icon={Eye}>
            {scans.length > 0 ? (
              <div className="group relative overflow-hidden rounded-2xl border border-white/10">
                <div className="aspect-video bg-white/5 flex items-center justify-center relative overflow-hidden">
                  {scans[0].fileUrl && scans[0].fileType === 'image' ? (
                    <img src={scans[0].fileUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Last scan" />
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-white/20">
                      <FileText className="w-16 h-16" />
                      <span className="font-bold text-sm uppercase tracking-widest">{scans[0].fileType} Document</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 gap-4">
                    <a href={scans[0].fileUrl} target="_blank" rel="noreferrer" className="p-3 bg-white rounded-full text-royal shadow-xl">
                      <Download className="w-5 h-5" />
                    </a>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-bold truncate max-w-[200px] text-white underline underline-offset-4 decoration-royal/30">{scans[0].fileName}</p>
                    <p className="text-xs text-white/40 font-medium italic">Uploaded {scans[0].uploadDate?.toDate().toLocaleDateString()}</p>
                  </div>
                  <div className="text-[10px] font-black text-royal bg-royal/10 px-3 py-1 rounded-full uppercase tracking-widest">
                    {(scans[0].fileSize! / (1024 * 1024)).toFixed(1)} MB
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-4 border-2 border-dashed border-white/10 rounded-2xl">
                 <div className="p-4 bg-white/5 rounded-full w-fit mx-auto"><Upload className="w-8 h-8 text-white/20" /></div>
                 <p className="text-sm font-bold text-white/40">No scans uploaded yet.</p>
                 <button onClick={() => setActiveTab('upload')} className="text-sm font-black text-royal uppercase tracking-widest italic hover:underline">Upload your first scan</button>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-8">
           {/* Care Tips */}
          <SectionCard title="Care Tips" icon={CheckCircle2}>
             <div className="space-y-4">
                {[
                  "Wear aligners 22+ hours per day",
                  "Remove only to eat and drink",
                  "Clean with cool water and soap",
                  "Store in case when not wearing"
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors group">
                    <CheckCircle2 className="w-5 h-5 text-royal flex-shrink-0 group-hover:scale-110 transition-all" />
                    <span className="text-sm font-black text-white italic uppercase tracking-tight">{tip}</span>
                  </div>
                ))}
             </div>
          </SectionCard>

          {/* Quick Actions */}
          <div className="space-y-3">
            <button 
              onClick={() => setActiveTab('upload')}
              className="w-full flex items-center justify-between p-6 bg-royal text-white rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-royal/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span className="flex items-center gap-3"><Upload className="w-5 h-5" /> Upload New Scan</span>
              <ChevronRight className="w-5 h-5" />
            </button>
            <button className="w-full flex items-center justify-between p-6 bg-white/5 border border-white/10 text-white rounded-[24px] font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all">
              <span className="flex items-center gap-3"><MessageSquare className="w-5 h-5 text-royal" /> Message Doctor</span>
              <ChevronRight className="w-5 h-5 opacity-40" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const UploadScan = () => (
    <div className="space-y-8 pb-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-white italic tracking-tighter">Upload Your Scan</h1>
        <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Keep your doctor updated with the latest progress.</p>
      </div>

      <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-[32px] p-12 text-center space-y-6 relative overflow-hidden backdrop-blur-2xl">
        {isUploading && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[#070B14]/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-12 space-y-8"
          >
             <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-royal rounded-full opacity-20" />
                <motion.div 
                  className="absolute inset-0 border-4 border-royal rounded-full border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
             </div>
             <div className="w-full max-w-sm space-y-4">
                <p className="text-xl font-bold text-white uppercase italic">Uploading Scan...</p>
                <ModernProgressBar progress={uploadProgress} />
             </div>
          </motion.div>
        )}

        <div className="mx-auto w-24 h-24 bg-royal/10 rounded-[32px] flex items-center justify-center shadow-2xl shadow-royal/20">
          <Upload className="w-10 h-10 text-royal" />
        </div>
        <div className="max-w-xs mx-auto space-y-2">
          <p className="text-xl font-black text-white italic uppercase tracking-tight">Drag and drop your file</p>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Supported formats: JPG, PNG, PDF (Max 50MB)</p>
        </div>
        <div className="pt-4">
          <label className="bg-royal text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest cursor-pointer hover:bg-royal/80 shadow-2xl shadow-royal/20 transition-all inline-block hover:scale-105 active:scale-95">
            Choose File
            <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
          </label>
        </div>
      </div>

      {scans.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-sm font-black text-white/40 uppercase tracking-[0.3em] italic">Recent Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {scans.slice(0, 4).map((scan) => (
              <div key={scan.id} className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-[24px] hover:bg-white/10 transition-all">
                <div className="w-12 h-12 bg-royal/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-royal" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-black text-sm truncate text-white">{scan.fileName}</p>
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{scan.fileType} • {new Date(scan.uploadDate?.toDate()).toLocaleDateString()}</p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-royal" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const Timeline = () => (
    <div className="space-y-12 pb-20">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Treatment Timeline</h1>
        <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Tracking your progress aligner by aligner.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-12">
          <SectionCard title="Your Journey Map">
            <div className="relative flex flex-wrap gap-4 items-center justify-center p-8 bg-white/5 rounded-[24px]">
              {Array.from({ length: profile?.totalAligners || 22 }).map((_, i) => {
                const alignerNum = i + 1;
                const isCurrent = alignerNum === profile?.currentAligner;
                const isPast = alignerNum < profile?.currentAligner!;
                return (
                  <div key={i} className="flex flex-col items-center gap-2 group relative">
                    <div className={`
                      w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs transition-all border
                      ${isCurrent ? 'bg-royal border-royal text-white shadow-[0_0_20px_rgba(65,105,225,0.4)] scale-110 rotate-[15deg]' : 
                        isPast ? 'bg-emerald-500/20 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/5 text-white/20'}
                    `}>
                      {isPast ? <CheckCircle2 className="w-5 h-5" /> : alignerNum}
                    </div>
                    {isCurrent && (
                      <div className="absolute -top-12 bg-royal text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg shadow-2xl shadow-royal/40 whitespace-nowrap tracking-widest italic">
                        CURRENT
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SectionCard title="Current Phase" icon={CheckCircle2}>
               <div className="space-y-6">
                  <p className="text-4xl font-black text-white italic tracking-tighter">Aligner {profile?.currentAligner}</p>
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Instructions:</p>
                    <ul className="text-sm font-bold text-white/80 space-y-3">
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-royal" /> 22 hours per day maintenance</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-royal" /> Remove only for essential meals</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-royal" /> Professional hydration with cool water</li>
                    </ul>
                  </div>
               </div>
            </SectionCard>
            <SectionCard title="Coming Up" icon={ChevronRight}>
               <div className="space-y-6">
                  <p className="text-4xl font-black text-white/10 italic tracking-tighter">Aligner {profile!.currentAligner! + 1}</p>
                  <p className="text-sm font-bold text-white/40 leading-relaxed italic">
                    Strategic evolution of your smile. Minimal adjustment pressure anticipated in the initial phase.
                  </p>
                  <div className="px-5 py-3 bg-royal/10 border border-royal/10 rounded-2xl">
                    <p className="text-[10px] font-black text-royal uppercase tracking-[0.2em]">Active in {getDaysDiff(profile?.nextAlignerChange)} days</p>
                  </div>
               </div>
            </SectionCard>
          </div>
        </div>

        <div className="space-y-8">
           <SectionCard title="Milestones">
              <div className="space-y-10 py-4">
                 {[
                   { label: "Treatment Start", date: profile?.treatmentStartDate?.toDate().toLocaleDateString(), completed: true },
                   { label: "Phase 1 Transition", date: "June 12, 2026", completed: false },
                   { label: "Final Reveal Hub", date: "Sept 15, 2026", completed: false }
                 ].map((m, i) => (
                   <div key={i} className="flex gap-6 relative">
                      {i < 2 && <div className="absolute left-[11px] top-8 bottom-[-40px] w-px bg-white/10" />}
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center z-10 border transition-all ${m.completed ? 'bg-emerald-500/20 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-white/10'}`}>
                        {m.completed && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <div className="space-y-1 mt-[-2px]">
                        <p className={`text-xs font-black uppercase tracking-widest ${m.completed ? 'text-white' : 'text-white/20'}`}>{m.label}</p>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{m.date}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </SectionCard>
        </div>
      </div>
    </div>
  );

  const Instructions = () => (
    <div className="space-y-8 pb-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-white italic tracking-tighter">Care Protocol</h1>
        <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Strategic guidelines for optimal transformation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
           {[
             { title: "How to Wear", items: ["Wear 22+ hours/day", "Remove for meals", "Wash hands before handling"], icon: User },
             { title: "How to Clean", items: ["Run under cool water", "Use clear, gentle soap", "Air dry in case"], icon: Shield },
             { title: "What to Avoid", items: ["Hot coffee/tea with aligners in", "Sugary drinks", "Chewing gum"], icon: AlertCircle }
           ].map((section, idx) => (
             <SectionCard key={idx} title={section.title} icon={section.icon}>
                <ul className="space-y-3">
                   {section.items.map((item, i) => (
                     <li key={i} className="flex items-center gap-3 text-sm font-black text-white/70 uppercase italic">
                       <div className="w-1.5 h-1.5 rounded-full bg-royal" />
                       {item}
                     </li>
                   ))}
                </ul>
             </SectionCard>
           ))}
        </div>
        
        <div className="space-y-6">
          <SectionCard title="Troubleshooting" icon={HelpCircle}>
            <div className="space-y-4">
              <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl space-y-4">
                 <p className="text-sm font-black text-rose-500 uppercase italic">Aligner Compromised?</p>
                 <p className="text-[10px] text-white/40 font-bold leading-relaxed">Switch to your previous set immediately and message your doctor within the portal.</p>
              </div>
              <div className="p-6 bg-royal/5 border border-royal/10 rounded-2xl space-y-4">
                 <p className="text-sm font-black text-royal uppercase italic">Structural Pressure?</p>
                 <p className="text-[10px] text-white/40 font-bold leading-relaxed">Normal for the first 48 hours of a new set. Try wearing them extra during this period.</p>
              </div>
            </div>
          </SectionCard>

          <div className="bg-gradient-to-br from-royal to-[#005bb7] p-8 rounded-[38px] text-white space-y-6 shadow-2xl relative overflow-hidden">
             <Stethoscope className="w-12 h-12" />
             <div className="space-y-2">
               <h3 className="text-2xl font-black italic tracking-tighter uppercase">Clinical Support</h3>
               <p className="text-white/60 text-xs font-bold uppercase tracking-widest leading-relaxed">Our medical team is operational 24/7 for emergency assist.</p>
             </div>
             <button className="w-full bg-white text-royal py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Open Channel</button>
          </div>
        </div>
      </div>
    </div>
  );

  const SettingsPage = () => (
    <div className="space-y-12 pb-20">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Settings</h1>
        <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Manage your profile and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <SectionCard title="Personal Information" icon={User}>
           <div className="space-y-8">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.3em] ml-1">Full Name</label>
                 <input 
                   disabled 
                   value={profile?.name} 
                   className="w-full bg-white/5 p-6 rounded-2xl font-black text-white italic border border-white/5" 
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.3em] ml-1">Email Address</label>
                 <input 
                   disabled 
                   value={profile?.email} 
                   className="w-full bg-white/5 p-6 rounded-2xl font-black text-white italic border border-white/5" 
                 />
              </div>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest italic">To change credentials, contact clinical support.</p>
           </div>
        </SectionCard>

        <SectionCard title="App Preferences" icon={Shield}>
           <div className="space-y-8">
              {[
                { label: "Aligner Change Reminders", active: true },
                { label: "Appointment Updates", active: true },
                { label: "Clinical Team Messages", active: false }
              ].map((pref, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                   <span className="text-sm font-black text-white uppercase italic">{pref.label}</span>
                   <div className={`w-14 h-7 rounded-full relative transition-all shadow-inner ${pref.active ? 'bg-royal' : 'bg-white/10'}`}>
                      <div className={`absolute top-1 w-5 h-5 rounded-lg bg-white shadow-2xl transition-all ${pref.active ? 'left-8' : 'left-1'}`} />
                   </div>
                </div>
              ))}
           </div>
        </SectionCard>
      </div>

      <div className="flex justify-center pt-8">
        <button 
          onClick={() => auth.signOut()}
          className="flex items-center gap-4 px-10 py-5 bg-white/5 text-white/40 border border-white/10 rounded-[24px] font-black uppercase tracking-widest text-[10px] hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all group active:scale-95 shadow-2xl shadow-black/40"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Sign Out from Journey
        </button>
      </div>
    </div>
  );

  const AppointmentDetails = () => (
    <div className="space-y-8 pb-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Your Appointments</h1>
        <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Manage your clinical visits and check-ups.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <SectionCard title="Next Appointment" icon={Calendar}>
             <div className="bg-royal/10 p-10 rounded-[40px] border border-royal/10 space-y-10">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                   <div className="space-y-4">
                      <div className="px-4 py-2 bg-royal/20 border border-royal/20 rounded-full inline-block">
                        <p className="text-[10px] font-black text-royal uppercase tracking-widest">CONFIRMED CLINICAL VISIT</p>
                      </div>
                      <p className="text-5xl font-black text-white leading-none tracking-tighter italic">
                        {profile?.nextAppointmentDate?.toDate().toLocaleString([], { dateStyle: 'full' })}
                      </p>
                      <p className="text-2xl font-bold text-white/40 italic">at {profile?.nextAppointmentDate?.toDate().toLocaleTimeString([], { timeStyle: 'short' })}</p>
                   </div>
                   <div className="p-8 bg-white/5 backdrop-blur-2xl rounded-[32px] border border-white/10 shadow-2xl shadow-royal/20">
                      <CountdownItem value={getDaysDiff(profile?.nextAppointmentDate)} label="DAYS AWAY" urgent={getDaysDiff(profile?.nextAppointmentDate) <= 1} />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-white/5">
                   <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10"><User className="w-6 h-6 text-royal" /></div>
                        <div>
                          <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Doctor</p>
                          <p className="font-black text-white uppercase italic">{profile?.doctorName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10"><Stethoscope className="w-6 h-6 text-royal" /></div>
                        <div>
                          <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Specialized Type</p>
                          <p className="font-black text-white uppercase italic">{profile?.appointmentType}</p>
                        </div>
                      </div>
                   </div>
                   <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl"><Home className="w-6 h-6 text-royal" /></div>
                        <div>
                          <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Medical Centre</p>
                          <p className="font-black text-white uppercase italic">{profile?.clinicAddress}</p>
                        </div>
                      </div>
                      <button className="text-[10px] font-black text-royal uppercase tracking-widest flex items-center gap-2 hover:underline italic">
                        <Info className="w-4 h-4" /> Preparedness Checklist
                      </button>
                   </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 pt-10">
                   <button className="flex-1 bg-royal text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-royal/40 hover:bg-royal/80 hover:scale-[1.02] active:scale-[0.98] transition-all">Reschedule</button>
                   <button className="px-10 border border-white/10 text-white/40 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/5 active:scale-95 transition-all">Withdraw</button>
                </div>
             </div>
          </SectionCard>

          <SectionCard title="Mission History" icon={Clock}>
             <div className="space-y-4">
                {[
                   { date: "March 15, 2024", type: "Initial Consultation", notes: "Treatment plan finalized.", status: "Verified" },
                   { date: "January 10, 2024", type: "Smile Scan & Records", notes: "All digital assets captured.", status: "Verified" }
                ].map((past, i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-white/5 border border-transparent hover:border-white/10 rounded-[24px] transition-all group">
                     <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-royal/10 transition-colors">
                           <CheckCircle2 className="w-6 h-6 text-royal" />
                        </div>
                        <div>
                           <p className="font-black text-white italic uppercase tracking-tighter text-lg">{past.type}</p>
                           <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">{past.date} • {past.notes}</p>
                        </div>
                     </div>
                     <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full tracking-widest italic border border-emerald-500/10">CONFIRMED</span>
                  </div>
                ))}
             </div>
          </SectionCard>
        </div>

        <div className="space-y-12">
           <SectionCard title="Directives">
              <div className="space-y-8">
                 <div className="flex gap-6">
                    <div className="p-4 bg-royal/10 rounded-2xl border border-royal/10 flex-shrink-0 h-fit"><Clock className="w-6 h-6 text-royal" /></div>
                    <div className="flex-1">
                       <p className="text-sm font-black text-white uppercase italic tracking-wide">Advance Arrival</p>
                       <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest leading-relaxed mt-2">Target arrival 10m pre-deployment. Ensure current aligners and metadata provided.</p>
                    </div>
                 </div>
                 <div className="flex gap-6">
                    <div className="p-4 bg-royal/10 rounded-2xl border border-royal/10 flex-shrink-0 h-fit"><HelpCircle className="w-6 h-6 text-royal" /></div>
                    <div className="flex-1">
                       <p className="text-sm font-black text-white uppercase italic tracking-wide">Parking Protocol</p>
                       <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest leading-relaxed mt-2">Verified docking station available in the medical hub deck.</p>
                    </div>
                 </div>
              </div>
           </SectionCard>

           <div className="p-10 bg-white/5 backdrop-blur-2xl border border-white/5 rounded-[40px] text-center space-y-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-royal/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-20 h-20 bg-emerald-500/10 rounded-[32px] flex items-center justify-center mx-auto border border-emerald-500/10 group-hover:scale-110 transition-transform shadow-2xl">
                 <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="relative z-10 space-y-2">
                 <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Reminders Operational</h3>
                 <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">Deployment notifications active 24h pre-visit.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070B14] text-white font-sans selection:bg-royal/30 selection:text-white">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-royal/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#87CEEB]/5 blur-[150px] rounded-full" />
      </div>

      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-[#070B14]/60 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-8">
             <button 
               onClick={onBack}
               className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group px-4 py-2 bg-white/5 rounded-xl border border-white/5"
             >
               <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
               <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{isEn ? 'Back to Site' : 'Kthehu'}</span>
             </button>
             <div className="w-px h-8 bg-white/10 mx-2 hidden sm:block" />
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-royal rounded-2xl flex items-center justify-center shadow-2xl shadow-royal/40">
                  <CheckCircle2 className="text-white w-6 h-6" />
                </div>
                <span className="text-3xl font-black text-white italic tracking-tighter">LINE<span className="text-royal">A</span></span>
             </div>
             
             {/* Desktop Tabs */}
             <div className="hidden lg:flex items-center gap-4 ml-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-xl ${activeTab === tab.id ? 'bg-royal text-white shadow-xl shadow-royal/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div 
                        layoutId="navIndicator"
                        className="absolute inset-0 border border-white/10 rounded-xl"
                      />
                    )}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-white">{profile?.name}</span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-white/30">Patient Portal</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white border border-white/10 shadow-lg font-black italic italic">
                {profile?.name ? profile.name.charAt(0) : <User />}
            </div>
            <button 
              onClick={() => auth.signOut()}
              className="p-3.5 bg-white/5 hover:bg-red-500/20 rounded-2xl border border-white/5 group transition-all"
            >
              <LogOut className="w-5 h-5 text-white/40 group-hover:text-red-400 transition-colors" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden p-4">
        <div className="bg-[#070B14]/80 backdrop-blur-2xl border border-white/5 rounded-[32px] p-2 flex items-center justify-around shadow-2xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all relative ${activeTab === tab.id ? 'text-royal' : 'text-white/20'}`}
            >
              <tab.icon className={`w-5 h-5 mb-1 ${activeTab === tab.id ? 'scale-110' : ''}`} />
              <span className="text-[8px] font-black uppercase tracking-widest">{tab.label.split(' ')[0]}</span>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="mobileNavIndicator"
                  className="absolute inset-0 bg-royal/5 rounded-2xl border border-royal/10"
                />
              )}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'upload' && <UploadScan />}
            {activeTab === 'timeline' && <Timeline />}
            {activeTab === 'appointment' && <AppointmentDetails />}
            {activeTab === 'instructions' && <Instructions />}
            {activeTab === 'settings' && <SettingsPage />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Padding for Mobile */}
      <div className="h-20 lg:hidden" />
    </div>
  );
};

