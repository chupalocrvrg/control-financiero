import fs from 'fs';

const filePath = 'src/pages/AdminPanel.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  '<h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-50 tracking-tighter uppercase italic">HQ Intelligence</h1>',
  '<h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-50 tracking-tighter uppercase italic">Control 360°</h1>\n            <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em] mb-1">by Trennd</p>'
);

fs.writeFileSync(filePath, content);
console.log("Updated AdminPanel.tsx");
