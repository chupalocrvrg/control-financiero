const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(
  'const employees = empSnap.docs.map(d => ({id: d.id, ...d.data()}));',
  'const employees = empSnap.docs.map(d => ({id: d.id, ...d.data()} as any));'
);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
