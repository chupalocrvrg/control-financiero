import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Lock, ShieldAlert, Power, ShieldCheck, Fingerprint } from 'lucide-react';
import { cn } from '../lib/utils';

export default function SecurityGuard({ children }: { children: React.ReactNode }) {
  const { isExpired, sessionVerified, verifyPin, logout, profile } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) return;
    
    setLoading(true);
    setError(false);
    const success = await verifyPin(pin);
    if (!success) {
      setError(true);
      setPin('');
    }
    setLoading(false);
  };

  if (isExpired) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-center items-center p-6 text-center transition-colors duration-500">
        <div className="bg-white dark:bg-neutral-900 p-10 rounded-[3rem] shadow-2xl dark:shadow-none max-w-md w-full border border-neutral-100 dark:border-neutral-800 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <ShieldAlert className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-3xl font-black text-neutral-900 dark:text-neutral-50 mb-4 tracking-tighter uppercase italic">Acceso Restringido</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-10 font-medium px-4">
            Tu suscripción corporativa o periodo de validación ha finalizado. Es necesario regularizar tu estatus para continuar operando.
          </p>
          <div className="space-y-4">
            <a
              href="https://wa.me/593985441487"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full px-8 py-5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 dark:shadow-none hover:scale-[1.02] active:scale-95"
            >
              <MessageCircle className="mr-3 h-6 w-6" />
              Soporte Ventas
            </a>
            <button
              onClick={logout}
              className="flex items-center justify-center w-full px-8 py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
            >
              <Power className="mr-2 h-4 w-4" /> Finalizar Sesión
            </button>
          </div>
        </div>
        <p className="mt-12 text-[10px] font-black text-neutral-300 dark:text-neutral-700 uppercase tracking-[0.3em]">
          SECURITY LAYER V.1.1.0
        </p>
      </div>
    );
  }

  if (!sessionVerified) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center p-6 text-center animate-in fade-in duration-700">
        <div className="bg-neutral-900 p-12 rounded-[3.5rem] shadow-2xl max-w-md w-full border border-neutral-800 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="w-16 h-16 bg-neutral-800 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-neutral-700 group-hover:scale-110 transition-transform duration-500">
            <Lock className="h-7 w-7 text-indigo-500" />
          </div>
          
          <h2 className="text-3xl font-black text-white mb-3 tracking-tighter uppercase italic italic">Protocolo de Identidad</h2>
          <p className="text-neutral-500 mb-10 text-[10px] font-black uppercase tracking-[0.2em]">
            Ingresa tu PIN de 6 dígitos para autenticar
          </p>
          
          <form onSubmit={handlePinSubmit} className="space-y-10">
            <div className="relative group/input">
              <input
                type="password"
                maxLength={6}
                value={pin}
                autoFocus
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className={cn(
                  "w-full text-center text-4xl tracking-[0.6em] font-black px-4 py-6 bg-neutral-950 border rounded-3xl text-white outline-none transition-all",
                  error ? "border-red-500 shadow-lg shadow-red-500/10 animate-shake" : "border-neutral-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                )}
                placeholder="000000"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2">
                <Fingerprint className={cn("w-6 h-6 transition-colors", error ? "text-red-500" : "text-neutral-700 group-focus-within/input:text-indigo-500")} />
              </div>
              {error && <p className="text-red-500 text-[10px] mt-4 font-black uppercase tracking-widest animate-in slide-in-from-top-1">Autorización Denegada</p>}
            </div>
            
            <button
              type="submit"
              disabled={loading || pin.length !== 6}
              className="w-full flex justify-center py-5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 disabled:opacity-30 disabled:shadow-none transition-all active:scale-95"
            >
              {loading ? 'Validando...' : 'Desbloquear Sistema'}
            </button>
          </form>
          
          <button
            onClick={logout}
            className="mt-12 group/logout flex items-center justify-center gap-2 mx-auto text-[10px] text-neutral-600 hover:text-neutral-400 font-black uppercase tracking-[0.2em] transition-colors"
          >
            <Power className="w-3 h-3 group-hover:text-red-500 transition-colors" /> Cerrar Terminal
          </button>
        </div>
        
        <div className="mt-12 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
            <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest">Encriptación AES-256</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest">En Línea</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
