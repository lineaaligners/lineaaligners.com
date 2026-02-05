import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
}

const GOOGLE_CALENDAR_URL = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2eP6uFm-7rY-M8Nn4R-JqXvY-M8Nn4R-JqXvY-M8Nn4R-JqXv';

const scheduleAppointmentDeclaration: FunctionDeclaration = {
  name: 'scheduleAppointment',
  parameters: {
    type: Type.OBJECT,
    description: 'Schedules a free 3D scan appointment at Meident Dental Clinic for the user. Call this tool when the user expresses interest in booking a scan, visiting the clinic, or starting their journey.',
    properties: {
      fullName: { type: Type.STRING, description: 'The full name of the patient.' },
      email: { type: Type.STRING, description: 'The email address of the patient for confirmation.' },
      preferredDay: { type: Type.STRING, description: 'Optionally, the day the user prefers.' }
    },
    required: ['fullName', 'email'],
  },
};

export const AIAssistant: React.FC<{ language: 'en' | 'sq' }> = ({ language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isEn = language === 'en';
  const initialText = isEn 
    ? "Welcome to Linea Aligners! I'm your personal AI smile consultant. How can we start transforming your smile today? I can help you book a free 3D scan at our clinic!"
    : "Mirësevini në Linea Aligners! Unë jam konsulenti juaj personal i AI. Si mund të fillojmë transformimin e buzëqeshjes suaj sot? Unë mund t'ju ndihmoj të rezervoni një skanim 3D falas në klinikën tonë!";
  
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    setMessages([{ role: 'model', text: initialText }]);
  }, [language]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: updatedMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        config: {
          systemInstruction: `You are a friendly AI for Linea Aligners. Your goal is to help users understand our clear aligner treatment and ultimately book a free 3D scan at Meident Dental Clinic in Peja. 
          Help the user in ${isEn ? 'English' : 'Albanian'}. 
          If a user wants to book, visit, or start, ALWAYS use the 'scheduleAppointment' tool. If they haven't provided their full name and email, ask for them politely first.
          Booking link: ${GOOGLE_CALENDAR_URL}. 
          Keep responses concise and premium. Do not use asterisks in output.`,
          tools: [{ functionDeclarations: [scheduleAppointmentDeclaration] }],
        },
      });

      if (response.functionCalls && response.functionCalls.length > 0) {
        // Automatically open the booking link when the AI calls the function
        window.open(GOOGLE_CALENDAR_URL, '_blank');
        
        const fc = response.functionCalls[0];
        const name = fc.args.fullName;
        
        const confirmation = isEn 
          ? `Perfect, ${name}! I've initiated your booking process. I am opening our digital calendar for you right now so you can pick your exact time slot at Meident Clinic.`
          : `Shkëlqyeshëm, ${name}! Kam nisur procesin e rezervimit tuaj. Po hap kalendarin tonë digjital për ju tani që të zgjidhni orarin tuaj të saktë në Klinikën Meident.`;
        
        setMessages(prev => [...prev, { role: 'model', text: confirmation }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: (response.text || "").replace(/\*/g, '') }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: isEn ? "I'm having a bit of trouble connecting. Please try again or visit our booking page directly!" : "Kam pak vështirësi në lidhje. Ju lutem provoni përsëri ose vizitoni faqen tonë të rezervimeve direkt!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[60]">
      {isOpen && (
        <div className="mb-6 w-80 sm:w-96 h-[500px] bg-white rounded-[32px] shadow-2xl border border-purple-100 flex flex-col overflow-hidden animate-scale-in origin-bottom-right">
          <div className="p-6 bg-purple-700 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
              </div>
              <p className="font-black text-sm uppercase tracking-widest">Linea AI</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-purple-700 text-white shadow-md' : 'bg-white text-slate-700 shadow-sm border border-slate-100'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                  <div className="flex gap-1 loader-dots">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isEn ? "Ask me anything..." : "Më pyet çdo gjë..."}
              className="flex-1 bg-purple-50/50 rounded-xl px-4 py-3 text-sm outline-none text-purple-900 placeholder:text-purple-300 font-medium"
            />
            <button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()} 
              className={`w-12 h-12 rounded-xl text-white flex items-center justify-center shadow-lg transition-all ${isLoading || !input.trim() ? 'bg-slate-200 shadow-none' : 'bg-purple-gradient hover:scale-105 active:scale-95'}`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-[#5b21b6] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 border-4 border-white"
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg> : "💬"}
      </button>
    </div>
  );
};