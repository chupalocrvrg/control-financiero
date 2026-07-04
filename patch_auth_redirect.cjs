const fs = require('fs');
let content = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

content = content.replace(
  `throw new Error("Navegador no admitido o bloqueado: Active las cookies de terceros o intente en otro navegador (O abra en una pestaña nueva).");`,
  `throw new Error("third-party cookie blocking detected: auth state not persisted. Navegador no admitido o bloqueado.");`
);

fs.writeFileSync('src/contexts/AuthContext.tsx', content);
console.log("Patched to trigger redirect fallback");
