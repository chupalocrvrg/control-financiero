const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.split('      );\n}').join('      );');
code = code.split('  );\n}').join('  );');

fs.writeFileSync('src/pages/Dashboard.tsx', code);
