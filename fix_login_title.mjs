import fs from 'fs';

const filePath = 'src/pages/Login.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /<h2 className="text-center text-4xl font-black text-neutral-900 dark:text-neutral-50 tracking-tighter uppercase italic">\s*Control Financiero\s*<\/h2>/,
  '<h2 className="text-center text-4xl font-black text-neutral-900 dark:text-neutral-50 tracking-tighter uppercase italic">Control 360°</h2>\n        <p className="text-center text-xs font-bold text-indigo-500 uppercase tracking-widest mt-1">by Trennd</p>'
);

fs.writeFileSync(filePath, content);
console.log("Updated Login.tsx");
