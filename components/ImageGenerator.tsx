import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

export const ImageGenerator: React.FC<{ language: 'en' | 'sq' }> = ({ language }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEn = language === 'en';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
      setGeneratedImage(null);
      setError(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const generateSmilePreview = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const base64Data = await fileToBase64(file);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: file.type,
              },
            },
            {
              text: "Enhance this person's smile to have perfectly straight, white teeth. Keep it looking natural. This is a dental aligner preview.",
            },
          ],
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          setGeneratedImage(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (err) {
      setError(isEn ? "Generation failed." : "Gjenerimi dështoi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="visualizer" className="py-32 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-20 items-center">
          <div className="lg:w-1/2 space-y-10">
            <div className="space-y-4">
              <h2 className="text-purple-600 font-black uppercase tracking-[0.25em] text-[10px]">{isEn ? 'AI Innovation' : 'Inovacioni AI'}</h2>
              <h3 className="text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter">
                {isEn ? 'Visualize your' : 'Vizualizoni'} <br />
                <span className="text-purple-600">{isEn ? 'future smile.' : 'buzëqeshjen tuaj.'}</span>
              </h3>
            </div>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">
              {isEn 
                ? "Our advanced AI Smile Preview tool uses neural imaging to show you the potential of your transformation."
                : "Mjeti ynë i avancuar AI Smile Preview përdor imazhe neurale për t'ju treguar potencialin e transformimit tuaj."}
            </p>
            
            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-purple-50 space-y-6">
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="smile-upload-v2" />
              <label htmlFor="smile-upload-v2" className="block w-full text-center py-5 bg-purple-50/20 border-2 border-dashed border-purple-200 rounded-2xl cursor-pointer">
                <span className="text-purple-900 font-black">{file ? file.name : (isEn ? 'Choose Photo' : 'Zgjidhni Foton')}</span>
              </label>

              <button 
                onClick={generateSmilePreview}
                disabled={!file || loading}
                className={`w-full py-6 rounded-[25px] font-black text-white transition-all shadow-xl text-lg ${!file || loading ? 'bg-slate-300' : 'bg-purple-gradient'}`}
              >
                {loading ? (isEn ? 'Analyzing...' : 'Duke analizuar...') : (isEn ? 'Generate AI Preview' : 'Gjenero Preview me AI')}
              </button>
            </div>
          </div>

          <div className="lg:w-1/2 w-full flex flex-col items-center">
            <div className="relative w-full aspect-square max-w-lg bg-white rounded-[60px] shadow-2xl overflow-hidden border-8 border-white">
              {generatedImage ? <img src={generatedImage} className="w-full h-full object-cover" alt="" /> : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300 font-bold">
                  {isEn ? 'Preview Area' : 'Zona e Shikimit'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};