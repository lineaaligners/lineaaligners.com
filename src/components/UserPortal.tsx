import React, { useState, useEffect, useRef } from 'react';
import { auth, db, storage, handleFirestoreError } from '../lib/firebase';
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
import { useDropzone } from 'react-dropzone';
import { ScanUpload } from './ScanUpload';
import { ScansList } from './ScansList';
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
  fileSize?: number | string;
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
  createdAt?: any;
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
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#4169E1] to-[#87CEEB] animate-moving-bar rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
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
  <div 
    className={`bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 hover:scale-[1.01] hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] transition-all duration-300 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] ${className}`}
  >
    <div className="flex items-center gap-3 mb-8">
      {Icon && <div className="p-3 bg-white/10 rounded-2xl border border-white/5 shadow-lg"><Icon className="w-6 h-6 text-white" /></div>}
      <h3 className="text-xl font-black text-white tracking-tight uppercase">{title}</h3>
    </div>
    {children}
  </div>
);

const CountdownItem: React.FC<{ value: number; label: string; urgent?: boolean }> = ({ value, label, urgent }) => (
  <div className="text-center group">
    <div 
      className={`text-5xl font-black italic tracking-tighter transition-all duration-300 ${urgent ? 'text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]' : 'text-white'}`}
    >
      {value}
    </div>
    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mt-2 group-hover:text-white transition-colors">{label}</div>
  </div>
);

// --- Main Component ---

