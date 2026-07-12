import fs from 'fs';

const filePath = 'src/pages/AdminPanel.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldImpersonate = `      const { hashPin } = await import('../lib/utils');
      const hashedPin = await hashPin(impersonatePinValue);
      if (isSuperAdminEmail(originalUser?.email)) {
        // Find super admin's PIN. originalUser is FirebaseUser, we need the DB document
        const superAdminDoc = await getDoc(doc(db, 'users', originalUser.uid));
        if (superAdminDoc.exists()) {
          const superAdminData = superAdminDoc.data();
          if (superAdminData.pin !== hashedPin && superAdminData.pin !== impersonatePinValue) {
             showAlert("PIN Incorrecto", "El PIN de administrador ingresado no es correcto.", "error");
             setLoading(false);
             return;
          }
        }
      }`;

const newImpersonate = `      const isValid = await verifyPin(impersonatePinValue);
      if (!isValid) {
        showAlert("PIN Incorrecto", "El PIN de administrador ingresado no es correcto.", "error");
        setLoading(false);
        return;
      }`;

content = content.replace(oldImpersonate, newImpersonate);
fs.writeFileSync(filePath, content);
console.log("Updated handleImpersonate in AdminPanel.tsx");
