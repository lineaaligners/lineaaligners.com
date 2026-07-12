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

export const ScreenLoader: React.FC<{ message?: string }> = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050B18] p-12">
      <div className="flex flex-col items-center gap-8">
        {/* Pulsing brand logo */}
        <div className="relative flex items-center justify-center">
          <motion.div
            className="absolute w-40 h-40 rounded-full bg-[#4e4f9e]/20 blur-2xl"
            animate={{ scale: [1, 1.35, 1], opacity: [0.35, 0.7, 0.35] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.img
            src="/linea-logo.svg"
            alt="Linea Aligners"
            className="w-32 h-auto relative z-10 brightness-0 invert drop-shadow-[0_0_25px_rgba(78,79,158,0.6)]"
            animate={{ scale: [1, 1.08, 1], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Message + animated dots */}
        <div className="flex items-center gap-1.5">
          <p className="text-sm text-white/50 font-medium">{message}</p>
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#87CEEB]"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
