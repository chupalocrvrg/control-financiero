const fs = require('fs');

['src/pages/Employees.tsx', 'src/pages/Budgets.tsx', 'src/pages/Sales.tsx', 'src/pages/Collections.tsx'].forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  
  if (file.includes('Employees')) {
    code = code.replace(
      /useEffect\(\(\) => \{\n\s*fetchEmployees\(\);\n\s*\}, \[\]\);/,
      'useEffect(() => {\n    fetchEmployees();\n  }, [user]);'
    );
  } else {
    code = code.replace(
      /useEffect\(\(\) => \{\n\s*fetchData\(\);\n\s*\}, \[.*?\]\);/,
      (match) => {
         if (!match.includes('user')) {
           return match.replace(/\[(.*?)\]/, '[$1, user]');
         }
         return match;
      }
    );
  }
  
  fs.writeFileSync(file, code);
});
