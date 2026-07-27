import { GoogleGenAI, Type } from "@google/genai";

const scheduleAppointmentDeclaration = {
  name: 'scheduleAppointment',
  parameters: {
    type: Type.OBJECT,
    description: 'Directs the user to book a free 3D scan appointment at Medident Dental Clinic via WhatsApp. Call this when the user wants to book, visit, or start treatment.',
    properties: {
      fullName: { type: Type.STRING, description: 'The full name of the patient.' },
      email: { type: Type.STRING, description: 'The email address of the patient for confirmation.' },
      preferredDay: { type: Type.STRING, description: 'Optionally, the day the user prefers.' }
    },
    required: ['fullName', 'email'],
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { message, history, language } = req.body || {};
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not set in Vercel environment variables');
      res.status(500).json({ error: 'Server not configured' });
      return;
    }

    const isEn = language !== 'sq';
    const ai = new GoogleGenAI({ apiKey });
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: `You are a friendly AI for Linea Aligners. Your goal is to help users understand our clear aligner treatment and ultimately book a free 3D scan at Medident Dental Clinic in Peja.
        Help the user in ${isEn ? 'English' : 'Albanian'}.
        If a user wants to book, visit, or start, ALWAYS use the 'scheduleAppointment' tool. If they haven't provided their full name and email, ask for them politely first.
        Keep responses concise and warm. Do not use asterisks in output.`,
        tools: [{ functionDeclarations: [scheduleAppointmentDeclaration] }],
      },
      history: Array.isArray(history) ? history.map((m: any) => ({
        role: m.role,
        parts: [{ text: m.text }]
      })) : [],
    });

    const response = await chat.sendMessage({ message });
    const functionCalls = response.functionCalls;

    if (functionCalls && functionCalls.length > 0) {
      const fc = functionCalls[0];
      const name = (fc.args as any)?.fullName || null;
      res.status(200).json({ openWhatsApp: true, name });
      return;
    }

    res.status(200).json({ text: (response.text || '').replace(/\*/g, '') });
  } catch (err: any) {
    console.error('Chat API error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}
