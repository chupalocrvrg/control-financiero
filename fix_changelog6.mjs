import fs from 'fs';

const filePath = 'src/lib/changelog.ts';
let content = fs.readFileSync(filePath, 'utf8');

const newEntry = `  {
    version: '4.2.3',
    date: new Date().toISOString().split('T')[0],
    changes: [
      'Validación Estricta de Código de Barras: Se añadió un cuadro de diálogo de confirmación obligatorio en Ingreso de Mercadería al detectar un código de barras ya registrado, previniendo duplicados.',
      'Mejora UI Ventas de Almacén: Reemplazada la lista desplegable nativa de artículos por el selector inteligente con búsqueda y soporte integrado para selección de series y lotes.'
    ]
  },
`;

content = content.replace('export const staticChangelog: ChangelogRelease[] = [', 'export const staticChangelog: ChangelogRelease[] = [\n' + newEntry);
fs.writeFileSync(filePath, content);
console.log("Updated changelog.ts for 4.2.3");
