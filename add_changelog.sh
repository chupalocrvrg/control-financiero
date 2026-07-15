sed -i '/export const staticChangelog: ChangelogRelease\[\] = \[/a\
  {\
    version: '\''4.4.0'\'',\
    date: new Date().toISOString(),\
    changes: [\
      '\''Efecto Glassmorphism Avanzado implementado con gradientes CSS inspirados en diseño 3D y elementos flotantes.'\'',\
      '\''Separación de funcionalidades de Admin (Usuarios, Asignación, Versiones, Auditoría, Papelera) en rutas y vistas independientes en el menú.'\'',\
    ]\
  },' /app/applet/src/lib/changelog.ts
