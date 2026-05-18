import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Download, Eye, Clock, Loader2, Image as ImageIcon, Box } from 'lucide-react';
import { STLViewer } from './STLViewer';

interface Scan {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize: string;
  uploadDate: any;
}

interface ScansListProps {
  patientId: string;
}

export const ScansList: React.FC<ScansListProps> = ({ patientId }) => {
  const [lastScan, setLastScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;

    const q = query(
      collection(db, 'scans'),
      where('patientId', '==', patientId),
      orderBy('uploadDate', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setLastScan({ id: doc.id, ...doc.data() } as Scan);
      } else {
        setLastScan(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching scans:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [patientId]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 text-white/20">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Loading scans...</p>
      </div>
    );
  }

  if (!lastScan) {
    return (
      <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[40px] space-y-4">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-white/10" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">No scans found yet.</p>
      </div>
    );
  }

  const isImage = ['jpg', 'jpeg', 'png'].includes(lastScan.fileType.toLowerCase()) || lastScan.fileType === 'image';
  const isSTL = lastScan.fileType.toLowerCase() === 'stl' || lastScan.fileName.toLowerCase().endsWith('.stl');

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={lastScan.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="group glass-panel rounded-[40px] overflow-hidden border border-white/5 hover:border-royal/30 transition-all shadow-2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Thumbnail section */}
          <div className="relative aspect-video md:aspect-square bg-navy/20 flex items-center justify-center overflow-hidden">
            {isSTL ? (
              <STLViewer url={lastScan.fileUrl} />
            ) : isImage ? (
              <img 
                src={lastScan.fileUrl} 
                alt={lastScan.fileName} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-white/20">
                 <FileText className="w-20 h-20" />
                 <span className="font-black uppercase tracking-widest text-xs italic">PDF DOCUMENT</span>
              </div>
            )}
            <div className="absolute top-6 left-6 p-3 bg-navy/80 backdrop-blur-xl rounded-2xl border border-white/10 text-white shadow-2xl">
              {isSTL ? <Box className="w-5 h-5 text-royal" /> : isImage ? <ImageIcon className="w-5 h-5 text-royal" /> : <FileText className="w-5 h-5 text-emerald-400" />}
            </div>
          </div>

          {/* Details section */}
          <div className="p-10 flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-royal italic">Latest Medical Record</p>
                <h3 className="text-2xl font-black italic tracking-tighter text-white truncate max-w-full uppercase">{lastScan.fileName}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
                <div className="space-y-1">
                  <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">Upload Date</p>
                  <p className="text-sm font-bold text-white/80">{lastScan.uploadDate?.toDate?.() ? lastScan.uploadDate.toDate().toLocaleDateString() : 'Syncing...'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">File Weight</p>
                  <p className="text-sm font-bold text-white/80">{lastScan.fileSize}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-6">
              <button 
                onClick={() => window.open(lastScan.fileUrl, '_blank')}
                className="flex-1 min-w-[140px] bg-royal hover:bg-royal/80 text-white h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-royal/40 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Download className="w-4 h-4" /> DOWNLOAD
              </button>
              <button 
                onClick={() => window.open(lastScan.fileUrl, '_blank')}
                className="flex-1 min-w-[140px] bg-white/5 border border-white/10 hover:bg-white/10 text-white h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Eye className="w-4 h-4 text-royal" /> VIEW FILE
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
