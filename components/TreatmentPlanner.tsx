
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ModelViewer } from './ModelViewer';

export const TreatmentPlanner: React.FC<{ onBack: () => void; onBookScan?: () => void }> = ({ onBack, onBookScan }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extension, setExtension] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      setExtension(ext);
      
      const isModel = ext === 'stl' || ext === 'obj';
      
      if (isModel) {
        setPreview(URL.createObjectURL(selectedFile));
      } else {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
      }
      
      setAnalysis(null);
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

  const analyzeSmile = async () => {
    if (!file) return;
    
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      setError("AI Vision analysis is currently optimized for clinical photos. For 3D scans, please book a full in-clinic consultation.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const base64Data = await fileToBase64(file);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        You are a professional orthodontic planning assistant for Linea Aligners. 
        Analyze the provided dental scan/image. 
        Identify common orthodontic concerns like crowding (rradhitje e dendur), spacing (hapësira), or alignment issues. 
        Provide a preliminary clinical assessment.
        
        IMPORTANT: Do not use any asterisks (*) or markdown formatting in your response. Keep the text clean, plain, and structured with simple line breaks.
        
        MANDATORY DISCLAIMER: You MUST start and end the response with this message in both English and Albanian:
        "This is a preliminary clinical observation and NOT a professional medical diagnosis. A full in-person 3D scan at our clinic is mandatory for a definitive treatment plan."
        "Ky është një vlerësim paraprak klinik dhe nuk përbën një diagnozë mjekësore profesionale. Një skanim i plotë 3D në klinikën tonë është i domosdoshëm për një plan përfundimtar."

        Please provide the analysis in both English and Albanian.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: file.type, data: base64Data } }
          ]
        }
      });

      const rawText = response.text || "Unable to process the image. Please try again with a clearer dental scan or photo.";
      const cleanText = rawText.replace(/\*/g, '');
      setAnalysis(cleanText);
    } catch (err) {
      console.error(err);
      setError("An error occurred during file processing. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const is3DModel = extension === 'stl' || extension === 'obj';

  return (
    <div className="min-h-screen pt-32 pb-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-purple-600 font-bold hover:text-purple-700 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Home
        </button>

        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-purple-100">
          <div className="bg-purple-700 p-8 text-white text-center">
            <h1 className="text-3xl font-bold mb-2">Clinical Planning: Scan & X-Ray</h1>
            <p className="text-purple-100 opacity-80">Upload your data for a preliminary orthodontic review</p>
          </div>

          <div className="p-8 md:p-12 space-y-12">
            {!analysis ? (
              <>
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900">Uploading your data</h2>
                    <div className="grid gap-4">
                      {[
                        { icon: '🔬', title: '3D Scans', text: 'Upload STL or OBJ files from your previous dental work.' },
                        { icon: '🦴', title: 'Dental X-rays', text: 'High-resolution Panoramic or Lateral Ceph images.' },
                        { icon: '📸', title: 'Clinical Photos', text: 'Clear front-facing photos of your natural bite.' },
                        { icon: '🔒', title: 'Secure Handling', text: 'Data is handled securely for specialist review.' }
                      ].map((item, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-md">
                          <span className="text-2xl">{item.icon}</span>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">{item.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*, .stl, .obj" 
                      onChange={handleFileChange}
                      className="hidden" 
                      id="teeth-upload"
                    />
                    <div className={`block w-full rounded-3xl overflow-hidden transition-all ${preview ? 'shadow-lg' : ''}`}>
                      {preview ? (
                        <div className="relative h-[350px] bg-slate-100">
                          {is3DModel ? (
                            <ModelViewer url={preview} extension={extension} />
                          ) : (
                            <img src={preview} alt="File Preview" className="w-full h-full object-contain" />
                          )}
                          <button 
                            onClick={() => { setFile(null); setPreview(null); }}
                            className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md text-red-500 hover:text-red-600 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ) : (
                        <label 
                          htmlFor="teeth-upload"
                          className="aspect-[4/3] rounded-3xl border-4 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-purple-300 cursor-pointer transition-all flex flex-col items-center justify-center text-center p-6"
                        >
                          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                          </div>
                          <span className="text-slate-900 font-bold text-lg">Upload Data</span>
                          <span className="text-slate-500 text-sm mt-2">Select STL, OBJ, or Clinical Photos</span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 pt-4">
                  <button
                    onClick={analyzeSmile}
                    disabled={!file || loading}
                    className={`px-12 py-4 rounded-full font-bold text-lg transition-all shadow-xl flex items-center gap-3 ${
                      !file || loading 
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                        : 'bg-purple-600 text-white hover:bg-purple-700 transform hover:scale-105 shadow-purple-200'
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2 loader-dots">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        <span className="ml-2">Analyzing...</span>
                      </div>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        <span>Start Preliminary Review</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="animate-fade-in space-y-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h2 className="text-2xl font-bold text-slate-900">Preliminary Clinical Review</h2>
                  <button 
                    onClick={() => { setAnalysis(null); setFile(null); setPreview(null); }}
                    className="text-purple-600 font-bold hover:text-purple-700 text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Upload New File
                  </button>
                </div>

                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 leading-relaxed text-slate-700 whitespace-pre-wrap font-medium shadow-inner">
                  {analysis}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-2xl flex gap-4">
                  <div className="text-yellow-400 text-2xl pt-1 leading-none">⚠️</div>
                  <p className="text-yellow-800 text-sm font-medium leading-relaxed">
                    <strong>Medical Disclaimer:</strong> This review is a preliminary assessment based on uploaded data. It is NOT a professional diagnosis. A full in-person clinical examination and scan are required.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                  <button 
                    onClick={onBookScan}
                    className="bg-purple-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-purple-700 transition-all shadow-xl shadow-purple-200"
                  >
                    Book Scan via Google Calendar
                  </button>
                  <button onClick={onBack} className="bg-white border-2 border-purple-100 text-purple-700 px-10 py-4 rounded-full font-bold text-lg hover:bg-purple-50 transition-all">
                    Back to Home
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center font-medium border border-red-100 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
