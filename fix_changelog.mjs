import fs from 'fs';

const filePath = 'src/lib/changelog.ts';
let content = fs.readFileSync(filePath, 'utf8');

const newEntry = `  {
    version: '4.1.7',
    date: '2026-07-11',
    changes: [
      'Corrección de Simulación de Sesión: Se ha resuelto el problema que impedía realizar acciones administrativas (como modificar o vaciar datos) al simular un usuario, debido a una validación errónea contra el PIN del usuario simulado en lugar del administrador.'
    ]
  },
`;

content = content.replace('export const staticChangelog: ChangelogRelease[] = [', 'export const staticChangelog: ChangelogRelease[] = [\n' + newEntry);
fs.writeFileSync(filePath, content);
console.log("Updated changelog.ts");
