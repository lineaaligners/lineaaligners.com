import React, { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { ScanUpload } from './ScanUpload';
import { ScansList } from './ScansList';
import { WHATSAPP_URL } from '../constants';
import { ScreenLoader } from './ProgressBar';
import {
  LogOut,
  Home,
  Upload,
  Calendar,
  Settings,
  HelpCircle,
  Clock,
  Eye,
  CheckCircle2,
  AlertCircle,
  User,
  ArrowLeft,
  ExternalLink,
  MessageCircle,
  X,
  Sparkles,
  Droplets,
  Ban
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Translations — every patient-facing string in English and Albanian
// ---------------------------------------------------------------------------
const T = {
  en: {
    backToSite: 'Back to site',
    tabs: { dashboard: 'Home', progress: 'My Progress', upload: 'Upload Photos', appointment: 'Appointment', help: 'Help', settings: 'Settings' },
    hello: 'Hello',
    subtitle: 'Here is where your treatment stands today.',
    currentAligner: 'You are wearing aligner',
    of: 'of',
    changeOn: 'Change to the next aligner on',
    daysLeft: 'days left',
    dayLeft: 'day left',
    changeToday: 'Change your aligner today!',
    iChanged: 'I changed my aligner today',
    changedConfirm: 'Great! Move to aligner {n} and wear it for the next 10 days?',
    undoStep: 'Go back one aligner',
    treatmentProgress: 'Treatment progress',
    completed: 'completed',
    estimatedFinish: 'Estimated finish',
    dayTracker: '10-day wear calendar',
    trackerHint: 'Each aligner is worn for 10 days. Green days are done.',
    setupTracker: 'Update your aligner number below to start the calendar.',
    nextAppointment: 'Your next appointment',
    noAppointment: 'No appointment scheduled yet.',
    withDoctor: 'with',
    atClinic: 'at',
    contactClinic: 'Message the clinic on WhatsApp',
    view3d: 'View my 3D treatment plan',
    view3dHint: 'See how your teeth will move, prepared by your doctor.',
    uploadTitle: 'Send us photos of your teeth',
    uploadHint: 'Take clear photos in good light. Your doctor checks them and replies on WhatsApp.',
    yourUploads: 'Photos you have sent',
    progressTitle: 'Your aligner journey',
    progressHint: 'Tap the aligner number you are currently wearing to update your progress.',
    updateConfirm: 'Set aligner {n} as the one you are wearing now? The 10-day calendar restarts from today.',
    current: 'NOW',
    milestones: 'Milestones',
    treatmentStart: 'Treatment started',
    finalSmile: 'Final smile (estimated)',
    helpTitle: 'How to care for your aligners',
    wear: { title: 'Wearing', items: ['Wear them at least 22 hours a day', 'Take them out only to eat and drink', 'Wash your hands before touching them'] },
    clean: { title: 'Cleaning', items: ['Rinse with cool water — never hot', 'Clean gently with clear soap', 'Keep them in their case when not wearing'] },
    avoid: { title: 'Avoid', items: ['Hot coffee or tea while wearing them', 'Sugary drinks with aligners in', 'Chewing gum'] },
    problems: 'Problems?',
    broken: 'Aligner broken or lost?',
    brokenText: 'Put your previous aligner back in and message us right away.',
    pressure: 'Feeling pressure?',
    pressureText: 'That is normal for the first 2 days of a new aligner. It means it is working.',
    emergency: 'Need help? We answer on WhatsApp.',
    settingsTitle: 'Settings',
    yourInfo: 'Your information',
    name: 'Name',
    email: 'Email',
    infoNote: 'To change your details, message the clinic.',
    signOut: 'Sign out',
    openFull: 'Open in browser',
    close: 'Close',
    loading: 'Loading your treatment...',
    profileError: "We couldn't load your profile",
    profileErrorText: 'Please check your connection and try again. If this keeps happening, message us on WhatsApp.',
    tryAgain: 'Try again',
    appointmentHelp: 'To book or change an appointment, message us on WhatsApp — we reply quickly.',
    clinicHours: 'Clinic hours',
    aligners: 'aligners'
  },
  sq: {
    backToSite: 'Kthehu te faqja',
    tabs: { dashboard: 'Kryesore', progress: 'Progresi Im', upload: 'Dërgo Foto', appointment: 'Termini', help: 'Ndihmë', settings: 'Cilësimet' },
    hello: 'Përshëndetje',
    subtitle: 'Ja ku ndodhet trajtimi juaj sot.',
    currentAligner: 'Ju jeni duke mbajtur aparatin',
    of: 'nga',
    changeOn: 'Ndërrojeni me aparatin tjetër më',
    daysLeft: 'ditë të mbetura',
    dayLeft: 'ditë e mbetur',
    changeToday: 'Ndërrojeni aparatin sot!',
    iChanged: 'E ndërrova aparatin sot',
    changedConfirm: 'Shumë mirë! Kaloni te aparati {n} dhe mbajeni për 10 ditët e ardhshme?',
    undoStep: 'Kthehu një aparat prapa',
    treatmentProgress: 'Progresi i trajtimit',
    completed: 'e përfunduar',
    estimatedFinish: 'Përfundimi i parashikuar',
    dayTracker: 'Kalendari 10-ditor',
    trackerHint: 'Çdo aparat mbahet 10 ditë. Ditët e gjelbra janë kryer.',
    setupTracker: 'Përditësoni numrin e aparatit më poshtë për të nisur kalendarin.',
    nextAppointment: 'Termini juaj i radhës',
    noAppointment: 'Ende nuk keni termin të caktuar.',
    withDoctor: 'me',
    atClinic: 'në',
    contactClinic: 'Shkruani klinikës në WhatsApp',
    view3d: 'Shiko planin tim 3D të trajtimit',
    view3dHint: 'Shikoni si do të lëvizin dhëmbët tuaj, përgatitur nga mjeku juaj.',
    uploadTitle: 'Na dërgoni foto të dhëmbëve tuaj',
    uploadHint: 'Bëni foto të qarta me dritë të mirë. Mjeku i kontrollon dhe ju përgjigjet në WhatsApp.',
    yourUploads: 'Fotot që keni dërguar',
    progressTitle: 'Rrugëtimi i aparateve tuaja',
    progressHint: 'Prekni numrin e aparatit që po mbani tani për të përditësuar progresin.',
    updateConfirm: 'Të vendoset aparati {n} si ai që po mbani tani? Kalendari 10-ditor rinis nga sot.',
    current: 'TANI',
    milestones: 'Etapat',
    treatmentStart: 'Fillimi i trajtimit',
    finalSmile: 'Buzëqeshja finale (e parashikuar)',
    helpTitle: 'Si të kujdeseni për aparatet',
    wear: { title: 'Mbajtja', items: ['Mbajini të paktën 22 orë në ditë', 'Hiqini vetëm për të ngrënë dhe pirë', 'Lani duart para se t\'i prekni'] },
    clean: { title: 'Pastrimi', items: ['Shpëlajini me ujë të ftohtë — kurrë të nxehtë', 'Pastrojini butësisht me sapun të kthjellët', 'Mbajini në kutinë e tyre kur nuk i mbani'] },
    avoid: { title: 'Shmangni', items: ['Kafe ose çaj të nxehtë me aparate në gojë', 'Pije me sheqer me aparate në gojë', 'Çamçakëz'] },
    problems: 'Probleme?',
    broken: 'Aparati u thye ose humbi?',
    brokenText: 'Vendosni aparatin e mëparshëm dhe na shkruani menjëherë.',
    pressure: 'Ndjeni presion?',
    pressureText: 'Është normale për 2 ditët e para të një aparati të ri. Do të thotë se po funksionon.',
    emergency: 'Keni nevojë për ndihmë? Përgjigjemi në WhatsApp.',
    settingsTitle: 'Cilësimet',
    yourInfo: 'Të dhënat tuaja',
    name: 'Emri',
    email: 'Email',
    infoNote: 'Për të ndryshuar të dhënat, shkruani klinikës.',
    signOut: 'Dilni',
    openFull: 'Hap në shfletues',
    close: 'Mbyll',
    loading: 'Duke ngarkuar trajtimin tuaj...',
    profileError: 'Nuk mundëm të ngarkonim profilin tuaj',
    profileErrorText: 'Kontrolloni lidhjen dhe provoni përsëri. Nëse vazhdon, na shkruani në WhatsApp.',
    tryAgain: 'Provo përsëri',
    appointmentHelp: 'Për të caktuar ose ndryshuar një termin, na shkruani në WhatsApp — përgjigjemi shpejt.',
    clinicHours: 'Orari i klinikës',
    aligners: 'aparate'
  }
};

interface UserProfile {
  name?: string;
  email?: string;
  currentAligner?: number;
  totalAligners?: number;
  nextAlignerChange?: any;
  nextAppointmentDate?: any;
  doctorName?: string;
  clinicAddress?: string;
  clinicName?: string;
  appointmentType?: string;
  treatmentStartDate?: any;
  createdAt?: any;
  nextVisitUrl?: string;
}

interface Scan {
  id: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: string;
  fileType?: string;
  uploadDate?: any;
}

type TabId = 'dashboard' | 'progress' | 'upload' | 'appointment' | 'help' | 'settings';

export const UserPortal: React.FC<{
  currentUser: any;
  onBack: () => void;
  language: 'en' | 'sq';
}> = ({ currentUser, onBack, language }) => {
  const t = T[language] || T.en;
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [scans, setScans] = useState<Scan[]>([]);
  const [scansLoaded, setScansLoaded] = useState(false);
  const [viewingUrl, setViewingUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // -------------------------------------------------------------------------
  // Data listeners (with error handling — never hang on the loading screen)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!currentUser) return;

    const unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
        setProfileLoaded(true);
      } else {
        // Self-heal a missing profile document so the portal never hangs.
        setDoc(snap.ref, {
          uid: currentUser.uid,
          email: currentUser.email || '',
          name: currentUser.displayName || 'Unnamed User',
          role: 'patient',
          status: 'active',
          createdAt: serverTimestamp(),
          registrationDate: serverTimestamp(),
          currentAligner: 1,
          totalAligners: 20,
          clinicName: 'Medident Dental Clinic',
          clinicAddress: 'Peja, Kosovo'
        }).catch((err) => {
          console.error('Failed to create missing profile:', err);
          setProfileLoaded(true);
        });
      }
    }, (err) => {
      console.error('Profile listener error:', err);
      setProfileLoaded(true);
    });

    // No orderBy: avoids needing a composite Firestore index. Sorted client-side.
    const q = query(collection(db, 'scans'), where('assignedTo', 'array-contains', currentUser.uid));
    const unsubScans = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Scan))
        .sort((a: any, b: any) => (b.uploadDate?.seconds || 0) - (a.uploadDate?.seconds || 0));
      setScans(docs);
      setScansLoaded(true);
    }, (err) => {
      console.error('Scans listener error:', err);
      setScans([]);
      setScansLoaded(true);
    });

    return () => { unsubProfile(); unsubScans(); };
  }, [currentUser]);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  const toJsDate = (d: any): Date | null => {
    if (!d) return null;
    if (typeof d.toDate === 'function') return d.toDate();
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const daysUntil = (d: any) => {
    const date = toJsDate(d);
    if (!date) return null;
    const diff = Math.ceil((date.getTime() - Date.now()) / 86400000);
    return diff < 0 ? 0 : diff;
  };

  const fmtDate = (d: any, withTime = false) => {
    const date = toJsDate(d);
    if (!date) return '—';
    const locale = language === 'sq' ? 'sq-AL' : 'en-GB';
    return withTime
      ? date.toLocaleString(locale, { dateStyle: 'full', timeStyle: 'short' })
      : date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const current = profile?.currentAligner || 1;
  const total = profile?.totalAligners || 20;
  const progressPct = Math.min(100, Math.round((current / total) * 100));
  const changeDays = daysUntil(profile?.nextAlignerChange);

  const estimatedFinish = () => {
    const start = toJsDate(profile?.treatmentStartDate) || toJsDate(profile?.createdAt) || new Date();
    const end = new Date(start.getTime() + total * 10 * 86400000);
    return end.toLocaleDateString(language === 'sq' ? 'sq-AL' : 'en-GB', { month: 'long', year: 'numeric' });
  };

  const setAligner = async (n: number) => {
    if (!currentUser || isSaving) return;
    setIsSaving(true);
    try {
      const next = new Date();
      next.setDate(next.getDate() + 10);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        currentAligner: n,
        nextAlignerChange: next
      });
    } catch (err: any) {
      console.error(err);
      alert('Error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const advanceAligner = () => {
    const next = Math.min(current + 1, total);
    if (window.confirm(t.changedConfirm.replace('{n}', String(next)))) setAligner(next);
  };

  // -------------------------------------------------------------------------
  // Loading / error states
  // -------------------------------------------------------------------------
  if (!profileLoaded || !scansLoaded) return <ScreenLoader message={t.loading} />;

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0B1220] text-white flex flex-col items-center justify-center gap-6 p-6 text-center">
        <AlertCircle className="w-14 h-14 text-amber-400" />
        <p className="text-2xl font-bold">{t.profileError}</p>
        <p className="text-white/60 max-w-md text-base">{t.profileErrorText}</p>
        <div className="flex flex-wrap justify-center gap-4">
          <button onClick={() => window.location.reload()} className="bg-[#4169E1] px-8 py-4 rounded-2xl font-bold">{t.tryAgain}</button>
          <button onClick={onBack} className="border border-white/20 px-8 py-4 rounded-2xl font-bold">{t.backToSite}</button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Shared small components
  // -------------------------------------------------------------------------
  const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/[0.04] border border-white/10 rounded-3xl p-6 md:p-8 ${className}`}>{children}</div>
  );

  const WhatsAppButton: React.FC<{ label?: string; className?: string }> = ({ label, className = '' }) => (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-3 bg-[#25D366] text-[#0B1220] font-bold text-base px-6 py-4 rounded-2xl hover:brightness-110 transition-all ${className}`}
    >
      <MessageCircle className="w-5 h-5" />
      {label || t.contactClinic}
    </a>
  );

  const DayTracker = () => {
    const nextChange = toJsDate(profile?.nextAlignerChange);
    if (!nextChange) {
      return <p className="text-white/60 text-base">{t.setupTracker}</p>;
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 10 }, (_, i) => {
      const d = new Date(nextChange.getTime());
      d.setDate(d.getDate() - (10 - (i + 1)));
      d.setHours(0, 0, 0, 0);
      return { n: i + 1, date: d, isToday: d.getTime() === today.getTime(), isPast: d.getTime() < today.getTime() };
    });
    return (
      <div className="space-y-3">
        <p className="text-white/60 text-sm">{t.trackerHint}</p>
        <div className="grid grid-cols-5 gap-2">
          {days.map(day => (
            <div
              key={day.n}
              className={`rounded-xl p-2 text-center border ${
                day.isToday ? 'bg-[#4169E1] border-[#4169E1] text-white'
                : day.isPast ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300'
                : 'bg-white/5 border-white/10 text-white/50'
              }`}
            >
              <div className="text-[11px] font-semibold opacity-70">
                {day.date.toLocaleDateString(language === 'sq' ? 'sq-AL' : 'en-GB', { weekday: 'short' })}
              </div>
              <div className="text-lg font-bold leading-tight">
                {day.isPast ? <CheckCircle2 className="w-5 h-5 mx-auto" /> : day.date.getDate()}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Pages
  // -------------------------------------------------------------------------
  const DashboardPage = () => (
    <div className="space-y-6 pb-24 lg:pb-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white">{t.hello}, {profile?.name?.split(' ')[0] || ''} 👋</h1>
        <p className="text-white/60 text-lg mt-1">{t.subtitle}</p>
      </div>

      {/* PRIMARY CARD: current aligner */}
      <Card className="border-[#4169E1]/30 bg-gradient-to-br from-[#4169E1]/15 to-transparent">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <p className="text-white/70 text-lg">{t.currentAligner}</p>
            <p className="text-6xl font-bold text-white leading-none">
              {current} <span className="text-2xl text-white/50 font-semibold">{t.of} {total}</span>
            </p>
            <p className="text-lg text-[#87CEEB] font-semibold pt-1">
              {t.changeOn} <span className="text-white">{fmtDate(profile?.nextAlignerChange)}</span>
            </p>
          </div>
          <div className="text-center shrink-0">
            {changeDays === 0 ? (
              <p className="text-amber-300 font-bold text-xl">{t.changeToday}</p>
            ) : changeDays !== null && (
              <>
                <p className="text-6xl font-bold text-white leading-none">{changeDays}</p>
                <p className="text-white/60 font-semibold mt-1">{changeDays === 1 ? t.dayLeft : t.daysLeft}</p>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {/* progress bar */}
          <div>
            <div className="flex justify-between text-sm text-white/60 mb-2">
              <span>{t.treatmentProgress}</span>
              <span className="font-bold text-white">{progressPct}% {t.completed}</span>
            </div>
            <div className="h-4 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#4169E1] to-[#87CEEB] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="text-sm text-white/50 mt-2">{t.estimatedFinish}: <span className="text-white/80 font-semibold">{estimatedFinish()}</span></p>
          </div>

          <button
            onClick={advanceAligner}
            disabled={isSaving || current >= total}
            className="w-full md:w-auto bg-white text-[#0B1220] font-bold text-base px-8 py-4 rounded-2xl hover:bg-white/90 disabled:opacity-40 transition-all flex items-center justify-center gap-3"
          >
            <Sparkles className="w-5 h-5" />
            {t.iChanged}
          </button>
        </div>
      </Card>

      {/* 10-day tracker */}
      <Card>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3"><Clock className="w-5 h-5 text-[#87CEEB]" /> {t.dayTracker}</h2>
        <DayTracker />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appointment summary */}
        <Card>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3"><Calendar className="w-5 h-5 text-[#87CEEB]" /> {t.nextAppointment}</h2>
          {profile?.nextAppointmentDate ? (
            <div className="space-y-2">
              <p className="text-2xl font-bold text-white">{fmtDate(profile.nextAppointmentDate, true)}</p>
              {profile?.doctorName && <p className="text-white/70 text-base">{t.withDoctor} {profile.doctorName}</p>}
              <p className="text-white/50 text-base">{t.atClinic} {profile?.clinicName || 'Medident Dental Clinic'}</p>
            </div>
          ) : (
            <p className="text-white/60 text-base">{t.noAppointment}</p>
          )}
          <WhatsAppButton className="mt-5 w-full" />
        </Card>

        {/* 3D plan (view only) */}
        <Card>
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-3"><Eye className="w-5 h-5 text-[#87CEEB]" /> {t.view3d}</h2>
          <p className="text-white/60 text-base mb-5">{t.view3dHint}</p>
          {(() => {
            const doctorLinks = scans.filter(s => s.fileSize === 'Secure Portal Link' || s.fileType?.toLowerCase() === 'url');
            const hasAny = profile?.nextVisitUrl || doctorLinks.length > 0;
            if (!hasAny) return <p className="text-white/40 text-base italic">—</p>;
            return (
              <div className="space-y-3">
                {profile?.nextVisitUrl && (
                  <button
                    onClick={() => setViewingUrl(profile.nextVisitUrl!)}
                    className="w-full bg-[#4169E1] text-white font-bold text-base px-6 py-4 rounded-2xl hover:bg-[#5A8DFF] transition-all flex items-center justify-center gap-3"
                  >
                    <Eye className="w-5 h-5" /> {t.view3d}
                  </button>
                )}
                {doctorLinks.map(link => (
                  <button
                    key={link.id}
                    onClick={() => setViewingUrl(link.fileUrl || '')}
                    className="w-full bg-white/5 border border-white/15 text-white font-semibold text-base px-6 py-3.5 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                  >
                    <Eye className="w-5 h-5 text-[#87CEEB]" /> {link.fileName || t.view3d}
                  </button>
                ))}
              </div>
            );
          })()}
        </Card>
      </div>
    </div>
  );

  const ProgressPage = () => (
    <div className="space-y-6 pb-24 lg:pb-10">
      <div>
        <h1 className="text-3xl font-bold text-white">{t.progressTitle}</h1>
        <p className="text-white/60 text-lg mt-1">{t.progressHint}</p>
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 justify-center">
          {Array.from({ length: total }).map((_, i) => {
            const n = i + 1;
            const isCurrent = n === current;
            const isPast = n < current;
            return (
              <button
                key={n}
                onClick={() => {
                  if (window.confirm(t.updateConfirm.replace('{n}', String(n)))) setAligner(n);
                }}
                className={`relative w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-base border transition-all
                  ${isCurrent ? 'bg-[#4169E1] border-[#4169E1] text-white scale-110 shadow-lg shadow-blue-900/40'
                    : isPast ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'}`}
              >
                {isPast ? <CheckCircle2 className="w-6 h-6" /> : n}
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-[#0B1220] text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {t.current}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-white mb-6">{t.milestones}</h2>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-white font-semibold text-base">{t.treatmentStart}</p>
              <p className="text-white/50 text-sm">{fmtDate(profile?.treatmentStartDate || profile?.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white/40" />
            </div>
            <div>
              <p className="text-white font-semibold text-base">{t.finalSmile}</p>
              <p className="text-white/50 text-sm">{estimatedFinish()}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const UploadPage = () => (
    <div className="space-y-6 pb-24 lg:pb-10">
      <div>
        <h1 className="text-3xl font-bold text-white">{t.uploadTitle}</h1>
        <p className="text-white/60 text-lg mt-1">{t.uploadHint}</p>
      </div>
      <Card>
        <ScanUpload patientId={currentUser.uid} onUploadComplete={() => setActiveTab('dashboard')} />
      </Card>
      <div>
        <h2 className="text-xl font-bold text-white mb-4">{t.yourUploads}</h2>
        <ScansList patientId={currentUser.uid} />
      </div>
    </div>
  );

  const AppointmentPage = () => (
    <div className="space-y-6 pb-24 lg:pb-10">
      <div>
        <h1 className="text-3xl font-bold text-white">{t.nextAppointment}</h1>
      </div>
      <Card>
        {profile?.nextAppointmentDate ? (
          <div className="space-y-4">
            <p className="text-3xl font-bold text-white">{fmtDate(profile.nextAppointmentDate, true)}</p>
            <div className="space-y-1 text-lg">
              {profile?.doctorName && <p className="text-white/70">{t.withDoctor} <span className="text-white font-semibold">{profile.doctorName}</span></p>}
              <p className="text-white/70">{t.atClinic} <span className="text-white font-semibold">{profile?.clinicName || 'Medident Dental Clinic'}</span></p>
              <p className="text-white/50">{profile?.clinicAddress || 'Peja, Kosovo'}</p>
            </div>
            {daysUntil(profile.nextAppointmentDate) !== null && (
              <div className="inline-block bg-[#4169E1]/15 border border-[#4169E1]/25 rounded-2xl px-6 py-3">
                <span className="text-2xl font-bold text-white">{daysUntil(profile.nextAppointmentDate)}</span>
                <span className="text-white/60 font-semibold ml-2">{daysUntil(profile.nextAppointmentDate) === 1 ? t.dayLeft : t.daysLeft}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-white/60 text-lg">{t.noAppointment}</p>
        )}
      </Card>
      <Card>
        <p className="text-white/70 text-base mb-5">{t.appointmentHelp}</p>
        <WhatsAppButton className="w-full md:w-auto" />
        <div className="mt-6 pt-6 border-t border-white/10 text-base">
          <p className="text-white/50 font-semibold mb-2">{t.clinicHours}</p>
          <p className="text-white/70">E hënë – E premte: 09:00 – 18:00</p>
          <p className="text-white/70">E shtunë: 10:00 – 15:00</p>
        </div>
      </Card>
    </div>
  );

  const HelpPage = () => (
    <div className="space-y-6 pb-24 lg:pb-10">
      <div>
        <h1 className="text-3xl font-bold text-white">{t.helpTitle}</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Clock, data: t.wear, color: 'text-[#87CEEB]' },
          { icon: Droplets, data: t.clean, color: 'text-emerald-300' },
          { icon: Ban, data: t.avoid, color: 'text-rose-300' }
        ].map((sec, i) => (
          <Card key={i}>
            <h2 className={`text-xl font-bold mb-4 flex items-center gap-3 text-white`}>
              <sec.icon className={`w-5 h-5 ${sec.color}`} /> {sec.data.title}
            </h2>
            <ul className="space-y-3">
              {sec.data.items.map((item, j) => (
                <li key={j} className="flex items-start gap-3 text-base text-white/80">
                  <CheckCircle2 className="w-5 h-5 text-white/30 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold text-white mb-4">{t.problems}</h2>
          <div className="space-y-4">
            <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
              <p className="font-bold text-rose-300 text-base">{t.broken}</p>
              <p className="text-white/70 text-base mt-1">{t.brokenText}</p>
            </div>
            <div className="p-5 bg-[#4169E1]/10 border border-[#4169E1]/20 rounded-2xl">
              <p className="font-bold text-[#87CEEB] text-base">{t.pressure}</p>
              <p className="text-white/70 text-base mt-1">{t.pressureText}</p>
            </div>
          </div>
        </Card>
        <Card className="flex flex-col justify-center items-center text-center gap-5">
          <MessageCircle className="w-12 h-12 text-[#25D366]" />
          <p className="text-white text-lg font-semibold">{t.emergency}</p>
          <WhatsAppButton className="w-full" />
        </Card>
      </div>
    </div>
  );

  const SettingsPage = () => (
    <div className="space-y-6 pb-24 lg:pb-10">
      <h1 className="text-3xl font-bold text-white">{t.settingsTitle}</h1>
      <Card>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3"><User className="w-5 h-5 text-[#87CEEB]" /> {t.yourInfo}</h2>
        <div className="space-y-5">
          <div>
            <p className="text-white/50 text-sm font-semibold mb-1">{t.name}</p>
            <p className="text-white text-lg font-semibold">{profile?.name || '—'}</p>
          </div>
          <div>
            <p className="text-white/50 text-sm font-semibold mb-1">{t.email}</p>
            <p className="text-white text-lg font-semibold">{profile?.email || '—'}</p>
          </div>
          <p className="text-white/50 text-base">{t.infoNote}</p>
          <WhatsAppButton className="w-full md:w-auto" />
        </div>
      </Card>
      <div className="flex justify-center pt-4">
        <button
          onClick={() => auth.signOut()}
          className="flex items-center gap-3 px-8 py-4 bg-white/5 text-white/70 border border-white/15 rounded-2xl font-bold text-base hover:bg-rose-500/10 hover:text-rose-300 hover:border-rose-500/25 transition-all"
        >
          <LogOut className="w-5 h-5" /> {t.signOut}
        </button>
      </div>
    </div>
  );

  // -------------------------------------------------------------------------
  // Layout
  // -------------------------------------------------------------------------
  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'dashboard', label: t.tabs.dashboard, icon: Home },
    { id: 'progress', label: t.tabs.progress, icon: Clock },
    { id: 'upload', label: t.tabs.upload, icon: Upload },
    { id: 'appointment', label: t.tabs.appointment, icon: Calendar },
    { id: 'help', label: t.tabs.help, icon: HelpCircle },
    { id: 'settings', label: t.tabs.settings, icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#0B1220] text-white font-sans">
      {/* Top bar */}
      <nav className="sticky top-0 z-50 bg-[#0B1220]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors px-3 py-2 bg-white/5 rounded-xl border border-white/10 shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-semibold hidden sm:inline">{t.backToSite}</span>
            </button>
            <span className="text-2xl font-bold tracking-tight shrink-0">Line<span className="text-[#4169E1]">a</span></span>

            {/* Desktop tabs */}
            <div className="hidden lg:flex items-center gap-1 ml-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                    activeTab === tab.id ? 'bg-[#4169E1] text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden md:block text-sm font-semibold text-white/80 truncate max-w-[140px]">{profile?.name}</span>
            <div className="w-10 h-10 rounded-xl bg-[#4169E1]/20 border border-[#4169E1]/30 flex items-center justify-center font-bold text-[#87CEEB]">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#0B1220]/95 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-stretch justify-around px-1 py-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 px-2 py-1.5 rounded-xl min-w-[52px] ${
                activeTab === tab.id ? 'text-[#87CEEB]' : 'text-white/40'
              }`}
            >
              <tab.icon className="w-6 h-6" />
              <span className="text-[11px] font-semibold leading-none">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <DashboardPage />}
            {activeTab === 'progress' && <ProgressPage />}
            {activeTab === 'upload' && <UploadPage />}
            {activeTab === 'appointment' && <AppointmentPage />}
            {activeTab === 'help' && <HelpPage />}
            {activeTab === 'settings' && <SettingsPage />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 3D plan viewer modal */}
      {viewingUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-lg">
          <div className="bg-[#0B1220] rounded-3xl w-full max-w-6xl h-[92vh] border border-white/15 flex flex-col overflow-hidden">
            <header className="p-4 md:p-5 border-b border-white/10 flex justify-between items-center gap-3 shrink-0">
              <h3 className="text-lg md:text-xl font-bold text-white truncate">{t.view3d}</h3>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => window.open(viewingUrl, '_blank')}
                  className="px-4 py-2.5 bg-[#4169E1] text-white rounded-xl font-semibold text-sm flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" /> {t.openFull}
                </button>
                <button
                  onClick={() => setViewingUrl('')}
                  className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl"
                  aria-label={t.close}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>
            <iframe
              src={viewingUrl}
              className="w-full h-full border-0 bg-white"
              title="3D treatment plan"
              allow="fullscreen; autoplay; clipboard-write"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads"
            />
          </div>
        </div>
      )}
    </div>
  );
};
