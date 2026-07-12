import fs from 'fs';
import path from 'path';

function replaceInFile(filePath, level) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('VITE_SUPER_ADMIN_EMAIL')) {
    const importPath = level === 1 ? '../lib/utils' : '../../lib/utils';
    if (!content.includes('isSuperAdminEmail')) {
      // Find the last import statement
      const importMatches = [...content.matchAll(/^import .*;$/gm)];
      if (importMatches.length > 0) {
        const lastImport = importMatches[importMatches.length - 1];
        const index = lastImport.index + lastImport[0].length;
        content = content.slice(0, index) + `\nimport { isSuperAdminEmail } from '${importPath}';` + content.slice(index);
      } else {
        content = `import { isSuperAdminEmail } from '${importPath}';\n` + content;
      }
    }
    content = content.replace(/([a-zA-Z0-9_?.]+(?:email|email\?\.?)) === import\.meta\.env\.VITE_SUPER_ADMIN_EMAIL/g, 'isSuperAdminEmail($1)');
    content = content.replace(/([a-zA-Z0-9_?.]+(?:email|email\?\.?)) !== import\.meta\.env\.VITE_SUPER_ADMIN_EMAIL/g, '!isSuperAdminEmail($1)');
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

const files = [
  { p: 'src/pages/AdminPanel.tsx', l: 1 },
  { p: 'src/pages/Sales.tsx', l: 1 },
  { p: 'src/pages/CheckSearch.tsx', l: 1 },
  { p: 'src/pages/CheckEntry.tsx', l: 1 },
  { p: 'src/contexts/AuthContext.tsx', l: 1 },
  { p: 'src/components/Layout.tsx', l: 1 },
];

files.forEach(f => replaceInFile(f.p, f.l));
