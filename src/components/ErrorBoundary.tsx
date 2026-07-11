import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase mb-4">Error Inesperado</h2>
          <p className="text-neutral-400 text-sm max-w-md mx-auto mb-8">
            Ha ocurrido un problema al cargar la interfaz. Por favor, recargue la página o contacte al soporte si el problema persiste.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all"
          >
            Recargar Página
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
