import fs from 'fs';

const filePath = 'src/lib/changelog.ts';
let content = fs.readFileSync(filePath, 'utf8');

const newEntry = `  {
    version: '4.2.1',
    date: new Date().toISOString().split('T')[0],
    changes: [
      'Nombre Automático de Artículo: El campo "Nombre del Artículo" en el formulario de Ingreso de Mercadería ahora es de solo lectura y se genera automáticamente combinando la Marca y el Modelo ingresados, evitando errores de tipeo y asegurando un formato estandarizado.'
    ]
  },
`;

content = content.replace('export const staticChangelog: ChangelogRelease[] = [', 'export const staticChangelog: ChangelogRelease[] = [\n' + newEntry);
fs.writeFileSync(filePath, content);
console.log("Updated changelog.ts for 4.2.1");
