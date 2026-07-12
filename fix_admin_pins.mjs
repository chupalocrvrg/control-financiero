import fs from 'fs';

const filePath = 'src/pages/AdminPanel.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add verifyPin to useAuth
content = content.replace(
  /const { user, isAdmin, profile, impersonateUser, originalUser } = useAuth\(\);/,
  'const { user, isAdmin, profile, impersonateUser, originalUser, verifyPin } = useAuth();'
);

// handleMigrateData
content = content.replace(
  /    if \(!profile\?\.pin\) {\s*showAlert\("PIN no configurado", "Error: Tu perfil de administrador no tiene un PIN configurado. Por favor, configúralo en ajustes.", "error"\);\s*return;\s*}\s*if \(migratePinValue !== profile\.pin\) {\s*showAlert\("PIN Incorrecto", "El PIN de administrador ingresado es incorrecto.", "error"\);\s*return;\s*}\s*setLoading\(true\);\s*try {/,
  `    setLoading(true);
    try {
      const isValid = await verifyPin(migratePinValue);
      if (!isValid) {
        showAlert("PIN Incorrecto", "El PIN de administrador ingresado es incorrecto o no está configurado.", "error");
        setLoading(false);
        return;
      }
`
);

// handleVaciarBaseDatos
content = content.replace(
  /    \/\/ Safety check for admin pin\s*if \(!profile\?\.pin\) {\s*showAlert\("PIN no configurado", "Error: Tu perfil de administrador no tiene un PIN configurado. Por favor, configúralo en ajustes.", "error"\);\s*return;\s*}\s*if \(adminPinValue !== profile\.pin\) {\s*showAlert\("PIN Incorrecto", "PIN de administrador incorrecto.", "error"\);\s*return;\s*}\s*setLoading\(true\);\s*try {/,
  `    setLoading(true);
    try {
      const isValid = await verifyPin(adminPinValue);
      if (!isValid) {
        showAlert("PIN Incorrecto", "El PIN de administrador ingresado es incorrecto o no está configurado.", "error");
        setLoading(false);
        return;
      }
`
);

// handleDeleteUser
content = content.replace(
  /    if \(!profile\?\.pin\) {\s*showAlert\("PIN no configurado", "Error: Tu perfil de administrador no tiene un PIN configurado. Por favor, configúralo en ajustes.", "error"\);\s*return;\s*}\s*if \(deleteUserPinValue !== profile\.pin\) {\s*showAlert\("PIN Incorrecto", "PIN de administrador incorrecto.", "error"\);\s*return;\s*}\s*setLoading\(true\);\s*try {/,
  `    setLoading(true);
    try {
      const isValid = await verifyPin(deleteUserPinValue);
      if (!isValid) {
        showAlert("PIN Incorrecto", "El PIN de administrador ingresado es incorrecto o no está configurado.", "error");
        setLoading(false);
        return;
      }
`
);

fs.writeFileSync(filePath, content);
console.log("Updated AdminPanel.tsx");
