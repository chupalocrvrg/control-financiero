sed -i 's/<th className="px-8 py-4 text-right text-\[10px\] font-black text-neutral-400 uppercase tracking-widest">Control<\/th>//g' /app/applet/src/pages/AdminUsers.tsx
sed -i '/<td className="px-8 py-6 text-right">/,/<\/td>/d' /app/applet/src/pages/AdminUsers.tsx
