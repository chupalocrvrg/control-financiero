const fs = require('fs');
let code = fs.readFileSync('src/pages/Budgets.tsx', 'utf8');

code = code.replace(
  'Object.values(budgets).map(async (budget) => {',
  'Object.values(budgets).map(async (budget: any) => {'
);

code = code.replace(
  'const totalSalesBudget = Object.values(budgets).reduce((acc, curr) => acc + (curr.salesBudget || 0), 0);',
  'const totalSalesBudget = Object.values(budgets).reduce((acc: number, curr: any) => acc + (curr.salesBudget || 0), 0) as number;'
);

code = code.replace(
  'const totalCollectionsBudget = Object.values(budgets).reduce((acc, curr) => acc + (curr.collectionsBudget || 0), 0);',
  'const totalCollectionsBudget = Object.values(budgets).reduce((acc: number, curr: any) => acc + (curr.collectionsBudget || 0), 0) as number;'
);

fs.writeFileSync('src/pages/Budgets.tsx', code);
