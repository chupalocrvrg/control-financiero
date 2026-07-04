const fs = require('fs');
let code = fs.readFileSync('src/pages/Employees.tsx', 'utf8');

code = code.replace(
  'const fetchEmployees = async () => {',
  'const fetchEmployees = async () => {\n    if (!user) return;'
);

fs.writeFileSync('src/pages/Employees.tsx', code);
