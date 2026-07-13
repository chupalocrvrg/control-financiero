import fs from 'fs';

const filePath = 'src/lib/changelog.ts';
let content = fs.readFileSync(filePath, 'utf8');

const newEntry = `  {
    version: '4.1.8',
    date: '2026-07-11',
    changes: [
      'Rebranding de la aplicación: Cambio general del nombre "HQ Intelligence" y otros nombres genéricos a "Control 360°", incluyendo la firma "by Trennd".'
    ]
  },
`;

content = content.replace('export const staticChangelog: ChangelogRelease[] = [', 'export const staticChangelog: ChangelogRelease[] = [\n' + newEntry);
fs.writeFileSync(filePath, content);
console.log("Updated changelog.ts");
