import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence, useInView } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { WHATSAPP_URL, SCAN_VIDEO_URL, FAQS_CONTENT } from '../../constants';

type Lang = 'en' | 'sq';
const HF = 'https://d8j0ntlcm91z4.cloudfront.net/user_3GK4EvYC3RV3gOLAljSryk8hjDQ/';
const IMG = {
  hero: HF + 'hf_20261004_203134_2798cb00-8f5e-4ca8-ac63-80617e2df842_min.webp',
  laugh: HF + 'hf_20261004_203131_5905c43e-2e37-4bd0-b201-b62159882e58_min.webp',
  grad: HF + 'hf_20261004_203129_039513d0-d62c-43c9-9334-45adef4cae92_min.webp',
  selfie: HF + 'hf_20260827_083629_e56cf9a9-dfb3-44e8-b1a6-1313b61b81c5_min.webp',
  night: HF + 'hf_20261004_203136_fac73ad2-ad76-4688-92ce-d8ddeac0064b_min.webp',
  waterAligner: HF + 'hf_20261004_201720_30a4c15a-9650-4200-b999-6030f5de9149_min.webp',
  caseHands: HF + 'hf_20261004_201417_1ff5d485-5840-44b2-87ae-5ccf98d9b047_min.webp',
  tabletDrop: HF + 'hf_20261004_201010_5280e9fd-037a-463b-b5ee-083d7b7846f3_min.webp',
  tabletFall: HF + 'hf_20261007_114956_7d5f6e9e-5c2a-4291-b261-71fd46d15ba6_min.webp',
  box: '/images/retainer-cleaner-box.webp',
  boxVideo: HF + 'hf_20261007_125317_217a4dbc-3b51-4760-8c2b-345ac9021b19.mp4',
  studio: '/images/linea-studio.webp',
  smile: '/images/smile.webp', polish: '/images/lab-polish.webp', print: '/images/lab-print.webp', slicing: '/images/lab-slicing.webp',
};
const EASE = [0.16, 1, 0.3, 1] as const;

