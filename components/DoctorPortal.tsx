import React, { useState, useEffect } from 'react';
import { storage, db, auth, handleFirestoreError } from '../lib/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp,
  getDoc,
  where,
  orderBy,
  onSnapshot,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { 
  Users, 
  Database, 
  LayoutDashboard, 
  LogOut, 
  Search,
  Plus,
  Trash2,
  Upload,
  File,
  FileImage,
  FileType,
  Files,
  Loader2,
  Download,
  Eye,
  X,
  UserPlus,
  Link,
  CheckCircle2,
  Clock,
  Filter,
  Grid,
  List as ListIcon
} from 'lucide-react';

// Types
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'doctor' | 'patient';
  doctorId?: string;
  status: 'active' | 'inactive';
  createdAt: any;
}

interface ScanRecord {
  id: string;
  fileName: string;
  fileType: 'jpg' | 'png' | 'pdf';
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  uploadedBy: string;
  assignedTo: string[];
  uploadDate: any;
}

interface PatientRel {
  id: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  patientEmail: string;
  assignedScans: string[];
  registrationDate: any;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const DoctorPortal: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'scans' | 'patients' | 'dashboard'>('dashboard');
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [patients, setPatients] = useState<PatientRel[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'jpg' | 'png' | 'pdf'>('all');
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadTotal, setUploadTotal] = useState({ current: 0, total: 0 });
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    // Real-time scans for this doctor
    const scansQuery = query(
      collection(db, 'scans'), 
      where('uploadedBy', '==', currentUser.uid),
      orderBy('uploadDate', 'desc')
    );
    const unsubscribeScans = onSnapshot(scansQuery, (snapshot) => {
      setScans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScanRecord)));
      setLoading(false);
    });

    // Real-time patients for this doctor
    const patientsQuery = query(
      collection(db, 'doctor_patients'),
      where('doctorId', '==', currentUser.uid)
    );
    const unsubscribePatients = onSnapshot(patientsQuery, (snapshot) => {
      setPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PatientRel)));
    });

    return () => {
      unsubscribeScans();
      unsubscribePatients();
    };
  }, [currentUser]);

  // Fast Parallel Upload
  const handleUpload = async (acceptedFiles: File[]) => {
    if (!currentUser) return;
    setIsUploading(true);
    setUploadTotal({ current: 0, total: acceptedFiles.length });
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
                thumbnailUrl: isImage ? fileUrl : null // In real app, generate a real proxy thumbnail
              });

              setUploadTotal(prev => ({ ...prev, current: prev.current + 1 }));
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

  const handleDeleteScan = async (scan: ScanRecord) => {
    if (!confirm("Are you sure you want to delete this scan?")) return;
    try {
      // Delete from storage
      // Note: We'd need the storage path. For now, let's just delete metadata for this demo
      // In production, we store 'storagePath' in Firestore.
      await deleteDoc(doc(db, 'scans', scan.id));
      
      // Cleanup patient relationships
      const relsSnap = await getDocs(query(collection(db, 'doctor_patients'), where('assignedScans', 'array-contains', scan.id)));
      for (const d of relsSnap.docs) {
        await updateDoc(doc(db, 'doctor_patients', d.id), {
          assignedScans: arrayRemove(scan.id)
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignScan = async (patientId: string) => {
    if (!selectedScan) return;
    try {
      const rel = patients.find(p => p.patientId === patientId);
      if (!rel) return;

      await updateDoc(doc(db, 'doctor_patients', rel.id), {
        assignedScans: arrayUnion(selectedScan.id)
      });

      await updateDoc(doc(db, 'scans', selectedScan.id), {
        assignedTo: arrayUnion(patientId)
      });

      setIsAssignModalOpen(false);
      setSelectedScan(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredScans = scans.filter(s => {
    const matchesSearch = s.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || s.fileType === filterType;
    return matchesSearch && matchesFilter;
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleUpload,
    disabled: isUploading
  });

  return (
    <div className="flex min-h-screen bg-[#0A0F1C] text-slate-200 selection:bg-blue-500 selection:text-white font-sans">
      {/* Sidebar - Technical Dashboard Look */}
      <aside className="w-72 bg-[#0E1528] border-r border-white/5 flex flex-col pt-12">
        <div className="px-8 mb-16 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">L</div>
          <span className="text-xl font-bold tracking-tight text-white">DOCTOR PORTAL</span>
        </div>

        <nav className="flex-grow px-4 space-y-1">
          {[
            { id: 'dashboard', label: 'Monitor', icon: LayoutDashboard },
            { id: 'scans', label: 'Scan Library', icon: Database },
            { id: 'patients', label: 'Patient Registry', icon: Users },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all font-semibold text-sm ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-white/5">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-slate-400 font-semibold text-sm hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        {/* Header Bar */}
        <header className="h-24 bg-[#0E1528]/50 backdrop-blur-xl border-b border-white/5 px-12 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {activeTab === 'dashboard' && "System Monitor"}
              {activeTab === 'scans' && "Scan Management"}
              {activeTab === 'patients' && "Patient Hub"}
            </h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
              Practitioner: {currentUser?.displayName || currentUser?.email}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-blue-900/40 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              UPLOAD SCANS
            </button>
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-blue-400">
              {currentUser?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Scrollable Body */}
        <section className="flex-grow p-12 overflow-y-auto custom-scrollbar">
          {activeTab === 'dashboard' && (
            <div className="space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { label: 'Total Scans', val: scans.length, icon: Files, color: '#3B82F6' },
                    { label: 'Active Patients', val: patients.length, icon: Users, color: '#60A5FA' },
                    { label: 'Storage Used', val: formatFileSize(scans.reduce((acc, s) => acc + (s.fileSize || 0), 0)), icon: Database, color: '#93C5FD' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-[#0E1528] rounded-3xl p-8 border border-white/5 shadow-2xl flex items-center gap-6">
                       <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                          <stat.icon className="w-8 h-8" />
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
                          <p className="text-3xl font-bold text-white mt-1">{stat.val}</p>
                       </div>
                    </div>
                  ))}
               </div>

               <div className="bg-[#0E1528] rounded-[40px] p-10 border border-white/5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Clock className="w-32 h-32" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                    <Clock className="w-6 h-6 text-blue-500" />
                    Recent Upload Operations
                  </h3>
                  <div className="space-y-4">
                     {scans.slice(0, 5).map(scan => (
                       <div key={scan.id} className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all group">
                          <div className="flex items-center gap-5">
                             <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                                {scan.fileType === 'pdf' ? <FileType className="text-red-400" /> : <FileImage className="text-blue-400" />}
                             </div>
                             <div>
                                <p className="font-bold text-white">{scan.fileName}</p>
                                <p className="text-xs text-slate-500">{formatFileSize(scan.fileSize)} • {new Date(scan.uploadDate?.toDate?.()).toLocaleDateString()}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button className="p-2 hover:text-white transition-colors"><Eye className="w-5 h-5" /></button>
                             <button className="p-2 hover:text-white transition-colors"><Download className="w-5 h-5" /></button>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'scans' && (
            <div className="space-y-8">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="relative w-full max-w-md group">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                     <input 
                        type="text" 
                        placeholder="Search scans by filename..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0E1528] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium focus:outline-none focus:border-blue-500/50 transition-all"
                     />
                  </div>
                  
                  <div className="flex items-center gap-4 bg-[#0E1528] p-2 rounded-2xl border border-white/5">
                     <button onClick={() => setViewMode('grid')} className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><Grid className="w-5 h-5" /></button>
                     <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><ListIcon className="w-5 h-5" /></button>
                     <div className="w-px h-8 bg-white/5 mx-2"></div>
                     <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="bg-transparent border-none text-sm font-bold text-slate-400 pr-4 focus:ring-0 cursor-pointer"
                     >
                        <option value="all">ALL TYPES</option>
                        <option value="jpg">JPG</option>
                        <option value="png">PNG</option>
                        <option value="pdf">PDF</option>
                     </select>
                  </div>
               </div>

               {viewMode === 'grid' ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredScans.map(scan => (
                       <div key={scan.id} className="bg-[#0E1528] rounded-[32px] overflow-hidden border border-white/5 group hover:border-blue-500/30 transition-all flex flex-col shadow-2xl">
                          <div className="aspect-square bg-slate-900 relative p-4 flex items-center justify-center overflow-hidden">
                             {scan.fileType === 'pdf' ? (
                               <div className="flex flex-col items-center gap-4 text-slate-600">
                                  <FileType className="w-20 h-20" />
                                  <span className="font-bold text-sm tracking-widest">PDF DOCUMENT</span>
                               </div>
                             ) : (
                               <img 
                                  src={scan.thumbnailUrl || scan.fileUrl} 
                                  alt={scan.fileName} 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-700" 
                               />
                             )}
                             <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <button onClick={() => window.open(scan.fileUrl, '_blank')} className="w-12 h-12 rounded-full bg-white text-[#0A0F1C] flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"><Download className="w-5 h-5" /></button>
                                <button onClick={() => { setSelectedScan(scan); setIsAssignModalOpen(true); }} className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"><Link className="w-5 h-5" /></button>
                                <button onClick={() => handleDeleteScan(scan)} className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"><Trash2 className="w-5 h-5" /></button>
                             </div>
                          </div>
                          <div className="p-6">
                             <p className="font-bold text-white truncate mb-1">{scan.fileName}</p>
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{formatFileSize(scan.fileSize)} • {scan.fileType}</span>
                                <span className={`w-2 h-2 rounded-full ${scan.assignedTo.length > 0 ? 'bg-green-500' : 'bg-slate-700'}`} title={scan.assignedTo.length > 0 ? 'Assigned' : 'Unassigned'}></span>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
               ) : (
                 <div className="bg-[#0E1528] rounded-[32px] overflow-hidden border border-white/5 shadow-2xl">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-white/5">
                             <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Filename</th>
                             <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type</th>
                             <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Size</th>
                             <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assigned To</th>
                             <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {filteredScans.map(scan => (
                             <tr key={scan.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="p-6 font-bold text-white">{scan.fileName}</td>
                                <td className="p-6"><span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-400">{scan.fileType}</span></td>
                                <td className="p-6 text-sm text-slate-500">{formatFileSize(scan.fileSize)}</td>
                                <td className="p-6">
                                   {scan.assignedTo.length > 0 ? (
                                      <span className="flex items-center gap-2 text-green-400 text-[10px] font-bold uppercase tracking-widest">
                                         <CheckCircle2 className="w-3 h-3" />
                                         {scan.assignedTo.length} Patients
                                      </span>
                                   ) : (
                                      <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Not Assigned</span>
                                   )}
                                </td>
                                <td className="p-6 text-right">
                                   <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => { setSelectedScan(scan); setIsAssignModalOpen(true); }} className="p-2 hover:text-blue-400"><Link className="w-5 h-5" /></button>
                                      <button onClick={() => window.open(scan.fileUrl, '_blank')} className="p-2 hover:text-white"><Download className="w-5 h-5" /></button>
                                      <button onClick={() => handleDeleteScan(scan)} className="p-2 hover:text-red-400"><Trash2 className="w-5 h-5" /></button>
                                   </div>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'patients' && (
            <div className="space-y-8">
               <div className="bg-[#0E1528] rounded-[48px] overflow-hidden border border-white/5 shadow-2xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5">
                        <th className="p-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Patient Name</th>
                        <th className="p-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email Address</th>
                        <th className="p-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Registration</th>
                        <th className="p-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scans Assigned</th>
                        <th className="p-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {patients.map(p => (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="p-8 flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center font-bold text-blue-400">
                                {p.patientName.charAt(0)}
                             </div>
                             <span className="text-lg font-bold text-white tracking-tight">{p.patientName}</span>
                          </td>
                          <td className="p-8 text-slate-400 font-medium">{p.patientEmail}</td>
                          <td className="p-8 text-slate-500 text-sm italic">{new Date(p.registrationDate?.toDate?.()).toLocaleDateString()}</td>
                          <td className="p-8">
                             <div className="flex items-center gap-3">
                                <div className="h-2 w-24 bg-slate-800 rounded-full overflow-hidden">
                                   <div className="h-full bg-blue-600" style={{ width: `${Math.min(100, (p.assignedScans.length / 10) * 100)}%` }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">{p.assignedScans.length}</span>
                             </div>
                          </td>
                          <td className="p-8 text-right">
                             <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="px-5 py-2.5 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">View Dossier</button>
                                <button className="p-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all"><X className="w-4 h-4" /></button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          )}
        </section>
      </main>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-[#0A0F1C]/90 backdrop-blur-xl animate-fade-in">
           <div className="bg-[#0E1528] rounded-[50px] p-12 w-full max-w-3xl border border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between items-center mb-10">
                 <div>
                    <h2 className="text-3xl font-bold text-white">Upload Clinical Scans</h2>
                    <p className="text-slate-500 font-medium">Parallel processing enabled for high-speed delivery.</p>
                 </div>
                 <button onClick={() => setIsUploadModalOpen(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all"><X /></button>
              </div>

              <div 
                {...getRootProps()} 
                className={`
                  mb-10 p-16 border-4 border-dashed rounded-[40px] flex flex-col items-center gap-8 transition-all cursor-pointer
                  ${isDragActive ? 'bg-blue-600/10 border-blue-500 scale-[0.98]' : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]'}
                  ${isUploading ? 'pointer-events-none opacity-50' : ''}
                `}
              >
                 <input {...getInputProps()} />
                 <div className="w-24 h-24 rounded-3xl bg-blue-600/20 text-blue-500 flex items-center justify-center">
                    <Upload className="w-10 h-10" />
                 </div>
                 <div className="text-center">
                    <p className="text-xl font-bold text-white mb-2">{isDragActive ? 'Release to Start Upload' : 'Drag Scans Here'}</p>
                    <p className="text-sm text-slate-500 uppercase tracking-widest font-bold">Supports JPG, PNG, PDF up to 50MB</p>
                 </div>
              </div>

              {isUploading && (
                <div className="space-y-6">
                   <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-400">
                      <span>Uploading {uploadTotal.current} of {uploadTotal.total} Files</span>
                      <span>Total Progress: {Math.round((uploadTotal.current / uploadTotal.total) * 100)}%</span>
                   </div>
                   <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 transition-all duration-500 shadow-[0_0_20px_rgba(37,99,235,0.5)]" style={{ width: `${(uploadTotal.current / uploadTotal.total) * 100}%` }}></div>
                   </div>
                   <div className="grid grid-cols-2 gap-4 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                       {Object.entries(uploadProgress).map(([name, p]) => (
                         <div key={name} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{name}</span>
                            <span className="text-[10px] font-bold text-blue-500">{p}%</span>
                         </div>
                       ))}
                   </div>
                </div>
              )}

              {uploadSuccess && (
                <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl flex items-center gap-4 text-green-400 font-bold animate-scale-up">
                   <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                   {uploadSuccess}
                </div>
              )}
           </div>
        </div>
      )}

      {/* Assign Modal */}
      {isAssignModalOpen && selectedScan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-[#0A0F1C]/90 backdrop-blur-xl animate-fade-in">
           <div className="bg-[#0E1528] rounded-[50px] p-12 w-full max-w-xl border border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between items-center mb-10">
                 <div>
                    <h2 className="text-3xl font-bold text-white">Assign Scan</h2>
                    <p className="text-slate-500 font-medium">Link this scan to a specific patient dossier.</p>
                 </div>
                 <button onClick={() => setIsAssignModalOpen(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 transition-all"><X /></button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                 {patients.map(p => (
                   <button 
                      key={p.id}
                      onClick={() => handleAssignScan(p.patientId)}
                      disabled={selectedScan.assignedTo.includes(p.patientId)}
                      className={`w-full p-6 rounded-3xl border transition-all flex items-center justify-between group ${selectedScan.assignedTo.includes(p.patientId) ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed' : 'bg-white/[0.02] border-white/5 hover:bg-blue-600/10 hover:border-blue-500/30'}`}
                   >
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-slate-800 text-blue-400 flex items-center justify-center font-bold">
                            {p.patientName.charAt(0)}
                         </div>
                         <div className="text-left">
                            <p className="font-bold text-white">{p.patientName}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{p.patientEmail}</p>
                         </div>
                      </div>
                      {selectedScan.assignedTo.includes(p.patientId) ? (
                         <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                         <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-600 transition-all">
                            <Plus className="w-4 h-4 text-white" />
                         </div>
                      )}
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
