const fs = require('fs');

const pkgPath = '/app/applet/package.json';
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.version = '4.3.0';
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

const clPath = '/app/applet/src/lib/changelog.ts';
let cl = fs.readFileSync(clPath, 'utf8');

const newVersionEntry = `
export const staticChangelog: ChangelogRelease[] = [
  {
    version: '4.3.0',
    date: new Date().toISOString(),
    features: [
      'Estilo visual "Glassmorfismo" con opciones de personalización (Sólido/Glass).',
      'Nueva barra lateral colapsable para maximizar el espacio de trabajo.',
      'Módulo de Inventario migrado a estructura de submódulos laterales.',
      'Panel de Administración reestructurado en submódulos para mejor organización.',
      'Nuevo submódulo de Notificaciones de Error en el Panel de Administración.',
      'Soporte robusto para manejo de estados de red (Cargando, Error, Vacío) en módulos.',
    ],
    fixes: [
      'Corrección de flujo de Onboarding que impedía acceso a usuarios nuevos (loop infinito).',
      'Secciones inexistentes ahora muestran una página 404 detallada y un acceso rápido al Dashboard.',
      'Actualización en el icono de Inventario para distinguirlo del módulo de Comercio.'
    ]
  },
`;

cl = cl.replace('export const staticChangelog: ChangelogRelease[] = [', newVersionEntry);
cl = cl.replace(/export const CURRENT_VERSION = '[^']+';/, "export const CURRENT_VERSION = '4.3.0';");
fs.writeFileSync(clPath, cl);
