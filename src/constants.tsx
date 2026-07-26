
import { NavItem, Feature, Step, FAQ, Testimonial } from './types';

export const WHATSAPP_URL = 'https://wa.me/38349772307';
export const GOOGLE_CALENDAR_URL = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2eP6uFm-7rY-M8Nn4R-JqXvY-M8Nn4R-JqXvY-M8Nn4R-JqXv';

export const BRAND_ASSET = "https://gwzvtrikxkudostserwe.supabase.co/storage/v1/object/public/linea/202241%20-%20Copy.jpg";
export const ICONIC_DESIGN_ASSET = "https://gwzvtrikxkudostserwe.supabase.co/storage/v1/object/public/linea/freepik_upscale-your-image-to-a-h_2777775323.jpeg";
export const ALIGNMENT_ASSET = "https://gwzvtrikxkudostserwe.supabase.co/storage/v1/object/public/linea/leart3d.stl";
export const SCAN_VIDEO_URL = "https://gwzvtrikxkudostserwe.supabase.co/storage/v1/object/public/linea/linea34.mp4";

export const TRANSLATIONS = {
  en: {
    nav: [
      { label: 'Home', href: '#' },
      { label: 'Features', href: '#benefits' },
      { label: 'About', href: '#how-it-works' },
      { label: 'Contact', href: '#footer' },
    ],
    hero: {
      badge: "Straighter teeth, no metal wires",
      founders: "Made in Peja by Genis Nallbani & Dr. Fatbardha Mustafa",
      title1: "Straighten",
      title2: "your smile",
      title3: "without anyone",
      title4: "noticing.",
      description: "Linea Aligners are clear, custom-made trays that fit snugly over your teeth — like a retainer, but one that gently guides your teeth into place over time. No metal, no wires, and barely visible in photos.",
      btnPrimary: "Book a Free Scan",
      btnSecondary: "See If It's Right For Me",
      trust: "500+ smiles straightened so far"
    },
    features: {
      tag: "Why people choose Linea",
      title: "Everything braces do — without the metal.",
      desc: "Clear aligners are custom trays made just for your teeth. You switch to a new set every couple of weeks, and little by little your teeth shift into place. No brackets, no wires, no awkward photos.",
      items: [
        {
          title: 'Nearly invisible',
          description: 'Made from clear, medical-grade plastic. Most people won\'t even notice you\'re wearing them.',
          icon: 'invisible'
        },
        {
          title: 'Take them out anytime',
          description: 'Eating, drinking coffee, brushing your teeth — just pop them out, and put them back in when you\'re done.',
          icon: 'removable'
        },
        {
          title: 'Made just for you',
          description: 'We scan your mouth and design a set of aligners that fits your teeth exactly. No messy molds, no goo.',
          icon: 'precision'
        },
        {
          title: 'Often faster than braces',
          description: 'Many people finish treatment in a matter of months, not years — and you can watch your smile change along the way.',
          icon: 'results'
        }
      ]
    },
    process: {
      tag: "How it works",
      title1: "Three simple",
      title2: "steps.",
      desc: "No confusing jargon, no long consultations. Here's exactly what happens.",
      items: [
        {
          number: '01',
          title: 'Free 3D scan',
          description: 'Come by our clinic in Peja and we\'ll take a quick digital scan of your teeth. No gooey molds — just a few minutes in the chair.'
        },
        {
          number: '02',
          title: 'See your new smile first',
          description: 'Before you commit to anything, we show you a simulation of how your smile will look once treatment is done.'
        },
        {
          number: '03',
          title: 'Get your aligners, start smiling',
          description: 'We hand you your custom aligners and walk you through everything. We\'re just a WhatsApp message away the whole time.'
        }
      ],
      ctaTitle: "Curious if this could work for you?",
      ctaDesc: "It only takes one message. We'll tell you honestly whether aligners are a good fit for your teeth — no pressure, no sales pitch.",
      ctaBtn1: "Message us on WhatsApp",
      ctaBtn2: "Try our quick smile check"
    },
    pricing: {
      tag: "No surprises",
      title1: "Clear pricing,",
      title2: "no hidden fees.",
      desc: "We know cost is usually the first question on your mind. Here's what to expect, plainly.",
      perks: ['Checked by a dentist at every step', 'See your results before you start', 'Retainers included after treatment', 'Pay in installments, interest-free'],
      cardTag: "Payment plans",
      cardTitle: "Flexible Plans",
      cardBadge: "0% Interest",
      details: [
        { label: 'Treatment Time', val: '4 – 9 Months' },
        { label: 'Initial Deposit', val: 'Small, from day one' },
        { label: 'Support', val: 'We\'re here 24/7' },
        { label: 'Retainers', val: 'Included, no extra cost' }
      ],
      btn: "Ask us on WhatsApp"
    }
  },
  sq: {
    nav: [
      { label: 'Fillimi', href: '#' },
      { label: 'Karakteristikat', href: '#benefits' },
      { label: 'Rreth nesh', href: '#how-it-works' },
      { label: 'Kontakti', href: '#footer' },
    ],
    hero: {
      badge: "Dhëmbë të drejtë, pa tela metalikë",
      founders: "Krijuar në Pejë nga Genis Nallbani & Dr. Fatbardha Mustafa",
      title1: "Drejtoni",
      title2: "buzëqeshjen",
      title3: "pa e vënë",
      title4: "re askush.",
      description: "Linea Aligners janë pjata transparente, të bëra posaçërisht për dhëmbët tuaj — si një retainer, por që i lëviz dhëmbët ngadalë drejt vendit të duhur. Pa tela, pa metal, dhe pothuajse të padukshme në foto.",
      btnPrimary: "Rezervo Skanimin Falas",
      btnSecondary: "A më Përshtatet Mua?",
      trust: "500+ buzëqeshje të drejtuara deri tani"
    },
    features: {
      tag: "Përse njerëzit zgjedhin Linea",
      title: "Gjithçka bëjnë telat — pa metal.",
      desc: "Aligner-at transparentë janë pjata të bëra vetëm për dhëmbët tuaj. Ndërroni një set të ri çdo dy javë, dhe dalëngadalë dhëmbët zhvendosen në vendin e tyre. Pa breketa, pa tela, pa foto të vështira.",
      items: [
        {
          title: 'Pothuajse i padukshëm',
          description: 'Bërë nga plastikë transparente e nivelit mjekësor. Shumica e njerëzve as s\'do ta vërejnë.',
          icon: 'invisible'
        },
        {
          title: 'Hiqi kur të duash',
          description: 'Po hëngre, po pive kafe, po lave dhëmbët — thjesht hiqi dhe rivishi kur të mbarosh.',
          icon: 'removable'
        },
        {
          title: 'Bërë vetëm për ty',
          description: 'Skanojmë gojën tuaj dhe dizajnojmë aligner që i përshtaten saktësisht dhëmbëve tuaj. Pa llum, pa siluetë të pakëndshme.',
          icon: 'precision'
        },
        {
          title: 'Shpesh më shpejt se telat',
          description: 'Shumë njerëz e përfundojnë trajtimin brenda muajve, jo viteve — dhe e shohin ndryshimin gjatë rrugës.',
          icon: 'results'
        }
      ]
    },
    process: {
      tag: "Si funksionon",
      title1: "Tre hapa",
      title2: "të thjeshtë.",
      desc: "Pa fjalë të komplikuara, pa konsultime të gjata. Ja saktësisht çka ndodh.",
      items: [
        {
          number: '01',
          title: 'Skanimi 3D falas',
          description: 'Ejani në klinikën tonë në Pejë dhe bëjmë një skanim digjital të shpejtë të dhëmbëve tuaj. Pa llum — vetëm pak minuta në karrige.'
        },
        {
          number: '02',
          title: 'Shihni buzëqeshjen e re para se të filloni',
          description: 'Para se të vendosni për diçka, ju tregojmë një simulim se si do të duket buzëqeshja juaj pas trajtimit.'
        },
        {
          number: '03',
          title: 'Merrni aligner-at, filloni të buzëqeshni',
          description: 'Ju dorëzojmë aligner-at tuaj të personalizuar dhe ju shpjegojmë gjithçka. Jemi një mesazh larg në WhatsApp gjatë gjithë kohës.'
        }
      ],
      ctaTitle: "Kurioz nëse kjo funksionon për ty?",
      ctaDesc: "Duhet vetëm një mesazh. Do t'ju themi sinqerisht nëse aligner-at janë zgjedhja e duhur për dhëmbët tuaj — pa presion, pa shitje.",
      ctaBtn1: "Na Shkruani në WhatsApp",
      ctaBtn2: "Provoni Kontrollin e Shpejtë"
    },
    pricing: {
      tag: "Pa surpriza",
      title1: "Çmim i qartë,",
      title2: "pa kosto të fshehura.",
      desc: "E dimë që çmimi zakonisht është pyetja e parë. Ja çfarë të prisni — thjesht dhe qartë.",
      perks: ['Kontrolluar nga dentisti në çdo hap', 'Shihni rezultatin para se të filloni', 'Retainer-at të përfshirë pas trajtimit', 'Pagesa me këste, pa interes'],
      cardTag: "Planet e Pagesës",
      cardTitle: "Plane Fleksibile",
      cardBadge: "0% Interes",
      details: [
        { label: 'Koha e Trajtimit', val: '4 – 9 Muaj' },
        { label: 'Depozita Fillestare', val: 'E vogël, që nga fillimi' },
        { label: 'Mbështetja', val: 'Jemi këtu 24/7' },
        { label: 'Retainer-at', val: 'Të përfshira, pa kosto shtesë' }
      ],
      btn: "Na Pyet në WhatsApp"
    }
  }
};

export const FAQS_CONTENT = {
  en: [
    {
      question: 'What exactly are clear aligners?',
      answer: "They're clear, custom-made plastic trays that fit snugly over your teeth. You wear a new set every 1-2 weeks, and each one gently nudges your teeth a little closer to where they should be. By the end, your teeth have moved into their new position — without a single metal bracket."
    },
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
      question: 'Çka janë saktësisht aligner-at transparentë?',
      answer: 'Janë pjata plastike transparente, të bëra posaçërisht për dhëmbët tuaj. Vishni një set të ri çdo 1-2 javë, dhe secili i afron pak dhëmbët drejt vendit të duhur. Në fund, dhëmbët tuaj kanë lëvizur në pozicionin e ri — pa asnjë breketë metalike.'
    },
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
