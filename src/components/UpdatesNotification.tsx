import React, { useEffect, useState } from 'react';
import { changelog, CURRENT_VERSION } from '../lib/changelog';
import { CheckCircle, X, Sparkles } from 'lucide-react';

export default function UpdatesNotification() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const lastSeen = localStorage.getItem('lastSeenVersion');
    if (lastSeen !== CURRENT_VERSION) {
      setShow(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('lastSeenVersion', CURRENT_VERSION);
    setShow(false);
  };

  if (!show) return null;

  const currentRelease = changelog[0];

  return (
    <div className="fixed inset-0 z-[2000] bg-neutral-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 zoom-out-95 duration-300">
        <div className="p-6 sm:p-8 bg-gradient-to-br from-indigo-500 to-indigo-700 flex justify-between items-start relative">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Sparkles className="w-24 h-24 text-white" />
          </div>
          <div className="text-white relative z-10">
            <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              <CheckCircle className="w-6 h-6" /> Plataforma Actualizada
            </h3>
            <p className="text-indigo-100 font-medium text-sm mt-1">
              Versión {currentRelease.version} • {currentRelease.date}
            </p>
          </div>
          <button onClick={handleClose} className="text-indigo-200 hover:text-white transition-colors relative z-10">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 font-medium">
            Se han implementado las siguientes mejoras en esta versión:
          </p>
          <ul className="space-y-4">
            {currentRelease.changes.map((change, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                <span className="leading-relaxed">{change}</span>
              </li>
            ))}
          </ul>
          
          <button 
            onClick={handleClose}
            className="mt-8 w-full py-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest"
          >
            Continuar a la Plataforma
          </button>
        </div>
      </div>
    </div>
  );
}
