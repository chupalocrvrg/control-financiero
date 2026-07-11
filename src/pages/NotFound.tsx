import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="w-20 h-20 text-neutral-400 dark:text-neutral-600 mb-6" />
      <h1 className="text-4xl font-black text-neutral-900 dark:text-white uppercase tracking-tight mb-4">
        Página no encontrada
      </h1>
      <p className="text-neutral-500 dark:text-neutral-400 text-lg mb-8 max-w-md mx-auto">
        La ruta a la que intentas acceder no existe o fue movida.
      </p>
      <button 
        onClick={() => navigate('/')}
        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-indigo-500/25 transition-all"
      >
        Volver al Inicio
      </button>
    </div>
  );
}