export const UserPortal: React.FC<{ 
  currentUser: any;
  onBack: () => void;
  language: 'en' | 'sq';
}> = ({ currentUser, onBack, language }) => {
  const isEn = language === 'en';
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scans, setScans] = useState<Scan[]>([]);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [scansLoaded, setScansLoaded] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewingPortalUrl, setViewingPortalUrl] = useState<string | null>(null);
  const [viewingPortalName, setViewingPortalName] = useState<string>('');
  const [editedJourneyUrl, setEditedJourneyUrl] = useState('');
  const [isEditingJourneyUrl, setIsEditingJourneyUrl] = useState(false);

  const [typedCurrent, setTypedCurrent] = useState<string>('');
  const [typedTotal, setTypedTotal] = useState<string>('');
  const [isSavingJourney, setIsSavingJourney] = useState(false);

  useEffect(() => {
    if (profile) {
      setTypedCurrent(String(profile.currentAligner || 1));
      setTypedTotal(String(profile.totalAligners || 20));
    }
  }, [profile?.currentAligner, profile?.totalAligners]);

  useEffect(() => {
    if (profile?.nextVisitUrl) {
      setEditedJourneyUrl(profile.nextVisitUrl);
    }
  }, [profile?.nextVisitUrl]);

  const handleManualJourneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const curVal = parseInt(typedCurrent, 10);
    const totVal = parseInt(typedTotal, 10);

    if (isNaN(curVal) || curVal < 1) {
      alert("Please enter a valid active aligner stage (minimum is 1).");
      return;
    }
    if (isNaN(totVal) || totVal < 1) {
      alert("Please enter a valid total number of aligners.");
      return;
    }
    if (curVal > totVal) {
      alert("The active aligner stage cannot be greater than the total number of aligners in your plan.");
      return;
    }

    setIsSavingJourney(true);
    try {
      await handleUpdateJourney(curVal, totVal);
    } finally {
      setIsSavingJourney(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    // Load patient profile
    const unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setProfile({
          ...data,
          currentAligner: data.currentAligner || 1,
          totalAligners: data.totalAligners || 20,
          nextAlignerChange: data.nextAlignerChange || null,
          nextAppointmentDate: data.nextAppointmentDate || null,
          doctorName: data.doctorName || "Pending Assignment",
          clinicAddress: data.clinicAddress || "Medident Clinic, Prishtina",
          appointmentType: data.appointmentType || "Initial Assessment",
          treatmentStartDate: data.treatmentStartDate || data.createdAt || null
        } as UserProfile);
      }
      setProfileLoaded(true);
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
      setScansLoaded(true);
    });

    return () => {
      unsubProfile();
      unsubScans();
    };
  }, [currentUser]);

  const handleUpdateJourney = async (newCurrent: number, newTotal: number) => {
    if (!currentUser) return;
    try {
      const tenDaysFromNow = new Date();
      tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);

      await updateDoc(doc(db, 'users', currentUser.uid), {
        currentAligner: newCurrent,
        totalAligners: newTotal,
        nextAlignerChange: tenDaysFromNow
      });
    } catch (err: any) {
      console.error(err);
      alert("Failed to update journey: " + err.message);
    }
  };

  const handleUpdateJourneyUrl = async (newUrl: string) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        nextVisitUrl: newUrl
      });
      alert("Journey link updated successfully on your dashboard!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to update journey link: " + err.message);
    }
  };

  const getEstimatedFinishDate = () => {
    if (!profile) return 'Pending...';
    try {
      const total = profile.totalAligners || 15;
      
      // Get treatment start date as a JS Date
      let startJSDate = new Date();
      if (profile.treatmentStartDate) {
        if (typeof profile.treatmentStartDate.toDate === 'function') {
          startJSDate = profile.treatmentStartDate.toDate();
        } else {
          startJSDate = new Date(profile.treatmentStartDate);
        }
      } else if (profile.createdAt) {
        if (typeof profile.createdAt.toDate === 'function') {
          startJSDate = profile.createdAt.toDate();
        } else {
          startJSDate = new Date(profile.createdAt);
        }
      }

      // Check if startJSDate is valid, if not use current date
      if (isNaN(startJSDate.getTime())) {
        startJSDate = new Date();
      }

      // Each stage is 10 days, so the total treatment takes total * 10 days from start
      const totalDays = total * 10;
      
      const targetDate = new Date(startJSDate.getTime());
      targetDate.setDate(targetDate.getDate() + totalDays);
      
      return targetDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      console.error(e);
      return 'TBD';
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    const qRel = query(
      collection(db, 'doctor_patients'),
      where('patientId', '==', currentUser.uid)
    );
    const unsubRel = onSnapshot(qRel, (snapshot) => {
      if (!snapshot.empty) {
        setDoctorId(snapshot.docs[0].data().doctorId);
      }
    });
    return () => unsubRel();
  }, [currentUser]);

  const onDrop = async (acceptedFiles: File[]) => {
    if (!currentUser) return;
    setIsUploading(true);
    setUploadProgress(0);

    const uploadPromises = acceptedFiles.map(async (file) => {
      const fileId = Math.random().toString(36).substring(7);
      const storagePath = `patient_scans/${currentUser.uid}/${fileId}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snapshot) => {
            const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(p);
          }, 
          reject, 
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const assignedIds = [currentUser.uid];
            if (doctorId) assignedIds.push(doctorId);

            try {
              let type = file.type.split('/')[1] || 'file';
              if (type === 'jpeg') type = 'jpg';
              if (file.name.toLowerCase().endsWith('.stl')) type = 'stl';

              await addDoc(collection(db, 'scans'), {
                fileName: file.name,
                fileUrl: downloadURL,
                fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                fileType: type,
                uploadDate: serverTimestamp(),
                uploadedBy: currentUser.uid,
                assignedTo: assignedIds,
                isProcessed: false
              });
              resolve();
            } catch (dbErr: any) {
              handleFirestoreError(dbErr, 'write', 'scans');
              reject(dbErr);
            }
          }
        );
      });
    });

    try {
      await Promise.all(uploadPromises);
      setIsUploading(false);
    } catch (err) {
      console.error("Upload failed", err);
      setIsUploading(false);
      alert("One or more uploads failed.");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) onDrop(files);
  };

  if (!profileLoaded || !scansLoaded || !profile) return <ScreenLoader message="Building your journey..." />;

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
    const d = typeof date.toDate === 'function' ? date.toDate() : new Date(date);
    const diff = d.getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days < 0 ? 0 : days;
  };

  const renderAlignerCalendarTracker = () => {
    const nextChange = profile?.nextAlignerChange?.toDate 
      ? profile.nextAlignerChange.toDate() 
      : (profile?.nextAlignerChange ? new Date(profile.nextAlignerChange) : null);
    
    if (!nextChange) {
      return (
        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-relaxed">
            Please setup your active aligner to start tracking your 10-day calendar!
          </p>
        </div>
      );
    }

    const durationDays = 10;
    const daysArray = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build the 10 days array relative to the change date
    for (let i = 1; i <= durationDays; i++) {
      const dayDate = new Date(nextChange.getTime());
      dayDate.setDate(dayDate.getDate() - (durationDays - i));
      dayDate.setHours(0, 0, 0, 0);
      daysArray.push({
        dayNumber: i,
        date: dayDate,
        isToday: dayDate.getTime() === today.getTime(),
        isPast: dayDate.getTime() < today.getTime(),
        isFuture: dayDate.getTime() > today.getTime()
      });
    }

    // Count days remaining (today or in future)
    const daysLeft = daysArray.filter(d => d.isFuture || d.isToday).length;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <span className="text-[9px] font-black uppercase text-purple-400 tracking-widest">
            10-Day Phase Calendar Tracker
          </span>
          <span className="text-[9px] font-black uppercase text-amber-400 tracking-widest bg-[#8B5CF6]/10 px-2.5 py-1 rounded-md border border-[#8B5CF6]/20">
            {daysLeft} of 10 Days Left
          </span>
        </div>

        {/* Start Date configuration picker */}
        <div className="flex items-center justify-between gap-2 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
          <span className="text-white/40 font-bold uppercase text-[9px] tracking-wide">
            Adjust Date Started:
          </span>
          <input 
            type="date"
            onChange={async (e) => {
              if (!e.target.value || !currentUser) return;
              try {
                const selectedStart = new Date(e.target.value);
                // Ends 10 days later
                const newNextChange = new Date(selectedStart.getTime() + 10 * 24 * 60 * 60 * 1000);
                await updateDoc(doc(db, 'users', currentUser.uid), {
                  nextAlignerChange: newNextChange
                });
              } catch (err: any) {
                console.error(err);
                alert("Failed to adjust calendar start date: " + err.message);
              }
            }}
            value={new Date(nextChange.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-[9px] font-black font-mono text-amber-400 focus:outline-none"
          />
        </div>

        {/* 10-Day Calendar Grid */}
        <div className="grid grid-cols-5 gap-2">
          {daysArray.map((day) => {
            const formattedDate = day.date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            const weekday = day.date.toLocaleDateString([], { weekday: 'short' });
            
            return (
              <div 
                key={day.dayNumber}
                className={`relative p-2 rounded-2xl flex flex-col items-center justify-between border transition-all text-center group cursor-default
                  ${day.isToday 
                    ? 'bg-royal border-royal text-white shadow-[0_0_15px_rgba(65,105,225,0.4)] scale-105' 
                    : day.isPast 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                  }
                `}
                title={`Day ${day.dayNumber}: ${weekday}, ${formattedDate} (${day.isToday ? 'Today' : day.isPast ? 'Completed' : 'Days Left'})`}
              >
                <div className="text-[7px] font-black uppercase tracking-widest opacity-40">
                  D{day.dayNumber}
                </div>
                
                <div className="my-1.5 text-xs font-black tracking-tight font-mono">
                  {day.isPast ? (
                    <CheckCircle2 className="w-3.5 h-3.5 mx-auto text-emerald-400" />
                  ) : (
                    day.date.getDate()
                  )}
                </div>

                <div className="text-[7px] font-black uppercase tracking-wider opacity-60">
                  {weekday}
                </div>

                {day.isToday && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#87CEEB] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#87CEEB]"></span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- Page Components ---

  const Dashboard = () => {
    const journeyLinks = scans.filter(s => s.fileSize === 'Secure Portal Link' || s.fileType?.toLowerCase() === 'url');
    
    return (
      <div className="space-y-8 pb-20">
        {/* Hero Header */}
        <div className="space-y-3">
          <h2 className="text-5xl md:text-8xl font-black text-white italic tracking-tighter leading-[0.8]">
            Your Smile<br /><span className="text-[#C084FC]">Journey.</span>
          </h2>
          <p className="text-white/60 font-black uppercase tracking-widest text-xs">
            Aligner Hub • Welcome back, {profile?.name || 'User'}
          </p>
        </div>

        {/* Full-width Treatment Journey Launcher */}
        {profile?.nextVisitUrl && (
          <div className="relative group bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-indigo-600 rounded-[32px] p-8 md:p-10 border border-white/10 shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-purple-900/40 hover:scale-[1.01] active:scale-[0.99]">
            {/* Ambient Animated Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-pink-400/20 rounded-full blur-3xl group-hover:bg-pink-400/30 transition-all duration-500" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="px-3.5 py-1 bg-white/15 text-white text-[9px] font-black uppercase tracking-widest rounded-full backdrop-blur-md border border-white/10">
                  CLINCHECK / INTERACTIVE PORTAL
                </span>
                <h3 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter uppercase leading-none mt-1">
                  View your Treatment Journey
                </h3>
                <p className="text-sm font-bold text-white/85 tracking-wide max-w-xl">
                  Inspect your custom 3D clear aligner plan, staging, and final cosmetic projections published securely by your doctor.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
                <button 
                  onClick={() => {
                    setViewingPortalUrl(profile.nextVisitUrl || '');
                    setViewingPortalName('Your Treatment Journey');
                  }}
                  className="w-full sm:w-auto px-8 py-5 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 shrink-0"
                >
                  <Eye className="w-5 h-5 text-royal stroke-[3]" />
                  OPEN JOURNEY VIEW
                </button>
                <button 
                  onClick={() => setIsEditingJourneyUrl(!isEditingJourneyUrl)}
                  className="w-full sm:w-auto px-5 py-5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase text-xs tracking-widest border border-white/15 transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  ✏️ {isEditingJourneyUrl ? 'Close Link Editor' : 'Edit Link'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Journey Link Configuration Panel */}
        {(!profile?.nextVisitUrl || isEditingJourneyUrl) && (
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 md:p-8 space-y-6 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-[#8B5CF6]/5 blur-[70px] rounded-full" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="px-3 py-1 bg-[#8B5CF6]/10 text-[#C084FC] text-[8px] font-black uppercase tracking-widest rounded-full border border-[#8B5CF6]/20">
                    Interactive Workspace Link
                  </span>
                  <h3 className="text-xl font-black text-white italic tracking-tight uppercase mt-2">Configure Treatment Link</h3>
                </div>
                {profile?.nextVisitUrl && (
                  <button 
                    onClick={() => setIsEditingJourneyUrl(false)}
                    className="text-[9px] font-black text-white/40 hover:text-white uppercase tracking-widest"
                  >
                    Close [X]
                  </button>
                )}
              </div>
              <p className="text-xs text-white/50 leading-relaxed font-bold">
                Pasting a custom 3D clear aligner plan or digital simulation Web Link allows you to view it directly within the interactive dashboard sandbox.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <input 
                  type="url"
                  placeholder="Paste URL (e.g. https://my-clincheck.com/plan)"
                  value={editedJourneyUrl}
                  onChange={(e) => setEditedJourneyUrl(e.target.value)}
                  className="flex-grow bg-white/5 border border-white/10 hover:border-[#8B5CF6]/45 focus:border-[#8B5CF6] rounded-2xl p-4 text-xs font-bold outline-none text-white focus:ring-1 focus:ring-[#8B5CF6]/20 transition-all font-mono"
                />
                <button 
                  onClick={async () => {
                    await handleUpdateJourneyUrl(editedJourneyUrl);
                    setIsEditingJourneyUrl(false);
                  }}
                  className="px-6 py-4 bg-royal hover:bg-royal/80 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-royal/20"
                >
                  Save Journey Link
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stored Custom Journey Links */}
        {journeyLinks.length > 0 && (
          <div className="relative bg-gradient-to-br from-white/[0.03] to-transparent p-8 rounded-[40px] border border-white/5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-[#C084FC] rounded-full" />
              <h3 className="text-xl font-black uppercase tracking-tight italic">Allocated Interactive Links</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {journeyLinks.map((link) => (
                <div 
                  key={link.id} 
                  className="group bg-white/5 border border-white/5 hover:border-[#C084FC]/30 rounded-3xl p-6 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase text-[#C084FC] tracking-widest block">Portal Platform</span>
                    <h4 className="text-lg font-black text-white italic truncate uppercase">{link.fileName}</h4>
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                      Published {link.uploadDate?.toDate?.() ? link.uploadDate.toDate().toLocaleDateString() : 'Syncing...'}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setViewingPortalUrl(link.fileUrl);
                        setViewingPortalName(link.fileName);
                      }}
                      className="flex-grow py-3 bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/30 text-white rounded-xl font-bold uppercase text-[9px] tracking-widest border border-[#8B5CF6]/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#C084FC]" /> In-App View
                    </button>
                    <button 
                      onClick={() => window.open(link.fileUrl, '_blank')}
                      className="py-3 px-4 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-xl border border-white/10 transition-all"
                      title="Open in external browser window"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                <p className="text-sm font-bold text-[#87CEEB] mt-4">Change on {profile?.nextAlignerChange?.toDate?.() ? profile.nextAlignerChange.toDate().toLocaleDateString() : 'TBD'}</p>
              </div>
              <div className="flex gap-4">
                <CountdownItem value={getDaysDiff(profile?.nextAlignerChange)} label="Days Left" urgent={getDaysDiff(profile?.nextAlignerChange) <= 2} />
              </div>
            </div>
            <div className="bg-white/5 border border-white/5 p-6 rounded-[24px] backdrop-blur-md space-y-4">
              {renderAlignerCalendarTracker()}
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
                <p className="text-lg font-black text-[#87CEEB] tracking-tight">{profile?.nextAppointmentDate?.toDate?.() ? profile.nextAppointmentDate.toDate().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Setting up...'}</p>
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
              <ModernProgressBar 
                progress={calculateProgress()} 
                label={`Aligner ${profile?.currentAligner || 1} of ${profile?.totalAligners || 15}`} 
              />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-white/30 uppercase tracking-widest italic">Aligners Completed</p>
                   <p className="text-xl font-black text-[#87CEEB] italic tracking-tighter">
                     {Math.max(0, (profile?.currentAligner || 1) - 1)} ALIGNERS
                   </p>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-white/30 uppercase tracking-widest italic">Remaining Aligners</p>
                   <p className="text-xl font-black text-white italic tracking-tighter">
                     {Math.max(0, (profile?.totalAligners || 15) - (profile?.currentAligner || 1))} ALIGNERS
                   </p>
                </div>
                <div className="space-y-1">
                   <p className="text-xs text-white/40 font-bold uppercase tracking-wider">Estimated Date</p>
                   <p className="text-xl font-black text-royal uppercase">{getEstimatedFinishDate()}</p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Upload New Scan Section */}
          <SectionCard title="Upload New Scan" icon={Upload}>
            <ScanUpload 
              patientId={currentUser.uid} 
              onUploadComplete={() => setActiveTab('dashboard')} 
            />
          </SectionCard>

          {/* Last Scan Section */}
          <SectionCard title="Your Last Scan" icon={Eye}>
            <ScansList patientId={currentUser.uid} />
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
};

  const UploadScan = () => (
    <div className="space-y-8 pb-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">Upload Digital Records</h1>
        <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Managed File Transmission • HIPAA Compliant</p>
      </div>

      <div className="glass-panel p-10 rounded-[40px]">
        <ScanUpload patientId={currentUser.uid} onUploadComplete={() => setActiveTab('dashboard')} />
      </div>

      <div className="space-y-6">
        <h2 className="text-sm font-black text-white/40 uppercase tracking-[0.3em] italic">Your Scan Library</h2>
        <ScansList patientId={currentUser.uid} />
      </div>
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
            <div className="space-y-6">
              {/* Write Journey Stage Configurator Form */}
              <form onSubmit={handleManualJourneySubmit} className="flex flex-col gap-5 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <span>✏️ Write Your Journey Progress</span>
                    </p>
                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-wide">
                      Type your active aligner number and your total plan count below (e.g., 10 of 25).
                    </p>
                  </div>
                  <span className="text-[9px] px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-amber-400 font-extrabold uppercase tracking-widest whitespace-nowrap">
                    10 Days / Stage Protocol
                  </span>
                </div>

                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex-1 min-w-[120px] space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-white/40 tracking-widest block pl-1">Active Aligner</label>
                    <input 
                      type="number"
                      min="1"
                      placeholder="e.g. 10"
                      value={typedCurrent}
                      onChange={(e) => setTypedCurrent(e.target.value)}
                      className="w-full bg-[#193D6D] border border-white/10 hover:border-amber-400/45 focus:border-amber-400 rounded-xl p-3 text-sm font-black text-white outline-none focus:ring-1 focus:ring-amber-400/20 transition-all font-mono"
                    />
                  </div>

                  <div className="self-center pb-3 text-white/30 text-xs font-black uppercase tracking-widest italic select-none">
                    of
                  </div>

                  <div className="flex-1 min-w-[120px] space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-white/40 tracking-widest block pl-1">Total Aligners Plan</label>
                    <input 
                      type="number"
                      min="1"
                      placeholder="e.g. 25"
                      value={typedTotal}
                      onChange={(e) => setTypedTotal(e.target.value)}
                      className="w-full bg-[#193D6D] border border-white/10 hover:border-amber-400/45 focus:border-amber-400 rounded-xl p-3 text-sm font-black text-white outline-none focus:ring-1 focus:ring-amber-400/20 transition-all font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingJourney}
                    className="h-[46px] px-6 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-lg active:scale-95 disabled:opacity-50 min-w-[130px] flex items-center justify-center gap-1.5"
                  >
                    {isSavingJourney ? 'Saving...' : 'Update Journey'}
                  </button>
                </div>
              </form>

              {/* Grid cell map with interactive triggers */}
              <div className="relative flex flex-wrap gap-4 items-center justify-center p-8 bg-white/5 rounded-[24px]">
                {Array.from({ length: profile?.totalAligners || 22 }).map((_, i) => {
                  const alignerNum = i + 1;
                  const isCurrent = alignerNum === profile?.currentAligner;
                  const isPast = alignerNum < profile?.currentAligner!;
                  return (
                    <button 
                      key={i} 
                      onClick={() => {
                        if (confirm(`Set Aligner ${alignerNum} as your active stage? Under the 10-day interval protocol, this resets your next aligner change to 10 days from today.`)) {
                          handleUpdateJourney(alignerNum, profile?.totalAligners || 20);
                        }
                      }}
                      title={`Switch to Aligner Stage ${alignerNum}`}
                      className="flex flex-col items-center gap-2 group relative cursor-pointer outline-none focus:outline-none"
                    >
                      <div className={`
                        w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs transition-all border
                        ${isCurrent ? 'bg-royal border-royal text-white shadow-[0_0_20px_rgba(65,105,225,0.4)] scale-110 rotate-[15deg]' : 
                          isPast ? 'bg-emerald-500/20 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/35 hover:scale-105' : 
                          'bg-white/5 border-white/5 text-white/20 hover:bg-white/10 hover:text-white/60 hover:scale-105'}
                      `}>
                        {isPast ? <CheckCircle2 className="w-5 h-5" /> : alignerNum}
                      </div>
                      {isCurrent && (
                        <div className="absolute -top-12 bg-royal text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg shadow-2xl shadow-royal/40 whitespace-nowrap tracking-widest italic z-10 animate-bounce">
                          CURRENT
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
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
                   { label: "Treatment Start", date: profile?.treatmentStartDate ? (typeof profile.treatmentStartDate.toDate === 'function' ? profile.treatmentStartDate.toDate().toLocaleDateString() : new Date(profile.treatmentStartDate).toLocaleDateString()) : (profile?.createdAt ? (typeof profile.createdAt.toDate === 'function' ? profile.createdAt.toDate().toLocaleDateString() : new Date(profile.createdAt).toLocaleDateString()) : "Setting up..."), completed: true },
                   { label: "Phase 1 Transition", date: "June 12, 2026", completed: false },
                   { label: "Final Reveal Hub", date: getEstimatedFinishDate(), completed: false }
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
    <div className="min-h-screen bg-[#070512] text-white font-sans selection:bg-royal/30 selection:text-white">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-royal/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#C084FC]/5 blur-[150px] rounded-full" />
      </div>

      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-[#070512]/60 backdrop-blur-2xl border-b border-white/5">
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
              <span className="text-[8px] font-bold uppercase tracking-widest text-white/30">Member Portal</span>
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
        <div className="bg-[#070512]/80 backdrop-blur-2xl border border-white/5 rounded-[32px] p-2 flex items-center justify-around shadow-2xl">
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
            {activeTab === 'dashboard' && Dashboard()}
            {activeTab === 'upload' && UploadScan()}
            {activeTab === 'timeline' && Timeline()}
            {activeTab === 'appointment' && AppointmentDetails()}
            {activeTab === 'instructions' && Instructions()}
            {activeTab === 'settings' && SettingsPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Padding for Mobile */}
      <div className="h-20 lg:hidden" />

      {/* Modern In-App Portal / Link Viewer Modal */}
      {viewingPortalUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-xl animate-fade-in text-white">
          <div className="bg-[#142A4D] rounded-[32px] md:rounded-[48px] w-full max-w-7xl h-[94vh] border-2 border-white/10 shadow-2xl flex flex-col relative overflow-hidden">
            {/* Header bar */}
            <header className="p-4 sm:p-6 md:p-8 border-b border-b-white/10 bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 flex items-center justify-center text-[#C084FC] shadow-lg shadow-purple-900/20">
                  <ExternalLink className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase text-white">{viewingPortalName || 'Interactive Portal'}</h3>
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Connection Established
                    </span>
                  </div>
                  <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mt-1">Operational Secure Link Sandbox Viewer</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto self-stretch sm:self-auto shrink-0 justify-end">
                <button
                  type="button"
                  onClick={() => window.open(viewingPortalUrl, '_blank')}
                  className="flex-grow sm:flex-grow-0 px-5 h-12 bg-royal hover:bg-royal/80 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-royal/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Full Window
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setViewingPortalUrl(null);
                    setViewingPortalName('');
                  }}
                  className="w-12 h-12 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-2xl border border-white/10 transition-all flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Sandbox Container */}
            <div className="flex-grow bg-[#070512] relative flex flex-col justify-between overflow-hidden">
              {/* Context Banner */}
              <div className="absolute top-4 left-4 right-4 z-40 bg-[#142A4D]/80 border border-white/5 p-4 rounded-2xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> 
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                    Interact with your 3D Clincheck animation or web portal directly inside this workspace.
                  </span>
                </div>
                <span className="text-[9px] font-black text-[#C084FC] uppercase tracking-widest bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                  Sandboxed Environment
                </span>
              </div>
              
              {/* Iframe element */}
              <iframe 
                src={viewingPortalUrl} 
                className="w-full h-full border-0 bg-transparent select-none pt-20"
                title={viewingPortalName}
                allow="fullscreen; autoplay; clipboard-write"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

