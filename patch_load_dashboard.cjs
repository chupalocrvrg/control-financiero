const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(
  /const motosContado = empSales\.filter\(s => s\.isMoto && s\.type === 'contado'\)\.length;\n\s*const motosCredito = empSales\.filter\(s => s\.isMoto && s\.type === 'credito'\)\.length;/,
  `const motosContado = empSales.filter(s => s.isMoto && s.type === 'contado').length;
        const motosCredito = empSales.filter(s => s.isMoto && s.type === 'credito').length;
        const motosContadoVal = empSales.filter(s => s.isMoto && s.type === 'contado').reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
        const motosCreditoVal = empSales.filter(s => s.isMoto && s.type === 'credito').reduce((acc, curr) => acc + (curr.totalValue || 0), 0);`
);

code = code.replace(
  /motoCombustion,\n\s*motoElectric,\n\s*salesContado,\n\s*salesCredito,\n\s*motosContado,\n\s*motosCredito/,
  `motoCombustion,
          motoElectric,
          salesContado,
          salesCredito,
          motosContado,
          motosCredito,
          motosContadoVal,
          motosCreditoVal`
);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log('Patched loadDashboardData');
