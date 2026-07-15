import re

with open('/app/applet/src/pages/Settings.tsx', 'r') as f:
    content = f.read()

liquid_glass_btn = """
                    <button
                      onClick={() => updateSettings({ uiStyle: 'liquid-glass' })}
                      className={cn(
                        "p-6 rounded-2xl border-2 transition-all font-bold text-left space-y-1 relative overflow-hidden sm:col-span-2",
                        settings.uiStyle === 'liquid-glass' ? "bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-700 dark:text-indigo-300" : "bg-white dark:bg-neutral-800/40 border-neutral-100 dark:border-neutral-800 text-neutral-500"
                      )}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none backdrop-blur-md" />
                      <div className="relative z-10 text-base">Liquid Glass</div>
                      <div className="relative z-10 text-xs font-normal opacity-80">Efecto avanzado con desenfoques acrílicos, transparencias orgánicas y texturas.</div>
                    </button>
"""

content = content.replace("                    </button>\n                  </div>", "                    </button>" + liquid_glass_btn + "\n                  </div>")

liquid_glass_options = """
                {settings.uiStyle === 'liquid-glass' && (
                  <div className="space-y-4 p-6 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-2xl animate-in slide-in-from-top-2">
                    <label className="text-sm font-bold text-indigo-900 dark:text-indigo-100 uppercase tracking-widest flex items-center gap-2">
                      <PaintBucket className="w-4 h-4" /> Fondo Liquid Glass
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { id: 'gradient', label: 'Gradiente Vibrante' },
                        { id: 'animated', label: 'Fondo Animado' },
                        { id: 'custom', label: 'Fondo Personalizado' }
                      ].map(bg => (
                        <button
                          key={bg.id}
                          onClick={() => updateSettings({ liquidBackgroundType: bg.id as any })}
                          className={cn(
                            "p-4 rounded-xl border-2 transition-all font-bold text-center text-sm",
                            (settings.liquidBackgroundType || 'gradient') === bg.id
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "bg-white dark:bg-neutral-800 border-transparent text-neutral-600 dark:text-neutral-400 hover:border-indigo-200"
                          )}
                        >
                          {bg.label}
                        </button>
                      ))}
                    </div>
                    
                    {settings.liquidBackgroundType === 'custom' && (
                      <div className="mt-4 space-y-2">
                        <label className="text-xs font-bold text-indigo-700 dark:text-indigo-300 block">URL de Imagen (o sube un archivo en Firebase)</label>
                        <input
                          type="url"
                          value={settings.liquidBackgroundValue || ''}
                          onChange={(e) => updateSettings({ liquidBackgroundValue: e.target.value })}
                          className="w-full bg-white dark:bg-neutral-800 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                          placeholder="https://ejemplo.com/imagen.jpg"
                        />
                      </div>
                    )}
                  </div>
                )}
"""

content = content.replace("                {/* Tipografía */}", liquid_glass_options + "\n                {/* Tipografía */}")

with open('/app/applet/src/pages/Settings.tsx', 'w') as f:
    f.write(content)

