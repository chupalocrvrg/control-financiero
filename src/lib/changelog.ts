import { db } from '../firebase';
import { collection, getDocs, getDoc, setDoc, doc } from 'firebase/firestore';

export interface ChangelogRelease {
  version: string;
  date: string;
  changes: string[];
  createdAt?: string;
}

export const staticChangelog: ChangelogRelease[] = [
  {
    version: '4.1.7',
    date: '2026-07-11',
    changes: [
      'Corrección de Simulación de Sesión: Se ha resuelto el problema que impedía realizar acciones administrativas (como modificar o vaciar datos) al simular un usuario, debido a una validación errónea contra el PIN del usuario simulado en lugar del administrador.'
    ]
  },

  {
    version: '4.1.6',
    date: '2026-07-11',
    changes: [
      'Autorización de Super-Admin: Expansión de las reglas de Firestore para reconocer múltiples cuentas maestras de administrador y validaciones relajadas en campos opcionales del perfil.',
      'Resolución Onboarding: Solución al problema que impedía crear nuevos perfiles debido al bloqueo por rol de administrador.'
    ]
  },
  {
    version: '4.1.5',
    date: '2026-07-11',
    changes: [
      'Resolución de Seguridad: Corrección de las reglas de seguridad de Firestore para aceptar la creación de usuarios con PIN encriptado en formato hexadecimal SHA-256.'
    ]
  },
  {
    version: '4.1.4',
    date: '2026-07-11',
    changes: [
      'Optimización de UI: Los módulos de la barra lateral (Finanzas, Comercio) ahora inician colapsados por defecto para reducir el ruido visual en la interfaz.'
    ]
  },
  {
    version: '4.1.3',
    date: '2026-07-11',
    changes: [
      'Limpieza de Código: Eliminación del componente no utilizado GlobalCommerceCard del panel de control.',
      'Optimización de Dependencias: Eliminación de dependencias duplicadas en la configuración del proyecto.',
      'Páginas de Error Globales: Incorporación de un capturador de errores (ErrorBoundary) y página 404 para evitar pantallas en blanco al fallar la carga de un módulo.',
      'Optimización de Rendimiento de Arranque: Implementación de validación previa (getDoc) para evitar escrituras redundantes de versiones en Firestore.'
    ]
  },
  {
    version: '4.1.2',
    date: '2026-07-11',
    changes: [
      'Autorización Estricta de Simulación: Se requiere el ingreso del PIN de administrador obligatoriamente antes de activar el modo de suplantación de cuenta.',
      'Límites y Paginación de Consultas: Integración de filtros por fechas desde la base de datos limitando el flujo de información a 12 meses para acelerar la carga.',
      'Estados Cautelares de Sesión: Si el perfil del usuario no se ha resuelto correctamente, el sistema asume estado inactivo/caducado, previniendo accesos temporales.',
      'Filtros de Fechas Robustos: Transición de filtros lógicos usando comparación de strings a evaluación criptográfica en milisegundos evitando errores de sintaxis.'
    ]
  },
  {
    version: '4.1.1',
    date: '2026-07-11',
    changes: [
      'Seguridad de Credenciales: Migración de correo administrador quemado en código a variable de entorno global segura.',
      'Cifrado de PIN: Implementación de encriptación criptográfica SHA-256 para validación y almacenamiento del PIN de usuario.',
      'Resolución de Excepciones Reactivas: Reorganización del orden de ejecución de hooks en el Dashboard de Inventario resolviendo inconsistencias.',
      'Delegación de Permisos: Refinamiento de verificación de administrador dependiendo estrictamente de reglas robustas de datos y variables de entorno.'
    ]
  },
  {
    version: '4.1.0',
    date: '2026-07-11',
    changes: [
      'Validaciones de Reversión de Stock: Optimización matemática que impide saldos negativos durante la reversión de transferencias, ventas y préstamos, limitando la cantidad revertida al stock disponible real de forma segura.',
      'Sincronización y Búsqueda Predictiva: Integración de listas de autocompletado inteligente (datalists) en tiempo real para bodegas, clientes, asignados y encargados de préstamos en toda la interfaz de inventario.',
      'Sincronización de Versión Unificada: Conversión de las etiquetas de versión a una constante dinámica global importada, eliminando referencias estáticas duplicadas en la UI.'
    ]
  },
  {
    version: '4.0.0',
    date: '2026-07-10',
    changes: [
      'Sincronización Automática de Versiones: El sistema ahora detecta, calcula y propaga automáticamente las nuevas versiones de software directamente desde la base de código a la base de datos Firestore sin requerir intervención manual de los administradores.',
      'Eliminación del Gestor Manual de Plataforma: Se retiró la interfaz de registro manual en el Panel de Administración para automatizar completamente el control de versiones y evitar discrepancias de nomenclatura.',
      'Actualización Mayor de Arquitectura (V4.0.0): Sincronización transparente de hitos de desarrollo y despliegues con la base de datos en cada ciclo de arranque del sistema.',
      'Soporte Completo para Progressive Web App (PWA): Carga rápida, capacidades sin conexión y soporte de instalación nativo.',
      'Cuadro de Mando Analítico Avanzado: Tableros dinámicos interactivos de cheques con Recharts y filtros en tiempo real.'
    ]
  },
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

// Fallback static exports for components expecting static access
export const changelog: ChangelogRelease[] = staticChangelog;
export const CURRENT_VERSION = staticChangelog[0].version;

// Helper to compare version numbers (descending order)
export function compareVersions(a: string, b: string): number {
  const cleanA = a.replace(/^[Vv]/, '');
  const cleanB = b.replace(/^[Vv]/, '');
  const partsA = cleanA.split('.').map(Number);
  const partsB = cleanB.split('.').map(Number);
  
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const valA = partsA[i] || 0;
    const valB = partsB[i] || 0;
    if (valA !== valB) {
      return valB - valA; // Descending
    }
  }
  return 0;
}

