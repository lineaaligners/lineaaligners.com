import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence, useInView } from 'motion/react';
import { ArrowUpRight, Plus, Minus, Menu, X, Phone, MapPin, MessageCircle, ScanLine, Sparkles, Eye, Clock, ShieldCheck, Wallet } from 'lucide-react';
import { WHATSAPP_URL, SCAN_VIDEO_URL, FAQS_CONTENT } from '../../constants';

type Lang = 'en' | 'sq';
const HERO_IMG = 'https://gwzvtrikxkudostserwe.supabase.co/storage/v1/object/public/linea/freepik_anamorphic-lens-photograp_2698310219.jpeg';
const ALIGNER_IMG = 'https://gwzvtrikxkudostserwe.supabase.co/storage/v1/object/public/linea/freepik_upscale-your-image-to-a-h_2777775323.jpeg';
const EASE = [0.16, 1, 0.3, 1] as const;

const T = {
  sq: {
    nav: [['Si funksionon', '#si'], ['Pse Linea', '#pse'], ['Çmimi', '#cmimi'], ['Pyetje', '#pyetje']],
    login: 'Hyr', cta: 'Skanim falas',
    eyebrow: 'Aligner transparentë · Pejë, Kosovë',
    h1a: 'Buzëqeshja', h1b: 'që e ke', h1c: 'merituar.',
    sub: 'Maskerina transparente, të dizajnuara në 3D vetëm për dhëmbët e tu. Pa tela, pa metal — dhe askush nuk e vëren.',
    b1: 'Rezervo skanimin falas', b2: 'A më përshtatet?',
    chips: ['0% interes', '4–9 muaj', 'Retainer të përfshirë'],
    marquee: ['Pa tela', 'Pa metal', 'Plan 3D', 'Skanim falas', 'Bërë në Pejë', 'Mbikëqyrje nga dentisti', 'Pagesë me këste'],
    trTag: 'Transformimi', trTitle: 'Çdo maskerinë, një hap më afër.', trDesc: 'Lëviz poshtë dhe shih si dhëmbët zhvendosen hap pas hapi — pikërisht siç planifikohet në 3D para se të fillosh.', step: 'Hapi',
    whyTag: 'Pse Linea', whyTitle: 'Gjithçka që bëjnë telat.', whyTitle2: 'Asgjë nga ato që s’i do.',
    why: [
      ['Pothuajse të padukshme', 'Plastikë mjekësore krejt transparente. Në foto, në punë, në dasëm — askush s’e kupton.', 'eye'],
      ['I heq kur të duash', 'Ha, pi kafe, laj dhëmbët pa pengesa. I vendos prapë dhe vazhdon.', 'spark'],
      ['E sheh rezultatin para fillimit', 'Plani 3D të tregon buzëqeshjen përfundimtare para se të vendosësh.', 'scan'],
      ['Shpejt', 'Shumica e rasteve përfundojnë për 4–9 muaj.', 'clock'],
      ['Dentisti në çdo hap', 'Çdo plan kontrollohet nga mjeku në Medident — klinikë që nga viti 1999.', 'shield'],
      ['Me këste, 0% interes', 'Pagesë fleksibile pa kosto të fshehura.', 'wallet'],
    ],
    howTag: 'Si funksionon', howTitle: 'Tre hapa. Asnjë tel.',
    how: [
      ['Skanimi 3D falas', 'Disa minuta në karrige, pa masë gipsi. Skanojmë dhëmbët me skaner digjital.'],
      ['Plani yt në 3D', 'Të dërgojmë linkun me planin — e sheh lëvizjen e çdo dhëmbi dhe buzëqeshjen përfundimtare.'],
      ['Fillon buzëqeshja', 'Merr maskerinat, i ndërron çdo 10 ditë dhe ne të ndjekim në portal dhe WhatsApp.'],
    ],
    filmTag: 'Nga afër', filmTitle: 'Precizion që shihet.', filmDesc: 'Çdo set prodhohet sipas planit digjital — me saktësi të dhjetave të milimetrit.', play: 'Shiko videon',
    priceTag: 'Çmimi', priceTitle: 'E qartë. Pa surpriza.', priceDesc: 'Çmimi varet nga rasti yt — pas skanimit falas e merr ofertën e saktë me shkrim.',
    priceRows: [['Koha e trajtimit', '4 – 9 muaj'], ['Pagesa', 'Me këste, 0% interes'], ['Skanimi 3D', 'Falas'], ['Retainer-at', 'Të përfshirë']],
    priceBtn: 'Merr ofertën në WhatsApp',
    faqTag: 'Pyetje', faqTitle: 'Pyetjet që na bëni më shpesh.',
    endA: 'Gati për', endB: 'buzëqeshjen tënde?', endDesc: 'Një mesazh mjafton. Të themi sinqerisht nëse aligner-at janë për ty.',
    fTag: 'Aligner transparentë premium, të dizajnuar dhe prodhuar në Kosovë.',
    fCols: [['Linea', [['Si funksionon', '#si'], ['Pse Linea', '#pse'], ['Çmimi', '#cmimi'], ['Pyetje', '#pyetje']]], ['Pacientët', [['Portali', '/portal/'], ['A më përshtatet?', '/assessment/'], ['WhatsApp', WHATSAPP_URL]]]],
    fContact: 'Kontakti', fAddr: 'Rr. Bajram Kelmendi, Pejë 30000', fClinic: 'Në partneritet me Medident Dental Clinic',
    rights: 'Të gjitha të drejtat e rezervuara.',
  },
  en: {
    nav: [['How it works', '#si'], ['Why Linea', '#pse'], ['Pricing', '#cmimi'], ['FAQ', '#pyetje']],
    login: 'Log in', cta: 'Free scan',
    eyebrow: 'Clear aligners · Pejë, Kosovo',
    h1a: 'The smile', h1b: 'you’ve always', h1c: 'deserved.',
    sub: 'Clear aligners designed in 3D for your teeth only. No wires, no metal — and nobody notices.',
    b1: 'Book your free scan', b2: 'Is it right for me?',
    chips: ['0% interest', '4–9 months', 'Retainers included'],
    marquee: ['No wires', 'No metal', '3D planned', 'Free scan', 'Made in Pejë', 'Dentist-supervised', 'Pay in installments'],
    trTag: 'The transformation', trTitle: 'Every aligner, one step closer.', trDesc: 'Scroll and watch the teeth move step by step — exactly as it is planned in 3D before you start.', step: 'Step',
    whyTag: 'Why Linea', whyTitle: 'Everything braces do.', whyTitle2: 'None of what you don’t want.',
    why: [
      ['Nearly invisible', 'Fully transparent medical-grade plastic. At work, in photos, at weddings — nobody can tell.', 'eye'],
      ['Remove them anytime', 'Eat, drink coffee, brush freely. Pop them back in and carry on.', 'spark'],
      ['See the result first', 'Your 3D plan shows the final smile before you decide.', 'scan'],
      ['Fast', 'Most cases finish in 4–9 months.', 'clock'],
      ['A dentist at every step', 'Every plan is checked by a doctor at Medident — a clinic since 1999.', 'shield'],
      ['Installments, 0% interest', 'Flexible payment, no hidden costs.', 'wallet'],
    ],
    howTag: 'How it works', howTitle: 'Three steps. Zero wires.',
    how: [
      ['Free 3D scan', 'A few minutes in the chair, no goo. We scan your teeth digitally.'],
      ['Your plan in 3D', 'We send you a link to your plan — see every tooth move and your final smile.'],
      ['Start smiling', 'Get your aligners, switch every 10 days, and we follow you in the portal and on WhatsApp.'],
    ],
    filmTag: 'Up close', filmTitle: 'Precision you can see.', filmDesc: 'Every set is produced from your digital plan — accurate to tenths of a millimetre.', play: 'Watch the film',
    priceTag: 'Pricing', priceTitle: 'Clear. No surprises.', priceDesc: 'Price depends on your case — after the free scan you get an exact written quote.',
    priceRows: [['Treatment time', '4 – 9 months'], ['Payment', 'Installments, 0% interest'], ['3D scan', 'Free'], ['Retainers', 'Included']],
    priceBtn: 'Get a quote on WhatsApp',
    faqTag: 'FAQ', faqTitle: 'What people ask us most.',
    endA: 'Ready for', endB: 'your smile?', endDesc: 'One message is enough. We’ll tell you honestly if aligners are right for you.',
    fTag: 'Premium clear aligners, designed and made in Kosovo.',
    fCols: [['Linea', [['How it works', '#si'], ['Why Linea', '#pse'], ['Pricing', '#cmimi'], ['FAQ', '#pyetje']]], ['Patients', [['Portal', '/portal/'], ['Is it right for me?', '/assessment/?lang=en'], ['WhatsApp', WHATSAPP_URL]]]],
    fContact: 'Contact', fAddr: 'Rr. Bajram Kelmendi, Pejë 30000', fClinic: 'In partnership with Medident Dental Clinic',
    rights: 'All rights reserved.',
  },
};

