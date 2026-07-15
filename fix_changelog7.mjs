import fs from 'fs';

const filePath = 'src/lib/changelog.ts';
let content = fs.readFileSync(filePath, 'utf8');

const newEntry = `  {
    version: '4.2.4',
    date: new Date().toISOString().split('T')[0],
    changes: [
      'Seguridad: Se han movido los correos electrónicos de los administradores super usuarios del código fuente a variables de entorno (VITE_SUPER_ADMIN_EMAILS) para mayor protección y confidencialidad.'
    ]
  },
`;

content = content.replace('export const staticChangelog: ChangelogRelease[] = [', 'export const staticChangelog: ChangelogRelease[] = [\n' + newEntry);
fs.writeFileSync(filePath, content);
console.log("Updated changelog.ts for 4.2.4");
