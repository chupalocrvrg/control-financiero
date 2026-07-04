export interface ChangelogRelease {
  version: string;
  date: string;
  changes: string[];
}

export const changelog: ChangelogRelease[] = [
  {
    version: '3.1.5',
    date: '2026-05-08',
    changes: [
      'Transformación en PWA (Progressive Web App) con soporte instalable y manifiesto personalizado.',
      'Sistema de Auditoría: Registro de acciones críticas para administradores (Logs de Auditoría).',
      'Implementación de Papelera de Reciclaje (Soft Delete) para evitar pérdida accidental de datos.',
      'Optimización de rendimiento mediante Lazy Loading de módulos y rutas principales.',
      'Nuevo tablero de Gráficos Analíticos interactivos con Recharts.',
      'Mejoras en el motor de consultas y políticas de caché local.'
    ]
  },
  {
    version: '2.1.7',
    date: '2026-05-08',
    changes: [
      'Corrección del error 404 al recargar páginas secundarias mediante la implementación de middleware SPA en el servidor y configuración de reescritura para Vercel.',
      'Transición a una arquitectura full-stack (Express + Vite) para garantizar la persistencia del enrutamiento en entornos de producción y desarrollo.'
    ]
  },
  {
    version: '2.1.6',
    date: '2026-05-08',
    changes: [
      'Integración del Historial de Actualizaciones y notificaciones emergentes de novedades en la plataforma.',
      'El Panel de Administración ahora permite la eliminación permanente de usuarios y su información asociada.',
      'Inclusión de los Términos y Condiciones obligatorios durante el proceso de incorporación.',
      'Agregado el cálculo y despliegue del balance general (total, pendientes, pagados y vencidos) de cheques en interfaz y en reportes PDF.',
      'Actualización del Protocolo de Carga Masiva a V2.1.6.'
    ]
  },
  {
    version: '2.1.5',
    date: '2026-05-08',
    changes: [
      'Se incluyó la posibilidad de agregar y administrar Bancos en los ajustes.',
      'Mejoras en el registro manual para asociar cheques con los bancos guardados.'
    ]
  },
  {
    version: '2.1.4',
    date: '2026-05-08',
    changes: [
      'Correcciones internas en operaciones con la base de datos Firestore y optimización en las consultas de pagos.'
    ]
  }
];

export const CURRENT_VERSION = changelog[0].version;
