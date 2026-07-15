sed -i '/<div className="absolute -top-\[20%\] -left-\[10%\] w-\[50%\]/d' /app/applet/src/components/Layout.tsx
sed -i '/<div className="absolute top-\[20%\] -right-\[10%\] w-\[60%\]/d' /app/applet/src/components/Layout.tsx
sed -i '/<div className="absolute -bottom-\[20%\] left-\[20%\] w-\[50%\]/d' /app/applet/src/components/Layout.tsx

sed -i '/<div className="fixed inset-0 overflow-hidden pointer-events-none z-0">/a\
          {/* Fondo de gradiente base claro */}\
          <div className="absolute inset-0 dark:hidden bg-gradient-to-br from-[#e0e7ff] via-[#fae8ff] to-[#f3e8ff] opacity-60" />\
          {/* Esferas de luz con gradientes vibrantes (Modo Claro / Modo Oscuro) */}\
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-r from-blue-500/40 to-cyan-400/40 dark:from-orange-500/20 dark:to-amber-500/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse duration-1000" />\
          <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-bl from-pink-500/40 to-purple-500/40 dark:from-red-600/20 dark:to-orange-500/20 blur-[150px] mix-blend-multiply dark:mix-blend-screen" />\
          <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-yellow-400/40 to-pink-500/40 dark:from-indigo-600/20 dark:to-purple-900/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />' /app/applet/src/components/Layout.tsx
