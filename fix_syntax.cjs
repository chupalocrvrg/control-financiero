const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(
  /const motoUnits,\s*motoCombustion,\s*motoElectric = empSales\.filter\(s => s\.isMoto\)\.length;/,
  'const motoUnits = empSales.filter(s => s.isMoto).length;'
);

code = code.replace(
  'function CommerceCard({ data }: { data: any })',
  'function CommerceCard({ data }: { data: any; key?: any })'
);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
