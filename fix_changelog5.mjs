import fs from 'fs';

const filePath = 'src/lib/changelog.ts';
let content = fs.readFileSync(filePath, 'utf8');

const newEntry = `  {
    version: '4.2.2',
    date: new Date().toISOString().split('T')[0],
    changes: [
      'Actualización del nombre automático: El nombre de un artículo ahora se genera automáticamente utilizando la fórmula Categoría + Marca + Modelo + Código de Barras (opcional) de forma estandarizada.'
    ]
  },
`;

content = content.replace('export const staticChangelog: ChangelogRelease[] = [', 'export const staticChangelog: ChangelogRelease[] = [\n' + newEntry);
fs.writeFileSync(filePath, content);
console.log("Updated changelog.ts for 4.2.2");
