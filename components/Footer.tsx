import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-100 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-purple-700 tracking-tight">LINEA</span>
              <span className="text-2xl font-light text-slate-400">ALIGNERS</span>
            </div>
            <p className="text-slate-500 max-w-sm leading-relaxed">
              Premium invisible orthodontic care based in Peja, Republic of Kosova. Powered by Meident Dental Clinic.
            </p>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Founders</p>
              <p className="text-sm font-bold text-slate-700">Genis Nallbani & Dr. Fatbardha Mustafa</p>
            </div>
            <div className="flex gap-4">
              {['instagram', 'facebook', 'linkedin'].map(social => (
                <a key={social} href="#" className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-purple-600 hover:text-white transition-all">
                  <span className="sr-only">{social}</span>
                  <div className="w-5 h-5 bg-current rounded-sm"></div>
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-xs">Clinic</h5>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li className="font-bold text-purple-700">Meident Dental Clinic</li>
              <li>Peja, Republic of Kosova</li>
              <li>3000</li>
              <li>
                <a href="tel:+38349772307" className="text-purple-600 font-bold hover:underline">
                  +383 49 772 307
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-xs">Hours</h5>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li>Mon - Fri: 09:00 - 18:00</li>
              <li>Saturday: 10:00 - 15:00</li>
              <li>Sunday: Closed</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm text-center md:text-left">
            © {new Date().getFullYear()} Linea Aligners Kosovo. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-purple-600">Privacy Policy</a>
            <a href="#" className="hover:text-purple-600">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};