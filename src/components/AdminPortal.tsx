import React, { useState, useEffect } from 'react';
import { storage, db, auth, handleFirestoreError } from '../lib/firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  updateDoc, 
  serverTimestamp,
  getDoc,
  collectionGroup,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { useDropzone } from 'react-dropzone';
import { 
  Users, 
  UserPlus, 
  Database, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Search,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  User as UserIcon,
  FileText,
  Upload,
  File,
  Eye,
  Download as DownloadIcon,
  Filter,
  X,
  FileCode,
  FileImage,
  FileType,
  Files,
  Loader2,
  Calendar,
  Info,
  ExternalLink,
  ShieldAlert,
  Menu
} from 'lucide-react';

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface DocumentRecord {
  id: string;
  name: string;
  fileName: string;
  fileType: string;
  category: 'Medical Records' | 'Test Results' | 'Prescriptions' | 'Notes' | 'Other';
  fileSize: number;
  storagePath: string;
  downloadUrl: string;
  uploadedBy: string;
  createdAt: any;
  patientId: string;
}

interface Patient {
  id: string;
  name: string;
  dob: string;
  condition: string;
  userId: string;
  createdAt: any;
}

interface AlignerCase {
  id: string;
  caseName: string;
  patientName: string;
  createdAt: any;
  fileCount: number;
  clinicId?: string;
  clinicName?: string;
  price?: number;
  paid?: boolean;
}

