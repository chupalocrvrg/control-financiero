import re

with open('/app/applet/src/pages/Settings.tsx', 'r') as f:
    content = f.read()

timer_ui = """
      {positionConfirmTimer && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] bg-neutral-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div>
            <p className="font-bold text-sm">¿Mantener esta ubicación?</p>
            <p className="text-xs text-neutral-400">Restableciendo en {timeLeft}s...</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={cancelPositionChange} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-bold transition-colors">Revertir</button>
            <button onClick={confirmPositionChange} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold transition-colors">Mantener</button>
          </div>
        </div>
      )}
"""

content = content.replace("    <div className=\"max-w-7xl mx-auto space-y-6 lg:space-y-8 pb-20 animate-in fade-in duration-300\">", timer_ui + "\n    <div className=\"max-w-7xl mx-auto space-y-6 lg:space-y-8 pb-20 animate-in fade-in duration-300\">")

with open('/app/applet/src/pages/Settings.tsx', 'w') as f:
    f.write(content)

