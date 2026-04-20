import React, { useState, useEffect } from 'react';
import { auth, db, storage, handleFirestoreError } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp,
  orderBy,
  onSnapshot,
  setDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { 
  LogOut, 
  Upload, 
  FileText, 
  Users, 
  Trash2, 
  ExternalLink, 
  TrendingUp, 
  Plus, 
  Search,
  CheckCircle2,
  Clock,
  Database,
  User
} from 'lucide-react';
import { ProgressBar, ScreenLoader } from './ProgressBar';

interface ScanRecord {
  id: string;
  fileName: string;
  fileType: 'jpg' | 'png' | 'pdf';
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  uploadDate: any;
  assignedTo: string[];
  thumbnailUrl?: string;
}

interface Patient {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  assignedScans: string[];
  registrationDate: any;
}

export const DoctorPortal: React.FC<{ currentUser: any }> = ({ currentUser }) => {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patientForm, setPatientForm] = useState({
    currentAligner: 1,
    totalAligners: 20,
    nextAlignerChange: '',
    nextAppointmentDate: '',
    nextVisitUrl: '',
    status: 'In Progress'
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // Real-time listener for scans
    const scansQuery = query(
      collection(db, 'scans'), 
      where('uploadedBy', '==', currentUser.uid),
      orderBy('uploadDate', 'desc')
    );
    
    const unsubscribeScans = onSnapshot(scansQuery, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScanRecord));
      setScans(docs);
      setLoading(false);
    }, (err) => handleFirestoreError(err, 'list', '/scans'));

    // Real-time listener for assigned patients
    const patientsQuery = query(
      collection(db, 'doctor_patients'),
      where('doctorId', '==', currentUser.uid)
    );
    const unsubscribePatients = onSnapshot(patientsQuery, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Patient));
      setPatients(docs);
    });

    return () => {
      unsubscribeScans();
      unsubscribePatients();
    };
  }, [currentUser]);

  const onDrop = async (acceptedFiles: File[]) => {
    setIsUploading(true);
    setUploadProgress({});

    const startTime = Date.now();

    const uploadPromises = acceptedFiles.map(async (file) => {
      try {
        let fileToUpload = file;
        let isImage = file.type.startsWith('image/');
        let type: 'jpg' | 'png' | 'pdf' = file.type.includes('pdf') ? 'pdf' : (file.type.includes('png') ? 'png' : 'jpg');

        // Compression for images
        if (isImage) {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          fileToUpload = await imageCompression(file, options);
        }

        const fileId = Math.random().toString(36).substring(7);
        const storagePath = `scans/${currentUser.uid}/${fileId}_${file.name}`;
        const storageRef = ref(storage, storagePath);

        const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

        return new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(prev => ({ ...prev, [file.name]: Math.round(p) }));
            },
            reject,
            async () => {
              const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
              
              // Create metadata in Firestore
              await addDoc(collection(db, 'scans'), {
                fileName: file.name,
                fileType: type,
                fileUrl,
                fileSize: fileToUpload.size,
                uploadedBy: currentUser.uid,
                assignedTo: [],
                uploadDate: serverTimestamp(),
                thumbnailUrl: isImage ? fileUrl : null
              });

              resolve();
            }
          );
        });
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err);
        throw err;
      }
    });

    try {
      await Promise.all(uploadPromises);
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(1);
      setUploadSuccess(`${acceptedFiles.length} files uploaded in ${duration}s`);
      setTimeout(() => {
        setUploadSuccess(null);
        setIsUploadModalOpen(false);
      }, 3000);
    } catch (err) {
      alert("Some uploads failed. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    }
  });

  const handleDeleteScan = async (scan: ScanRecord) => {
    if (!confirm("Are you sure you want to delete this scan?")) return;
    try {
      await deleteDoc(doc(db, 'scans', scan.id));
      // Relationship updates can follow here
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignScan = async (patientId: string) => {
    if (!selectedScan) return;
    try {
      const relDocRef = doc(db, 'doctor_patients', patientId);
      await updateDoc(relDocRef, {
        assignedScans: arrayUnion(selectedScan.id)
      });
      
      const scanRef = doc(db, 'scans', selectedScan.id);
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
        await updateDoc(scanRef, {
          assignedTo: arrayUnion(patient.patientId)
        });
      }
      
      setSelectedScan(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = async (patient: Patient) => {
    setEditingPatient(patient);
    try {
      const snap = await getDoc(doc(db, 'users', patient.patientId));
      if (snap.exists()) {
        const data = snap.data();
        setPatientForm({
          currentAligner: data.currentAligner || 1,
          totalAligners: data.totalAligners || 20,
          nextAlignerChange: data.nextAlignerChange ? new Date(data.nextAlignerChange.seconds * 1000).toISOString().split('T')[0] : '',
          nextAppointmentDate: data.nextAppointmentDate ? new Date(data.nextAppointmentDate.seconds * 1000).toISOString().split('T')[0] : '',
          nextVisitUrl: data.nextVisitUrl || '',
          status: data.status || 'In Progress'
        });
      }
    } catch (err) {
      console.error("Error fetching patient profile:", err);
    }
  };

  const handleUpdatePatient = async () => {
    if (!editingPatient) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', editingPatient.patientId);
      await updateDoc(userRef, {
        currentAligner: Number(patientForm.currentAligner),
        totalAligners: Number(patientForm.totalAligners),
        nextAlignerChange: patientForm.nextAlignerChange ? Timestamp.fromDate(new Date(patientForm.nextAlignerChange)) : null,
        nextAppointmentDate: patientForm.nextAppointmentDate ? Timestamp.fromDate(new Date(patientForm.nextAppointmentDate)) : null,
        nextVisitUrl: patientForm.nextVisitUrl,
        status: patientForm.status,
        updatedAt: serverTimestamp()
      });
      setEditingPatient(null);
    } catch (err) {
      console.error("Error updating patient:", err);
      alert("Failed to update patient profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredScans = scans.filter(s => 
    s.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <ScreenLoader message="Fetching scans..." />;

  return (
    <div className="min-h-screen bg-[#070B14] text-white font-sans selection:bg-royal/30 selection:text-white">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-royal/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#87CEEB]/5 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 space-y-16 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 relative group/header bg-white/5 backdrop-blur-2xl p-10 rounded-[40px] border border-white/5 shadow-2xl">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-royal rounded-2xl flex items-center justify-center shadow-2xl shadow-royal/40">
                <Database className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">Line<span className="text-royal">a</span> Scan Hub</h1>
            </div>
            <p className="text-white/40 text-xs font-black uppercase tracking-[0.4em] ml-1">Managed Digital Ecosystem • Surgeons Only</p>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="group relative bg-royal hover:bg-royal/80 text-white font-black uppercase text-[10px] tracking-widest px-10 py-5 rounded-2xl shadow-2xl shadow-royal/40 flex items-center gap-3 transition-all hover:scale-105 active:scale-95"
            >
              <Upload className="w-4 h-4" />
              Upload Medical Data
            </button>
            <button 
              onClick={() => auth.signOut()}
              className="p-5 bg-white/5 hover:bg-red-500/20 rounded-2xl border border-white/5 transition-all text-white/40 hover:text-red-400"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: FileText, label: "Total Scans", value: scans.length, color: "text-royal" },
          { icon: Users, label: "Active Patients", value: patients.length, color: "text-sky" },
          { icon: TrendingUp, label: "Storage Efficiency", value: "85%", color: "text-emerald-400" }
        ].map((stat, i) => (
          <div key={i} className="glass-panel p-8 rounded-[32px] flex items-center gap-6">
            <div className={`p-4 bg-white/5 rounded-2xl ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{stat.label}</p>
              <p className="text-2xl font-black italic">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black uppercase tracking-widest">Scan Library</h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="text" 
              placeholder="Search filename..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm font-bold focus:border-royal/50 outline-none w-64"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredScans.map(scan => (
              <motion.div 
                key={scan.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group glass-panel rounded-[32px] overflow-hidden hover:border-royal/50 transition-all flex flex-col"
              >
                <div className="relative aspect-square bg-navy/20 flex items-center justify-center p-4">
                  {scan.thumbnailUrl ? (
                    <img src={scan.thumbnailUrl} alt={scan.fileName} className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-white/20">
                      <FileText className="w-12 h-12" />
                      <span className="font-black uppercase text-[10px] tracking-widest">{scan.fileType}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-6">
                    <button 
                      onClick={() => window.open(scan.fileUrl, '_blank')}
                      className="w-full py-3 bg-white/90 text-navy rounded-xl font-black flex items-center justify-center gap-2 text-[10px] hover:bg-white"
                    >
                      <ExternalLink className="w-3 h-3" /> OPEN
                    </button>
                    <button 
                      onClick={() => setSelectedScan(scan)}
                      className="w-full py-3 bg-royal text-white rounded-xl font-black flex items-center justify-center gap-2 text-[10px] hover:bg-royal/80"
                    >
                      <Users className="w-3 h-3" /> ASSIGN
                    </button>
                    <button 
                      onClick={() => handleDeleteScan(scan)}
                      className="w-full py-3 bg-red-500/20 text-red-400 rounded-xl font-black flex items-center justify-center gap-2 text-[10px] hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="w-3 h-3" /> DELETE
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-1">
                  <p className="text-sm font-black truncate">{scan.fileName}</p>
                  <div className="flex justify-between items-center text-[8px] font-black uppercase text-white/40 tracking-widest">
                    <span>{new Date(scan.uploadDate?.toDate()).toLocaleDateString()}</span>
                    <span>{(scan.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Patient Management */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-widest">Patient Success Management</h2>
          <div className="flex items-center gap-2 text-white/40 text-[10px] font-black uppercase tracking-widest">
            <Users className="w-3.5 h-3.5" />
            <span>{patients.length} ACTIVE PATIENTS</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map(patient => (
            <div key={patient.id} className="glass-panel p-8 rounded-[32px] space-y-6 group hover:border-royal/50 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-royal/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-royal" />
                  </div>
                  <div className="max-w-[150px]">
                    <p className="text-sm font-black uppercase tracking-tight truncate">{patient.patientName}</p>
                    <p className="text-[10px] font-bold text-white/40 truncate">{patient.patientEmail}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleOpenEdit(patient)}
                  className="p-3 bg-white/5 hover:bg-royal/20 rounded-xl transition-all group/btn"
                  title="Update Progress & Appointments"
                >
                  <TrendingUp className="w-4 h-4 text-royal group-hover/btn:scale-110 transition-transform" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[0.2em] text-white/60">
                  <span>Assigned Scans</span>
                  <span className="text-royal">{patient.assignedScans?.length || 0}</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-royal w-2/3" />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-white/20" />
                  <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Joined {new Date(patient.registrationDate?.toDate()).toLocaleDateString()}</span>
                </div>
                <span className="px-3 py-1 bg-royal/10 text-royal text-[8px] font-black uppercase rounded-full">Patient</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl glass-panel rounded-[40px] p-12 space-y-8 relative"
            >
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Fast Upload <span className="text-royal">Portal</span></h3>
                <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">High-Volume Medical Transmission</p>
              </div>

              {isUploading ? (
                <div className="space-y-6 max-h-[400px] overflow-y-auto px-2">
                  {Object.entries(uploadProgress).map(([name, p]) => (
                    <div key={name} className="space-y-1">
                      <ProgressBar progress={p} label={name} statusText={p === 100 ? "Finalizing" : "Moving"} />
                    </div>
                  ))}
                </div>
              ) : uploadSuccess ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                  <div className="p-6 bg-emerald-500/20 rounded-full">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                  </div>
                  <p className="text-xl font-black uppercase tracking-tight text-emerald-400">{uploadSuccess}</p>
                </div>
              ) : (
                <div 
                  {...getRootProps()} 
                  className={`group h-80 border-4 border-dashed rounded-[40px] flex flex-col items-center justify-center gap-6 transition-all cursor-pointer bg-white/5 border-white/10 hover:border-royal/50 hover:bg-royal/5`}
                >
                  <input {...getInputProps()} />
                  <div className="p-8 bg-royal/10 rounded-[32px] group-hover:scale-110 transition-transform">
                    <Upload className="w-12 h-12 text-royal" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-lg font-black uppercase tracking-widest">DRAG & DROP SCANS</p>
                    <p className="text-[10px] font-black uppercase text-white/20 tracking-widest italic">Optimized JPG, PNG, PDF Support</p>
                  </div>
                </div>
              )}

              <button 
                onClick={() => setIsUploadModalOpen(false)}
                disabled={isUploading}
                className="w-full py-5 bg-white/5 hover:bg-white/10 rounded-2xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50"
              >
                CLOSE
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assignment Modal */}
      <AnimatePresence>
        {selectedScan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md glass-panel rounded-[40px] p-12 space-y-8"
            >
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-widest italic">Assign to Patient</h3>
                <p className="text-[10px] font-black text-white/40 tracking-widest">{selectedScan.fileName}</p>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {patients.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => handleAssignScan(p.id)}
                    className="w-full flex items-center justify-between p-5 bg-white/5 hover:bg-royal/20 rounded-2xl transition-all border border-white/5"
                  >
                    <span className="font-black text-xs uppercase">{p.patientName}</span>
                    <Plus className="w-4 h-4 text-royal" />
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setSelectedScan(null)}
                className="w-full py-5 bg-white/5 hover:bg-white/10 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
              >
                CANCEL
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Patient Modal */}
      <AnimatePresence>
        {editingPatient && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xl glass-panel rounded-[40px] p-12 space-y-8 my-auto"
            >
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-widest italic">Patient Journey <span className="text-royal">Admin</span></h3>
                <p className="text-[10px] font-black text-white/40 tracking-widest italic">{editingPatient.patientName}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Current Aligner #</label>
                  <input 
                    type="number" 
                    value={patientForm.currentAligner}
                    onChange={e => setPatientForm({...patientForm, currentAligner: Number(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold focus:border-royal/50 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Total Aligners</label>
                  <input 
                    type="number" 
                    value={patientForm.totalAligners}
                    onChange={e => setPatientForm({...patientForm, totalAligners: Number(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold focus:border-royal/50 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Next Aligner Change</label>
                  <input 
                    type="date" 
                    value={patientForm.nextAlignerChange}
                    onChange={e => setPatientForm({...patientForm, nextAlignerChange: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold focus:border-royal/50 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Next Appointment</label>
                  <input 
                    type="date" 
                    value={patientForm.nextAppointmentDate}
                    onChange={e => setPatientForm({...patientForm, nextAppointmentDate: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold focus:border-royal/50 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Next Visit URL (Link)</label>
                <input 
                  type="url" 
                  placeholder="https://..."
                  value={patientForm.nextVisitUrl}
                  onChange={e => setPatientForm({...patientForm, nextVisitUrl: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold focus:border-royal/50 outline-none"
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setEditingPatient(null)}
                  disabled={isSaving}
                  className="flex-1 py-5 bg-white/5 hover:bg-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleUpdatePatient}
                  disabled={isSaving}
                  className="flex-1 py-5 bg-royal text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-royal/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Clock className="animate-spin w-3 h-3" /> : 'SAVE UPDATES'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
    </div>
  );
};
