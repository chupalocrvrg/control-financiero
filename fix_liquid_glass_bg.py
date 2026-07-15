import re

with open('/app/applet/src/components/Layout.tsx', 'r') as f:
    content = f.read()

old_bg = """      {isGlass && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          {/* Fondo de gradiente base claro */}
          <div className="absolute inset-0 dark:hidden bg-gradient-to-br from-[#e0e7ff] via-[#fae8ff] to-[#f3e8ff] opacity-60" />
          {/* Esferas de luz con gradientes vibrantes (Modo Claro / Modo Oscuro) */}
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-r from-blue-500/40 to-cyan-400/40 dark:from-orange-500/20 dark:to-amber-500/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse duration-1000" />
          <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-bl from-pink-500/40 to-purple-500/40 dark:from-red-600/20 dark:to-orange-500/20 blur-[150px] mix-blend-multiply dark:mix-blend-screen" />
          <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-yellow-400/40 to-pink-500/40 dark:from-indigo-600/20 dark:to-purple-900/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        </div>
      )}"""

new_bg = """      {isGlass && settings.uiStyle !== 'liquid-glass' && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 dark:hidden bg-gradient-to-br from-[#e0e7ff] via-[#fae8ff] to-[#f3e8ff] opacity-60" />
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-r from-blue-500/40 to-cyan-400/40 dark:from-orange-500/20 dark:to-amber-500/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse duration-1000" />
          <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-bl from-pink-500/40 to-purple-500/40 dark:from-red-600/20 dark:to-orange-500/20 blur-[150px] mix-blend-multiply dark:mix-blend-screen" />
          <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-yellow-400/40 to-pink-500/40 dark:from-indigo-600/20 dark:to-purple-900/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        </div>
      )}
      {settings.uiStyle === 'liquid-glass' && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-1000">
          {(settings.liquidBackgroundType || 'gradient') === 'gradient' && (
            <>
              <div className="absolute inset-0 dark:hidden bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-pink-500/30 dark:from-indigo-900/60 dark:via-purple-900/60 dark:to-pink-900/60 blur-3xl saturate-200 opacity-80 dark:opacity-60 animate-in fade-in" />
              <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] rounded-full bg-blue-400/30 dark:bg-blue-600/30 blur-[100px] animate-pulse" />
              <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] rounded-full bg-pink-400/30 dark:bg-pink-600/30 blur-[120px] animate-pulse delay-1000" />
            </>
          )}
          {settings.liquidBackgroundType === 'animated' && (
             <div className="absolute inset-0 bg-[linear-gradient(45deg,#ff000022,#00ff0022,#0000ff22)] bg-[length:400%_400%] animate-pulse blur-2xl saturate-150" />
          )}
          {settings.liquidBackgroundType === 'custom' && settings.liquidBackgroundValue && (
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-md opacity-60 dark:opacity-40 scale-105"
              style={{ backgroundImage: `url(${settings.liquidBackgroundValue})` }}
            />
          )}
          {/* Base Noise overlay for all liquid glass */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-30 mix-blend-overlay pointer-events-none" />
        </div>
      )}"""

content = content.replace(old_bg, new_bg)

with open('/app/applet/src/components/Layout.tsx', 'w') as f:
    f.write(content)