const T = {
  sq: {
    nav: [['Si funksionon', '#si'], ['Pse Linea', '#pse'], ['Laboratori', '#lab'], ['Çmimi', '#cmimi'], ['E-shop', '#shop'], ['Pyetje', '#pyetje']],
    login: 'Hyr', cta: 'Skanim falas',
    eyebrow: 'Aligner transparentë në Pejë, Kosovë',
    h1a: 'Buzëqeshja', h1b: 'që e ke', h1c: 'merituar.',
    sub: 'Maskerina transparente, të dizajnuara në 3D vetëm për dhëmbët e tu. Pa tela, pa metal — dhe askush nuk e vëren.',
    b1: 'Rezervo skanimin falas', b2: 'A më përshtatet?',
    chips: ['0% interes', '4–9 muaj', 'Retainer të përfshirë'],
    marquee: ['Pa tela', 'Pa metal', 'Plan 3D', 'Skanim falas', 'Bërë në Pejë', 'Mbikëqyrje nga dentisti', 'Pagesë me këste'],
    trTag: 'Transformimi', trTitle: 'Çdo maskerinë, një hap më afër.', trDesc: 'Lëviz poshtë dhe shih si dhëmbët zhvendosen hap pas hapi — pikërisht siç planifikohet në 3D para se të fillosh.', step: 'Hapi',
    whyIntro: 'Linea Aligners janë aligner transparentë (maskerina të padukshme) që i drejtojnë dhëmbët pa tela e pa breketa. Çdo trajtim planifikohet në 3D dhe mbikëqyret nga dentisti në Pejë.', whyTag: 'Pse Linea', whyTitle: 'Gjithçka që bëjnë telat.', whyTitle2: 'Asgjë nga ato që s’i do.',
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
    fCols: [['Linea', [['Si funksionon', '#si'], ['Pse Linea', '#pse'], ['Çmimi', '#cmimi'], ['Pyetje', '#pyetje']]], ['Pacientët', [['Portali', '/portal/'], ['A më përshtatet?', '/assessment/'], ['WhatsApp', WHATSAPP_URL]]], ['Diaspora', [['Për diasporën', '/diaspora/'], ['Deutschland / Österreich', '/de/'], ['Schweiz', '/ch/'], ['English', '/en/']]]],
    fContact: 'Kontakti', fAddr: 'Rr. Bajram Kelmendi, Pejë 30000', fClinic: 'Në partneritet me Medident Dental Clinic',
    rights: 'Të gjitha të drejtat e rezervuara.',
    momTag: 'Momentet', momTitle: 'Për çdo foto që ke pritur.',
    moments: [['Pa u fshehur', 'Qesh lirshëm — askush s’i sheh.'], ['Dita e diplomës', 'Buzëqeshja gati për ditën e madhe.'], ['Çdo selfie', 'Pa tela në asnjë foto.'], ['Natën', 'I heq, i pastron, i vendos prapë.'], ['E pastër si kristal', 'Plastikë mjekësore transparente.']],
    shopQty: 'Sasia', shopTotal: 'Totali', shopNote: 'Porosia konfirmohet në WhatsApp', labTag: 'Laboratori', labTitle: 'Bërë me dorë, në Pejë.', lab: ['Planifikimi 3D', 'Printimi i modeleve', 'Polirimi me dorë'],
    prodTag: 'E-shop', prodTitle: 'Linea Retainer Cleaner', prodDesc: 'Tableta shkumuese antibakteriale për maskerina dhe retainer. Një tabletë në ujë, disa minuta — dhe maskerinat dalin të pastra e transparente.',
    prodPts: ['30 tableta', 'Heq njollat dhe pllakën', 'Extra Strength'], prodBtn: 'Porosit tani',
    stuTag: 'Bërë në Pejë', stuTitle: 'Një brand kosovar, me standard botëror.', stuDesc: 'Linea lindi në Pejë — nga ideja te plani 3D, deri te maskerina në dorën tënde. Me mbështetjen klinike të Medident Dental Clinic, që nga viti 1999.',
  },
  en: {
    nav: [['How it works', '#si'], ['Why Linea', '#pse'], ['The lab', '#lab'], ['Pricing', '#cmimi'], ['Shop', '#shop'], ['FAQ', '#pyetje']],
    login: 'Log in', cta: 'Free scan',
    eyebrow: 'Clear aligners in Pejë, Kosovo',
    h1a: 'The smile', h1b: 'you’ve always', h1c: 'deserved.',
    sub: 'Clear aligners designed in 3D for your teeth only. No wires, no metal — and nobody notices.',
    b1: 'Book your free scan', b2: 'Is it right for me?',
    chips: ['0% interest', '4–9 months', 'Retainers included'],
    marquee: ['No wires', 'No metal', '3D planned', 'Free scan', 'Made in Pejë', 'Dentist-supervised', 'Pay in installments'],
    trTag: 'The transformation', trTitle: 'Every aligner, one step closer.', trDesc: 'Scroll and watch the teeth move step by step — exactly as it is planned in 3D before you start.', step: 'Step',
    whyIntro: 'Linea Aligners are clear aligners — nearly invisible trays that straighten teeth without wires or brackets. Every treatment is planned in 3D and supervised by a dentist in Pejë, Kosovo.', whyTag: 'Why Linea', whyTitle: 'Everything braces do.', whyTitle2: 'None of what you don’t want.',
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
    fCols: [['Linea', [['How it works', '#si'], ['Why Linea', '#pse'], ['Pricing', '#cmimi'], ['FAQ', '#pyetje']]], ['Patients', [['Portal', '/portal/'], ['Is it right for me?', '/assessment/?lang=en'], ['WhatsApp', WHATSAPP_URL]]], ['Abroad', [['Albanian diaspora', '/diaspora/'], ['Deutschland / Österreich', '/de/'], ['Schweiz', '/ch/'], ['English', '/en/']]]],
    fContact: 'Contact', fAddr: 'Rr. Bajram Kelmendi, Pejë 30000', fClinic: 'In partnership with Medident Dental Clinic',
    rights: 'All rights reserved.',
    momTag: 'Moments', momTitle: 'For every photo you’ve been waiting for.',
    moments: [['No more hiding', 'Laugh freely — nobody sees them.'], ['Graduation day', 'A smile ready for the big day.'], ['Every selfie', 'No wires in any photo.'], ['At night', 'Take them out, clean, pop back in.'], ['Crystal clear', 'Transparent medical-grade plastic.']],
    shopQty: 'Quantity', shopTotal: 'Total', shopNote: 'Your order is confirmed on WhatsApp', labTag: 'The lab', labTitle: 'Made by hand, in Pejë.', lab: ['3D planning', 'Model printing', 'Hand polishing'],
    prodTag: 'Shop', prodTitle: 'Linea Retainer Cleaner', prodDesc: 'Antibacterial effervescent tablets for aligners and retainers. One tablet in water, a few minutes — and your aligners come out clean and clear.',
    prodPts: ['30 tablets', 'Removes stains & plaque', 'Extra Strength'], prodBtn: 'Order now',
    stuTag: 'Made in Pejë', stuTitle: 'A Kosovar brand, world-class standard.', stuDesc: 'Linea was born in Pejë — from the idea to the 3D plan, to the aligner in your hand. Clinically backed by Medident Dental Clinic since 1999.',
  },
};

