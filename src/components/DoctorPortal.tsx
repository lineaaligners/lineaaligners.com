import React, { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { WHATSAPP_URL } from '../constants';
import { ScreenLoader } from './ProgressBar';
import {
  LogOut,
  ArrowLeft,
  MessageCircle,
  FolderOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Clinic (B2B) management portal. A partner clinic sees ONLY:
//  - the patients Linea has assigned to them, with live aligner progress
//  - their cases grouped by month, each with price and paid / unpaid
//  - money totals: billed, paid, outstanding
// Read-only. Anything else goes through WhatsApp.
// ---------------------------------------------------------------------------

const T = {
  en: {
    title: 'Clinic Portal',
    hello: 'Welcome',
    patients: 'Patients',
    activeCases: 'Cases',
    outstanding: 'Outstanding',
    yourPatients: 'Your patients',
    noPatients: 'No patients assigned yet. Patients appear here when Linea links them to your clinic.',
    aligners: 'aligners',
    done: 'Done',
    inTreatment: 'In treatment',
    monthly: 'Cases & billing by month',
    noCases: 'No cases yet. New cases appear here as soon as Linea registers them.',
    patient: 'Patient',
    caseRef: 'Case',
    price: 'Price',
    status: 'Status',
    paid: 'Paid',
    unpaid: 'Unpaid',
    casesWord: 'cases',
    billed: 'billed',
    owed: 'owed',
    allPaid: 'all paid',
    contact: 'Contact Linea on WhatsApp',
    backToSite: 'Back to site',
    signOut: 'Sign out',
    loading: 'Loading your clinic data...'
  },
  sq: {
    title: 'Portali i Klinikës',
    hello: 'Mirë se vini',
    patients: 'Pacientë',
    activeCases: 'Raste',
    outstanding: 'Pa paguar',
    yourPatients: 'Pacientët tuaj',
    noPatients: 'Ende nuk keni pacientë të caktuar. Pacientët shfaqen këtu kur Linea i lidh me klinikën tuaj.',
    aligners: 'aparate',
    done: 'Përfunduar',
    inTreatment: 'Në trajtim',
    monthly: 'Rastet dhe faturat sipas muajve',
    noCases: 'Ende nuk ka raste. Rastet e reja shfaqen këtu sapo Linea t\'i regjistrojë.',
    patient: 'Pacienti',
    caseRef: 'Rasti',
    price: 'Çmimi',
    status: 'Statusi',
    paid: 'Paguar',
    unpaid: 'Pa paguar',
    casesWord: 'raste',
    billed: 'faturuar',
    owed: 'borxh',
    allPaid: 'të gjitha të paguara',
    contact: 'Kontaktoni Linea në WhatsApp',
    backToSite: 'Kthehu te faqja',
    signOut: 'Dilni',
    loading: 'Duke ngarkuar të dhënat e klinikës...'
  }
};

interface ClinicCase {
  id: string;
  caseName?: string;
  patientName?: string;
  price?: number;
  paid?: boolean;
  createdAt?: any;
}

interface ClinicPatient {
  id: string;
  name?: string;
  currentAligner?: number;
  totalAligners?: number;
}

export const DoctorPortal: React.FC<{
  currentUser: any;
  onBack: () => void;
  language: 'en' | 'sq';
}> = ({ currentUser, onBack, language }) => {
  const t = T[language] || T.en;
  const [cases, setCases] = useState<ClinicCase[]>([]);
  const [patients, setPatients] = useState<ClinicPatient[]>([]);
  const [casesLoaded, setCasesLoaded] = useState(false);
  const [patientsLoaded, setPatientsLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;

    // Cases assigned to this clinic (no orderBy — avoids composite indexes).
    const qCases = query(collection(db, 'alignerCases'), where('clinicId', '==', currentUser.uid));
    const unsubCases = onSnapshot(qCases, (snap) => {
      const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as ClinicCase))
        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setCases(docs);
      setCasesLoaded(true);
    }, (err) => {
      console.error('Clinic cases listener error:', err);
      setError(err.message || 'Could not load cases');
      setCasesLoaded(true);
    });

    // Patients Linea assigned to this clinic (users.doctorId == clinic uid).
    const qPatients = query(collection(db, 'users'), where('doctorId', '==', currentUser.uid));
    const unsubPatients = onSnapshot(qPatients, (snap) => {
      const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as ClinicPatient))
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setPatients(docs);
      setPatientsLoaded(true);
    }, (err) => {
      console.error('Clinic patients listener error:', err);
      setPatients([]);
      setPatientsLoaded(true);
    });

    return () => { unsubCases(); unsubPatients(); };
  }, [currentUser]);

  if (!casesLoaded || !patientsLoaded) return <ScreenLoader message={t.loading} />;

  const outstanding = cases.filter(c => !c.paid).reduce((s, c) => s + (c.price || 0), 0);

  const locale = language === 'sq' ? 'sq-AL' : 'en-GB';

  // Group cases by month (newest month first — cases already sorted desc).
  const months: { key: string; label: string; items: ClinicCase[] }[] = [];
  for (const c of cases) {
    const d = c.createdAt?.toDate ? c.createdAt.toDate() : null;
    const key = d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : 'unknown';
    const label = d ? d.toLocaleDateString(locale, { month: 'long', year: 'numeric' }) : '—';
    let group = months.find(m => m.key === key);
    if (!group) { group = { key, label, items: [] }; months.push(group); }
    group.items.push(c);
  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-white font-sans">
      {/* Top bar */}
      <nav className="sticky top-0 z-50 bg-[#0B1220]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors px-3 py-2 bg-white/5 rounded-xl border border-white/10 shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-semibold hidden sm:inline">{t.backToSite}</span>
            </button>
            <img src="/linea-logo.svg" alt="Linea Aligners" className="h-9 w-auto shrink-0 brightness-0 invert" />
            <span className="text-white/40 text-sm font-semibold hidden md:inline">{t.title}</span>
          </div>
          <button
            onClick={() => auth.signOut()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 text-white/70 border border-white/15 rounded-xl font-semibold text-sm hover:bg-rose-500/10 hover:text-rose-300 transition-all shrink-0"
          >
            <LogOut className="w-4 h-4" /> {t.signOut}
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-6">
        <h1 className="text-3xl font-bold">{t.hello}, {currentUser?.displayName || ''}</h1>

        {error && (
          <div className="flex items-center gap-3 p-5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-200 text-base">
            <AlertCircle className="w-5 h-5 shrink-0" /> {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6">
            <div className="flex items-center gap-3 text-white/50 text-sm font-semibold mb-2">
              <Users className="w-4 h-4 text-[#87CEEB]" /> {t.patients}
            </div>
            <p className="text-5xl font-bold">{patients.length}</p>
          </div>
          <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6">
            <div className="flex items-center gap-3 text-white/50 text-sm font-semibold mb-2">
              <FolderOpen className="w-4 h-4 text-[#87CEEB]" /> {t.activeCases}
            </div>
            <p className="text-5xl font-bold">{cases.length}</p>
          </div>
          <div className={`border rounded-3xl p-6 ${outstanding > 0 ? 'bg-amber-500/10 border-amber-500/25' : 'bg-white/[0.04] border-white/10'}`}>
            <div className="flex items-center gap-3 text-white/50 text-sm font-semibold mb-2">
              <Clock className={`w-4 h-4 ${outstanding > 0 ? 'text-amber-300' : 'text-white/40'}`} /> {t.outstanding}
            </div>
            <p className={`text-5xl font-bold ${outstanding > 0 ? 'text-amber-300' : ''}`}>€{outstanding.toLocaleString()}</p>
          </div>
        </div>

        {/* Patients with live aligner progress */}
        <div className="bg-white/[0.04] border border-white/10 rounded-3xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10">
            <h2 className="text-xl font-bold">{t.yourPatients}</h2>
          </div>
          {patients.length === 0 ? (
            <p className="p-8 text-white/50 text-base">{t.noPatients}</p>
          ) : (
            <div className="divide-y divide-white/5">
              {patients.map(p => {
                const current = p.currentAligner || 1;
                const total = p.totalAligners || 20;
                const pct = Math.min(100, Math.round((current / total) * 100));
                const done = current >= total;
                return (
                  <div key={p.id} className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    <div className="flex items-center gap-4 min-w-0 sm:w-56 shrink-0">
                      <div className="w-11 h-11 rounded-xl bg-[#4169E1]/20 border border-[#4169E1]/30 flex items-center justify-center font-bold text-[#87CEEB] shrink-0">
                        {(p.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <p className="font-semibold text-base truncate">{p.name || '—'}</p>
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-white/60 font-semibold">{current} / {total} {t.aligners}</span>
                        <span className="text-white/40">{pct}%</span>
                      </div>
                      <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${done ? 'bg-emerald-400' : 'bg-gradient-to-r from-[#4169E1] to-[#87CEEB]'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="shrink-0">
                      {done ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-sm font-bold px-3 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {t.done}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-[#4169E1]/15 text-[#87CEEB] border border-[#4169E1]/25 text-sm font-bold px-3 py-1 rounded-full">
                          <Clock className="w-3.5 h-3.5" /> {t.inTreatment}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Monthly cases & billing */}
        <div className="bg-white/[0.04] border border-white/10 rounded-3xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10">
            <h2 className="text-xl font-bold">{t.monthly}</h2>
          </div>
          {cases.length === 0 ? (
            <p className="p-8 text-white/50 text-base">{t.noCases}</p>
          ) : (
            <div>
              {months.map(m => {
                const billed = m.items.reduce((s, c) => s + (c.price || 0), 0);
                const owed = m.items.filter(c => !c.paid).reduce((s, c) => s + (c.price || 0), 0);
                return (
                  <div key={m.key} className="border-b border-white/5 last:border-0">
                    <div className="px-6 py-4 bg-white/[0.03] flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-base capitalize">{m.label}</p>
                      <p className="text-sm text-white/60 font-semibold">
                        {m.items.length} {t.casesWord} • €{billed.toLocaleString()} {t.billed} •{' '}
                        {owed > 0
                          ? <span className="text-amber-300">€{owed.toLocaleString()} {t.owed}</span>
                          : <span className="text-emerald-300">{t.allPaid}</span>}
                      </p>
                    </div>
                    <div className="divide-y divide-white/5">
                      {m.items.map(c => (
                        <div key={c.id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-base truncate">{c.patientName || '—'}</p>
                            <p className="text-white/50 text-sm truncate">{c.caseName || '—'}</p>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className="font-semibold text-base">€{(c.price || 0).toLocaleString()}</span>
                            {c.paid ? (
                              <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-sm font-bold px-3 py-1 rounded-full">
                                <CheckCircle2 className="w-3.5 h-3.5" /> {t.paid}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-300 border border-amber-500/25 text-sm font-bold px-3 py-1 rounded-full">
                                <Clock className="w-3.5 h-3.5" /> {t.unpaid}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Contact */}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-3 bg-[#25D366] text-[#0B1220] font-bold text-base px-6 py-4 rounded-2xl hover:brightness-110 transition-all"
        >
          <MessageCircle className="w-5 h-5" /> {t.contact}
        </a>
      </main>
    </div>
  );
};
