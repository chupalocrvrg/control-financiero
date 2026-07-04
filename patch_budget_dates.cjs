const fs = require('fs');
let code = fs.readFileSync('src/pages/Budgets.tsx', 'utf8');

// For subMonths
code = code.replace(
  /onClick=\{\(\) => setCurrentMonth\(format\(subMonths\(parse\(currentMonth, 'yyyy-MM', new Date\(\)\), 1\), 'yyyy-MM'\)\)\}/g,
  `onClick={() => { const [y, m] = currentMonth.split('-'); setCurrentMonth(format(subMonths(new Date(Number(y), Number(m) - 1, 15), 1), 'yyyy-MM')); }}`
);

// For addMonths
code = code.replace(
  /onClick=\{\(\) => setCurrentMonth\(format\(addMonths\(parse\(currentMonth, 'yyyy-MM', new Date\(\)\), 1\), 'yyyy-MM'\)\)\}/g,
  `onClick={() => { const [y, m] = currentMonth.split('-'); setCurrentMonth(format(addMonths(new Date(Number(y), Number(m) - 1, 15), 1), 'yyyy-MM')); }}`
);

// For format
code = code.replace(
  /format\(parse\(currentMonth, 'yyyy-MM', new Date\(\)\), 'MMMM yyyy', \{ locale: es \}\)/g,
  `format(new Date(Number(currentMonth.split('-')[0]), Number(currentMonth.split('-')[1]) - 1, 15), 'MMMM yyyy', { locale: es })`
);

fs.writeFileSync('src/pages/Budgets.tsx', code);
console.log('Patched Budgets.tsx dates');
