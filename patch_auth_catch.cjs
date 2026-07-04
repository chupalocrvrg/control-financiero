const fs = require('fs');
let content = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

content = content.replace(
  `} else {
        throw new Error('Navegador no admitido o bloqueado: Active las cookies de terceros o intente en otro navegador.');
      }`,
  `} else {
        throw new Error(error.message || 'Navegador no admitido o bloqueado: Active las cookies de terceros o intente en otro navegador.');
      }`
);

fs.writeFileSync('src/contexts/AuthContext.tsx', content);
console.log("Patched catch block");