// Function to fetch merged dynamic versions
export async function getDynamicVersions(): Promise<ChangelogRelease[]> {
  try {
    const versionsRef = collection(db, 'versions');
    const snapshot = await getDocs(versionsRef);
    const firestoreVersions: ChangelogRelease[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      firestoreVersions.push({
        version: docSnap.id,
        date: data.date || new Date().toISOString().split('T')[0],
        changes: data.changes || [],
        createdAt: data.createdAt || ''
      });
    });

    // Merge static and firestore versions (avoiding duplicates)
    const mergedMap = new Map<string, ChangelogRelease>();
    
    // Add static ones first
    staticChangelog.forEach(v => {
      // Standardize static version key by converting to e.g. V3.1.5 or keeping as is
      mergedMap.set(v.version, v);
    });

    // Add firestore ones (will override or add new ones)
    firestoreVersions.forEach(v => {
      // If version is saved as V3.1.5 and we have static '3.1.5', normalize keys for lookup
      const lookupKey = v.version.replace(/^[Vv]/, '');
      const matchedKey = Array.from(mergedMap.keys()).find(k => k.replace(/^[Vv]/, '') === lookupKey);
      if (matchedKey) {
        mergedMap.set(matchedKey, v);
      } else {
        mergedMap.set(v.version, v);
      }
    });

    // Automatically register any static versions that do not exist in Firestore
    const firestoreCleanVersions = new Set(firestoreVersions.map(v => v.version.replace(/^[Vv]/, '').trim()));
    for (const v of staticChangelog) {
      const cleanV = v.version.replace(/^[Vv]/, '').trim();
      if (!firestoreCleanVersions.has(cleanV)) {
        try {
          const normalizedVersion = v.version.startsWith('V') || v.version.startsWith('v') ? v.version : `V${v.version}`;
          const versionDocRef = doc(db, 'versions', normalizedVersion);
          const vDoc = await getDoc(versionDocRef);
          if (!vDoc.exists()) {
            await saveNewVersion(v.version, v.changes);
            console.log(`[Auto-Version] Automatically registered V${cleanV} in Firestore.`);
          }
        } catch (err) {
          console.error(`[Auto-Version] Failed to automatically register V${cleanV}:`, err);
        }
      }
    }

    const mergedList = Array.from(mergedMap.values());
    
    // Sort descending by version number
    mergedList.sort((a, b) => compareVersions(a.version, b.version));
    
    return mergedList;
  } catch (error) {
    console.error('Error fetching dynamic versions:', error);
    return staticChangelog;
  }
}

// Helper to calculate the next version number automatically
export function getNextVersion(currentVersion: string, type: 'minor' | 'medium' | 'major'): string {
  const clean = currentVersion.replace(/^[Vv]/, '');
  const parts = clean.split('.').map(Number);
  
  let [major, medium, minor] = parts.length === 3 ? parts : [3, 1, 5];
  if (isNaN(major)) major = 3;
  if (isNaN(medium)) medium = 1;
  if (isNaN(minor)) minor = 5;

  if (type === 'minor') {
    minor += 1;
  } else if (type === 'medium') {
    medium += 1;
    minor = 0;
  } else if (type === 'major') {
    major += 1;
    medium = 0;
    minor = 0;
  }

  return `V${major}.${medium}.${minor}`;
}

// Function to save a new version to Firestore
export async function saveNewVersion(version: string, changes: string[]): Promise<void> {
  const normalizedVersion = version.startsWith('V') || version.startsWith('v') ? version : `V${version}`;
  const versionDocRef = doc(db, 'versions', normalizedVersion);
  
  await setDoc(versionDocRef, {
    date: new Date().toISOString().split('T')[0],
    changes: changes,
    createdAt: new Date().toISOString()
  });
}
