import re

with open('/app/applet/src/components/Layout.tsx', 'r') as f:
    content = f.read()

old_effect = """  useEffect(() => {
    if (settings.uiStyle === 'glass') {
      document.documentElement.classList.add('theme-glass');
    } else {
      document.documentElement.classList.remove('theme-glass');
    }
  }, [settings.uiStyle]);"""

new_effect = """  useEffect(() => {
    if (settings.uiStyle === 'glass' || settings.uiStyle === 'liquid-glass') {
      document.documentElement.classList.add('theme-glass');
      if (settings.uiStyle === 'liquid-glass') {
        document.documentElement.classList.add('theme-liquid-glass');
      } else {
        document.documentElement.classList.remove('theme-liquid-glass');
      }
    } else {
      document.documentElement.classList.remove('theme-glass', 'theme-liquid-glass');
    }
  }, [settings.uiStyle]);"""

content = content.replace(old_effect, new_effect)

# Also we need to inject the liquid background conditionally
background_layer = """
      {/* Liquid Glass Background */}
      {settings.uiStyle === 'liquid-glass' && (
        <div className="fixed inset-0 pointer-events-none -z-10 transition-opacity duration-1000">
          {(settings.liquidBackgroundType || 'gradient') === 'gradient' && (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 dark:from-indigo-900/40 dark:via-purple-900/40 dark:to-pink-900/40 blur-3xl saturate-200 opacity-60 dark:opacity-40 animate-in fade-in" />
          )}
          {settings.liquidBackgroundType === 'animated' && (
             <div className="absolute inset-0 bg-[linear-gradient(45deg,#ff000022,#00ff0022,#0000ff22)] bg-[length:400%_400%] animate-pulse blur-2xl saturate-150" />
          )}
          {settings.liquidBackgroundType === 'custom' && settings.liquidBackgroundValue && (
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-sm opacity-50 dark:opacity-30"
              style={{ backgroundImage: `url(${settings.liquidBackgroundValue})` }}
            />
          )}
          {/* Base Noise overlay for all liquid glass */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20 mix-blend-overlay"></div>
        </div>
      )}
"""

content = content.replace('<div className={`min-h-screen font-sans ${themeClass} ${settings.fontFamily === \'mono\' ? \'font-mono\' : \'\'}`}>', '<div className={`min-h-screen font-sans ${themeClass} ${settings.fontFamily === \'mono\' ? \'font-mono\' : \'\'}`}>' + background_layer)

with open('/app/applet/src/components/Layout.tsx', 'w') as f:
    f.write(content)

