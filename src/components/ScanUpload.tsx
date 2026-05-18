import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, CheckCircle2, AlertCircle, FileText, X, Loader2 } from 'lucide-react';
import { storage, db, auth, handleFirestoreError } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';

interface ScanUploadProps {
  patientId: string;
  onUploadComplete?: () => void;
}

export const ScanUpload: React.FC<ScanUploadProps> = ({ patientId, onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;
    const qRel = query(
      collection(db, 'doctor_patients'),
      where('patientId', '==', patientId)
    );
    const unsubRel = onSnapshot(qRel, (snapshot) => {
      if (!snapshot.empty) {
        setDoctorId(snapshot.docs[0].data().doctorId);
      }
    });
    return () => unsubRel();
  }, [patientId]);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validation
    if (file.size > 50 * 1024 * 1024) {
      showError("File must be less than 50MB");
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/jpg', 'model/stl', 'application/sla', 'application/vnd.ms-pki.stl'];
    const isSTL = file.name.toLowerCase().endsWith('.stl');
    if (!allowedTypes.includes(file.type) && !isSTL && !(file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg'))) {
      showError("Only JPG, PNG, PDF, and STL files allowed");
      return;
    }

    startUpload(file);
  };

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  };

  const startUpload = async (file: File) => {
    if (!auth.currentUser) {
      showError("Authentication required for upload");
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);
    setSuccess(false);

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `scans/${patientId}/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Important: Add extra listener for immediate feedback
      console.log("Starting upload for:", fileName);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Calculate progress carefully
          const transferred = snapshot.bytesTransferred;
          const total = snapshot.totalBytes;
          if (total > 0) {
            const p = (transferred / total) * 100;
            // Ensure UI updates smoothy
            setProgress(Math.max(1, p)); // Minimum 1% to show activity
          } else {
            setProgress(0);
          }
        },
        (err) => {
          console.error("Upload error details:", err);
          let message = "Upload failed";
          if (err.code === 'storage/unauthorized') message = "Permission denied in Storage";
          if (err.code === 'storage/quota-exceeded') message = "Storage quota exceeded";
          
          showError(message);
          setIsUploading(false);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("Upload success, download URL obtained");
            
            const assignedIds = [patientId];
            if (doctorId) assignedIds.push(doctorId);

            let type = file.type.split('/')[1] || 'file';
            if (type === 'jpeg') type = 'jpg';
            if (file.name.toLowerCase().endsWith('.stl')) type = 'stl';

            // Save Metadata to Firestore
            const scanData = {
              patientId,
              fileName: file.name,
              fileType: type,
              fileUrl: downloadUrl,
              fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
              uploadDate: serverTimestamp(),
              category: "Medical Records",
              uploadedBy: auth.currentUser?.uid || patientId,
              assignedTo: assignedIds
            };

            // 1. Save to Scans Collection
            await addDoc(collection(db, 'scans'), scanData);
            
            // 2. SAVE INTO USER'S RECORD as requested
            try {
              await updateDoc(doc(db, 'users', patientId), {
                lastScanUrl: downloadUrl,
                lastScanDate: serverTimestamp(),
                lastScanType: type
              });
            } catch (updateErr) {
              console.warn("Failed to update user record with lastScanUrl, continuing...", updateErr);
            }

            setSuccess(true);
            setIsUploading(false);
            if (onUploadComplete) onUploadComplete();
            setTimeout(() => setSuccess(false), 3000);
          } catch (dbErr) {
            console.error("Firestore database error:", dbErr);
            handleFirestoreError(dbErr, 'write', 'scans');
            showError("Data sync error, contact support");
            setIsUploading(false);
          }
        }
      );
    } catch (err) {
      console.error("Network or initialization error:", err);
      showError("Connection error, please retry");
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isUploading,
    multiple: false,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
      'model/stl': ['.stl'],
      'application/sla': ['.stl']
    }
  });

  return (
    <div className="w-full space-y-4">
      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-black uppercase text-[10px] tracking-widest"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        {...getRootProps()}
        className={`relative group border-4 border-dashed rounded-[40px] p-12 text-center transition-all cursor-pointer overflow-hidden
          ${isDragActive ? 'border-royal bg-royal/10 scale-[1.02]' : 'border-white/10 bg-white/5 hover:border-royal/50 hover:bg-royal/5'}
          ${isUploading ? 'cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div 
              key="uploading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="mx-auto w-20 h-20 bg-royal/10 rounded-[32px] flex items-center justify-center relative">
                <Loader2 className="w-10 h-10 text-royal animate-spin" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-xl font-black italic tracking-tight text-white uppercase">Uploading Progress</p>
                  <p className="text-3xl font-black italic text-royal">{Math.round(progress)}%</p>
                </div>
                <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-royal via-[#5A8DFF] to-emerald-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                  />
                </div>
                <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] animate-pulse italic">
                  Encrypting and transmitting secure medical data...
                </p>
              </div>
            </motion.div>
          ) : success ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="mx-auto w-24 h-24 bg-emerald-500/10 rounded-[40px] flex items-center justify-center relative">
                <motion.div 
                  className="absolute inset-0 border-2 border-emerald-500/50 rounded-[40px]"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-black italic tracking-tight text-emerald-400 uppercase">File Securely Uploaded</p>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Medical records updated successfully</p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="idle"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="space-y-8 py-4"
            >
              <div className="mx-auto w-24 h-24 bg-royal/10 rounded-[36px] flex items-center justify-center group-hover:scale-110 transition-all duration-500 relative">
                 <div className="absolute inset-0 bg-royal/5 blur-2xl group-hover:bg-royal/10 transition-all" />
                 <div className="relative">
                   <Upload className="w-12 h-12 text-royal" />
                   <motion.div 
                    className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-navy"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                   />
                 </div>
              </div>
              <div className="space-y-3">
                <p className="text-2xl font-black italic tracking-tight text-white uppercase group-hover:text-royal transition-colors">Digital Portal Sync</p>
                <div className="flex flex-col items-center gap-2">
                   <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">Drag and drop files or click to browse</p>
                   <div className="flex gap-2">
                     {['JPG', 'PNG', 'PDF', 'STL'].map(t => (
                       <span key={t} className="text-[8px] font-black border border-white/10 px-2 py-0.5 rounded text-white/30 uppercase">{t}</span>
                     ))}
                   </div>
                </div>
              </div>
              <div>
                <button 
                  type="button"
                  className="bg-white text-navy px-12 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-royal hover:text-white transition-all shadow-2xl hover:-translate-y-1 active:scale-95"
                >
                  SELECT MEDICAL FILE
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
