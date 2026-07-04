const fs = require('fs');
let content = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

content = content.replace(
  `      if (!auth.currentUser) {
        throw new Error("Su navegador bloquea el acceso en esta vista. Por favor, abra la aplicación en una pestaña nueva para iniciar sesión (Navegador no admitido o bloqueado).");
      }`,
  `      if (!auth.currentUser) {
        if (window.self !== window.top) {
          throw new Error("Navegador no admitido: pestaña nueva");
        } else {
          await signInWithRedirect(auth, provider);
          return;
        }
      }`
);

fs.writeFileSync('src/contexts/AuthContext.tsx', content);
console.log("Patched smart auth fallback");