const openWA = () => { const w = window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer'); if (!w) window.location.href = WHATSAPP_URL; };

/* ---------- animated teeth graphic: crooked -> aligned driven by a 0..1 value ---------- */

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
          className={`flex items-center justify-between transition-all duration-500 ${solid ? 'rounded-full bg-[#0B1A33]/95 border border-white/10 pl-5 pr-2 py-2' : 'py-6'}`}>
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
            <button onClick={openWA} className="group relative overflow-hidden rounded-full bg-white text-[#0B1A33] px-5 py-2.5 text-[14px] font-semibold flex items-center gap-2">
              <span className="relative z-10">{t.cta}</span>
              
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
/* ---------- real lab footage (muted, inline, respects reduced motion & data saver) ---------- */
const LabVideo: React.FC<{ className?: string; label?: string }> = ({ className, label }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const vis = useInView(ref, { margin: '200px' });
  const [still, setStill] = useState(false);
  useEffect(() => {
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const save = (navigator as any).connection?.saveData;
    setStill(!!(rm || save));
  }, []);
  useEffect(() => { const v = ref.current; if (!v || still) return; if (vis) v.play().catch(() => {}); else v.pause(); }, [vis, still]);
  const small = typeof window !== 'undefined' && window.innerWidth < 700;
  return (
    <div className={'relative overflow-hidden bg-black ' + (className || '')}>
      {still ? <img src="/images/posters/lab-loop.jpg" alt={label || ''} className="absolute inset-0 w-full h-full object-cover" />
        : <video ref={ref} src={small ? '/videos/laboratory/lab-loop-540.mp4' : '/videos/laboratory/lab-loop-960.mp4'} poster="/images/posters/lab-loop.jpg" muted loop playsInline preload="metadata" aria-label={label} className="absolute inset-0 w-full h-full object-cover" />}
    </div>
  );
};

const Hero: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = T[lang];
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const fade = useTransform(scrollYProgress, [0, .6], [1, 0]);
  const yUp = useTransform(scrollYProgress, [0, 1], ['0%', '-20%']);
  return (
    <section id="top" ref={ref} className="relative min-h-[100svh] overflow-hidden bg-[#06101F] flex items-center">
      <motion.div initial={{ opacity: 0, clipPath: 'inset(12% 12% 12% 12% round 28px)' }} animate={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 28px)' }} transition={{ delay: .5, duration: 1.4, ease: EASE }}
        style={{ y: yUp }} className="hidden lg:block absolute right-[max(2rem,calc((100vw-80rem)/2+2rem))] top-[18vh] w-[30vw] max-w-[440px] aspect-square z-0">
        <LabVideo className="w-full h-full rounded-[28px]" label={lang === 'sq' ? 'Laboratori Linea në Pejë: planifikim, printim, polirim' : 'The Linea lab in Pejë: planning, printing, polishing'} />
        <div className="absolute left-4 bottom-4 text-[11px] uppercase text-white/80 bg-black/50 px-3 py-1.5 rounded-full" style={{ letterSpacing: '.18em' }}>{lang === 'sq' ? 'Laboratori ynë · Pejë' : 'Our lab · Pejë'}</div>
      </motion.div>
      <motion.div style={{ opacity: fade, y: yUp }} className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 pt-32 pb-14">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .1, duration: .8 }} className="text-[12px] font-semibold uppercase text-white/45 mb-8" style={{ letterSpacing: '.24em' }}>{t.eyebrow}</motion.div>
        <h1 className="font-display text-white leading-[.92] tracking-[-.05em] text-[15vw] sm:text-[10vw] lg:text-[6.6rem] lg:max-w-[60%]">
          <span className="block overflow-hidden pb-[.06em]"><motion.span className="block" initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 1.1, ease: EASE, delay: .2 }}>{lang === 'sq' ? 'Drejtoji dhëmbët,' : 'Straighten your teeth,'}</motion.span></span>
          <span className="block overflow-hidden pb-[.08em]"><motion.span className="block italic font-serif-i text-[#87CEEB]" initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 1.1, ease: EASE, delay: .35 }}>{lang === 'sq' ? 'pa u vërejt.' : 'unnoticed.'}</motion.span></span>
        </h1>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .9, duration: 1, ease: EASE }} className="lg:hidden mt-10 relative">
          <LabVideo className="w-full aspect-[16/10] rounded-[22px]" label={lang === 'sq' ? 'Laboratori Linea në Pejë' : 'The Linea lab in Pejë'} />
          <div className="absolute left-3 bottom-3 text-[10px] uppercase text-white/80 bg-black/40 px-3 py-1.5 rounded-full" style={{ letterSpacing: '.18em' }}>{lang === 'sq' ? 'Laboratori ynë · Pejë' : 'Our lab · Pejë'}</div>
        </motion.div>
        <div className="mt-14 flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-t border-white/10 pt-8">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .9, duration: .9, ease: EASE }} className="text-lg text-white/60 leading-relaxed max-w-md">{t.sub}</motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: .9, ease: EASE }} className="flex flex-col sm:flex-row gap-3">
            <button onClick={openWA} className="group flex items-center justify-between gap-4 rounded-full bg-white text-[#06101F] px-7 py-4 font-semibold whitespace-nowrap">
              {t.b1}
            </button>
            <a href={'/assessment/' + (lang === 'en' ? '?lang=en' : '')} className="flex items-center justify-center rounded-full border border-white/20 hover:bg-white/10 transition-colors text-white px-6 py-4 font-semibold whitespace-nowrap">{t.b2}</a>
          </motion.div>
        </div>
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
            {row.map((w, i) => <span key={i} className="flex items-center gap-10 font-display text-3xl sm:text-4xl text-white whitespace-nowrap">{w}<span className="text-white/40">/</span></span>)}
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
  const stepRef = useRef<HTMLSpanElement>(null), pctRef = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const p = useTransform(scrollYProgress, [0.05, 0.9], [0, 1], { clamp: true });
  // write the counter straight to the DOM: no React re-render while scrolling
  useEffect(() => p.on('change', v => { const st = Math.max(1, Math.round(v * 24)); if (stepRef.current) stepRef.current.textContent = String(st).padStart(2, '0'); if (pctRef.current) pctRef.current.textContent = Math.round(st / 24 * 100) + '%'; }), [p]);
  const width = useTransform(p, v => `scaleX(${v})`);
  const zoom = useTransform(p, [0, 1], [1.12, 1]);
  const pan = useTransform(p, [0, 1], ['-3%', '3%']);
  return (
    <section ref={ref} className="relative h-[200vh] bg-[#06101F]" aria-label={t.trTag}>
      <div className="sticky top-0 h-[100svh] flex items-center overflow-hidden">
        
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 w-full grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <div>
            <Tag>{t.trTag}</Tag>
            <h2 className="font-display text-5xl sm:text-7xl text-white leading-[.95] tracking-[-.03em] mt-6"><Words text={t.trTitle} /></h2>
            <Up delay={.2}><p className="text-white/65 text-lg mt-6 max-w-md">{t.trDesc}</p></Up>
            <div className="mt-10 max-w-md">
              <div className="flex justify-between text-sm text-white/60 mb-3"><span>{t.step} <span ref={stepRef} className="text-white font-semibold tabular-nums">01</span> / 24</span><span ref={pctRef} className="tabular-nums">4%</span></div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><motion.div style={{ transform: width }} className="h-full w-full origin-left bg-gradient-to-r from-[#4169E1] to-[#87CEEB] rounded-full" /></div>
            </div>
          </div>
          <div className="relative rounded-[28px] overflow-hidden border border-white/10 aspect-[4/3] bg-black">
            <motion.img style={{ scale: zoom, x: pan }} src={IMG.slicing} alt={lang === 'sq' ? 'Plani 3D i trajtimit në kompjuter, laboratori Linea' : '3D treatment plan on screen, Linea lab'} loading="lazy" className="absolute inset-0 w-full h-full object-cover will-change-transform" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
            <p className="absolute left-5 bottom-4 right-5 text-xs text-white/60">{lang === 'sq' ? 'Planifikimi 3D në laboratorin tonë. Plani yt i vërtetë del pas skanimit.' : '3D planning in our lab. Your own plan comes after the scan.'}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ---------- why: editorial list ---------- */
const Why: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = T[lang];
  return (
    <section id="pse" className="relative bg-[#F4F6FA] text-[#0B1A33] py-28 sm:py-40 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-14 lg:gap-20">
        <div className="lg:col-span-5 lg:sticky lg:top-28 self-start">
          <div className="text-[12px] font-semibold uppercase text-[#4169E1]" style={{ letterSpacing: '.22em' }}>{t.whyTag}</div>
          <h2 className="font-display text-5xl sm:text-6xl leading-[.98] tracking-[-.03em] mt-6"><Words text={t.whyTitle} /><br /><Words text={t.whyTitle2} className="italic font-serif-i text-[#4169E1]" delay={.2} /></h2>
          <p className="text-[#0B1A33]/60 text-lg mt-8 max-w-md">{t.whyIntro}</p>
          <Up delay={.1}><img src={IMG.print} alt={lang === 'sq' ? 'Modelet e dhëmbëve të printuara në 3D në laboratorin Linea' : '3D-printed dental models in the Linea lab'} loading="lazy" className="mt-10 w-full aspect-[4/3] object-cover rounded-[6px]" /></Up>
        </div>
        <ol className="lg:col-span-7 border-t border-[#0B1A33]/15">
          {t.why.map(([title, desc], i) => (
            <Up key={title} delay={i * .04}>
              <li className="grid grid-cols-[3.5rem_1fr] sm:grid-cols-[5rem_1fr] gap-4 py-9 border-b border-[#0B1A33]/15">
                <span className="text-sm tabular-nums text-[#0B1A33]/40 pt-2">{String(i + 1).padStart(2, '0')}</span>
                <div><h3 className="font-display text-2xl sm:text-3xl tracking-[-.02em]">{title}</h3><p className="text-[#0B1A33]/60 mt-2 max-w-lg">{desc}</p></div>
              </li>
            </Up>
          ))}
        </ol>
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
          <div className="hidden md:block absolute top-0 left-0 right-0 h-px bg-[#0B1A33]/10"><motion.div style={{ width: line }} className="h-full bg-[#4169E1]" /></div>
          {t.how.map(([title, desc], i) => (
            <Up key={title} delay={i * .12}>
              <div className="relative">
                <div className="text-sm tabular-nums text-[#4169E1] pt-6 mb-6 relative z-10">0{i + 1}</div>
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
  useEffect(() => { const v = vref.current; if (!v) return; if (inView) v.play().catch(() => {}); else v.pause(); }, [inView]);
  return (
    <section ref={ref} className="bg-[#F4F6FA] pb-28 sm:pb-40 px-3 sm:px-6">
      <motion.div style={{ scale }} className="relative overflow-hidden rounded-[28px] mx-auto max-w-[1500px] aspect-[4/5] sm:aspect-[16/8] bg-[#06101F]">
        <img src={IMG.polish} alt={lang === 'sq' ? 'Polirimi i maskerinës me dorë në laboratorin Linea' : 'Hand-polishing an aligner in the Linea lab'} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
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
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <Tag>{t.priceTag}</Tag>
          <h2 className="font-display text-5xl sm:text-7xl leading-[.95] tracking-[-.03em] mt-6"><Words text={t.priceTitle} /></h2>
          <Up delay={.2}><p className="text-white/65 text-lg mt-6 max-w-md">{t.priceDesc}</p></Up>
        </div>
        <Up>
          <div className="border-t border-white/15">
            <div className="flex items-baseline justify-between py-8 border-b border-white/15"><span className="text-white/55">{lang === 'sq' ? 'Pagesë me këste' : 'Installments'}</span><span className="font-display text-6xl leading-none">0%<span className="text-lg text-white/55 ml-2">{lang === 'sq' ? 'interes' : 'interest'}</span></span></div>
            {t.priceRows.map(([k, v]) => (
              <div key={k} className="flex justify-between py-5 border-b border-white/15"><span className="text-white/55">{k}</span><span className="font-semibold">{v}</span></div>
            ))}
            <button onClick={openWA} className="mt-8 rounded-full bg-white text-[#0B1A33] font-semibold px-8 py-4 hover:bg-[#E6ECFA] transition-colors">{t.priceBtn}</button>
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
                <span className={`shrink-0 w-10 h-10 rounded-full grid place-items-center border transition-colors ${open === i ? 'bg-white text-[#0B1A33] border-white' : 'border-white/20'}`}>{open === i ? <span aria-hidden>−</span> : <span aria-hidden>+</span>}</span>
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
    <footer ref={ref} id="footer" className="relative bg-[#4169E1] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28">
        <div className="grid lg:grid-cols-12 gap-12 pb-16 border-b border-white/20">
          <div className="lg:col-span-6">
            <h2 className="font-display text-5xl sm:text-7xl leading-[.95] tracking-[-.03em]">{t.endA}<br /><span className="italic font-serif-i">{t.endB}</span></h2>
            <p className="text-white/80 text-lg mt-6 max-w-md">{t.endDesc}</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button onClick={openWA} className="group flex items-center justify-between gap-4 rounded-full bg-white text-[#0B1A33] px-7 py-4 font-semibold">
                <span className="flex items-center gap-2">WhatsApp</span>
                
              </button>
              <a href="tel:+38349772307" className="flex items-center justify-center gap-2 rounded-full border border-white/40 hover:bg-white/10 px-6 py-4 font-semibold">+383 49 772 307</a>
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
              <a href="https://maps.google.com/?q=Medident+Dental+Clinic+Peja" target="_blank" rel="noopener noreferrer" className="flex gap-2 hover:opacity-70">{t.fAddr}</a>
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

/* ---------- product: retainer cleaner ---------- */
const Product: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = T[lang];
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y1 = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const vref = useRef<HTMLVideoElement>(null);
  const vis = useInView(ref, { margin: '300px' });
  useEffect(() => { const v = vref.current; if (v) { if (vis) v.play().catch(() => {}); else v.pause(); } }, [vis]);
  const [qty, setQty] = useState(1);
  const order = () => { const m = lang === 'sq' ? `Përshëndetje! Dua të porosis Linea Retainer Cleaner.\nSasia: ${qty} kuti\nTotali: €${(qty * 4.5).toFixed(2)}\nEmri:\nAdresa:` : `Hi! I'd like to order Linea Retainer Cleaner.\nQuantity: ${qty}\nTotal: €${(qty * 4.5).toFixed(2)}\nName:\nAddress:`; window.open('https://wa.me/38349772307?text=' + encodeURIComponent(m), '_blank', 'noopener'); };
  return (
    <section id="shop" ref={ref} className="relative overflow-hidden bg-gradient-to-b from-[#0E0A24] via-[#1A1145] to-[#0E0A24] text-white py-28 sm:py-40">
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-16 items-center">
        <div className="relative h-[520px] sm:h-[580px]">
          <motion.div style={{ y: y1 }} className="absolute left-1/2 -translate-x-1/2 top-0 h-full aspect-[9/16] rounded-[36px] overflow-hidden border border-white/15 bg-[#0E0A24]">
            <img src={IMG.box} alt="Linea Antibacterial Retainer Cleaner" className="absolute inset-0 w-full h-full object-cover" />
          </motion.div>
        </div>
        <div>
          <div className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[.22em] text-[#B9A6FF]"><span className="w-6 h-px bg-[#B9A6FF]" />{t.prodTag}</div>
          <h2 className="font-display text-5xl sm:text-7xl leading-[.95] tracking-[-.03em] mt-6"><Words text={t.prodTitle} /></h2>
          <Up delay={.15}><p className="text-white/70 text-lg mt-6 max-w-md">{t.prodDesc}</p></Up>
          <Up delay={.25}>
            <div className="flex flex-wrap gap-2 mt-8">{t.prodPts.map(x => <span key={x} className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm">{x}</span>)}</div>
            <div className="mt-10 rounded-[28px] border border-white/15 bg-white/[.04] p-6 max-w-md">
              <div className="flex items-end justify-between"><span className="font-display text-6xl tracking-[-.04em]">€4.50</span><span className="text-white/50 text-sm pb-2">/ {lang === 'sq' ? 'kutia' : 'box'}</span></div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-white/60 text-sm">{t.shopQty}</span>
                <div className="flex items-center gap-1 rounded-full border border-white/15 p-1">
                  <button aria-label="-" onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 grid place-items-center rounded-full hover:bg-white/10"><span aria-hidden>−</span></button>
                  <span className="w-8 text-center font-semibold tabular-nums">{qty}</span>
                  <button aria-label="+" onClick={() => setQty(q => Math.min(50, q + 1))} className="w-9 h-9 grid place-items-center rounded-full hover:bg-white/10"><span aria-hidden>+</span></button>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4"><span className="text-white/60 text-sm">{t.shopTotal}</span><motion.span key={qty} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-2xl tabular-nums">€{(qty * 4.5).toFixed(2)}</motion.span></div>
              <div className="mt-3 text-xs text-white/45">{t.shopNote}</div>
            </div>
            <button onClick={order} className="group mt-6 flex items-center gap-4 rounded-full bg-white text-[#1A1145] px-7 py-4 font-semibold">{t.prodBtn}</button>
          </Up>
        </div>
      </div>
    </section>
  );
};

/* ---------- lab: real photos ---------- */
const Lab: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = T[lang];
  const imgs = [IMG.slicing, IMG.print, IMG.polish];
  return (
    <section id="lab" className="bg-[#06101F] text-white py-28 sm:py-40 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div><Tag>{t.labTag}</Tag><h2 className="font-display text-5xl sm:text-7xl leading-[.95] tracking-[-.03em] mt-6"><Words text={t.labTitle} /></h2></div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {imgs.map((src, i) => (
            <Up key={i} delay={i * .1}>
              <figure className="group relative aspect-[4/5] overflow-hidden rounded-[28px] border border-white/10">
                <img src={src} alt={t.lab[i]} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.2s]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06101F]/85 via-transparent" />
                <figcaption className="absolute left-5 bottom-5 right-5 flex items-center justify-between"><span className="font-display text-xl">{t.lab[i]}</span><span className="text-white/50 text-sm tabular-nums">0{i + 1}</span></figcaption>
              </figure>
            </Up>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ---------- studio / brand ---------- */
const Studio: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = T[lang];
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1.25, 1]);
  return (
    <section ref={ref} className="relative h-[90vh] min-h-[560px] overflow-hidden bg-[#0E0A24]">
      <motion.img style={{ scale }} src={IMG.studio} alt="Linea studio, Pejë" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#06101F] via-[#06101F]/40 to-transparent" />
      <div className="relative h-full max-w-7xl mx-auto px-5 sm:px-8 flex flex-col justify-end pb-16 sm:pb-24">
        <Tag>{t.stuTag}</Tag>
        <h2 className="font-display text-5xl sm:text-7xl text-white leading-[.95] tracking-[-.03em] mt-6 max-w-4xl"><Words text={t.stuTitle} /></h2>
        <Up delay={.2}><p className="text-white/75 text-lg mt-6 max-w-xl">{t.stuDesc}</p></Up>
      </div>
    </section>
  );
};

/* ---------- page ---------- */
export const Landing: React.FC<{ lang: Lang; setLang: (l: Lang) => void; isAdmin?: boolean; onAdmin?: () => void; onPlayVideo: () => void }> = ({ lang, setLang, isAdmin, onAdmin, onPlayVideo }) => (
  <div className="landing bg-[#06101F] text-white overflow-x-clip">
    <style>{CSS}</style>
    <Header lang={lang} setLang={setLang} isAdmin={isAdmin} onAdmin={onAdmin} />
    <main id="main-content">
      <Hero lang={lang} />
      <Transformation lang={lang} />
      <Why lang={lang} />
      <How lang={lang} />
      <Film lang={lang} onPlay={onPlayVideo} />
      <Lab lang={lang} />
      <Studio lang={lang} />
      <Product lang={lang} />
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
.landing .marquee{animation:marquee 30s linear infinite}
@keyframes marquee{to{transform:translateX(-50%)}}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){.landing *{animation:none!important;transition:none!important}}
`;
