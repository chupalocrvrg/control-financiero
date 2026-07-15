const fs = require('fs');

const clPath = '/app/applet/src/lib/changelog.ts';
let cl = fs.readFileSync(clPath, 'utf8');

const newVersionEntry = `
export const staticChangelog: ChangelogRelease[] = [
  {
    version: '4.3.0',
    date: new Date().toISOString(),
    changes: [
      'Estilo visual "Glassmorfismo" con opciones de personalización (Sólido/Glass).',
      'Nueva barra lateral colapsable para maximizar el espacio de trabajo.',
      'Módulo de Inventario migrado a estructura de submódulos laterales.',
      'Panel de Administración reestructurado en submódulos para mejor organización.',
      'Nuevo submódulo de Notificaciones de Error en el Panel de Administración.',
      'Soporte robusto para manejo de estados de red (Cargando, Error, Vacío) en módulos.',
      'Corrección de flujo de Onboarding que impedía acceso a usuarios nuevos (loop infinito).',
      'Secciones inexistentes ahora muestran una página 404 detallada y un acceso rápido al Dashboard.',
      'Actualización en el icono de Inventario para distinguirlo del módulo de Comercio.'
    ]
  },
`;

cl = cl.replace(/export const staticChangelog: ChangelogRelease\[\] = \[\s*\{\s*version: '4\.3\.0'[\s\S]*?fixes: \[[^\]]*\]\s*\},/, newVersionEntry.trim());
fs.writeFileSync(clPath, cl);
