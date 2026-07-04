const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(
  /onClick=\{generatePdfReport\}/g,
  `onClick={() => setShowCustomReportModal(true)}`
);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log('Patched Dashboard.tsx btn');
