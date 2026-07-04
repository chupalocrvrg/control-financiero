const fs = require('fs');
let code = fs.readFileSync('src/pages/Budgets.tsx', 'utf8');

code = code.replace(
  /import \{ format, startOfMonth, addMonths, subMonths \} from 'date-fns';/,
  `import { format, startOfMonth, addMonths, subMonths, parse } from 'date-fns';`
);

code = code.replace(
  /onClick=\{\(\) => setCurrentMonth\(format\(subMonths\(new Date\(currentMonth \+ '-01'\), 1\), 'yyyy-MM'\)\)\}/g,
  `onClick={() => setCurrentMonth(format(subMonths(parse(currentMonth, 'yyyy-MM', new Date()), 1), 'yyyy-MM'))}`
);

code = code.replace(
  /onClick=\{\(\) => setCurrentMonth\(format\(addMonths\(new Date\(currentMonth \+ '-01'\), 1\), 'yyyy-MM'\)\)\}/g,
  `onClick={() => setCurrentMonth(format(addMonths(parse(currentMonth, 'yyyy-MM', new Date()), 1), 'yyyy-MM'))}`
);

code = code.replace(
  /format\(new Date\(currentMonth \+ '-01'\), 'MMMM yyyy', \{ locale: es \}\)/g,
  `format(parse(currentMonth, 'yyyy-MM', new Date()), 'MMMM yyyy', { locale: es })`
);

fs.writeFileSync('src/pages/Budgets.tsx', code);
console.log('Patched Budgets.tsx');
