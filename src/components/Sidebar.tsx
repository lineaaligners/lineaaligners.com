import React from 'react';
import { Box, Bell, Settings, HelpCircle, Activity } from 'lucide-react';

export const MovingSidebar: React.FC = () => {
  return (
    <div className="fixed left-8 top-0 bottom-0 z-40 hidden xl:flex flex-col items-center justify-center pointer-events-none">
      <div className="animate-float flex flex-col gap-6 pointer-events-auto">
        {[
          { icon: Box, label: "Vault" },
          { icon: Activity, label: "Metrics" },
          { icon: Bell, label: "Alerts" },
          { icon: Settings, label: "Config" },
          { icon: HelpCircle, label: "Info" },
        ].map((item, i) => (
          <div key={i} className="group relative">
            <div className="glass-panel p-4 rounded-[20px] transition-all hover:bg-royal/20 border-white/5 hover:border-royal/50 cursor-pointer shadow-xl">
              <item.icon className="w-5 h-5 text-white/40 group-hover:text-royal transition-colors" />
            </div>
            
            {/* Tooltip */}
            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 pointer-events-none">
              <div className="bg-[#050B18] border border-white/10 px-4 py-2 rounded-xl shadow-2xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-royal whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            </div>
            
            {/* Decorative dot */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-1 bg-royal rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}

        {/* Vertical Line */}
        <div className="w-px h-20 bg-gradient-to-b from-royal/50 to-transparent mx-auto mt-4" />
      </div>
    </div>
  );
};
