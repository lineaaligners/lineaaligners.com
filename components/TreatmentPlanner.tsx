import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ModelViewer } from './ModelViewer';

export const TreatmentPlanner: React.FC<{ onBack: () => void; onBookScan?: () => void; language: 'en' | 'sq' }> = ({ onBack, onBookScan, language }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extension, setExtension] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<number>(0);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isEn = language === 'en';

  const loadingStages = isEn 
    ? ["Encrypting data...", "Initializing AI vision...", "Analyzing tooth alignment...", "Generating clinical report...", "Finalizing assessment..."]
    : ["Duke enkriptuar të dhënat...", "Duke nisur vizionin AI...", "Duke analizuar rreshtimin...", "Duke gjeneruar raportin...", "Duke përfunduar vlerësimin..."];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStage(prev => (prev < loadingStages.length - 1 ? prev + 1 : prev));
      }, 2000);
    } else {
      setLoadingStage(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

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
      setError(isEn ? "AI Vision analysis is currently optimized for clinical photos. For 3D scans, please book a full in-clinic consultation." : "Analiza e AI Vision është e optimizuar për foto klinike. Për skanimet 3D, ju lutem rezervoni një konsultë të plotë në klinikë.");
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

      const rawText = response.text || (isEn ? "Unable to process the image. Please try again with a clearer dental scan or photo." : "Nuk mund të përpunohet imazhi. Ju lutem provoni përsëri me një skanim ose foto dentare më të qartë.");
      const cleanText = rawText.replace(/\*/g, '');
      setAnalysis(cleanText);
    } catch (err) {
      console.error(err);
      setError(isEn ? "An error occurred during file processing. Please check your connection and try again." : "Ndodhi një gabim gjatë përpunimit të skedarit. Ju lutem kontrolloni lidhjen tuaj dhe provoni përsëri.");
    } finally {
      setLoading(false);
    }
  };

  const is3DModel = extension === 'stl' || extension === 'obj';

  return (
    <div className="min-h-screen pt-32 pb-20 bg-slate-50 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-purple-700 font-black hover:text-purple-900 transition-all uppercase text-xs tracking-widest"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          {isEn ? 'Back to Home' : 'Kthehu në Fillim'}
        </button>

        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-purple-100 relative">
          {/* Analysis Overlay */}
          {loading && (
            <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center animate-fade-in">
              <div className="relative w-32 h-32 mb-10">
                <div className="absolute inset-0 border-8 border-purple-100 rounded-full"></div>
                <div 
                  className="absolute inset-0 border-8 border-purple-600 rounded-full border-t-transparent animate-spin"
                  style={{ animationDuration: '1.5s' }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center animate-pulse">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.503 1.508a2 2 0 01-1.185 1.184l-1.508.503a2 2 0 00-1.414 1.96l.477 2.387a2 2 0 00.547 1.022l1.428 1.428a2 2 0 001.022.547l2.387.477a2 2 0 001.96-1.414l.503-1.508a2 2 0 011.185-1.184l1.508-.503a2 2 0 001.414-1.96l-.477-2.387a2 2 0 00-.547-1.022l-1.428-1.428z" /></svg>
                   </div>
                </div>
              </div>
              
              <div className="space-y-4 max-w-sm">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {isEn ? 'Clinical AI Analysis' : 'Analiza Klinike me AI'}
                </h3>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-600 transition-all duration-1000 ease-out"
                    style={{ width: `${((loadingStage + 1) / loadingStages.length) * 100}%` }}
                  ></div>
                </div>
                <p className="text-purple-600 font-bold text-sm uppercase tracking-widest animate-pulse">
                  {loadingStages[loadingStage]}
                </p>
                <p className="text-slate-400 text-xs font-medium">
                  {isEn ? 'This usually takes 10-20 seconds...' : 'Kjo zakonisht zgjat 10-20 sekonda...'}
                </p>
              </div>
            </div>
          )}

          <div className="bg-purple-gradient p-8 text-white text-center">
            <h1 className="text-3xl font-black mb-2 tracking-tight">{isEn ? 'Clinical Planning' : 'Planifikimi Klinik'}</h1>
            <p className="text-purple-100 opacity-80 font-medium">{isEn ? 'Preliminary digital assessment lab' : 'Laboratori i vlerësimit paraprak digjital'}</p>
          </div>

          <div className="p-8 md:p-12 space-y-12">
            {!analysis ? (
              <>
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{isEn ? 'Uploading your data' : 'Ngarkimi i të dhënave tuaja'}</h2>
                    <div className="grid gap-4">
                      {[
                        { icon: '🔬', title: isEn ? '3D Scans' : 'Skanimet 3D', text: isEn ? 'Upload STL or OBJ files from your previous dental work.' : 'Ngarkoni skedarët STL ose OBJ nga puna juaj e mëparshme dentare.' },
                        { icon: '🦴', title: isEn ? 'Dental X-rays' : 'Rrezet X Dentare', text: isEn ? 'High-resolution Panoramic or Lateral Ceph images.' : 'Imazhe panoramike me rezolucion të lartë ose Ceph anësore.' },
                        { icon: '📸', title: isEn ? 'Clinical Photos' : 'Foto Klinike', text: isEn ? 'Clear front-facing photos of your natural bite.' : 'Foto të qarta ballore të kafshimit tuaj natyral.' },
                        { icon: '🔒', title: isEn ? 'Secure Handling' : 'Trajtim i Sigurt', text: isEn ? 'Data is handled securely for specialist review.' : 'Të dhënat trajtohen në mënyrë të sigurt për rishikim nga specialisti.' }
                      ].map((item, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-md cursor-default">
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
                    <div className={`block w-full rounded-3xl overflow-hidden transition-all ${preview ? 'shadow-lg border-2 border-purple-100' : ''}`}>
                      {preview ? (
                        <div className="relative h-[350px] bg-slate-100 group">
                          {is3DModel ? (
                            <ModelViewer url={preview} extension={extension} />
                          ) : (
                            <img src={preview} alt="File Preview" className="w-full h-full object-contain animate-scale-in" />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <label htmlFor="teeth-upload" className="bg-white text-purple-700 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-purple-50 transition-colors">
                                {isEn ? 'Change File' : 'Ndrysho Skedarin'}
                             </label>
                          </div>
                          <button 
                            onClick={(e) => { e.preventDefault(); setFile(null); setPreview(null); }}
                            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-lg text-red-500 hover:text-red-600 transition-all active:scale-90"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ) : (
                        <label 
                          htmlFor="teeth-upload"
                          className="aspect-[4/3] rounded-3xl border-4 border-dashed border-purple-100 bg-purple-50/20 hover:bg-purple-50 hover:border-purple-300 cursor-pointer transition-all flex flex-col items-center justify-center text-center p-6 group"
                        >
                          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-4 shadow-inner group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                          </div>
                          <span className="text-purple-900 font-black text-lg">{isEn ? 'Upload Data' : 'Ngarko të Dhënat'}</span>
                          <span className="text-purple-600/60 text-sm mt-2 font-medium">{isEn ? 'Select STL, OBJ, or Photos' : 'Zgjidhni STL, OBJ, ose Foto'}</span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 pt-4">
                  <button
                    onClick={analyzeSmile}
                    disabled={!file || loading}
                    className={`px-12 py-5 rounded-full font-black text-lg transition-all shadow-2xl flex items-center gap-3 active:scale-95 ${
                      !file || loading 
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                        : 'bg-purple-gradient text-white hover:-translate-y-1 shadow-purple-100'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    <span>{isEn ? 'Start Preliminary Review' : 'Fillo Rishikimin Paraprak'}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="animate-scale-in space-y-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{isEn ? 'Clinical Review Result' : 'Rezultati i Rishikimit Klinik'}</h2>
                  <button 
                    onClick={() => { setAnalysis(null); setFile(null); setPreview(null); }}
                    className="text-purple-700 font-black hover:text-purple-900 text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    {isEn ? 'New Assessment' : 'Vlerësim i Ri'}
                  </button>
                </div>

                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 leading-relaxed text-slate-700 whitespace-pre-wrap font-medium shadow-inner">
                  {analysis}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-2xl flex gap-4">
                  <div className="text-yellow-400 text-2xl pt-1 leading-none">⚠️</div>
                  <p className="text-yellow-800 text-sm font-medium leading-relaxed">
                    <strong>{isEn ? 'Medical Disclaimer:' : 'Mohim Mjekësor:'}</strong> {isEn ? 'This review is a preliminary assessment based on uploaded data. It is NOT a professional diagnosis. A full in-person clinical examination and scan are required.' : 'Ky rishikim është një vlerësim paraprak bazuar në të dhënat e ngarkuara. Nuk është një diagnozë profesionale. Kërkohet një ekzaminim klinik i plotë dhe skanim personalisht.'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                  <button 
                    onClick={onBookScan}
                    className="bg-purple-gradient text-white px-10 py-5 rounded-full font-black text-lg transition-all shadow-xl shadow-purple-200 active:scale-95"
                  >
                    {isEn ? 'Book Scan via Google Calendar' : 'Rezervo Skanimin në Google Calendar'}
                  </button>
                  <button onClick={onBack} className="bg-white border-2 border-purple-200 text-purple-700 px-10 py-5 rounded-full font-black text-lg hover:bg-purple-50 transition-all active:scale-95">
                    {isEn ? 'Back to Home' : 'Kthehu në Fillim'}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center font-bold border border-red-100 flex items-center justify-center gap-2 animate-bounce">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};