const fs = require('fs');
let content = fs.readFileSync('src/pages/Login.tsx', 'utf8');

content = content.replace(
  `    } catch (err: any) {
      if (inIframe && err.message.includes('Navegador no admitido')) {
        setError("Su navegador bloquea el acceso en esta vista incrustada. Por favor, abra la aplicación en una pestaña nueva para iniciar sesión.");
      } else {
        setError(err.message);
      }
    }`,
  `    } catch (err: any) {
      setError(err.message);
    }`
);

fs.writeFileSync('src/pages/Login.tsx', content);
console.log("Patched Login.tsx");
