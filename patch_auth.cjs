const fs = require('fs');
let content = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

// Remove browserPopupRedirectResolver import
content = content.replace(', browserPopupRedirectResolver', '');

// Replace signInWithPopup and handle fallback properly
content = content.replace(
  'const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);',
  `const result = await signInWithPopup(auth, provider);
      // In some browsers (like Edge with strict tracking prevention), 
      // the popup might succeed but state isn't persisted properly in the iframe.
      if (!auth.currentUser) {
        throw new Error("Navegador no admitido o bloqueado: Active las cookies de terceros o intente en otro navegador (O abra en una pestaña nueva).");
      }`
);

fs.writeFileSync('src/contexts/AuthContext.tsx', content);
console.log("Patched AuthContext");
