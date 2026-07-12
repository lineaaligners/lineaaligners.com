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
  AlertCircle
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Simple clinic (B2B) portal: how many cases the clinic has with Linea,
// which patients they belong to, and the billing status of each case.
// Read-only by design — clinics contact Linea on WhatsApp for anything else.
// ---------------------------------------------------------------------------

const T = {
  en: {
    title: 'Clinic Portal',
    hello: 'Welcome',
    cases: 'Cases',
    totalBilled: 'Total billed',
    outstanding: 'Outstanding',
    yourCases: 'Your cases',
    patient: 'Patient',
    caseRef: 'Case',
    date: 'Date',
    price: 'Price',
    status: 'Status',
    paid: 'Paid',
    unpaid: 'Unpaid',
    noCases: 'No cases yet. New cases appear here as soon as Linea registers them.',
    contact: 'Contact Linea on WhatsApp',
    backToSite: 'Back to site',
    signOut: 'Sign out',
    loading: 'Loading your cases...'
  },
  sq: {
    title: 'Portali i Klinikës',
    hello: 'Mirë se vini',
    cases: 'Raste',
    totalBilled: 'Fatura totale',
    outstanding: 'Pa paguar',
    yourCases: 'Rastet tuaja',
    patient: 'Pacienti',
    caseRef: 'Rasti',
    date: 'Data',
    price: 'Çmimi',
    status: 'Statusi',
    paid: 'Paguar',
    unpaid: 'Pa paguar',
    noCases: 'Ende nuk ka raste. Rastet e reja shfaqen këtu sapo Linea t\'i regjistrojë.',
    contact: 'Kontaktoni Linea në WhatsApp',
    backToSite: 'Kthehu te faqja',
    signOut: 'Dilni',
    loading: 'Duke ngarkuar rastet tuaja...'
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

export const DoctorPortal: React.FC<{
  currentUser: any;
  onBack: () => void;
  language: 'en' | 'sq';
}> = ({ currentUser, onBack, language }) => {
  const t = T[language] || T.en;
  const [cases, setCases] = useState<ClinicCase[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    // No orderBy — avoids composite index requirements. Sorted client-side.
    const q = query(collection(db, 'alignerCases'), where('clinicId', '==', currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as ClinicCase))
        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setCases(docs);
      setLoaded(true);
    }, (err) => {
      console.error('Clinic cases listener error:', err);
      setError(err.message || 'Could not load cases');
      setLoaded(true);
    });
    return () => unsub();
  }, [currentUser]);

  if (!loaded) return <ScreenLoader message={t.loading} />;

  const totalBilled = cases.reduce((s, c) => s + (c.price || 0), 0);
  const outstanding = cases.filter(c => !c.paid).reduce((s, c) => s + (c.price || 0), 0);

  const fmtDate = (d: any) => {
    if (!d) return '—';
    const date = typeof d.toDate === 'function' ? d.toDate() : new Date(d);
    return date.toLocaleDateString(language === 'sq' ? 'sq-AL' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

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
              <FolderOpen className="w-4 h-4 text-[#87CEEB]" /> {t.cases}
            </div>
            <p className="text-5xl font-bold">{cases.length}</p>
          </div>
          <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6">
            <div className="flex items-center gap-3 text-white/50 text-sm font-semibold mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" /> {t.totalBilled}
            </div>
            <p className="text-5xl font-bold">€{totalBilled.toLocaleString()}</p>
          </div>
          <div className={`border rounded-3xl p-6 ${outstanding > 0 ? 'bg-amber-500/10 border-amber-500/25' : 'bg-white/[0.04] border-white/10'}`}>
            <div className="flex items-center gap-3 text-white/50 text-sm font-semibold mb-2">
              <Clock className={`w-4 h-4 ${outstanding > 0 ? 'text-amber-300' : 'text-white/40'}`} /> {t.outstanding}
            </div>
            <p className={`text-5xl font-bold ${outstanding > 0 ? 'text-amber-300' : ''}`}>€{outstanding.toLocaleString()}</p>
          </div>
        </div>

        {/* Cases table */}
        <div className="bg-white/[0.04] border border-white/10 rounded-3xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10">
            <h2 className="text-xl font-bold">{t.yourCases}</h2>
          </div>
          {cases.length === 0 ? (
            <p className="p-8 text-white/50 text-base">{t.noCases}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-white/40 text-sm font-semibold border-b border-white/10">
                    <th className="px-6 py-4">{t.patient}</th>
                    <th className="px-6 py-4">{t.caseRef}</th>
                    <th className="px-6 py-4">{t.date}</th>
                    <th className="px-6 py-4">{t.price}</th>
                    <th className="px-6 py-4">{t.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map(c => (
                    <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                      <td className="px-6 py-4 font-semibold text-base">{c.patientName || '—'}</td>
                      <td className="px-6 py-4 text-white/60 text-base">{c.caseName || '—'}</td>
                      <td className="px-6 py-4 text-white/60 text-base">{fmtDate(c.createdAt)}</td>
                      <td className="px-6 py-4 font-semibold text-base">€{(c.price || 0).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        {c.paid ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-sm font-bold px-3 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {t.paid}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-300 border border-amber-500/25 text-sm font-bold px-3 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5" /> {t.unpaid}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