interface AlignerFile {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'url';
  url: string;
  size?: number;
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

const FileDropzone: React.FC<{ 
  onUpload: (files: File[]) => void; 
  isUploading: boolean; 
  progress: { [key: string]: number };
  success: boolean;
}> = ({ onUpload, isUploading, progress, success }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => onUpload(acceptedFiles),
    disabled: isUploading
  });

  return (
    <div 
      {...getRootProps()} 
      className={`
        relative overflow-hidden cursor-pointer transition-all duration-500
        border-4 border-dashed rounded-[40px] p-12
        flex flex-col items-center justify-center gap-6
        ${isDragActive ? 'bg-[#4169E1]/20 border-[#4169E1] scale-[0.99]' : 'bg-white/5 border-white/10 hover:border-[#4169E1]/40 hover:bg-white/[0.08]'}
        ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      
      <div className={`
        w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500
        ${isDragActive ? 'bg-[#4169E1] text-white rotate-12 scale-110' : 'bg-white/5 text-white/20'}
      `}>
         <Upload className="w-10 h-10" />
      </div>

      <div className="text-center">
         <h3 className="text-2xl font-black mb-2">{isDragActive ? "Drop to Upload" : "Add Files"}</h3>
         <p className="text-white/40 font-bold uppercase text-[10px] tracking-[0.2em]">Drag and drop or click to browse</p>
      </div>

      <div className="flex gap-4">
         <span className="px-4 py-1.5 bg-white/5 rounded-full text-[9px] font-black text-white/30 uppercase tracking-widest border border-white/5">PDF</span>
         <span className="px-4 py-1.5 bg-white/5 rounded-full text-[9px] font-black text-white/30 uppercase tracking-widest border border-white/5">Images</span>
         <span className="px-4 py-1.5 bg-white/5 rounded-full text-[9px] font-black text-white/30 uppercase tracking-widest border border-white/5">Docs</span>
      </div>

      {/* Upload Progress Overlay */}
      {Object.keys(progress).length > 0 && (
         <div className="absolute inset-0 bg-[#142A4D]/80 backdrop-blur-sm p-8 flex flex-col justify-center gap-6 animate-fade-in">
            {Object.entries(progress).map(([name, p]) => (
               <div key={name} className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                     <span className="truncate max-w-[200px]">{name}</span>
                     <span>{p}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                     <div 
                        className="h-full bg-gradient-to-r from-[#4169E1] to-[#87CEEB] transition-all duration-300" 
                        style={{ width: `${p}%` }}
                     />
                  </div>
               </div>
            ))}
         </div>
      )}

      {/* Success State Overlay */}
      {success && (
         <div className="absolute inset-0 bg-[#4169E1] flex flex-col items-center justify-center gap-4 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-[#4169E1] shadow-2xl">
               <CheckCircle className="w-10 h-10" />
            </div>
            <p className="text-xl font-black uppercase tracking-widest">Upload Successful</p>
         </div>
      )}
    </div>
  );
};

interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  role?: 'doctor' | 'patient' | 'admin';
  currentAligner?: number;
  totalAligners?: number;
  nextAlignerChange?: any;
  nextAppointmentDate?: any;
  doctorName?: string;
  appointmentType?: string;
  clinicAddress?: string;
  nextVisitUrl?: string;
  createdAt: any;
}

export const AdminPortal: React.FC<{ onLogout: () => void; onSwitchToPatient?: () => void }> = ({ onLogout, onSwitchToPatient }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'patients' | 'cases' | 'scans'>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPatients: 0,
    totalFiles: 0
  });

  // Modal states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({ 
    name: '', 
    email: '', 
    password: '',
    status: 'active' as 'active' | 'inactive',
    role: 'patient' as 'doctor' | 'patient'
  });
  const [patientFormData, setPatientFormData] = useState({ name: '', dob: '', condition: '', userId: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Document management
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [fileCounts, setFileCounts] = useState<{ [key: string]: number }>({});

  // Aligner Cases state
  const [alignerCases, setAlignerCases] = useState<AlignerCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<AlignerCase | null>(null);
  const [caseFiles, setCaseFiles] = useState<AlignerFile[]>([]);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [newCaseData, setNewCaseData] = useState({ caseName: '', patientName: '', clinicId: '', price: '' });
  const [urlInput, setUrlInput] = useState('');
  const [isFilesLoading, setIsFilesLoading] = useState(false);

  // Advanced Client Controller States
  const [isClientControlModalOpen, setIsClientControlModalOpen] = useState(false);
  const [controlFormData, setControlFormData] = useState({
    name: '',
    email: '',
    status: 'active' as 'active' | 'inactive',
    role: 'patient' as 'doctor' | 'patient',
    currentAligner: 1,
    totalAligners: 20,
    nextAlignerChange: '',
    doctorName: '',
    appointmentType: '',
    nextAppointmentDate: '',
    clinicAddress: '',
    nextVisitUrl: ''
  });
  const [clientScans, setClientScans] = useState<any[]>([]);
  const [isControlUploading, setIsControlUploading] = useState(false);
  const [controlFileUploadProgress, setControlFileUploadProgress] = useState(0);
  const [customLinkName, setCustomLinkName] = useState('');
  const [customLinkUrl, setCustomLinkUrl] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const fetchFileCounts = async () => {
      const counts: { [key: string]: number } = {};
      try {
        for (const p of patients) {
          const snap = await getDocs(collection(db, 'patients', p.id, 'documents'));
          counts[p.id] = snap.size;
        }
        setFileCounts(counts);
      } catch (err) {
        console.error("Error fetching file counts:", err);
      }
    };
    if (activeTab === 'cases' || activeTab === 'patients') {
      fetchFileCounts();
    }
  }, [activeTab, patients]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersList);

      const patientsSnap = await getDocs(collection(db, 'patients'));
      const patientsList = patientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
      setPatients(patientsList);

      // Fetch Aligner Cases
      const casesSnap = await getDocs(query(collection(db, 'alignerCases'), orderBy('createdAt', 'desc')));
      const casesList = casesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AlignerCase));
      setAlignerCases(casesList);

      // Total files across all patients
      const allDocsSnap = await getDocs(collectionGroup(db, 'documents'));

      const scansSnap = await getDocs(collection(db, 'scans'));
      const scansList = scansSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setScans(scansList);
      
      setStats({
        totalUsers: usersList.length,
        totalPatients: patientsList.length,
        totalFiles: allDocsSnap.size + scansList.length
      });
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data. Ensure you are an admin.");
    } finally {
      setLoading(false);
    }
  };

  // Real-time listener for cases
  useEffect(() => {
    const q = query(collection(db, 'alignerCases'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const cases = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AlignerCase));
      setAlignerCases(cases);
    });
    return () => unsubscribe();
  }, []);

  // Real-time listener for selected case files
  useEffect(() => {
    if (!selectedCase) {
      setCaseFiles([]);
      return;
    }

    setIsFilesLoading(true);
    const q = query(collection(db, 'alignerCases', selectedCase.id, 'files'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const files = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AlignerFile));
      setCaseFiles(files);
      setIsFilesLoading(false);
    });
    return () => unsubscribe();
  }, [selectedCase]);

  // Advanced Client Controls Handlers
  const fetchClientScans = async (userId: string) => {
    try {
      const q = query(
        collection(db, 'scans'),
        where('patientId', '==', userId),
        orderBy('uploadDate', 'desc')
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClientScans(list);
    } catch (err) {
      console.error("Error fetching client scans:", err);
    }
  };

  const handleOpenClientControl = (user: any) => {
    setSelectedUser(user);
    
    let changeDateStr = '';
    if (user.nextAlignerChange) {
      const changeDate = user.nextAlignerChange.toDate ? user.nextAlignerChange.toDate() : new Date(user.nextAlignerChange);
      try {
        changeDateStr = changeDate.toISOString().split('T')[0];
      } catch (e) {
        changeDateStr = '';
      }
    }
    
    let apptDateStr = '';
    if (user.nextAppointmentDate) {
      const apptDate = user.nextAppointmentDate.toDate ? user.nextAppointmentDate.toDate() : new Date(user.nextAppointmentDate);
      try {
        const offset = apptDate.getTimezoneOffset() * 60000;
        apptDateStr = new Date(apptDate.getTime() - offset).toISOString().substring(0, 16);
      } catch (e) {
        apptDateStr = '';
      }
    }

    setControlFormData({
      name: user.name || '',
      email: user.email || '',
      status: user.status || 'active',
      role: user.role || 'patient',
      currentAligner: user.currentAligner || 1,
      totalAligners: user.totalAligners || 20,
      nextAlignerChange: changeDateStr,
      doctorName: user.doctorName || 'Dr. Geno Nallbani',
      appointmentType: user.appointmentType || 'Progress Check & Scan',
      nextAppointmentDate: apptDateStr,
      clinicAddress: user.clinicAddress || 'Medident Clinic, Prishtina',
      nextVisitUrl: user.nextVisitUrl || ''
    });

    fetchClientScans(user.id);
    setIsClientControlModalOpen(true);
  };

  const handleUpdateAlignerStage = async (userId: string, currentVal: number, totalVal: number, change: number) => {
    try {
      const newStage = Math.max(1, Math.min(totalVal, currentVal + change));
      const userRef = doc(db, 'users', userId);
      const tenDaysFromNow = new Date();
      tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);

      await updateDoc(userRef, {
        currentAligner: newStage,
        nextAlignerChange: tenDaysFromNow
      });
      // Instantly apply state change to UI
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, currentAligner: newStage, nextAlignerChange: tenDaysFromNow } : u));
    } catch (err: any) {
      console.error(err);
      alert("Failed to update aligner phase: " + err.message);
    }
  };

  const handleSaveClientControl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      const updateData: any = {
        name: controlFormData.name,
        status: controlFormData.status,
        role: controlFormData.role,
        currentAligner: Number(controlFormData.currentAligner) || 1,
        totalAligners: Number(controlFormData.totalAligners) || 20,
        doctorName: controlFormData.doctorName || '',
        appointmentType: controlFormData.appointmentType || '',
        clinicAddress: controlFormData.clinicAddress || '',
        nextVisitUrl: controlFormData.nextVisitUrl || ''
      };

      if (controlFormData.nextAlignerChange) {
        updateData.nextAlignerChange = new Date(controlFormData.nextAlignerChange);
      } else {
        updateData.nextAlignerChange = null;
      }

      if (controlFormData.nextAppointmentDate) {
        updateData.nextAppointmentDate = new Date(controlFormData.nextAppointmentDate);
      } else {
        updateData.nextAppointmentDate = null;
      }

      await updateDoc(userRef, updateData);
      
      fetchData();
      setIsClientControlModalOpen(false);
      alert("Client profile and professional controls synchronized!");
    } catch (err: any) {
      console.error(err);
      alert("Synchronization failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSTLForClient = async (files: File[]) => {
    if (!selectedUser) return;
    const file = files[0];
    if (!file) return;

    const isSTL = file.name.toLowerCase().endsWith('.stl');
    
    setIsControlUploading(true);
    setControlFileUploadProgress(0);

    const fileId = Math.random().toString(36).substring(7);
    const storagePath = `patient_scans/${selectedUser.id}/${fileId}_${file.name}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setControlFileUploadProgress(p);
      }, 
      (err) => {
        console.error("Advanced STL upload issue:", err);
        setIsControlUploading(false);
        alert("Upload failed: " + err.message);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        await addDoc(collection(db, 'scans'), {
          fileName: file.name,
          fileUrl: downloadURL,
          fileSize: formatFileSize(file.size),
          fileType: isSTL ? 'stl' : (file.type.startsWith('image/') ? 'image' : 'pdf'),
          uploadDate: serverTimestamp(),
          uploadedBy: auth.currentUser?.uid || selectedUser.id,
          assignedTo: [selectedUser.id],
          patientId: selectedUser.id,
          isProcessed: false
        });

        setIsControlUploading(false);
        setControlFileUploadProgress(0);
        alert(`Successfully deployed scan asset "${file.name}" to the client portal!`);
        fetchClientScans(selectedUser.id);
      }
    );
  };

  const handleAddCustomLinkForClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !customLinkName || !customLinkUrl) return;

    try {
      await addDoc(collection(db, 'scans'), {
        fileName: customLinkName,
        fileUrl: customLinkUrl,
        fileSize: 'Secure Portal Link',
        fileType: 'pdf',
        uploadDate: serverTimestamp(),
        uploadedBy: auth.currentUser?.uid || selectedUser.id,
        assignedTo: [selectedUser.id],
        patientId: selectedUser.id,
        isProcessed: true
      });

      setCustomLinkName('');
      setCustomLinkUrl('');
      alert("Successfully posted external link resource!");
      fetchClientScans(selectedUser.id);
    } catch (err: any) {
      console.error(err);
      alert("Posting link failed: " + err.message);
    }
  };

  const handleDeleteClientScan = async (scanId: string) => {
    if (!confirm("Are you sure you want to delete this scan file / link?")) return;
    try {
      await deleteDoc(doc(db, 'scans', scanId));
      if (selectedUser) {
        fetchClientScans(selectedUser.id);
      }
    } catch (err: any) {
      alert("Failed to delete record: " + err.message);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple, flexible validation rules
    if (userFormData.name.trim().length < 2) {
      alert("Name must be at least 2 characters");
      return;
    }
    if (!userFormData.email.includes('@')) {
      alert("Invalid email format (must contain @)");
      return;
    }
    if (userFormData.password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    let tempApp;
    try {
      // 1. Create Auth User via Isolate Client-Side Secondary App instance
      const tempAppName = `temp-user-creator-${Date.now()}`;
      tempApp = initializeApp(firebaseConfig, tempAppName);
      const tempAuth = getAuth(tempApp);
      
      const userCredential = await createUserWithEmailAndPassword(
        tempAuth,
        userFormData.email,
        userFormData.password
      );
      
      // Update display name
      if (userFormData.name && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: userFormData.name
        });
      }
      
      // Sign out from the temporary session
      await signOut(tempAuth);
      
      const targetUid = userCredential.user.uid;

      // 2. Create Firestore User Document using the same UID
      const newUser: any = {
        name: userFormData.name,
        email: userFormData.email,
        status: userFormData.status,
        role: userFormData.role,
        createdAt: serverTimestamp()
      };
      
      if (userFormData.role === 'patient') {
        newUser.currentAligner = 1;
        newUser.totalAligners = 20;
        newUser.doctorName = 'Dr. Geno Nallbani';
        newUser.appointmentType = 'Progress Check & Scan';
        newUser.clinicAddress = 'Medident Clinic, Prishtina';
      }
      
      await setDoc(doc(db, 'users', targetUid), newUser);
      
      // 3. Trigger email notification via backend
      try {
        await fetch('/api/notify-user-created', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: userFormData.name,
            email: userFormData.email,
            createdAt: new Date().toISOString(),
            adminLink: window.location.origin + '/admin'
          })
        });
      } catch (notifyErr) {
        console.warn("Failed to trigger email notification:", notifyErr);
      }

      setIsUserModalOpen(false);
      setUserFormData({ name: '', email: '', password: '', status: 'active', role: 'patient' });
      fetchData();
      alert(`User ${userFormData.name} created successfully!`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error creating user');
    } finally {
      if (tempApp) {
        try {
          await deleteApp(tempApp);
        } catch (delErr) {
          console.error("Error clean deleting app:", delErr);
        }
      }
      setLoading(false);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (patientFormData.name.trim().length < 2) {
      alert("Patient name must be at least 2 characters");
      return;
    }

    setLoading(true);
    try {
      const newPatient = {
        ...patientFormData,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'patients'), newPatient);
      setIsPatientModalOpen(false);
      setPatientFormData({ name: '', dob: '', condition: '', userId: '' });
      fetchData();
    } catch (err) {
      handleFirestoreError(err, 'create', '/patients');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePaid = async (caseItem: AlignerCase) => {
    try {
      await updateDoc(doc(db, 'alignerCases', caseItem.id), { paid: !caseItem.paid });
    } catch (err: any) {
      console.error(err);
      alert('Could not update payment status: ' + err.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure? This will delete the user profile.")) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (!confirm("Are you sure? This will delete the patient record.")) return;
    try {
      await deleteDoc(doc(db, 'patients', id));
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const clinic = users.find(u => u.id === newCaseData.clinicId);
      const caseData = {
        caseName: newCaseData.caseName,
        patientName: newCaseData.patientName,
        clinicId: newCaseData.clinicId || '',
        clinicName: clinic?.name || '',
        price: Number(newCaseData.price) || 0,
        paid: false,
        fileCount: 0,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'alignerCases'), caseData);
      setIsCaseModalOpen(false);
      setNewCaseData({ caseName: '', patientName: '', clinicId: '', price: '' });
    } catch (err) {
      console.error("Error creating case:", err);
      // Fixed: handleFirestoreError needs 3 arguments
      try {
        handleFirestoreError(err, 'create', 'alignerCases');
      } catch (formattedError: any) {
        alert(JSON.parse(formattedError.message).error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (!confirm("Are you sure you want to delete this case and all its files?")) return;
    try {
      // First delete all files in subcollection (simple for demo, ideally cleanup storage too)
      const filesSnap = await getDocs(collection(db, 'alignerCases', caseId, 'files'));
      for (const f of filesSnap.docs) {
        const fdata = f.data() as AlignerFile;
        if (fdata.type !== 'url' && fdata.url.includes('firebasestorage')) {
           // Cleanup storage if needed
        }
        await deleteDoc(doc(db, 'alignerCases', caseId, 'files', f.id));
      }
      await deleteDoc(doc(db, 'alignerCases', caseId));
      if (selectedCase?.id === caseId) setSelectedCase(null);
    } catch (err) {
      console.error("Error deleting case:", err);
    }
  };

  const handleUploadAlignerFiles = async (files: File[]) => {
    if (!selectedCase) return;
    
    setIsUploading(true);
    setUploadProgress({});

    for (const file of files) {
      const fileId = Math.random().toString(36).substring(7);
      const storagePath = `alignerCases/${selectedCase.id}/${fileId}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      const uploadTask = uploadBytesResumable(storageRef, file);

      try {
        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed', 
            snapshot => {
              const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(prev => ({ ...prev, [file.name]: Math.round(p) }));
            },
            reject,
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              const fileData: Omit<AlignerFile, 'id'> = {
                name: file.name,
                type: file.type.includes('pdf') ? 'pdf' : 'image',
                url,
                size: file.size,
                createdAt: serverTimestamp()
              };
              await addDoc(collection(db, 'alignerCases', selectedCase.id, 'files'), fileData);
              // Update file count in case document
              await updateDoc(doc(db, 'alignerCases', selectedCase.id), {
                fileCount: (selectedCase.fileCount || 0) + 1
              });
              resolve();
            }
          );
        });
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err);
      }
    }

    setUploadSuccess(true);
    setTimeout(() => {
      setUploadSuccess(false);
      setUploadProgress({});
      setIsUploading(false);
    }, 2000);
  };

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !urlInput) return;
    try {
      const urlData: Omit<AlignerFile, 'id'> = {
        name: urlInput.split('//')[1]?.split('/')[0] || 'Link',
        type: 'url',
        url: urlInput.startsWith('http') ? urlInput : `https://${urlInput}`,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'alignerCases', selectedCase.id, 'files'), urlData);
      await updateDoc(doc(db, 'alignerCases', selectedCase.id), {
        fileCount: (selectedCase.fileCount || 0) + 1
      });
      setUrlInput('');
    } catch (err) {
      console.error("Error adding URL:", err);
    }
  };

  const handleDeleteAlignerFile = async (file: AlignerFile) => {
    if (!selectedCase || !confirm("Delete this file?")) return;
    try {
      await deleteDoc(doc(db, 'alignerCases', selectedCase.id, 'files', file.id));
      await updateDoc(doc(db, 'alignerCases', selectedCase.id), {
        fileCount: Math.max(0, (selectedCase.fileCount || 0) - 1)
      });
      // Storage cleanup omitted for brevity but recommended
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  };

  const handleOpenDocManager = (patient: Patient) => {
    setSelectedPatient(patient);
    const user = users.find(u => u.id === patient.userId);
    setSelectedUser(user || null);
    
    // Real-time listener for current patient documents
    const q = query(collection(db, 'patients', patient.id, 'documents'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DocumentRecord));
      setDocuments(docs);
    });

    setIsDocumentModalOpen(true);
    return unsubscribe;
  };

  const uploadFile = async (file: File, category: DocumentRecord['category']) => {
    if (!selectedPatient) return;
    
    const fileId = Math.random().toString(36).substring(7);
    const storagePath = `patients/${selectedPatient.id}/documents/${fileId}_${file.name}`;
    const storageRef = ref(storage, storagePath);
    
    setIsUploading(true);
    setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise<void>((resolve, reject) => {
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(prev => ({ ...prev, [file.name]: Math.round(progress) }));
        }, 
        (error) => {
          console.error("Upload error:", error);
          reject(error);
        }, 
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          
          const docData = {
            name: file.name.split('.').slice(0, -1).join('.') || file.name,
            fileName: file.name,
            fileType: file.type,
            category,
            fileSize: file.size,
            storagePath,
            downloadUrl,
            uploadedBy: auth.currentUser?.email || 'admin',
            createdAt: serverTimestamp(),
            patientId: selectedPatient.id
          };

          try {
            await addDoc(collection(db, 'patients', selectedPatient.id, 'documents'), docData);
            if (selectedUser) {
              await addDoc(collection(db, 'users', selectedUser.id, 'documents'), docData);
            }
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 3000);
            resolve();
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  };

  const handleMultiUpload = async (files: File[], category: DocumentRecord['category']) => {
    setIsUploading(true);
    try {
      await Promise.all(files.map(f => uploadFile(f, category)));
      setUploadProgress({});
    } catch (err) {
      console.error(err);
      alert("Some uploads failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = async (docObj: DocumentRecord) => {
    if (!confirm(`Are you sure you want to delete "${docObj.name}"?`)) return;
    
    try {
      const storageRef = ref(storage, docObj.storagePath);
      await deleteObject(storageRef);

      if (selectedPatient) {
        await deleteDoc(doc(db, 'patients', selectedPatient.id, 'documents', docObj.id));
      }

      if (selectedUser) {
        const userDocsSnap = await getDocs(query(collection(db, 'users', selectedUser.id, 'documents'), where('storagePath', '==', docObj.storagePath)));
        userDocsSnap.forEach(async (d) => {
          await deleteDoc(doc(db, 'users', selectedUser.id, 'documents', d.id));
        });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete file.");
    }
  };

  const handleRenameDoc = async (docId: string, newName: string) => {
    if (!newName || !selectedPatient) return;
    try {
      await updateDoc(doc(db, 'patients', selectedPatient.id, 'documents', docId), { name: newName });
      if (selectedUser) {
        const userDocsSnap = await getDocs(query(collection(db, 'users', selectedUser.id, 'documents'), where('storagePath', '==', documents.find(d => d.id === docId)?.storagePath)));
        userDocsSnap.forEach(async (d) => {
          await updateDoc(doc(db, 'users', selectedUser.id, 'documents', d.id), { name: newName });
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#193D6D] text-white overflow-hidden relative">
      {/* Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-all duration-300 animate-fade-in"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#142A4D] border-r border-white/5 p-8 flex flex-col gap-10 transition-transform duration-300 lg:static lg:translate-x-0
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#4169E1] rounded-xl flex items-center justify-center font-black">L</div>
            <span className="text-xl font-black tracking-tighter uppercase">Linea Admin</span>
          </div>
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-grow space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'users', label: 'Clients', icon: Users },
            { id: 'patients', label: 'Patients', icon: Database },
            { id: 'cases', label: 'Aligner Files', icon: Files },
            { id: 'scans', label: 'Clinical Scans', icon: FileImage },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === item.id ? 'bg-[#4169E1] text-white shadow-xl' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
          
          {onSwitchToPatient && (
            <button
              onClick={() => {
                onSwitchToPatient();
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-4 px-5 py-4 mt-6 rounded-2xl text-[#87CEEB] hover:bg-white/5 transition-all font-black text-[10px] uppercase tracking-widest border border-white/5"
            >
              <ShieldAlert className="w-5 h-5" />
              Switch to Patient Portal
            </button>
          )}
        </nav>

        <button 
          onClick={onLogout}
          className="flex items-center gap-4 px-5 py-4 rounded-2xl text-red-400 font-bold text-sm hover:bg-red-500/10 transition-all border border-red-500/0 hover:border-red-500/20"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 sm:p-8 lg:p-12 overflow-y-auto min-w-0 w-full">
        {/* Mobile Top Bar */}
        <div className="lg:hidden flex items-center justify-between mb-8 bg-white/5 border border-white/10 p-4 rounded-3xl">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-black tracking-widest uppercase">Linea Admin</span>
          </div>
          {onSwitchToPatient && (
            <button
              onClick={onSwitchToPatient}
              className="px-4 py-2 bg-[#4169E1]/10 text-[#C084FC] border border-[#4169E1]/20 rounded-2xl font-black text-[9px] uppercase tracking-widest"
            >
              Patient View
            </button>
          )}
        </div>
        <header className="mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight capitalize">
              {activeTab === 'cases' ? 'Clear Aligners Files' : activeTab}
            </h1>
            <p className="text-white/50 font-medium italic">
              {activeTab === 'cases' ? 'Secure file & link management for aligner treatments' : 'Control center for Linea Aligners'}
            </p>
          </div>
          <div className="flex gap-4">
            {activeTab === 'cases' && (
              <button 
                onClick={() => setIsCaseModalOpen(true)}
                className="bg-[#4169E1] hover:bg-[#5A8DFF] text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-900/40 flex items-center gap-3"
              >
                <Plus className="w-5 h-5" />
                New Case
              </button>
            )}
            {activeTab !== 'cases' && (
              <button 
                onClick={() => activeTab === 'patients' ? setIsPatientModalOpen(true) : setIsUserModalOpen(true)}
                className="bg-[#4169E1] hover:bg-[#5A8DFF] text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-900/40 flex items-center gap-3"
              >
                <Plus className="w-5 h-5" />
                {activeTab === 'patients' ? 'Add Patient' : 'Add User'}
              </button>
            )}
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-12">
            {/* Helpful Quicktip Banner */}
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-[32px] p-8 flex items-start gap-4 shadow-lg">
              <span className="text-2xl mt-0.5">💡</span>
              <div>
                <h4 className="font-semibold text-base text-amber-300 uppercase tracking-wider mb-2">Linea Aligner & Patient Journey Controls</h4>
                <p className="text-xs text-white/80 leading-relaxed font-semibold">
                  To easily configure a patient's **total number of aligners**, change their **current active aligner**, update their clinical appointment date, set telehealth progress links, or upload 3D scans/STL models, simply click the <span className="text-amber-400 font-extrabold uppercase bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">Journey / Aligners</span> button on the Clients or Patients list (or click on any user registration card below).
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: 'Total Clients', val: stats.totalUsers, icon: Users, color: '#4169E1' },
                { label: 'Total Patients', val: stats.totalPatients, icon: Database, color: '#87CEEB' },
                { label: 'Active Treatments', val: users.filter(u => u.status === 'active').length, icon: CheckCircle, color: '#10B981' },
                { label: 'Recent Growth', val: '+12%', icon: LayoutDashboard, color: '#F59E0B' },
              ].map((stat, i) => (
                <div key={i} className="bg-[#142A4D] p-8 rounded-[32px] border border-white/5 space-y-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                    <stat.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white/40 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-4xl font-black mt-2 tracking-tighter">{stat.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-[#142A4D] rounded-[48px] p-10 border border-white/5">
              <h3 className="text-xl font-black mb-8 px-2">Recent User Registrations</h3>
              <div className="space-y-4">
                {users.slice(0, 5).map(user => (
                  <div key={user.id} onClick={() => handleOpenClientControl(user)} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-all cursor-pointer group">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-[#4169E1] flex items-center justify-center font-black">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-lg">{user.name}</p>
                        <p className="text-sm text-white/50">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${user.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {user.status}
                      </span>
                      <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-[#142A4D] rounded-[48px] overflow-hidden border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
              <thead className="bg-white/5">
                <tr>
                  <th className="p-8 text-[10px] font-black text-white/40 uppercase tracking-widest">Client Name</th>
                  <th className="p-8 text-[10px] font-black text-white/40 uppercase tracking-widest">Email Address</th>
                  <th className="p-8 text-[10px] font-black text-white/40 uppercase tracking-widest">Aligners Journey</th>
                  <th className="p-8 text-[10px] font-black text-white/40 uppercase tracking-widest">Status</th>
                  <th className="p-8 text-[10px] font-black text-white/40 uppercase tracking-widest">Created</th>
                  <th className="p-8 text-[10px] font-black text-white/40 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-8 font-black text-lg">{user.name}</td>
                    <td className="p-8 text-white/60 font-medium">{user.email}</td>
                    <td className="p-8">
                      {user.role === 'patient' ? (
                        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl w-fit border border-white/5 font-sans">
                          <input 
                            type="number"
                            min="1"
                            value={user.currentAligner || 1}
                            onChange={async (e) => {
                              const newStage = Number(e.target.value) || 1;
                              const userRef = doc(db, 'users', user.id);
                              const tenDaysFromNow = new Date();
                              tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);
                              
                              await updateDoc(userRef, { 
                                currentAligner: newStage,
                                nextAlignerChange: tenDaysFromNow
                              });
                              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, currentAligner: newStage, nextAlignerChange: tenDaysFromNow } : u));
                            }}
                            className="bg-[#193D6D] border border-white/10 rounded-xl w-14 p-2 text-center text-xs font-black text-amber-400 focus:border-amber-400 hover:bg-white/[0.08] transition-all outline-none font-mono"
                            title="Edit Active Stage"
                          />
                          <span className="text-[10px] font-black text-white/40 uppercase">of</span>
                          <input 
                            type="number"
                            min="1"
                            value={user.totalAligners || 20}
                            onChange={async (e) => {
                              const newTotal = Number(e.target.value) || 20;
                              const userRef = doc(db, 'users', user.id);
                              await updateDoc(userRef, { totalAligners: newTotal });
                              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, totalAligners: newTotal } : u));
                            }}
                            className="bg-[#193D6D] border border-white/10 rounded-xl w-14 p-2 text-center text-xs font-black text-white/70 focus:border-amber-400 hover:bg-white/[0.08] transition-all outline-none font-mono"
                            title="Edit Total Aligners"
                          />
                        </div>
                      ) : (
                        <span className="text-white/20 italic text-xs uppercase tracking-wider font-bold">N/A ({user.role})</span>
                      )}
                    </td>
                    <td className="p-8">
                       <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${user.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-8 text-white/40 text-sm">{user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'Pending'}</td>
                    <td className="p-8">
                      <div className="flex gap-4 items-center">
                        <button 
                          onClick={() => {
                            const patient = patients.find(p => p.userId === user.id);
                            if (patient) {
                               handleOpenDocManager(patient);
                            } else {
                               alert("This client does not have a linked patient record yet.");
                            }
                          }}
                          title="Upload Files"
                          className="flex items-center gap-3 px-6 py-3 bg-[#4169E1] text-white rounded-2xl hover:bg-[#5A8DFF] transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/40 border-2 border-white/20"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload File</span>
                        </button>
                        <button 
                          onClick={() => handleOpenClientControl(user)}
                          title="Manage Treatment journey, aligners count and telehealth links"
                          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-400 to-[#FF8C00] text-slate-950 rounded-2xl hover:brightness-110 hover:shadow-lg transition-all font-black text-[11px] uppercase tracking-wider border-2 border-amber-300"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Journey / Aligners</span>
                        </button>
                        <button onClick={() => handleDeleteUser(user.id)} className="p-4 bg-white/5 rounded-2xl hover:bg-red-500 transition-all text-red-400 hover:text-white border-2 border-white/10"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="bg-[#142A4D] rounded-[48px] overflow-hidden border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
              <thead className="bg-white/5">
                <tr>
                  <th className="p-8 text-[10px] font-black text-white/40 uppercase tracking-widest">Patient Name</th>
                  <th className="p-8 text-[10px] font-black text-white/40 uppercase tracking-widest">D.O.B</th>
                  <th className="p-8 text-[10px] font-black text-white/40 uppercase tracking-widest">Condition</th>
                  <th className="p-8 text-[10px] font-black text-white/40 uppercase tracking-widest">Related Client</th>
                  <th className="p-8 text-[10px] font-black text-white/40 uppercase tracking-widest">Aligners Journey</th>
                  <th className="p-8 text-[10px] font-black text-white/40 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {patients.map(patient => (
                  <tr key={patient.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-8 font-black text-lg">{patient.name}</td>
                    <td className="p-8 text-white/60 font-medium">{patient.dob}</td>
                    <td className="p-8 text-white/60 max-w-xs truncate">{patient.condition}</td>
                    <td className="p-8 text-[#87CEEB] font-bold">
                      {users.find(u => u.id === patient.userId)?.name || 'Unknown'}
                    </td>
                    <td className="p-8">
                      {(() => {
                        const associatedUser = users.find(u => u.id === patient.userId);
                        if (!associatedUser) return <span className="text-white/20 italic text-xs uppercase font-bold">No client link</span>;
                        return (
                          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl w-fit border border-white/5 font-sans">
                            <input 
                              type="number"
                              min="1"
                              value={associatedUser.currentAligner || 1}
                              onChange={async (e) => {
                                const newStage = Number(e.target.value) || 1;
                                const userRef = doc(db, 'users', associatedUser.id);
                                const tenDaysFromNow = new Date();
                                tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);
                                
                                await updateDoc(userRef, { 
                                  currentAligner: newStage,
                                  nextAlignerChange: tenDaysFromNow
                                });
                                setUsers(prev => prev.map(u => u.id === associatedUser.id ? { ...u, currentAligner: newStage, nextAlignerChange: tenDaysFromNow } : u));
                              }}
                              className="bg-[#193D6D] border border-white/10 rounded-xl w-14 p-2 text-center text-xs font-black text-amber-400 focus:border-amber-400 hover:bg-white/[0.08] transition-all outline-none font-mono"
                              title="Edit Active Stage"
                            />
                            <span className="text-[10px] font-black text-white/40 uppercase">of</span>
                            <input 
                              type="number"
                              min="1"
                              value={associatedUser.totalAligners || 20}
                              onChange={async (e) => {
                                const newTotal = Number(e.target.value) || 20;
                                const userRef = doc(db, 'users', associatedUser.id);
                                await updateDoc(userRef, { totalAligners: newTotal });
                                setUsers(prev => prev.map(u => u.id === associatedUser.id ? { ...u, totalAligners: newTotal } : u));
                              }}
                              className="bg-[#193D6D] border border-white/10 rounded-xl w-14 p-2 text-center text-xs font-black text-white/70 focus:border-amber-400 hover:bg-white/[0.08] transition-all outline-none font-mono"
                              title="Edit Total Aligners"
                            />
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-8">
                      <div className="flex gap-4 items-center">
                        <button 
                          onClick={() => handleOpenDocManager(patient)}
                          title="Upload Files"
                          className="flex items-center gap-3 px-6 py-3 bg-[#4169E1] text-white rounded-2xl hover:bg-[#5A8DFF] transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/40 border-2 border-white/20"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload File</span>
                        </button>
                        {(() => {
                          const associatedUser = users.find(u => u.id === patient.userId);
                          return associatedUser ? (
                            <button 
                              onClick={() => handleOpenClientControl(associatedUser)}
                              title="Manage Treatment journey, aligners count and telehealth links"
                              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-400 to-[#FF8C00] text-slate-950 rounded-2xl hover:brightness-110 hover:shadow-lg transition-all font-black text-[11px] uppercase tracking-wider border-2 border-amber-300"
                            >
                              <Edit2 className="w-4 h-4" />
                              <span>Journey / Aligners</span>
                            </button>
                          ) : null;
                        })()}
                        <button onClick={() => handleDeletePatient(patient.id)} className="p-4 bg-white/5 rounded-2xl hover:bg-red-500 transition-all text-red-400 hover:text-white border-2 border-white/10"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
        {activeTab === 'cases' && (
          <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-250px)] gap-8 animate-fade-in">
            {/* Left Sidebar: Case List */}
            <div className="w-full lg:w-80 shrink-0 bg-[#142A4D]/50 backdrop-blur-md rounded-[32px] border border-white/5 flex flex-col h-[40vh] lg:h-auto overflow-hidden shadow-2xl">
               <div className="p-6 border-b border-white/5 bg-white/5">
                  <div className="relative mb-4">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                     <input 
                        type="text" 
                        placeholder="Search cases..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-xs font-bold outline-none focus:border-[#4169E1] transition-all"
                     />
                  </div>
               </div>
               
               <div className="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar">
                  {alignerCases
                    .filter(c => c.caseName.toLowerCase().includes(searchQuery.toLowerCase()) || c.patientName.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(caseItem => (
                      <button
                        key={caseItem.id}
                        onClick={() => setSelectedCase(caseItem)}
                        className={`w-full text-left p-5 rounded-3xl transition-all border-2 relative overflow-hidden group ${selectedCase?.id === caseItem.id ? 'bg-[#4169E1] border-white/20 shadow-xl' : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/5'}`}
                      >
                         <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Database className="w-12 h-12" />
                         </div>
                         <div className="relative z-10 flex flex-col gap-1">
                            <div className="flex justify-between items-start">
                               <h4 className="font-black text-sm truncate pr-2 uppercase tracking-tight">{caseItem.caseName}</h4>
                               <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">{caseItem.createdAt?.toDate ? caseItem.createdAt.toDate().toLocaleDateString() : 'New'}</span>
                            </div>
                            <p className="text-[11px] font-bold text-white/50 mb-1">{caseItem.patientName}</p>
                            {caseItem.clinicName && (
                              <p className="text-[9px] font-black text-amber-300/70 uppercase tracking-widest mb-2">
                                {caseItem.clinicName} • €{caseItem.price || 0} • {caseItem.paid ? 'PAID' : 'UNPAID'}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest mt-2 border-t border-white/10 pt-3">
                               <span className="flex items-center gap-1.5 text-[#87CEEB]"><Files className="w-3 h-3" /> {caseItem.fileCount || 0} Assets</span>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleDeleteCase(caseItem.id); }}
                                 className="p-1.5 hover:bg-red-500 rounded-lg transition-colors text-white/20 hover:text-white"
                               >
                                 <Trash2 className="w-3 h-3" />
                               </button>
                            </div>
                         </div>
                      </button>
                    ))}
               </div>
            </div>

            {/* Right Main Area: Case Details & Files */}
            <div className="flex-grow flex flex-col gap-8 overflow-y-auto lg:overflow-hidden">
               {selectedCase ? (
                  <>
                     {/* Case Info Header */}
                     <div className="bg-[#142A4D]/50 backdrop-blur-md rounded-[32px] p-8 border border-white/5 flex items-center justify-between shadow-xl">
                        <div className="flex items-center gap-6">
                           <div className="w-20 h-20 bg-gradient-to-br from-[#4169E1] to-[#87CEEB] rounded-[24px] flex items-center justify-center text-white shadow-2xl rotate-2">
                              <LayoutDashboard className="w-10 h-10" />
                           </div>
                           <div>
                              <div className="flex items-center gap-3 mb-1">
                                 <h2 className="text-3xl font-black tracking-tighter uppercase">{selectedCase.caseName}</h2>
                              </div>
                              <p className="text-white/40 font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-3">
                                Patient: <span className="text-white">{selectedCase.patientName}</span>
                                <span className="w-1.5 h-1.5 bg-[#87CEEB] rounded-full"></span>
                                Case Protocol: <span className="text-[#87CEEB]">{selectedCase.id.slice(0, 8).toUpperCase()}</span>
                              </p>
                           </div>
                        </div>
                        <div className="flex gap-8 items-center bg-white/5 px-8 py-4 rounded-3xl border border-white/5">
                           <div className="text-center">
                              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Total Assets</p>
                              <p className="text-2xl font-black text-[#87CEEB] leading-none">{selectedCase.fileCount || 0}</p>
                           </div>
                           {(selectedCase.price || 0) > 0 && (
                             <>
                               <div className="w-px h-10 bg-white/10"></div>
                               <div className="text-center">
                                  <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Billing • €{selectedCase.price}</p>
                                  <button
                                    onClick={() => handleTogglePaid(selectedCase)}
                                    className={`text-xs font-black px-4 py-1.5 rounded-full transition-all ${selectedCase.paid ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'}`}
                                    title="Click to toggle paid / unpaid"
                                  >
                                    {selectedCase.paid ? 'PAID ✓' : 'MARK PAID'}
                                  </button>
                               </div>
                             </>
                           )}
                           <div className="w-px h-10 bg-white/10"></div>
                           <div className="text-center">
                              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Status</p>
                              <p className="text-base font-black text-green-400 leading-none">ACTIVE</p>
                           </div>
                        </div>
                     </div>

                     {/* Action Area (Uploads & Links) */}
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <FileDropzone 
                          onUpload={handleUploadAlignerFiles}
                          isUploading={isUploading}
                          progress={uploadProgress}
                          success={uploadSuccess}
                        />

                        {/* URL Add Section */}
                        <div className="bg-[#142A4D]/50 backdrop-blur-md rounded-[40px] p-10 border border-white/5 flex flex-col justify-center gap-8 shadow-xl relative overflow-hidden group">
                           <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#87CEEB]/10 rounded-full blur-3xl group-hover:bg-[#87CEEB]/20 transition-all duration-700"></div>
                           <div className="relative z-10">
                              <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">External Resources</h3>
                              <p className="text-white/40 font-bold uppercase text-[10px] tracking-[0.3em]">Integrate scans, 3D viewers, or reports</p>
                           </div>
                           <form onSubmit={handleAddUrl} className="relative z-10 space-y-4">
                              <div className="relative group/input">
                                 <ExternalLink className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within/input:text-[#87CEEB] transition-colors" />
                                 <input 
                                   required
                                   type="url"
                                   placeholder="Add 3D viewer or scan URL..."
                                   value={urlInput}
                                   onChange={(e) => setUrlInput(e.target.value)}
                                   className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-6 pl-14 pr-6 text-sm font-bold outline-none focus:border-[#87CEEB] hover:bg-white/[0.08] transition-all"
                                 />
                              </div>
                              <button 
                                type="submit" 
                                className="w-full py-5 bg-gradient-to-r from-[#87CEEB] to-[#4169E1] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-sky-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                              >
                                 <Plus className="w-5 h-5" />
                                 Authorize Link
                              </button>
                           </form>
                        </div>
                     </div>

                     {/* Organized Files Area */}
                     <div className="flex-grow bg-[#142A4D]/30 backdrop-blur-sm rounded-[48px] border border-white/5 overflow-hidden flex flex-col shadow-2xl">
                        <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                           <div className="flex items-center gap-4">
                              <div className="p-2 bg-[#4169E1]/20 rounded-lg text-[#4169E1]">
                                 <Files className="w-5 h-5" />
                              </div>
                              <h3 className="text-xs font-black uppercase tracking-[0.3em]">Case Repository</h3>
                           </div>
                           <div className="flex gap-6 items-center">
                              <div className="flex gap-4">
                                 <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#4169E1]"></div>
                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">PDF</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#87CEEB]"></div>
                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Images</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Links</span>
                                 </div>
                              </div>
                              <div className="w-px h-6 bg-white/10"></div>
                              <button className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-widest hover:text-white transition-colors">
                                 <Filter className="w-3.5 h-3.5" />
                                 Newest First
                              </button>
                           </div>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto p-10 space-y-4 custom-scrollbar">
                           {isFilesLoading ? (
                             <div className="h-full flex flex-col items-center justify-center gap-4 text-white/20">
                               <Loader2 className="w-12 h-12 animate-spin text-[#4169E1]" />
                               <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Synchronizing Cloud Assets...</p>
                             </div>
                           ) : caseFiles.length === 0 ? (
                             <div className="h-full flex flex-col items-center justify-center gap-8 opacity-20 py-20">
                               <div className="w-24 h-24 border-2 border-dashed border-white rounded-[32px] flex items-center justify-center">
                                 <Plus className="w-10 h-10" />
                               </div>
                               <div className="text-center">
                                 <p className="text-xl font-black uppercase tracking-[0.3em] mb-2">No Case Assets</p>
                                 <p className="text-xs font-bold max-w-[250px] mx-auto opacity-60">Start by dragging files here or adding diagnostic URLs.</p>
                               </div>
                             </div>
                           ) : (
                             <div className="grid grid-cols-1 gap-4">
                               {caseFiles.map((file, idx) => (
                                 <div 
                                    key={file.id} 
                                    className="p-5 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between group/item hover:border-[#4169E1]/40 transition-all hover:bg-white/[0.08] relative overflow-hidden animate-fade-in"
                                    style={{ animationDelay: `${idx * 0.05}s` }}
                                 >
                                    <div className="flex items-center gap-6 relative z-10">
                                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all group-hover/item:scale-110 ${
                                         file.type === 'pdf' ? 'bg-[#4169E1]/20 text-[#4169E1]' :
                                         file.type === 'image' ? 'bg-[#87CEEB]/20 text-[#87CEEB]' :
                                         'bg-emerald-500/20 text-emerald-400'
                                       }`}>
                                          {file.type === 'pdf' ? <FileText className="w-7 h-7" /> :
                                           file.type === 'image' ? <FileImage className="w-7 h-7" /> :
                                           <ExternalLink className="w-7 h-7" />}
                                       </div>
                                       <div>
                                          <div className="flex items-center gap-3 mb-1">
                                             <h4 className="font-black text-lg tracking-tight group-hover/item:text-[#87CEEB] transition-colors">{file.name}</h4>
                                             {file.type === 'url' && (
                                               <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded-md border border-emerald-500/20">SECURE LINK</span>
                                             )}
                                          </div>
                                          <div className="flex items-center gap-4 text-white/30 text-[10px] font-black uppercase tracking-widest mt-1">
                                             <span className={file.type === 'url' ? 'text-emerald-400' : 'text-white/60'}>{file.type}</span>
                                             <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                                             <span>{file.createdAt?.toDate ? file.createdAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Processing...'}</span>
                                             {file.size && (
                                               <>
                                                 <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                                                 <span className="text-[#87CEEB]">{formatFileSize(file.size)}</span>
                                               </>
                                             )}
                                          </div>
                                       </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 relative z-10">
                                       {file.type !== 'url' ? (
                                         <a 
                                           href={file.url} 
                                           target="_blank" 
                                           rel="noreferrer"
                                           title="Download Asset"
                                           className="p-4 bg-white/5 rounded-2xl text-white/40 hover:bg-[#4169E1] hover:text-white transition-all shadow-xl border border-white/5"
                                         >
                                            <DownloadIcon className="w-5 h-5" />
                                         </a>
                                       ) : (
                                         <a 
                                           href={file.url} 
                                           target="_blank" 
                                           rel="noreferrer"
                                           title="Open External Resource"
                                           className="p-4 bg-white/10 rounded-2xl text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-xl border border-white/10"
                                         >
                                            <ExternalLink className="w-5 h-5" />
                                         </a>
                                       )}
                                       <button 
                                         onClick={() => handleDeleteAlignerFile(file)}
                                         title="Purge Asset"
                                         className="p-4 bg-white/5 rounded-2xl text-white/10 hover:bg-red-500 hover:text-white transition-all border border-white/5"
                                       >
                                          <Trash2 className="w-5 h-5" />
                                       </button>
                                    </div>
                                 </div>
                               ))}
                             </div>
                           )}
                        </div>
                     </div>
                  </>
               ) : (
                  <div className="flex-grow flex flex-col items-center justify-center gap-12 bg-[#142A4D]/20 backdrop-blur-md rounded-[48px] border-4 border-dashed border-white/5 relative overflow-hidden group">
                     {/* Decorative background elements */}
                     <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4169E1]/10 rounded-full blur-[120px] animate-pulse"></div>
                     <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#87CEEB]/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
                     
                     <div className="w-56 h-56 bg-white/5 rounded-[60px] flex items-center justify-center relative z-10 shadow-3xl border border-white/5 rotate-3 group-hover:rotate-0 transition-all duration-1000">
                        <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-[#4169E1] to-[#87CEEB] flex items-center justify-center shadow-2xl">
                           <Files className="w-16 h-16 text-white" />
                        </div>
                        <div className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#4169E1] shadow-xl rotate-12">
                           <Plus className="w-6 h-6" />
                        </div>
                     </div>
                     
                     <div className="text-center relative z-10">
                        <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase">Initialize Aligner Case</h2>
                        <p className="text-white/40 font-black uppercase tracking-[0.4em] text-[10px] max-w-[400px] leading-loose">
                           Select an active case from the repository or initialize a new patient protocol to begin file operations.
                        </p>
                        <div className="mt-12 flex justify-center gap-4">
                           <button onClick={() => setIsCaseModalOpen(true)} className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase text-xs tracking-widest border border-white/10 transition-all">New Protocol</button>
                           <div className="w-px h-12 bg-white/10"></div>
                           <p className="flex items-center gap-2 text-[10px] font-black text-[#87CEEB] uppercase tracking-widest">
                              <Search className="w-4 h-4" /> Use sidebar search
                           </p>
                        </div>
                     </div>
                  </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'scans' && (
          <div className="space-y-8">
            <div className="bg-[#142A4D] rounded-[48px] overflow-hidden border border-white/5 shadow-2xl">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h3 className="text-xl font-black uppercase tracking-tight">Global Scan Repository</h3>
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{scans.length} Total Clinical Records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                <thead className="bg-white/5">
                  <tr>
                    <th className="p-8 text-[10px] font-black text-white/40 uppercase tracking-widest">Filename</th>
                    <th className="p-8 text-[10px] font-black text-white/40 uppercase tracking-widest">Provider UID</th>
                    <th className="p-8 text-[10px] font-black text-white/40 uppercase tracking-widest">Type</th>
                    <th className="p-8 text-[10px] font-black text-white/40 uppercase tracking-widest">Assignment</th>
                    <th className="p-8 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {scans.map((scan: any) => (
                    <tr key={scan.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#87CEEB]">
                            <FileImage className="w-5 h-5" />
                          </div>
                          <span className="font-bold">{scan.fileName}</span>
                        </div>
                      </td>
                      <td className="p-8 text-white/40 font-mono text-[10px] truncate max-w-[150px]">{scan.uploadedBy}</td>
                      <td className="p-8">
                         <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-white/40 border border-white/5">
                            {scan.fileType}
                         </span>
                      </td>
                      <td className="p-8">
                         {scan.assignedTo?.length > 0 ? (
                            <span className="text-green-400 font-bold text-xs flex items-center gap-2">
                               <CheckCircle className="w-4 h-4" />
                               {scan.assignedTo.length} Patients
                            </span>
                         ) : (
                            <span className="text-white/20 font-bold text-xs uppercase tracking-widest">Floating Record</span>
                         )}
                      </td>
                      <td className="p-8 text-right">
                        <a 
                          href={scan.fileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-[#4169E1] rounded-xl transition-all text-xs font-black uppercase tracking-widest"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {isCaseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="bg-[#142A4D] rounded-[48px] p-12 w-full max-w-lg border border-white/10 shadow-2xl space-y-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#4169E1]/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#4169E1]/20 transition-all"></div>
            
            <div className="relative z-10">
               <h2 className="text-4xl font-black tracking-tighter uppercase mb-2">New Aligner Case</h2>
               <p className="text-white/40 font-bold uppercase text-[10px] tracking-[0.3em]">Initialize a secure clinical repository</p>
            </div>

            <form onSubmit={handleCreateCase} className="relative z-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Case Reference / Protocol</label>
                <div className="relative">
                   <FileType className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                   <input 
                     required 
                     placeholder="e.g., Upper Arch Corrective"
                     value={newCaseData.caseName} 
                     onChange={e => setNewCaseData({...newCaseData, caseName: e.target.value})} 
                     className="w-full bg-white/5 border-2 border-white/5 rounded-3xl p-6 pl-16 text-white outline-none focus:border-[#4169E1] hover:bg-white/[0.08] transition-all font-bold" 
                   />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Patient Full Identity</label>
                <div className="relative">
                   <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                   <input 
                     required 
                     placeholder="e.g., Johnathan Smith"
                     value={newCaseData.patientName} 
                     onChange={e => setNewCaseData({...newCaseData, patientName: e.target.value})} 
                     className="w-full bg-white/5 border-2 border-white/5 rounded-3xl p-6 pl-16 text-white outline-none focus:border-[#4169E1] hover:bg-white/[0.08] transition-all font-bold" 
                   />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Clinic (optional)</label>
                  <select
                    value={newCaseData.clinicId}
                    onChange={e => setNewCaseData({...newCaseData, clinicId: e.target.value})}
                    className="w-full bg-white/5 border-2 border-white/5 rounded-3xl p-6 text-white outline-none focus:border-[#4169E1] hover:bg-white/[0.08] transition-all font-bold cursor-pointer"
                  >
                    <option value="" className="bg-slate-900">— No clinic —</option>
                    {users.filter(u => u.role === 'doctor').map(u => (
                      <option key={u.id} value={u.id} className="bg-slate-900">{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Price (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 350"
                    value={newCaseData.price}
                    onChange={e => setNewCaseData({...newCaseData, price: e.target.value})}
                    className="w-full bg-white/5 border-2 border-white/5 rounded-3xl p-6 text-white outline-none focus:border-[#4169E1] hover:bg-white/[0.08] transition-all font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsCaseModalOpen(false)} className="flex-grow py-6 bg-white/5 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-white/10 hover:text-white transition-all text-white/60">Cancel</button>
                <button type="submit" disabled={loading} className="flex-grow py-6 bg-gradient-to-r from-[#4169E1] to-[#87CEEB] rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-blue-950/40 hover:scale-[1.02] transition-all">Initialize Case</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#142A4D] rounded-[40px] p-10 w-full max-w-6xl border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-6 bg-blue-500 rounded-full" />
                <h2 className="text-2xl font-black tracking-tight italic uppercase text-white">Create New User</h2>
              </div>
              <button 
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="text-white/40 hover:text-white font-bold uppercase text-[10px] tracking-widest transition-colors"
              >
                Close [X]
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="flex flex-col lg:flex-row items-end gap-4">
              <div className="flex-grow space-y-1.5 w-full">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Full Name</label>
                <input required value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 focus:border-[#4169E1] rounded-2xl p-4 text-xs font-bold text-white outline-none transition-all" placeholder="Enter Full Name" />
              </div>
              
              <div className="flex-grow space-y-1.5 w-full">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Email Address</label>
                <input required type="email" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 focus:border-[#4169E1] rounded-2xl p-4 text-xs font-bold text-white outline-none transition-all" placeholder="name@domain.com" />
              </div>
              
              <div className="flex-grow space-y-1.5 w-full">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Password</label>
                <input required type="text" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} placeholder="Set initial password" title="Minimum 6 characters" className="w-full bg-white/5 border border-white/10 focus:border-[#4169E1] rounded-2xl p-4 text-xs font-bold text-white outline-none transition-all" />
              </div>
              
              <div className="w-full lg:w-32 space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Status</label>
                <select value={userFormData.status} onChange={e => setUserFormData({...userFormData, status: e.target.value as any})} className="w-full bg-[#193D6D] border border-white/10 rounded-2xl p-4 text-xs font-bold text-[#4169E1] hover:bg-white/[0.08] transition-all cursor-pointer outline-none font-sans">
                  <option value="active" className="bg-[#142A4D] text-white">Active</option>
                  <option value="inactive" className="bg-[#142A4D] text-white">Inactive</option>
                </select>
              </div>
              
              <div className="w-full lg:w-36 space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Role</label>
                <select value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value as any})} className="w-full bg-[#193D6D] border border-white/10 rounded-2xl p-4 text-xs font-bold text-[#87CEEB] hover:bg-white/[0.08] transition-all cursor-pointer outline-none font-sans">
                  <option value="patient" className="bg-[#142A4D] text-white">Patient</option>
                  <option value="doctor" className="bg-[#142A4D] text-white">Doctor</option>
                </select>
              </div>
              
              <div className="flex gap-3 w-full lg:w-auto shrink-0 mt-4 lg:mt-0">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-5 h-[50px] bg-white/5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all text-white/70">Cancel</button>
                <button type="submit" disabled={loading} className="w-full lg:w-auto px-8 h-[50px] bg-[#4169E1] hover:bg-[#5A8DFF] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-900/40 hover:scale-[1.02] transition-all flex items-center justify-center whitespace-nowrap">
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPatientModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#142A4D] rounded-[40px] p-12 w-full max-w-md border border-white/10 shadow-2xl space-y-8">
            <h2 className="text-3xl font-black tracking-tight">Add Patient Record</h2>
            <form onSubmit={handleCreatePatient} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Patient Name</label>
                <input required value={patientFormData.name} onChange={e => setPatientFormData({...patientFormData, name: e.target.value})} className="w-full bg-white/5 border-2 border-white/5 rounded-2xl p-5 text-white outline-none focus:border-[#4169E1]" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Date of Birth</label>
                <input required type="date" value={patientFormData.dob} onChange={e => setPatientFormData({...patientFormData, dob: e.target.value})} className="w-full bg-white/5 border-2 border-white/5 rounded-2xl p-5 text-white outline-none focus:border-[#4169E1]" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Condition/Notes</label>
                <textarea required value={patientFormData.condition} onChange={e => setPatientFormData({...patientFormData, condition: e.target.value})} className="w-full bg-white/5 border-2 border-white/5 rounded-2xl p-5 text-white outline-none focus:border-[#4169E1] min-h-[100px]" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Assign to Client</label>
                <select required value={patientFormData.userId} onChange={e => setPatientFormData({...patientFormData, userId: e.target.value})} className="w-full bg-white/5 border-2 border-white/5 rounded-2xl p-5 text-white outline-none focus:border-[#4169E1] appearance-none cursor-pointer">
                  <option value="">Select a Client</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsPatientModalOpen(false)} className="flex-grow py-5 bg-white/5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                <button type="submit" disabled={loading} className="flex-grow py-5 bg-[#4169E1] rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-900/40 hover:bg-[#5A8DFF] transition-all">Add Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDocumentModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#142A4D] rounded-[32px] md:rounded-[56px] w-full max-w-6xl h-[92vh] md:h-[85vh] border-2 border-white/10 shadow-2xl flex flex-col relative overflow-hidden">
            {/* Header */}
            <header className="p-6 md:p-10 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 rounded-[24px] bg-[#4169E1] flex items-center justify-center text-white shadow-xl shadow-blue-900/40">
                    <UserIcon className="w-8 h-8" />
                 </div>
                 <div>
                    <h2 className="text-3xl font-black tracking-tight">{selectedPatient.name}</h2>
                    <div className="flex items-center gap-4 text-white/50 text-sm font-bold flex-wrap">
                       <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {selectedPatient.dob}</span>
                       <span className="w-1 h-1 rounded-full bg-white/20 hidden sm:inline"></span>
                       <span className="flex items-center gap-2 max-w-[200px] truncate"><Info className="w-4 h-4" /> {selectedPatient.condition}</span>
                    </div>
                 </div>
              </div>
              <button 
                onClick={() => setIsDocumentModalOpen(false)}
                className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/10 self-end sm:self-auto"
              >
                <X className="w-6 h-6 border-white/10" />
              </button>
            </header>
 
            <div className="flex flex-col lg:flex-row flex-grow overflow-y-auto lg:overflow-hidden">
               {/* Controls Sidebar */}
               <aside className="w-full lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-white/5 p-6 md:p-8 flex flex-col gap-6 md:gap-10 bg-white/[0.02]">
                  <section className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#4169E1]">File Category</h4>
                    <select 
                      value={categoryFilter} 
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full bg-[#193D6D] border-2 border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#4169E1] transition-all"
                    >
                       <option value="All">All Categories</option>
                       <option value="Medical Records">Medical Records</option>
                       <option value="Test Results">Test Results</option>
                       <option value="Prescriptions">Prescriptions</option>
                       <option value="Notes">Notes</option>
                       <option value="Other">Other</option>
                    </select>
                  </section>

                  <section className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#4169E1]">Quick Stats</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-[#193D6D] p-5 rounded-3xl border border-white/5">
                          <p className="text-2xl font-black">{documents.length}</p>
                          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Total Files</p>
                       </div>
                       <div className="bg-[#193D6D] p-5 rounded-3xl border border-white/5">
                          <p className="text-2xl font-black text-[#87CEEB]">{documents.filter(d => d.category === 'Medical Records').length}</p>
                          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Medical</p>
                       </div>
                    </div>
                  </section>

                  <section className="mt-auto">
                    <div className="p-6 rounded-[32px] bg-[#4169E1]/10 border border-[#4169E1]/20">
                       <div className="flex items-center gap-3 mb-3 text-[#87CEEB]">
                          <Info className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Storage Policy</span>
                       </div>
                       <p className="text-xs font-bold text-white/60 leading-relaxed">
                          Files are stored securely. Only administrators have deletion privileges.
                       </p>
                    </div>
                  </section>
               </aside>

               {/* File List & Upload Area */}
               <main className="flex-grow p-6 md:p-10 overflow-y-auto bg-gradient-to-br from-transparent to-black/20 relative">
                  {/* Upload Dropzone */}
                  <div className="mb-12">
                     <FileDropzone onUpload={(files) => handleMultiUpload(files, categoryFilter === 'All' ? 'Other' : categoryFilter as any)} isUploading={isUploading} progress={uploadProgress} success={uploadSuccess} />
                  </div>

                  {/* List Header */}
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                        <Files className="w-5 h-5 text-[#87CEEB]" />
                        Patient Files
                     </h3>
                     <div className="flex items-center gap-2">
                        <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Latest First</button>
                        <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">By Size</button>
                     </div>
                  </div>

                  {/* Files Grid/List */}
                  <div className="grid grid-cols-1 gap-4">
                     {documents.filter(d => categoryFilter === 'All' || d.category === categoryFilter).length === 0 ? (
                        <div className="py-20 text-center bg-white/[0.02] border-2 border-dashed border-white/5 rounded-[40px]">
                            <Files className="w-16 h-16 text-white/10 mx-auto mb-6" />
                            <p className="text-lg font-bold text-white/40">No files found for this category</p>
                        </div>
                     ) : (
                        documents.filter(d => categoryFilter === 'All' || d.category === categoryFilter).map(doc => (
                          <div key={doc.id} className="group bg-[#193D6D]/40 hover:bg-[#193D6D] p-6 rounded-[32px] border border-white/5 hover:border-[#4169E1]/30 transition-all flex items-center justify-between shadow-lg">
                             <div className="flex items-center gap-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                                   doc.fileType.includes('pdf') ? 'bg-red-500/20 text-red-400' :
                                   doc.fileType.includes('image') ? 'bg-green-500/20 text-green-400' :
                                   'bg-[#4169E1]/20 text-[#4169E1]'
                                }`}>
                                   {doc.fileType.includes('pdf') ? <FileCode className="w-6 h-6" /> : 
                                    doc.fileType.includes('image') ? <FileImage className="w-6 h-6" /> : 
                                    <FileType className="w-6 h-6" />}
                                </div>
                                <div>
                                   <div className="flex items-center gap-3 mb-1">
                                      <h4 className="font-black text-lg tracking-tight group-hover:text-[#87CEEB] transition-colors">{doc.name}</h4>
                                      <span className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] text-white/30">{doc.category}</span>
                                   </div>
                                   <div className="flex items-center gap-4 text-white/30 text-[11px] font-bold">
                                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {doc.createdAt?.toDate ? doc.createdAt.toDate().toLocaleDateString() : 'N/A'}</span>
                                      <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                      <span>{formatFileSize(doc.fileSize)}</span>
                                      <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                      <span className="flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5" /> {doc.uploadedBy}</span>
                                   </div>
                                </div>
                             </div>
                             <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => {
                                    const newName = prompt("Rename to:", doc.name);
                                    if (newName) handleRenameDoc(doc.id, newName);
                                  }}
                                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-all"
                                  title="Rename"
                                >
                                   <Edit2 className="w-4 h-4" />
                                </button>
                                <a 
                                  href={doc.downloadUrl} 
                                  download={doc.fileName}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-3 bg-white/5 hover:bg-[#4169E1] rounded-xl text-white transition-all shadow-lg"
                                  title="Download"
                                >
                                   <DownloadIcon className="w-4 h-4" />
                                </a>
                                <button 
                                  onClick={() => handleDeleteDoc(doc)}
                                  className="p-3 bg-white/5 hover:bg-red-500 rounded-xl text-red-400 hover:text-white transition-all"
                                  title="Delete"
                                >
                                   <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                          </div>
                        ))
                     )}
                  </div>
               </main>
            </div>
          </div>
        </div>
      )}

      {isClientControlModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl overflow-y-auto">
          <div className="bg-[#142A4D] rounded-[32px] md:rounded-[56px] w-full max-w-7xl h-[95vh] md:h-[90vh] border-2 border-white/10 shadow-2xl flex flex-col relative overflow-hidden">
            
            {/* Header */}
            <header className="p-6 md:p-10 border-b border-b-white/10 bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[24px] bg-amber-400 text-slate-900 flex items-center justify-center shadow-lg font-black text-2xl italic shrink-0">
                  {controlFormData.name ? controlFormData.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <h2 className="text-3xl font-black tracking-tight">{controlFormData.name}</h2>
                    <span className="px-3 py-1 bg-amber-400/10 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-400/20">
                      JOURNEY CONTROL PANEL
                    </span>
                  </div>
                  <p className="text-white/50 text-sm font-bold uppercase tracking-wide mt-1 break-all">{controlFormData.email} • UID: {selectedUser.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsClientControlModalOpen(false)}
                className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 hover:text-white border border-white/10 text-white/60 transition-all self-end sm:self-auto"
              >
                <X className="w-6 h-6" />
              </button>
            </header>

            {/* Scrollable Layout Form */}
            <form onSubmit={handleSaveClientControl} className="flex-grow flex flex-col lg:flex-row overflow-hidden">
              <div className="flex-grow p-6 md:p-10 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* Column 1: Client Identity & Aligner Phase */}
                <div className="space-y-8 bg-white/[0.02] p-8 border border-white/5 rounded-[40px] shadow-2xl">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <div className="w-2 h-6 bg-amber-400 rounded-full" />
                    <h3 className="text-lg font-black uppercase tracking-tight italic">Phase 1: Aligner Aligners</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Client Name</label>
                      <input 
                        required 
                        value={controlFormData.name} 
                        onChange={e => setControlFormData({...controlFormData, name: e.target.value})} 
                        className="w-full bg-[#193D6D] border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-amber-400 hover:bg-white/[0.08]" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Current Aligner</label>
                        <input 
                          type="number"
                          min="1"
                          required 
                          value={controlFormData.currentAligner === 0 ? '' : controlFormData.currentAligner} 
                          onChange={e => {
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            setControlFormData({...controlFormData, currentAligner: val as any});
                          }} 
                          className="w-full bg-[#193D6D] border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-amber-400 hover:bg-white/[0.08] transition-all" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Total Aligners</label>
                        <input 
                          type="number"
                          min="1"
                          required 
                          value={controlFormData.totalAligners === 0 ? '' : controlFormData.totalAligners} 
                          onChange={e => {
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            setControlFormData({...controlFormData, totalAligners: val as any});
                          }} 
                          className="w-full bg-[#193D6D] border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-amber-400 hover:bg-white/[0.08] transition-all" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Next Aligner Change Date</label>
                      <input 
                        type="date"
                        value={controlFormData.nextAlignerChange} 
                        onChange={e => setControlFormData({...controlFormData, nextAlignerChange: e.target.value})} 
                        className="w-full bg-[#193D6D] border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-amber-400 hover:bg-white/[0.08]" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Account Role</label>
                      <select 
                        value={controlFormData.role} 
                        onChange={e => setControlFormData({...controlFormData, role: e.target.value as any})} 
                        className="w-full bg-[#193D6D] border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-amber-400 cursor-pointer"
                      >
                        <option value="patient" className="bg-slate-900">Patient</option>
                        <option value="doctor" className="bg-slate-900">Doctor</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Membership Status</label>
                      <select 
                        value={controlFormData.status} 
                        onChange={e => setControlFormData({...controlFormData, status: e.target.value as any})} 
                        className="w-full bg-[#193D6D] border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-amber-400 cursor-pointer"
                      >
                        <option value="active" className="bg-slate-900">Active</option>
                        <option value="inactive" className="bg-slate-900">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Column 2: Clinical Visit Details */}
                <div className="space-y-8 bg-white/[0.02] p-8 border border-white/5 rounded-[40px] shadow-2xl">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <div className="w-2 h-6 bg-royal rounded-full" />
                    <h3 className="text-lg font-black uppercase tracking-tight italic">Phase 2: Clinical Visit</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Assigned Doctor</label>
                      <input 
                        value={controlFormData.doctorName} 
                        onChange={e => setControlFormData({...controlFormData, doctorName: e.target.value})} 
                        className="w-full bg-[#193D6D] border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-royal hover:bg-white/[0.08]" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Appointment Action / Type</label>
                      <input 
                        value={controlFormData.appointmentType} 
                        onChange={e => setControlFormData({...controlFormData, appointmentType: e.target.value})} 
                        className="w-full bg-[#193D6D] border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-royal hover:bg-white/[0.08]" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Next Appointment Date & Time</label>
                      <input 
                        type="datetime-local"
                        value={controlFormData.nextAppointmentDate} 
                        onChange={e => setControlFormData({...controlFormData, nextAppointmentDate: e.target.value})} 
                        className="w-full bg-[#193D6D] border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-royal hover:bg-white/[0.08]" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Medical Centre Hub Location</label>
                      <input 
                        value={controlFormData.clinicAddress} 
                        onChange={e => setControlFormData({...controlFormData, clinicAddress: e.target.value})} 
                        className="w-full bg-[#193D6D] border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-royal hover:bg-white/[0.08]" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Active External Telehealth / Custom Link</label>
                      <input 
                        placeholder="https://clinicalvisit.example.com/checkup"
                        value={controlFormData.nextVisitUrl} 
                        onChange={e => setControlFormData({...controlFormData, nextVisitUrl: e.target.value})} 
                        className="w-full bg-[#193D6D] border border-white/10 rounded-2xl p-5 text-xs font-bold text-white outline-none focus:border-royal hover:bg-white/[0.08]" 
                      />
                    </div>
                  </div>
                </div>

                {/* Column 3: 3D Model STL Viewer & Direct Link Uploaders */}
                <div className="space-y-8 bg-white/[0.02] p-8 border border-white/5 rounded-[40px] shadow-2xl flex flex-col h-full">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4 shrink-0">
                    <div className="w-2 h-6 bg-[#87CEEB] rounded-full" />
                    <h3 className="text-lg font-black uppercase tracking-tight italic">Phase 3: Digital Scan & STL Uploader</h3>
                  </div>

                  <div className="space-y-6 flex-grow overflow-y-auto pr-2">
                    {/* Drag and Drop/Files uploader block */}
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-[#87CEEB] rounded-3xl p-6 bg-white/5 cursor-pointer hover:bg-white/[0.08] transition-all group shrink-0">
                       <Upload className="w-8 h-8 text-white/30 group-hover:text-[#87CEEB] group-hover:scale-110 transition-all mb-2" />
                       <span className="text-xs font-black uppercase text-white/60 tracking-wider">Upload New Scan / STL</span>
                       <span className="text-[9px] text-white/30 tracking-widest uppercase mt-1">Supports STL 3D models & general records</span>
                       <input 
                         type="file" 
                         onChange={(e) => {
                           if (e.target.files) {
                             handleUploadSTLForClient(Array.from(e.target.files));
                           }
                         }} 
                         className="hidden" 
                       />
                    </label>

                    {isControlUploading && (
                       <div className="space-y-2 shrink-0 bg-white/5 p-4 rounded-2xl border border-white/5">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-[#87CEEB]">
                             <span>Deploying patient assets...</span>
                             <span>{Math.round(controlFileUploadProgress)}%</span>
                          </div>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                             <div className="bg-[#87CEEB] h-full transition-all duration-300" style={{ width: `${controlFileUploadProgress}%` }} />
                          </div>
                       </div>
                    )}

                    {/* External Link Uploader Form */}
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4 shrink-0">
                       <h4 className="text-[10px] font-black uppercase tracking-wider text-[#87CEEB]">Attach Custom Portal Link</h4>
                       <div className="space-y-3">
                          <input 
                             placeholder="Link Label (e.g., Clincheck Animation)" 
                             value={customLinkName} 
                             onChange={e => setCustomLinkName(e.target.value)} 
                             className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs font-bold outline-none text-white focus:border-royal"
                          />
                          <input 
                             placeholder="Destination URL (https://...)" 
                             value={customLinkUrl} 
                             onChange={e => setCustomLinkUrl(e.target.value)} 
                             className="w-full bg-white/5 border border-[#193D6D] rounded-2xl p-4 text-xs font-bold outline-none text-white focus:border-royal"
                          />
                          <button 
                            type="button"
                            onClick={handleAddCustomLinkForClient}
                            className="w-full py-4 bg-royal text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-royal/20"
                          >
                             Publish Portal Asset
                          </button>
                       </div>
                    </div>

                    {/* Active Scan Files / Links list */}
                    <div className="space-y-3 shrink-0">
                       <h4 className="text-[10px] font-black uppercase tracking-wider text-white/50">Stored Digital Assets</h4>
                       {clientScans.length === 0 ? (
                          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest p-6 bg-white/5 rounded-2xl text-center border-2 border-dashed border-white/5">
                            No digital scans or links allocated to this client.
                          </p>
                       ) : (
                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                             {clientScans.map((scan) => (
                                <div key={scan.id} className="flex justify-between items-center bg-[#193D6D]/40 p-4 border border-white/5 rounded-2xl hover:border-white/10 transition-all">
                                   <div className="truncate max-w-[170px]">
                                      <span className="font-bold text-xs text-white truncate block uppercase">{scan.fileName}</span>
                                      <span className="text-[8px] font-black text-[#87CEEB] uppercase tracking-widest block mt-0.5">{scan.fileSize} • {scan.fileType}</span>
                                   </div>
                                   <div className="flex gap-1.5 shrink-0">
                                      <button 
                                         type="button"
                                         onClick={() => window.open(scan.fileUrl, '_blank')} 
                                         className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-all"
                                         title="Review File"
                                      >
                                         <Eye className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                         type="button"
                                         onClick={() => handleDeleteClientScan(scan.id)} 
                                         className="p-2.5 bg-white/5 hover:bg-[#142A4D] rounded-xl text-red-400 hover:text-red-300 transition-all"
                                         title="Remove"
                                      >
                                         <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                   </div>
                                </div>
                             ))}
                          </div>
                       )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Sticky Footer */}
              <footer className="p-8 border-t border-t-white/10 bg-white/5 flex gap-4 shrink-0 justify-end font-sans">
                <button 
                  type="button" 
                  onClick={() => setIsClientControlModalOpen(false)} 
                  className="px-8 py-5 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-white/70 transition-all"
                >
                  Discard Changes
                </button>
                <button 
                  type="submit" 
                  className="px-10 py-5 bg-gradient-to-r from-amber-400 to-[#FF8C00] text-slate-900 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-[1.02] active:scale-95"
                >
                  Synchronize Patient Journey
                </button>
              </footer>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};
