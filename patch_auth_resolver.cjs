const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

code = code.replace(
  /import \{ onAuthStateChanged, User as FirebaseUser, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut \} from 'firebase\/auth';/,
  `import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, browserPopupRedirectResolver } from 'firebase/auth';`
);

code = code.replace(
  /const result = await signInWithPopup\(auth, provider\);/,
  `const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);`
);

fs.writeFileSync('src/contexts/AuthContext.tsx', code);
console.log('Patched AuthContext.tsx to use browserPopupRedirectResolver');
