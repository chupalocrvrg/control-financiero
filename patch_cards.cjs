const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const newGlobalStart = `
function GlobalCommerceCard({ allData }: { allData: any[] }) {
  const employeesWithSalesBudget = allData.filter(d => d.salesBudget > 0).length;
  const employeesWithCollBudget = allData.filter(d => d.collectionsBudget > 0).length;
  const totalSalesBudget = allData.reduce((acc, curr) => acc + curr.salesBudget, 0);
  const totalCollBudget = allData.reduce((acc, curr) => acc + curr.collectionsBudget, 0);
  
  const totalSales = allData.reduce((acc, curr) => acc + curr.totalSales, 0);
  const totalColl = allData.reduce((acc, curr) => acc + curr.totalCollections, 0);
  const totalMotos = allData.reduce((acc, curr) => acc + curr.motoUnits, 0);
  
  const totalMotosContado = allData.reduce((acc, curr) => acc + curr.motosContado, 0);
  const totalMotosCredito = allData.reduce((acc, curr) => acc + curr.motosCredito, 0);
  const totalMotosValContado = allData.reduce((acc, curr) => acc + curr.motosContadoVal, 0);
  const totalMotosValCredito = allData.reduce((acc, curr) => acc + curr.motosCreditoVal, 0);
  const totalMotosVal = totalMotosValContado + totalMotosValCredito;

  const salesPct = totalSalesBudget > 0 ? (totalSales / totalSalesBudget) * 100 : 0;
  const collPct = totalCollBudget > 0 ? (totalColl / totalCollBudget) * 100 : 0;
`;

code = code.replace(
  /function GlobalCommerceCard\(\{ allData \}: \{ allData: any\[\] \}\) \{[\s\S]*?const collPct = totalCollBudget > 0 \? \(totalColl \/ totalCollBudget\) \* 100 : 0;/,
  newGlobalStart.trim()
);

const newGlobalBike = `
          <div className="pt-4 grid grid-cols-2 gap-4 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
            <div>
              <p className="font-semibold text-neutral-500 uppercase">Artículos Netos</p>
              <ul className="mt-1 space-y-0.5">
                <li>Contado: \${allData.reduce((acc, curr) => acc + curr.salesContado, 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</li>
                <li>Crédito: \${allData.reduce((acc, curr) => acc + curr.salesCredito, 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-neutral-500 uppercase flex items-center gap-1"><Bike className="w-3 h-3"/> Motos ({totalMotos} uds)</p>
              <ul className="mt-1 space-y-0.5">
                <li>Contado ({totalMotosContado}): \${totalMotosValContado.toLocaleString('en-US', {minimumFractionDigits: 2})}</li>
                <li>Crédito ({totalMotosCredito}): \${totalMotosValCredito.toLocaleString('en-US', {minimumFractionDigits: 2})}</li>
                <li>Total: <span className="font-bold text-neutral-900 dark:text-white">\${totalMotosVal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></li>
              </ul>
            </div>
          </div>
`;

code = code.replace(
  /<div className="pt-2 text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-2">\s*<Bike className="w-4 h-4 text-indigo-500" \/>\s*Motos Vendidas: <span className="font-bold text-neutral-900 dark:text-white">\{totalMotos\} uds<\/span>\s*<\/div>/,
  newGlobalBike.trim()
);

const newCommerceBike = `
            <div className="pt-3 grid grid-cols-2 gap-4 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
              <div>
                <p className="font-semibold text-neutral-500 uppercase">Artículos Netos</p>
                <ul className="mt-1 space-y-0.5">
                  <li>Contado: \${(data.salesContado || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</li>
                  <li>Crédito: \${(data.salesCredito || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-neutral-500 uppercase flex items-center gap-1"><Bike className="w-3 h-3"/> Motos ({data.motoUnits} uds)</p>
                <ul className="mt-1 space-y-0.5">
                  <li>Contado ({data.motosContado}): \${(data.motosContadoVal || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</li>
                  <li>Crédito ({data.motosCredito}): \${(data.motosCreditoVal || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</li>
                  <li>Total: <span className="font-bold text-neutral-900 dark:text-white">\${((data.motosContadoVal || 0) + (data.motosCreditoVal || 0)).toLocaleString('en-US', {minimumFractionDigits: 2})}</span></li>
                </ul>
              </div>
            </div>
`;

code = code.replace(
  /<div className="pt-3 grid grid-cols-2 gap-4 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800\/50 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">[\s\S]*?<\/div>\s*<\/div>/,
  newCommerceBike.trim() + '\n          </div>'
);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log('Patched UI cards');
