const fs = require('fs');

['src/pages/Budgets.tsx', 'src/pages/Sales.tsx', 'src/pages/Collections.tsx'].forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes('if (!user) return;')) {
    code = code.replace(
      'const fetchData = async () => {',
      'const fetchData = async () => {\n    if (!user) return;'
    );
    fs.writeFileSync(file, code);
  }
});
