const fs = require('fs');
let content = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

content = content.replace(
  `throw new Error("third-party cookie blocking detected: auth state not persisted. Navegador no admitido o bloqueado.");`,
  `throw new Error("Su navegador bloquea el acceso en esta vista. Por favor, abra la aplicación en una pestaña nueva para iniciar sesión (Navegador no admitido o bloqueado).");`
);

fs.writeFileSync('src/contexts/AuthContext.tsx', content);
console.log("Patched error message");
