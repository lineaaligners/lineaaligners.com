import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ProgressBarProps {
  progress: number;
  label?: string;
  statusText?: string;
  height?: string;
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  label, 
  statusText, 
  height = "h-2",
  showPercentage = true 
}) => {
  // Color mapping based on progress stages
  const getBarColor = (p: number) => {
    if (p < 25) return 'from-[#193D6D] via-[#4169E1] to-[#193D6D]'; // Navy to Royal
    if (p < 50) return 'from-[#4169E1] via-[#87CEEB] to-[#4169E1]'; // Royal to Sky
    if (p < 75) return 'from-[#87CEEB] via-[#20B2AA] to-[#87CEEB]'; // Sky to Teal
    return 'from-[#20B2AA] via-[#3CB371] to-[#20B2AA]'; // Teal to Green
  };

  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between items-center px-1">
        {label && (
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
            {label}
          </span>
        )}
        <AnimatePresence mode="wait">
          {showPercentage && (
            <motion.span 
              key={progress}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-black text-royal"
            >
              {Math.round(progress)}% {statusText && <span className="ml-1 text-white/40">↗ {statusText}</span>}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      
      <div className={`w-full ${height} bg-white/10 rounded-full overflow-hidden relative`}>
        {/* The Animated Moving Fill */}
        <motion.div 
          className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getBarColor(progress)} animate-moving-bar rounded-full shadow-[0_0_15px_rgba(65,105,225,0.4)]`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        
        {/* Highlight glare for extra depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

export const ScreenLoader: React.FC<{ message?: string }> = ({ message = "Loading experience..." }) => {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + Math.random() * 5 : prev));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050B18] p-12 space-y-6">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black tracking-tighter uppercase italic text-royal">Linea</h2>
          <p className="text-xs text-white/40 font-medium tracking-widest uppercase">{message}</p>
        </div>
        <ProgressBar progress={progress} height="h-3" />
      </div>
    </div>
  );
};
