const fs = require('fs');
let content = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

const oldLoginStr = `  const login = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      const result = await signInWithPopup(auth, provider);
      // In some browsers (like Edge with strict tracking prevention), 
      // the popup might succeed but state isn't persisted properly in the iframe.
      if (!auth.currentUser) {
        if (window.self !== window.top) {
          throw new Error("Navegador no admitido: pestaña nueva");
        } else {
          await signInWithRedirect(auth, provider);
          return;
        }
      }
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
        throw new Error(error.message || 'Navegador no admitido o bloqueado: Active las cookies de terceros o intente en otro navegador.');
      }
    }
  };`;

const newLoginStr = `  const login = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      const result = await signInWithPopup(auth, provider);
      if (!auth.currentUser) {
        if (window.self !== window.top) {
          throw new Error("Su navegador bloquea el acceso en esta vista incrustada. Por favor, abra la aplicación en una pestaña nueva para iniciar sesión.");
        }
        throw new Error("Edge/Safari está bloqueando las cookies de terceros. Para iniciar sesión, desactive la prevención de rastreo (ícono de candado/escudo en la URL) o permita cookies de terceros.");
      }
      logAudit(AuditAction.USER_LOGIN, 'Inicio de sesión exitoso por proveedor Google', undefined, result.user);
    } catch (error: any) {
      console.error("Error signing in with Google popup", error);
      if (error.code === 'auth/unauthorized-domain') {
        throw new Error('El dominio actual no está autorizado. Ve a Firebase Console -> Authentication -> Settings -> Authorized domains y añade tu dominio de Vercel.');
      }
      
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        throw new Error('La ventana de Google fue cerrada o bloqueada. Permite las ventanas emergentes e intenta nuevamente.');
      }

      if (error.message.includes('cross-origin') || error.message.includes('third-party') || error.code === 'auth/internal-error') {
        throw new Error("Tu navegador bloquea las cookies de Firebase. Desactiva la Prevención de Rastreo (Edge/Brave) o permite cookies de terceros e intenta de nuevo.");
      }
      
      throw new Error(error.message || 'Ocurrió un error al iniciar sesión. Intenta en otro navegador.');
    }
  };`;

content = content.replace(oldLoginStr, newLoginStr);
fs.writeFileSync('src/contexts/AuthContext.tsx', content);
console.log("Patched login function!");
