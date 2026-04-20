
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { WHATSAPP_URL } from '../constants';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const scheduleAppointmentDeclaration: FunctionDeclaration = {
  name: 'scheduleAppointment',
  parameters: {
    type: Type.OBJECT,
    description: 'Directs the user to book a free 3D scan appointment at Medident Dental Clinic via WhatsApp. Call this tool when the user expresses interest in booking a scan, visiting the clinic, or starting their journey.',
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
    ? "Welcome to Linea Aligners! I'm your personal AI smile consultant. How can we start transforming your smile today? I can help you book a free 3D scan at our clinic via WhatsApp!"
    : "Mirësevini në Linea Aligners! Unë jam konsulenti juaj personal i AI. Si mund të fillojmë transformimin e buzëqeshjes suaj sot? Unë mund t'ju ndihmoj të rezervoni një skanim 3D falas në klinikën tonë përmes WhatsApp!";
  
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
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '' });
      const chat = ai.chats.create({
        model: "gemini-1.5-flash",
        config: {
          systemInstruction: `You are a friendly AI for Linea Aligners. Your goal is to help users understand our clear aligner treatment and ultimately book a free 3D scan at Medident Dental Clinic in Peja. 
          Help the user in ${isEn ? 'English' : 'Albanian'}. 
          If a user wants to book, visit, or start, ALWAYS use the 'scheduleAppointment' tool to guide them to WhatsApp. If they haven't provided their full name and email, ask for them politely first.
          Direct WhatsApp link: ${WHATSAPP_URL}. 
          Keep responses concise and premium. Do not use asterisks in output.`,
          tools: [{ functionDeclarations: [scheduleAppointmentDeclaration] }],
        },
        history: messages.slice(0, -1).map(m => ({ 
          role: m.role as 'user' | 'model', 
          parts: [{ text: m.text }] 
        })),
      });

      const response = await chat.sendMessage({ message: userMessage.text });
      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        // Automatically open the WhatsApp link when the AI calls the function
        window.open(WHATSAPP_URL, '_blank');
        
        const fc = functionCalls[0];
        const name = (fc.args as any).fullName;
        
        const confirmation = isEn 
          ? `Perfect, ${name}! I've initiated your booking process. I am opening WhatsApp for you right now so you can chat directly with our clinic to pick your exact time slot at Medident.`
          : `Shkëlqyeshëm, ${name}! Kam nisur procesin e rezervimit tuaj. Po hap WhatsApp për ju tani që të flisni direkt me klinikën tonë për të zgjedhur orarin tuaj të saktë në Medident.`;
        
        setMessages(prev => [...prev, { role: 'model', text: confirmation }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: (response.text || "").replace(/\*/g, '') }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: isEn ? "I'm having a bit of trouble connecting. Please try again or visit our WhatsApp directly!" : "Kam pak vështirësi në lidhje. Ju lutem provoni përsëri ose na kontaktoni në WhatsApp direkt!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[60]">
      {isOpen && (
        <div className="mb-6 w-80 sm:w-96 h-[500px] bg-[#142A4D] rounded-[32px] shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-scale-in origin-bottom-right">
          <div className="p-6 bg-[#4169E1] text-white flex justify-between items-center">
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

          <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#193D6D]/30">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-[#4169E1] text-white shadow-md font-medium' : 'bg-[#193D6D] text-white shadow-sm border border-white/5'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#193D6D] border border-white/5 p-4 rounded-2xl shadow-sm">
                  <div className="flex gap-1 loader-dots">
                    <div className="w-1.5 h-1.5 bg-[#4169E1] rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-[#4169E1] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-[#4169E1] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-[#142A4D] border-t border-white/5 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isEn ? "Ask me anything..." : "Më pyet çdo gjë..."}
              className="flex-1 bg-[#193D6D] rounded-xl px-4 py-3 text-sm outline-none text-white placeholder:text-white/20 font-medium"
            />
            <button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()} 
              className={`w-12 h-12 rounded-xl text-white flex items-center justify-center shadow-lg transition-all ${isLoading || !input.trim() ? 'bg-white/5 text-white/20 shadow-none' : 'bg-[#4169E1] hover:bg-[#5A8DFF] shadow-blue-900/40 hover:scale-105 active:scale-95'}`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-[#4169E1] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 border-4 border-white"
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg> : "💬"}
      </button>
    </div>
  );
};