const ICONS: Record<string, any> = { eye: Eye, spark: Sparkles, scan: ScanLine, clock: Clock, shield: ShieldCheck, wallet: Wallet };
const openWA = () => { const w = window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer'); if (!w) window.location.href = WHATSAPP_URL; };

/* ---------- animated teeth graphic: crooked -> aligned driven by a 0..1 value ---------- */
const OFFS = [[-10, 14], [8, -12], [-6, 18], [12, -16], [-4, 10], [10, 16], [-12, -10], [6, 12]]; // [dy, rotate] per tooth (crooked state)
const Teeth: React.FC<{ p: any; className?: string }> = ({ p, className }) => {
  const xs = [30, 92, 150, 202, 254, 306, 364, 426];
  const ws = [52, 56, 50, 48, 48, 50, 56, 52];
  return (
    <svg viewBox="0 0 480 220" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#c9dcff" /></linearGradient>
        <linearGradient id="ag" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#87CEEB" stopOpacity=".0" /><stop offset=".5" stopColor="#87CEEB" stopOpacity=".55" /><stop offset="1" stopColor="#87CEEB" stopOpacity="0" /></linearGradient>
      </defs>
      {xs.map((x, i) => <Tooth key={i} p={p} x={x} w={ws[i]} dy={OFFS[i][0]} rot={OFFS[i][1]} />)}
      <AlignerShell p={p} />
    </svg>
  );
};
const Tooth: React.FC<{ p: any; x: number; w: number; dy: number; rot: number }> = ({ p, x, w, dy, rot }) => {
  const y = useTransform(p, [0, 1], [dy, 0]);
  const r = useTransform(p, [0, 1], [rot, 0]);
  const h = 120;
  const d = `M${-w / 2},${-h / 2 + 18} Q${-w / 2},${-h / 2} ${-w / 4},${-h / 2} L${w / 4},${-h / 2} Q${w / 2},${-h / 2} ${w / 2},${-h / 2 + 18} L${w / 2 - 6},${h / 2 - 22} Q${w / 2 - 10},${h / 2} ${0},${h / 2} Q${-w / 2 + 10},${h / 2} ${-w / 2 + 6},${h / 2 - 22} Z`;
  return (
    <motion.g style={{ x: x + w / 2 - 4, y: useTransform(y, v => 110 + v), rotate: r }}>
      <path d={d} fill="url(#tg)" stroke="#ffffff" strokeOpacity=".6" />
      <path d={`M${-w / 4},${-h / 2 + 10} q${w / 6},-4 ${w / 3},0`} stroke="#4169E1" strokeOpacity=".25" strokeWidth="3" fill="none" strokeLinecap="round" />
    </motion.g>
  );
};
const AlignerShell: React.FC<{ p: any }> = ({ p }) => {
  const o = useTransform(p, [0.55, 1], [0, 1]);
  const y = useTransform(p, [0.55, 1], [-30, 0]);
  return (
    <motion.g style={{ opacity: o, y }}>
      <rect x="22" y="44" width="440" height="132" rx="40" fill="url(#ag)" opacity=".35" />
      <rect x="22" y="44" width="440" height="132" rx="40" fill="none" stroke="#87CEEB" strokeOpacity=".7" strokeWidth="2" strokeDasharray="6 8" />
    </motion.g>
  );
};

/* ---------- header ---------- */
const Header: React.FC<{ lang: Lang; setLang: (l: Lang) => void; isAdmin?: boolean; onAdmin?: () => void }> = ({ lang, setLang, isAdmin, onAdmin }) => {
  const t = T[lang];
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const bar = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  useEffect(() => { const f = () => setSolid(window.scrollY > 24); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <motion.div style={{ scaleX: bar }} className="absolute top-0 left-0 right-0 h-[2px] origin-left bg-gradient-to-r from-[#87CEEB] via-[#4169E1] to-[#87CEEB]" />
      <div className={`mx-auto transition-all duration-500 ${solid ? 'mt-3 max-w-6xl px-3' : 'mt-0 max-w-7xl px-4 sm:px-8'}`}>
        <motion.nav initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: .8, ease: EASE }}
          className={`flex items-center justify-between transition-all duration-500 ${solid ? 'rounded-full bg-[#0B1A33]/70 backdrop-blur-xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,.35)] pl-5 pr-2 py-2' : 'py-6'}`}>
          <a href="#top" className="flex items-center gap-2" aria-label="Linea Aligners">
            <img src="/linea-logo.svg" alt="Linea" className={`brightness-0 invert transition-all duration-500 ${solid ? 'h-7' : 'h-9'}`} />
          </a>
          <ul className="hidden lg:flex items-center gap-1">
            {t.nav.map(([l, h]) => (
              <li key={h}><a href={h} className="relative px-4 py-2 text-[14px] font-medium text-white/75 hover:text-white transition-colors group">
                {l}<span className="absolute left-4 right-4 -bottom-0.5 h-px bg-[#87CEEB] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
              </a></li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center rounded-full border border-white/15 p-0.5 text-[11px] font-semibold">
              {(['sq', 'en'] as Lang[]).map(l => (
                <button key={l} onClick={() => setLang(l)} className={`px-2.5 py-1 rounded-full uppercase transition-colors ${lang === l ? 'bg-white text-[#0B1A33]' : 'text-white/60 hover:text-white'}`}>{l}</button>
              ))}
            </div>
            {isAdmin && <button onClick={onAdmin} className="hidden md:block px-3 py-2 text-[12px] font-semibold text-amber-300/90 hover:text-amber-200">Admin</button>}
            <a href="/portal/" className="hidden md:block px-4 py-2 text-[14px] font-medium text-white/80 hover:text-white">{t.login}</a>
            <button onClick={openWA} className="group relative overflow-hidden rounded-full bg-white text-[#0B1A33] pl-5 pr-2 py-2 text-[14px] font-semibold flex items-center gap-2">
              <span className="relative z-10">{t.cta}</span>
              <span className="relative z-10 grid place-items-center w-7 h-7 rounded-full bg-[#0B1A33] text-white group-hover:rotate-45 transition-transform duration-300"><ArrowUpRight className="w-4 h-4" /></span>
            </button>
            <button className="lg:hidden w-10 h-10 grid place-items-center rounded-full border border-white/15 text-white" onClick={() => setOpen(true)} aria-label="Menu"><Menu className="w-5 h-5" /></button>
          </div>
        </motion.nav>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ clipPath: 'circle(0% at 100% 0%)' }} animate={{ clipPath: 'circle(150% at 100% 0%)' }} exit={{ clipPath: 'circle(0% at 100% 0%)' }} transition={{ duration: .6, ease: EASE }}
            className="fixed inset-0 z-[60] bg-[#06101F] flex flex-col p-6">
            <div className="flex justify-between items-center">
              <img src="/linea-logo.svg" alt="Linea" className="h-8 brightness-0 invert" />
              <button onClick={() => setOpen(false)} className="w-11 h-11 grid place-items-center rounded-full border border-white/15 text-white" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 flex flex-col justify-center gap-2">
              {[...t.nav, [t.login, '/portal/']].map(([l, h], i) => (
                <motion.a key={h} href={h} onClick={() => setOpen(false)} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: .15 + i * .06, ease: EASE, duration: .6 }}
                  className="font-display text-5xl text-white">{l}</motion.a>
              ))}
            </div>
            <div className="flex gap-2">
              {(['sq', 'en'] as Lang[]).map(l => <button key={l} onClick={() => setLang(l)} className={`px-4 py-2 rounded-full uppercase text-sm ${lang === l ? 'bg-white text-[#0B1A33]' : 'border border-white/20 text-white'}`}>{l}</button>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

/* ---------- reveal helpers ---------- */
const Words: React.FC<{ text: string; className?: string; delay?: number }> = ({ text, className, delay = 0 }) => (
  <motion.span className={className} initial="h" whileInView="s" viewport={{ once: true, margin: '-8%' }}>
    {text.split(' ').map((w, i) => (
      <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]">
        <motion.span className="inline-block" variants={{ h: { y: '110%' }, s: { y: 0, transition: { duration: 1, ease: EASE, delay: delay + i * .07 } } }}>{w}&nbsp;</motion.span>
      </span>
    ))}
  </motion.span>
);
const Up: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className }) => (
  <motion.div className={className} initial={{ y: 40, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true, margin: '-10%' }} transition={{ duration: .9, ease: EASE, delay }}>{children}</motion.div>
);
const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[.22em] text-[#87CEEB]"><span className="w-6 h-px bg-[#87CEEB]" />{children}</div>
);

