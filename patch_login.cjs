const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');

const newLoginLogic = `
  const inIframe = window.self !== window.top;

  const handleLogin = async () => {
    setError(null);
    try {
      await login();
    } catch (err: any) {
      if (inIframe && err.message.includes('Navegador no admitido')) {
        setError("Su navegador bloquea el acceso en esta vista incrustada. Por favor, abra la aplicación en una pestaña nueva para iniciar sesión.");
      } else {
        setError(err.message);
      }
    }
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };
`;

code = code.replace(
  /  const handleLogin = async \(\) => \{[\s\S]*?    \}\n  \};/,
  newLoginLogic.trim()
);

const newErrorUI = `
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl animate-in fade-in zoom-in duration-300 flex flex-col items-center">
                <p className="text-xs text-red-600 dark:text-red-400 font-medium text-center leading-relaxed mb-3">
                  {error}
                </p>
                {inIframe && error.includes('pestaña nueva') && (
                  <button onClick={handleOpenNewTab} className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-bold rounded-full hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors">
                    <ExternalLink className="w-3 h-3" />
                    Abrir en Nueva Pestaña
                  </button>
                )}
              </div>
            )}
`;

code = code.replace(
  /            \{error && \([\s\S]*?            \)\}/,
  newErrorUI.trim()
);

fs.writeFileSync('src/pages/Login.tsx', code);
console.log('Patched Login.tsx');
