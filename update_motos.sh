#!/bin/bash
node -e "
const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Update commerceArray logic
code = code.replace(
  'const motoUnits = empSales.filter(s => s.isMoto).length;',
  'const motoUnits = empSales.filter(s => s.isMoto).length;\n        const motoCombustion = empSales.filter(s => s.isMoto && s.motoType === \\'combustion\\').length;\n        const motoElectric = empSales.filter(s => s.isMoto && s.motoType === \\'electrico\\').length;'
);

code = code.replace(
  'motoUnits',
  'motoUnits, motoCombustion, motoElectric'
);

// Update UI
const oldMotoUI = 'Motos Vendidas: <span className=\\"font-bold text-neutral-900 dark:text-white\\">{data.motoUnits} uds</span>';
const newMotoUI = 'Motos Vendidas: <span className=\\"font-bold text-neutral-900 dark:text-white\\">{data.motoUnits} uds</span> (Combustión: {data.motoCombustion} | Eléctricas: {data.motoElectric})';

code = code.replace(oldMotoUI, newMotoUI);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
"
chmod +x update_motos.sh
./update_motos.sh
