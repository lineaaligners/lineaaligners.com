import { NavItem, Feature, Step, FAQ, Testimonial } from './types';

export const TRANSLATIONS = {
  en: {
    nav: [
      { label: 'How it Works', href: '#how-it-works' },
      { label: 'Benefits', href: '#benefits' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
    hero: {
      badge: "Kosovo's Digital Smile Lab",
      founders: "Genis Nallbani & Dr. Fatbardha Mustafa",
      title1: "Invisible",
      title2: "Precision.",
      title3: "Visible",
      title4: "Smiles.",
      description: "The future of orthodontics has arrived in Peja. Experience the perfect blend of digital 3D precision and clinical expertise.",
      btnPrimary: "Book Free Scan",
      btnSecondary: "AI Smile Check",
      trust: "500+ Perfect Smiles Created"
    },
    features: {
      tag: "The Linea Difference",
      title: "Advanced Orthodontics for the Modern Life.",
      desc: "We've redesigned the dental experience to be entirely digital, comfortable, and patient-focused. No messy molds, just clear clinical precision.",
      items: [
        {
          title: 'Virtually Invisible',
          description: 'Our aligners are made from crystal clear medical-grade polymer, making them nearly invisible even at close distances.',
          icon: 'invisible'
        },
        {
          title: 'Fully Removable',
          description: 'Eat your favorite foods and maintain perfect oral hygiene by simply removing your aligners during meals and cleaning.',
          icon: 'removable'
        },
        {
          title: 'Customized Precision',
          description: 'Every aligner is 3D printed specifically for your teeth based on a high-precision digital scan of your mouth.',
          icon: 'precision'
        },
        {
          title: 'Faster Results',
          description: 'Our advanced tracking technology ensures your teeth move efficiently, often reducing treatment time significantly.',
          icon: 'results'
        }
      ]
    },
    process: {
      tag: "Step by Step",
      title1: "The Path to",
      title2: "Perfection.",
      desc: "Discover the seamless fusion of technology and clinical expertise at Linea Aligners.",
      items: [
        {
          number: '01',
          title: 'Free 3D Scan',
          description: 'Visit our clinic in Peja for a state-of-the-art digital scan at Medident Dental Clinic. No uncomfortable molds required.'
        },
        {
          number: '02',
          title: 'Personalized Plan',
          description: 'Our expert orthodontists design your perfect smile and show you a digital simulation of your results.'
        },
        {
          number: '03',
          title: 'Start Your Journey',
          description: 'Receive your custom aligners and start your transformation with 24/7 digital support.'
        }
      ],
      ctaTitle: "Ready for your digital twin?",
      ctaDesc: "Take the first step toward your new smile. Book a session via Google Calendar or start your AI assessment.",
      ctaBtn1: "Google Calendar Booking",
      ctaBtn2: "AI Digital Assessment"
    },
    pricing: {
      tag: "Transparent Value",
      title1: "Invest in",
      title2: "your future self.",
      desc: "At Medident, we believe world-class orthodontic care should be accessible. Our clear pricing model removes any financial anxiety.",
      perks: ['In-Clinic Supervision', 'Digital Simulation', 'All Retainers', 'Flexible Payments'],
      cardTag: "Financing",
      cardTitle: "Flexible Plans",
      cardBadge: "0% Interest",
      details: [
        { label: 'Treatment Time', val: '4 - 9 Months' },
        { label: 'Initial Deposit', val: 'Minimal' },
        { label: 'Support', val: '24/7 Support' },
        { label: 'Retainers', val: 'Included' }
      ],
      btn: "Book via Google Calendar"
    }
  },
  sq: {
    nav: [
      { label: 'Si Funksionon', href: '#how-it-works' },
      { label: 'Përfitimet', href: '#benefits' },
      { label: 'Çmimet', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
    hero: {
      badge: "Laboratori Digjital i Buzëqeshjes në Kosovë",
      founders: "Genis Nallbani & Dr. Fatbardha Mustafa",
      title1: "Saktësi e",
      title2: "Padukshme.",
      title3: "Buzëqeshje të",
      title4: "Dukshme.",
      description: "E ardhmja e ortodoncisë ka mbërritur në Pejë. Përjetoni kombinimin e përsosur të saktësisë digjitale 3D dhe ekspertizës klinike.",
      btnPrimary: "Rezervo Skanimin Falas",
      btnSecondary: "AI Smile Check",
      trust: "500+ Buzëqeshje të Përsosura të Krijuara"
    },
    features: {
      tag: "Diferenca Linea",
      title: "Ortodonci e Avancuar për Jetën Moderne.",
      desc: "Ne kemi ridizajnuar përvojën dentare për të qenë plotësisht digjitale, komode dhe e fokusuar te pacienti.",
      items: [
        {
          title: 'Pothuajse i Padukshëm',
          description: 'Aligner-at tanë janë bërë nga polimer i pastër mjekësor, duke i bërë ata pothuajse të padukshëm.',
          icon: 'invisible'
        },
        {
          title: 'Plotësisht i Lëvizshëm',
          description: 'Hani ushqimet tuaja të preferuara dhe mbani higjienë të përsosur duke i hequr aligner-at gjatë ngrënies.',
          icon: 'removable'
        },
        {
          title: 'Saktësi e Personalizuar',
          description: 'Çdo aligner printohet në 3D posaçërisht për dhëmbët tuaj bazuar në një skanim digjital me saktësi të lartë.',
          icon: 'precision'
        },
        {
          title: 'Rezultate më të Shpejta',
          description: 'Teknologjia jonë e avancuar siguron që dhëmbët tuaj të lëvizin në mënyrë efikase.',
          icon: 'results'
        }
      ]
    },
    process: {
      tag: "Hap pas Hapi",
      title1: "Rruga drejt",
      title2: "Përsosmërisë.",
      desc: "Zbuloni bashkimin e teknologjisë dhe ekspertizës klinike në Linea Aligners.",
      items: [
        {
          number: '01',
          title: 'Skanimi 3D Falas',
          description: 'Vizitoni klinikën tonë në Pejë për një skanim digjital në Medident Dental Clinic.'
        },
        {
          number: '02',
          title: 'Plani i Personalizuar',
          description: 'Ortodontët tanë ekspertë dizajnojnë buzëqeshjen tuaj të përsosur përmes simulimit digjital.'
        },
        {
          number: '03',
          title: 'Filloni Rrugëtimin',
          description: 'Merrni aligner-at tuaj të personalizuar dhe filloni transformimin me mbështetje digjitale 24/7.'
        }
      ],
      ctaTitle: "Gati për binjakun tuaj digjital?",
      ctaDesc: "Bëni hapin e parë drejt buzëqeshjes tuaj të re. Rezervoni një seancë ose filloni vlerësimin me AI.",
      ctaBtn1: "Rezervo në Google Calendar",
      ctaBtn2: "Vlerësimi Digjital me AI"
    },
    pricing: {
      tag: "Vlerë Transparente",
      title1: "Investoni në",
      title2: "veten tuaj të ardhshme.",
      desc: "Në Medident, ne besojmë se kujdesi ortodontik i klasit botëror duhet të jetë i aksesueshëm.",
      perks: ['Mbikëqyrje në Klinikë', 'Simulim Digjital', 'Të gjithë Retainer-at', 'Pagesa Fleksibile'],
      cardTag: "Financimi",
      cardTitle: "Plane Fleksibile",
      cardBadge: "0% Interes",
      details: [
        { label: 'Koha e Trajtimit', val: '4 - 9 Muaj' },
        { label: 'Depozita Fillestare', val: 'Minimale' },
        { label: 'Mbështetja', val: '24/7 Mbështetje' },
        { label: 'Retainer-at', val: 'Të Përfshirë' }
      ],
      btn: "Rezervo në Google Calendar"
    }
  }
};

export const FAQS_CONTENT = {
  en: [
    {
      question: 'How long does the treatment take?',
      answer: 'Most cases are completed within 4 to 9 months, depending on the complexity of your dental alignment needs.'
    },
    {
      question: 'Is it painful?',
      answer: 'You may feel some pressure during the first few days of a new aligner set, which means they are working! It is much more comfortable than traditional braces.'
    },
    {
      question: 'Do I need to wear them all day?',
      answer: 'For the best results, we recommend wearing your aligners for 20-22 hours a day, removing them only for eating, drinking (except water), and brushing.'
    },
    {
      question: 'Are there any age restrictions?',
      answer: 'Linea Aligners are suitable for adults and teenagers whose permanent teeth have fully erupted.'
    }
  ],
  sq: [
    {
      question: 'Sa kohë zgjat trajtimi?',
      answer: 'Shumica e rasteve përfundojnë brenda 4 deri në 9 muaj, varësisht nga kompleksiteti i rregullimit të dhëmbëve tuaj.'
    },
    {
      question: 'A është e dhimbshme?',
      answer: 'Mund të ndjeni njëfarë presioni gjatë ditëve të para të një seti të ri, që do të thotë se ata po punojnë! Është shumë më komode se telat tradicionalë.'
    },
    {
      question: 'A duhet t\'i mbaj gjatë gjithë ditës?',
      answer: 'Për rezultate optimale, rekomandojmë mbajtjen e tyre për 20-22 orë në ditë, duke i hequr vetëm për ngrënie, pirje dhe pastrim.'
    },
    {
      question: 'A ka kufizime moshe?',
      answer: 'Linea Aligners janë të përshtatshme për të rritur dhe adoleshentë dhëmbët e të cilëve kanë dalë plotësisht.'
    }
  ]
};

export const TESTIMONIALS_CONTENT = {
  en: [
    {
      name: 'Arta Krasniqi',
      location: 'Peja',
      text: 'Linea Aligners changed my life! I always wanted to fix my teeth but hated the idea of braces. These were completely invisible.',
      image: 'https://images.unsplash.com/photo-1567532939604-b6b5b0ad2604?auto=format&fit=crop&q=80&w=200&h=200',
      rating: 5
    },
    {
      name: 'Besnik Gashi',
      location: 'Prizren',
      text: 'The 3D scan at Medident was so fast and professional. I could see my future smile before even starting. Highly recommend the team!',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
      rating: 5
    }
  ],
  sq: [
    {
      name: 'Arta Krasniqi',
      location: 'Pejë',
      text: 'Linea Aligners më ndryshoi jetën! Gjithmonë kam dashur të rregulloj dhëmbët, por nuk i pëlqeja telat tradicionalë. Këta ishin plotësisht të padukshëm.',
      image: 'https://images.unsplash.com/photo-1567532939604-b6b5b0ad2604?auto=format&fit=crop&q=80&w=200&h=200',
      rating: 5
    },
    {
      name: 'Besnik Gashi',
      location: 'Prizren',
      text: 'Skanimi 3D në Medident ishte shumë i shpejtë dhe profesional. Pashë buzëqeshjen time të ardhshme para se të filloja.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
      rating: 5
    }
  ]
};