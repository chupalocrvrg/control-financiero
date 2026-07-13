import fs from 'fs';

const filePath = 'src/lib/changelog.ts';
let content = fs.readFileSync(filePath, 'utf8');

const newEntry = `  {
    version: '4.2.0',
    date: '2026-07-11',
    changes: [
      'Búsqueda Predictiva: Se reemplazaron las listas desplegables convencionales en Transferencias, Préstamos y Ventas por un nuevo componente avanzado de autocompletado y búsqueda predictiva (por nombre, modelo, marca y código de barras).',
      'Soporte de Códigos de Barras: Opción para enlazar artículos a códigos de barras que facilita el ingreso y salida de inventario rápido mediante escáneres.',
      'Control Estricto de Series: Implementación de la opción "Requerir Series/Seriales" para artículos de alto valor. Si se habilita, fuerza a ingresar o seleccionar exactamente los seriales de cada unidad individual que ingrese o salga de bodega.',
      'Ingreso Inteligente: El botón "Nuevo Artículo" se renombró a "Ingreso de Mercadería" y ahora detecta si un artículo ya existe para simplemente agregar el nuevo stock sin duplicar datos en la base principal.'
    ]
  },
`;

content = content.replace('export const staticChangelog: ChangelogRelease[] = [', 'export const staticChangelog: ChangelogRelease[] = [\n' + newEntry);
fs.writeFileSync(filePath, content);
console.log("Updated changelog.ts for 4.2.0");
