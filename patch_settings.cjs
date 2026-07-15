const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/pages/Settings.tsx', 'utf8');

const themeReplacement = `
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <Moon className="w-4 h-4" /> Tema del Sistema
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light', name: 'Claro', icon: Sun },
                  { id: 'dark', name: 'Oscuro', icon: Moon },
                  { id: 'system', name: 'Auto', icon: Monitor },
                ].map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => updateSettings({ theme: theme.id as any })}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 gap-2 font-medium text-sm",
                      settings.theme === theme.id
                        ? "bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-sm"
                        : "bg-white dark:bg-neutral-800/40 border-neutral-100 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:border-indigo-200 dark:hover:border-indigo-800"
                    )}
                  >
                    <theme.icon className={cn("w-5 h-5", settings.theme === theme.id ? "text-indigo-600 dark:text-indigo-400" : "")} />
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                Estilo de Interfaz
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'classic', name: 'Sólido Clásico' },
                  { id: 'glass', name: 'Glassmorfismo' }
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => updateSettings({ uiStyle: style.id as any })}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 gap-2 font-medium text-sm",
                      settings.uiStyle === style.id || (!settings.uiStyle && style.id === 'classic')
                        ? "bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-sm"
                        : "bg-white dark:bg-neutral-800/40 border-neutral-100 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:border-indigo-200 dark:hover:border-indigo-800"
                    )}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>
`;

code = code.replace(/<\/div>\s*<div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">\s*<div className="space-y-4">\s*<label className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">\s*<Moon className="w-4 h-4" \/> Tema del Sistema\s*<\/label>\s*<div className="grid grid-cols-3 gap-3">\s*\{\[\s*\{\s*id: 'light', name: 'Claro', icon: Sun\s*\},.*\} \/>\s*\{theme.name\}\s*<\/button>\s*\)\)\}\s*<\/div>\s*<\/div>/s, themeReplacement);

fs.writeFileSync('/app/applet/src/pages/Settings.tsx', code);