/* ---------- hero ---------- */
const Hero: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = T[lang];
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const fade = useTransform(scrollYProgress, [0, .7], [1, 0]);
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 }), sy = useSpring(my, { stiffness: 60, damping: 20 });
  return (
    <section id="top" ref={ref} onMouseMove={e => { mx.set((e.clientX / window.innerWidth - .5) * 30); my.set((e.clientY / window.innerHeight - .5) * 30); }}
      className="relative min-h-[100svh] overflow-hidden bg-[#06101F] flex items-end">
      <motion.div style={{ y: imgY }} className="absolute inset-0">
        <img src={HERO_IMG} alt="" className="w-full h-full object-cover opacity-40 scale-110" fetchPriority="high" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#06101F]/60 via-[#06101F]/40 to-[#06101F]" />
      <motion.div style={{ x: sx, y: sy }} className="absolute -top-40 -right-40 w-[60vw] h-[60vw] rounded-full bg-[#4169E1] blur-[140px] opacity-40 blob" />
      <motion.div style={{ x: useTransform(sx, v => -v), y: useTransform(sy, v => -v) }} className="absolute -bottom-60 -left-40 w-[50vw] h-[50vw] rounded-full bg-[#87CEEB] blur-[160px] opacity-20 blob2" />
      <div className="absolute inset-0 grid-lines opacity-[.07]" />

      <motion.div style={{ opacity: fade }} className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 pb-14 sm:pb-20 pt-32">
        <div className="grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3, duration: .8, ease: EASE }}
              className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 backdrop-blur px-4 py-2 text-[12px] font-medium text-white/80 mb-8">
              <span className="relative flex w-2 h-2"><span className="absolute inset-0 rounded-full bg-[#87CEEB] animate-ping" /><span className="relative w-2 h-2 rounded-full bg-[#87CEEB]" /></span>
              {t.eyebrow}
            </motion.div>
            <h1 className="font-display text-white leading-[.92] tracking-[-.03em] text-[14vw] sm:text-[10vw] lg:text-[7.4rem]">
              {[t.h1a, t.h1b].map((l, i) => (
                <span key={i} className="block overflow-hidden pb-[.12em] -mb-[.12em]"><motion.span className="block" initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 1.2, ease: EASE, delay: .35 + i * .12 }}>{l}</motion.span></span>
              ))}
              <span className="block overflow-hidden pb-[.12em] -mb-[.12em]"><motion.span className="block italic font-serif-i text-shimmer" initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 1.2, ease: EASE, delay: .6 }}>{t.h1c}</motion.span></span>
            </h1>
          </div>
          <div className="lg:col-span-4 lg:pb-4">
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .9, duration: .9, ease: EASE }} className="text-lg text-white/75 leading-relaxed mb-8 max-w-md">{t.sub}</motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: .9, ease: EASE }} className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3">
              <button onClick={openWA} className="group flex items-center justify-between gap-4 rounded-full bg-[#4169E1] hover:bg-[#5A85FF] transition-colors text-white pl-6 pr-2 py-2 font-semibold whitespace-nowrap shadow-[0_20px_60px_rgba(65,105,225,.45)]">
                {t.b1}<span className="grid place-items-center w-10 h-10 rounded-full bg-white text-[#4169E1] group-hover:rotate-45 transition-transform"><ArrowUpRight className="w-5 h-5" /></span>
              </button>
              <a href={'/assessment/' + (lang === 'en' ? '?lang=en' : '')} className="flex items-center justify-center rounded-full border border-white/20 hover:bg-white/10 transition-colors text-white px-6 py-4 font-semibold whitespace-nowrap">{t.b2}</a>
            </motion.div>
          </div>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 1 }} className="mt-14 flex flex-col md:flex-row md:items-center justify-between gap-8 border-t border-white/10 pt-8">
          <div className="flex flex-wrap gap-2">
            {t.chips.map(c => <span key={c} className="rounded-full bg-white/[.06] border border-white/10 px-4 py-2 text-sm text-white/80">{c}</span>)}
          </div>
          <div className="text-sm text-white/50">Medident Dental Clinic · {lang === 'sq' ? 'që nga' : 'since'} 1999</div>
        </motion.div>
      </motion.div>
    </section>
  );
};

