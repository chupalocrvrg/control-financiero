const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

code = code.replace(
  /import \{ onAuthStateChanged, User as FirebaseUser, signInWithPopup, GoogleAuthProvider, signOut \} from 'firebase\/auth';/,
  `import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from 'firebase/auth';`
);

const newLogin = `
  useEffect(() => {
    getRedirectResult(auth).then(result => {
      if (result) {
        logAudit(AuditAction.USER_LOGIN, 'Inicio de sesión exitoso por redirección Google', undefined, result.user);
      }
    }).catch(error => {
      console.error("Error from redirect result:", error);
    });
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      const result = await signInWithPopup(auth, provider);
      logAudit(AuditAction.USER_LOGIN, 'Inicio de sesión exitoso por proveedor Google', undefined, result.user);
    } catch (error: any) {
      console.error("Error signing in with Google popup", error);
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request' || error.message.includes('cross-origin') || error.code === 'auth/unauthorized-domain' || error.message.includes('third-party')) {
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectError) {
          console.error("Error signing in with Google redirect", redirectError);
          throw new Error('Navegador no admitido: Active las cookies de terceros o intente en otro navegador para iniciar sesión.');
        }
      } else {
        throw new Error('Navegador no admitido o bloqueado: Active las cookies de terceros o intente en otro navegador.');
      }
    }
  };
`;

code = code.replace(
  /  const login = async \(\) => \{[\s\S]*?    \}\n  \};/,
  newLogin.trim()
);

fs.writeFileSync('src/contexts/AuthContext.tsx', code);
console.log('Patched AuthContext.tsx');
