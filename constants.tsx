import { NavItem, Feature, Step, FAQ, Testimonial } from './types';

export const NAV_ITEMS: NavItem[] = [
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Benefits', href: '#benefits' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export const FEATURES: Feature[] = [
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
];

export const STEPS: Step[] = [
  {
    number: '01',
    title: 'Free 3D Scan',
    description: 'Visit our clinic in Peja for a state-of-the-art digital scan at Meident Dental Clinic. No uncomfortable molds required.'
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
];

export const FAQS: FAQ[] = [
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
];

export const TESTIMONIALS: Testimonial[] = [
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
    text: 'The 3D scan at Meident was so fast and professional. I could see my future smile before even starting. Highly recommend the team!',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
    rating: 5
  },
  {
    name: 'Dafina Zeqiri',
    location: 'Ferizaj',
    text: 'Super comfortable and easy to manage. I love that I can take them out for important meetings or when I eat.',
    image: 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?auto=format&fit=crop&q=80&w=200&h=200',
    rating: 5
  },
  {
    name: 'Luan Rama',
    location: 'Peja',
    text: 'Great experience from start to finish. The support team was always there when I had questions about my treatment plan.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200',
    rating: 5
  },
  {
    name: 'Era Hoxha',
    location: 'Gjakova',
    text: 'The 3D scanning process was mind-blowing. No messy molds, just high-tech precision. My results are exactly what I expected!',
    image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=200&h=200',
    rating: 5
  },
  {
    name: 'Alban Berisha',
    location: 'Mitrovica',
    text: 'I work in a professional environment and was worried about my appearance. Nobody even noticed I was wearing them. Incredible!',
    image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=200&h=200',
    rating: 5
  },
  {
    name: 'Hana Morina',
    location: 'Gjilan',
    text: 'The flexibility is the best part. Removing them for meals makes life so much easier compared to my friends with traditional braces.',
    image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828d0a?auto=format&fit=crop&q=80&w=200&h=200',
    rating: 5
  },
  {
    name: 'Drilon Kelmendi',
    location: 'Podujeva',
    text: 'Great value for money. The transparent pricing and 24/7 support made the whole journey stress-free. Best decision ever.',
    image: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&q=80&w=200&h=200',
    rating: 5
  }
];