/* ---------- marquee ---------- */
const Marquee: React.FC<{ lang: Lang }> = ({ lang }) => {
  const items = T[lang].marquee;
  const row = [...items, ...items];
  return (
    <div className="relative bg-[#4169E1] py-5 overflow-hidden -rotate-[1.2deg] scale-[1.02] my-[-1px] z-20">
      <div className="marquee flex w-max gap-10">
        {[0, 1].map(k => (
          <div key={k} className="flex gap-10 shrink-0" aria-hidden={k === 1}>
            {row.map((w, i) => <span key={i} className="flex items-center gap-10 font-display text-3xl sm:text-4xl text-white whitespace-nowrap">{w}<span className="w-3 h-3 rounded-full bg-white/60" /></span>)}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------- scroll-driven transformation ---------- */
const Transformation: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = T[lang];
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const p = useSpring(useTransform(scrollYProgress, [0.05, 0.85], [0, 1], { clamp: true }), { stiffness: 80, damping: 22 });
  const [step, setStep] = useState(1);
  useEffect(() => p.on('change', v => setStep(Math.max(1, Math.round(v * 24)))), [p]);
  const width = useTransform(p, v => `${v * 100}%`);
  return (
    <section ref={ref} className="relative h-[260vh] bg-[#06101F]" aria-label={t.trTag}>
      <div className="sticky top-0 h-[100svh] flex items-center overflow-hidden">
        <div className="absolute inset-0 radial-glow" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 w-full grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Tag>{t.trTag}</Tag>
            <h2 className="font-display text-5xl sm:text-7xl text-white leading-[.95] tracking-[-.03em] mt-6"><Words text={t.trTitle} /></h2>
            <Up delay={.2}><p className="text-white/65 text-lg mt-6 max-w-md">{t.trDesc}</p></Up>
            <div className="mt-10 max-w-md">
              <div className="flex justify-between text-sm text-white/60 mb-3"><span>{t.step} <span className="text-white font-semibold tabular-nums">{String(step).padStart(2, '0')}</span> / 24</span><span className="tabular-nums">{Math.round(step / 24 * 100)}%</span></div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><motion.div style={{ width }} className="h-full bg-gradient-to-r from-[#4169E1] to-[#87CEEB] rounded-full" /></div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-10 bg-[#4169E1]/30 blur-[90px] rounded-full" />
            <div className="relative rounded-[36px] border border-white/10 bg-gradient-to-b from-white/[.07] to-white/[.02] p-6 sm:p-10">
              <Teeth p={p} className="w-full h-auto" />
              <div className="mt-6 flex justify-between text-[11px] uppercase tracking-[.2em] text-white/40"><span>{lang === 'sq' ? 'Para' : 'Before'}</span><span>{lang === 'sq' ? 'Pas' : 'After'}</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ---------- why / bento ---------- */
const Why: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = T[lang];
  return (
    <section id="pse" className="relative bg-[#F4F6FA] text-[#0B1A33] py-28 sm:py-40 rounded-t-[40px] sm:rounded-t-[64px] -mt-10 z-10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[.22em] text-[#4169E1]"><span className="w-6 h-px bg-[#4169E1]" />{t.whyTag}</div>
            <h2 className="font-display text-5xl sm:text-7xl leading-[.95] tracking-[-.03em] mt-6"><Words text={t.whyTitle} /><br /><Words text={t.whyTitle2} className="italic font-serif-i text-[#4169E1]" delay={.2} /></h2>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {t.why.map(([title, desc, ic], i) => {
            const I = ICONS[ic];
            const big = i === 0; const wide = i === 5;
            return (
              <Up key={title} delay={i * .06} className={big ? 'sm:col-span-2 lg:col-span-1 lg:row-span-2' : wide ? 'sm:col-span-2 lg:col-span-3' : ''}>
                <div className={`group h-full rounded-[28px] p-7 sm:p-8 flex flex-col justify-between gap-10 transition-all duration-500 hover:-translate-y-1 ${big ? 'bg-[#0B1A33] text-white min-h-[340px] overflow-hidden relative' : 'bg-white border border-[#0B1A33]/[.06] hover:shadow-[0_30px_80px_rgba(11,26,51,.12)]'}`}>
                  {big && <img src={ALIGNER_IMG} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-[1.5s]" />}
                  {big && <div className="absolute inset-0 bg-gradient-to-t from-[#0B1A33] via-[#0B1A33]/50 to-transparent" />}
                  <div className={`relative w-12 h-12 rounded-2xl grid place-items-center transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110 ${big ? 'bg-white/15 backdrop-blur' : 'bg-[#4169E1]/10 text-[#4169E1]'}`}><I className="w-6 h-6" /></div>
                  <div className="relative">
                    <h3 className={`font-display tracking-[-.02em] mb-2 ${big ? 'text-4xl' : 'text-2xl'}`}>{title}</h3>
                    <p className={big ? 'text-white/75' : 'text-[#0B1A33]/60'}>{desc}</p>
                  </div>
                </div>
              </Up>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ---------- how ---------- */
const How: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = T[lang];
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] });
  const line = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  return (
    <section id="si" className="bg-[#F4F6FA] text-[#0B1A33] pb-28 sm:pb-40">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[.22em] text-[#4169E1]"><span className="w-6 h-px bg-[#4169E1]" />{t.howTag}</div>
        <h2 className="font-display text-5xl sm:text-7xl leading-[.95] tracking-[-.03em] mt-6 mb-16"><Words text={t.howTitle} /></h2>
        <div ref={ref} className="relative grid md:grid-cols-3 gap-6">
          <div className="hidden md:block absolute top-[38px] left-0 right-0 h-px bg-[#0B1A33]/10"><motion.div style={{ width: line }} className="h-full bg-[#4169E1]" /></div>
          {t.how.map(([title, desc], i) => (
            <Up key={title} delay={i * .12}>
              <div className="relative">
                <div className="w-[76px] h-[76px] rounded-full bg-[#0B1A33] text-white grid place-items-center font-display text-2xl mb-8 relative z-10 ring-8 ring-[#F4F6FA]">0{i + 1}</div>
                <h3 className="font-display text-3xl tracking-[-.02em] mb-3">{title}</h3>
                <p className="text-[#0B1A33]/60 text-lg leading-relaxed">{desc}</p>
              </div>
            </Up>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ---------- film ---------- */
const Film: React.FC<{ lang: Lang; onPlay: () => void }> = ({ lang, onPlay }) => {
  const t = T[lang];
  const ref = useRef<HTMLDivElement>(null);
  const vref = useRef<HTMLVideoElement>(null);
  const inView = useInView(ref, { margin: '200px' });
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, .45], [.86, 1]);
  const radius = useTransform(scrollYProgress, [0, .45], [64, 28]);
  useEffect(() => { const v = vref.current; if (!v) return; if (inView) v.play().catch(() => {}); else v.pause(); }, [inView]);
  return (
    <section ref={ref} className="bg-[#F4F6FA] pb-28 sm:pb-40 px-3 sm:px-6">
      <motion.div style={{ scale, borderRadius: radius }} className="relative overflow-hidden mx-auto max-w-[1500px] aspect-[4/5] sm:aspect-[16/8] bg-[#06101F]">
        <img src={HERO_IMG} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-70" />
        {inView && <video ref={vref} src={SCAN_VIDEO_URL} muted loop playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06101F] via-[#06101F]/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-14 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <Tag>{t.filmTag}</Tag>
            <h2 className="font-display text-5xl sm:text-8xl text-white leading-[.92] tracking-[-.03em] mt-4"><Words text={t.filmTitle} /></h2>
            <p className="text-white/70 mt-4 max-w-md">{t.filmDesc}</p>
          </div>
          <button onClick={onPlay} className="group flex items-center gap-4 text-white shrink-0">
            <span className="relative w-20 h-20 rounded-full bg-white text-[#0B1A33] grid place-items-center">
              <span className="absolute inset-0 rounded-full border border-white animate-ping opacity-40" />
              <svg viewBox="0 0 24 24" className="w-6 h-6 ml-1 fill-current"><path d="M8 5v14l11-7z" /></svg>
            </span>
            <span className="font-semibold">{t.play}</span>
          </button>
        </div>
      </motion.div>
    </section>
  );
};

/* ---------- pricing ---------- */
const Pricing: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = T[lang];
  return (
    <section id="cmimi" className="relative bg-[#06101F] text-white py-28 sm:py-40 overflow-hidden">
      <div className="absolute -right-40 top-20 w-[600px] h-[600px] rounded-full bg-[#4169E1] blur-[180px] opacity-25 blob" />
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <Tag>{t.priceTag}</Tag>
          <h2 className="font-display text-5xl sm:text-7xl leading-[.95] tracking-[-.03em] mt-6"><Words text={t.priceTitle} /></h2>
          <Up delay={.2}><p className="text-white/65 text-lg mt-6 max-w-md">{t.priceDesc}</p></Up>
        </div>
        <Up>
          <div className="rounded-[32px] border border-white/10 bg-white/[.04] backdrop-blur p-3">
            <div className="rounded-[26px] bg-gradient-to-br from-[#4169E1] to-[#1D3F8F] p-8 mb-3 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full border border-white/20" />
              <div className="absolute -right-2 -top-2 w-32 h-32 rounded-full border border-white/20" />
              <div className="text-white/70 text-sm">{lang === 'sq' ? 'Interes' : 'Interest'}</div>
              <div className="font-display text-8xl leading-none mt-2">0%</div>
            </div>
            <div className="px-5 py-2">
              {t.priceRows.map(([k, v]) => (
                <div key={k} className="flex justify-between py-4 border-b border-white/[.07] last:border-0"><span className="text-white/55">{k}</span><span className="font-semibold">{v}</span></div>
              ))}
            </div>
            <button onClick={openWA} className="w-full mt-2 rounded-[22px] bg-white text-[#0B1A33] font-semibold py-5 flex items-center justify-center gap-2 hover:bg-[#87CEEB] transition-colors">{t.priceBtn}<ArrowUpRight className="w-5 h-5" /></button>
          </div>
        </Up>
      </div>
    </section>
  );
};

/* ---------- faq ---------- */
const Faq: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = T[lang];
  const items = ((FAQS_CONTENT as any)[lang] || []) as { question: string; answer: string }[];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="pyetje" className="bg-[#06101F] text-white pb-28 sm:pb-40">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <Tag>{t.faqTag}</Tag>
          <h2 className="font-display text-5xl sm:text-6xl leading-[.95] tracking-[-.03em] mt-6"><Words text={t.faqTitle} /></h2>
        </div>
        <div className="lg:col-span-7 divide-y divide-white/10 border-y border-white/10">
          {items.map((f, i) => (
            <div key={i}>
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex justify-between items-center gap-6 py-6 text-left" aria-expanded={open === i}>
                <span className="text-lg sm:text-xl font-medium">{f.question}</span>
                <span className={`shrink-0 w-10 h-10 rounded-full grid place-items-center border transition-colors ${open === i ? 'bg-white text-[#0B1A33] border-white' : 'border-white/20'}`}>{open === i ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}</span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .45, ease: EASE }} className="overflow-hidden">
                    <p className="pb-6 pr-14 text-white/65 leading-relaxed">{f.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ---------- big footer ---------- */
const BigFooter: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = T[lang];
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const y = useTransform(scrollYProgress, [0, 1], ['40%', '0%']);
  const ls = useTransform(scrollYProgress, [0, 1], ['0.2em', '-0.04em']);
  return (
    <footer ref={ref} id="footer" className="relative bg-[#4169E1] text-white overflow-hidden rounded-t-[40px] sm:rounded-t-[64px]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28">
        <div className="grid lg:grid-cols-12 gap-12 pb-16 border-b border-white/20">
          <div className="lg:col-span-6">
            <h2 className="font-display text-5xl sm:text-7xl leading-[.95] tracking-[-.03em]">{t.endA}<br /><span className="italic font-serif-i">{t.endB}</span></h2>
            <p className="text-white/80 text-lg mt-6 max-w-md">{t.endDesc}</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button onClick={openWA} className="group flex items-center justify-between gap-4 rounded-full bg-white text-[#0B1A33] pl-6 pr-2 py-2 font-semibold">
                <span className="flex items-center gap-2"><MessageCircle className="w-5 h-5 text-[#25D366]" />WhatsApp</span>
                <span className="grid place-items-center w-10 h-10 rounded-full bg-[#0B1A33] text-white group-hover:rotate-45 transition-transform"><ArrowUpRight className="w-5 h-5" /></span>
              </button>
              <a href="tel:+38349772307" className="flex items-center justify-center gap-2 rounded-full border border-white/40 hover:bg-white/10 px-6 py-4 font-semibold"><Phone className="w-4 h-4" />+383 49 772 307</a>
            </div>
          </div>
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {t.fCols.map(([h, links]) => (
              <div key={h as string}>
                <div className="text-[12px] uppercase tracking-[.2em] text-white/60 mb-4">{h as string}</div>
                <ul className="space-y-2.5">{(links as string[][]).map(([l, href]) => <li key={l}><a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">{l}</a></li>)}</ul>
              </div>
            ))}
            <div className="col-span-2 sm:col-span-1">
              <div className="text-[12px] uppercase tracking-[.2em] text-white/60 mb-4">{t.fContact}</div>
              <a href="https://maps.google.com/?q=Medident+Dental+Clinic+Peja" target="_blank" rel="noopener noreferrer" className="flex gap-2 hover:opacity-70"><MapPin className="w-4 h-4 mt-1 shrink-0" />{t.fAddr}</a>
              <p className="text-white/70 text-sm mt-3">{t.fClinic}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between gap-3 py-6 text-sm text-white/70">
          <span>© {new Date().getFullYear()} Linea Aligners. {t.rights}</span>
          <span>{t.fTag}</span>
        </div>
      </div>
      <motion.div style={{ y }} className="select-none pointer-events-none" aria-hidden="true">
        <motion.div style={{ letterSpacing: ls }} className="font-display text-center leading-[.75] text-[31vw] text-white/95 -mb-[3vw] whitespace-nowrap">linea</motion.div>
      </motion.div>
    </footer>
  );
};

/* ---------- page ---------- */
export const Landing: React.FC<{ lang: Lang; setLang: (l: Lang) => void; isAdmin?: boolean; onAdmin?: () => void; onPlayVideo: () => void }> = ({ lang, setLang, isAdmin, onAdmin, onPlayVideo }) => (
  <div className="landing bg-[#06101F] text-white overflow-x-clip">
    <style>{CSS}</style>
    <Header lang={lang} setLang={setLang} isAdmin={isAdmin} onAdmin={onAdmin} />
    <main id="main-content">
      <Hero lang={lang} />
      <Marquee lang={lang} />
      <Transformation lang={lang} />
      <Why lang={lang} />
      <How lang={lang} />
      <Film lang={lang} onPlay={onPlayVideo} />
      <Pricing lang={lang} />
      <Faq lang={lang} />
    </main>
    <BigFooter lang={lang} />
  </div>
);

const CSS = `
.landing{font-family:'Inter Tight','Inter',system-ui,sans-serif}
.landing .font-display{font-family:'Inter Tight','Inter',sans-serif;font-weight:600}
.landing .font-serif-i{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-.01em}
.landing .text-shimmer{background:linear-gradient(100deg,#87CEEB 20%,#fff 40%,#87CEEB 60%,#4169E1 80%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:shimmer 6s linear infinite}
@keyframes shimmer{to{background-position:-250% 0}}
.landing .grid-lines{background-image:linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px);background-size:80px 80px;mask-image:radial-gradient(ellipse at center,#000 30%,transparent 75%)}
.landing .radial-glow{background:radial-gradient(ellipse 60% 50% at 70% 50%,rgba(65,105,225,.25),transparent 70%)}
.landing .blob{animation:blob 18s ease-in-out infinite}
.landing .blob2{animation:blob 22s ease-in-out infinite reverse}
@keyframes blob{0%,100%{border-radius:50%;transform:translate(0,0) scale(1)}33%{border-radius:40% 60% 55% 45%;transform:translate(-6%,8%) scale(1.1)}66%{border-radius:60% 40% 45% 55%;transform:translate(5%,-4%) scale(.95)}}
.landing .marquee{animation:marquee 30s linear infinite}
@keyframes marquee{to{transform:translateX(-50%)}}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){.landing *{animation:none!important;transition:none!important}}
`;
