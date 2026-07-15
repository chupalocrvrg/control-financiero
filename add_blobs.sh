sed -i '/<PWAPrompt \/>/a\
      {isGlass && (\
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">\
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 dark:bg-amber-600/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />\
          <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-pink-400/20 dark:bg-orange-500/10 blur-[150px] mix-blend-multiply dark:mix-blend-screen" />\
          <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-purple-400/20 dark:bg-indigo-600/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />\
        </div>\
      )}' /app/applet/src/components/Layout.tsx
