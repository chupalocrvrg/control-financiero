#!/bin/bash
node -e "
const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const commerceUI = \`

      {/* Commerce Section */}
      <section className=\\"space-y-6 pt-8 border-t border-neutral-200 dark:border-neutral-800\\">
        <div>
          <h2 className=\\"text-2xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight flex items-center gap-2\\">
            <Store className=\\"w-6 h-6 text-indigo-500\\" />
            Rendimiento Comercial (Mes Actual)
          </h2>
          <p className=\\"text-neutral-500 dark:text-neutral-400 text-sm mt-1\\">Progreso de ventas y cobranzas vs presupuestos</p>
        </div>

        {user?.email === 'marcelogutama3eroa@gmail.com' ? (
          <div className=\\"grid grid-cols-1 md:grid-cols-2 gap-6\\">
            {allCommerceData.map((data, idx) => (
              <CommerceCard key={idx} data={data} />
            ))}
          </div>
        ) : (
          <div>
            {commerceData ? (
              <CommerceCard data={commerceData} />
            ) : (
              <div className=\\"p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-center text-neutral-500\\">
                No hay un perfil de empleado asignado a tu correo electrónico.
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  );
}

function CommerceCard({ data }: { data: any }) {
  const salesPct = data.salesBudget > 0 ? (data.totalSales / data.salesBudget) * 100 : 0;
  const collPct = data.collectionsBudget > 0 ? (data.totalCollections / data.collectionsBudget) * 100 : 0;
  
  const canSell = data.employee.role === 'vendedor' || data.employee.role === 'ambos';
  const canCollect = data.employee.role === 'cobrador' || data.employee.role === 'ambos';

  return (
    <div className=\\"bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm\\">
      <h3 className=\\"text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2 mb-4\\">
        <User className=\\"w-5 h-5 text-neutral-400\\" />
        {data.employee.name} {data.employee.lastName}
        <span className=\\"ml-2 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500\\">
          {data.employee.role}
        </span>
      </h3>

      <div className=\\"space-y-6\\">
        {canSell && (
          <div className=\\"space-y-2\\">
            <div className=\\"flex justify-between items-end\\">
              <div>
                <p className=\\"text-xs font-semibold text-neutral-500 uppercase tracking-wider\\">Ventas Netas</p>
                <div className=\\"flex items-baseline gap-2\\">
                  <p className=\\"text-2xl font-bold text-indigo-600 dark:text-indigo-400\\">
                    \$\\{data.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className=\\"text-sm text-neutral-500\\">/ \$\\{data.salesBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div className=\\"text-right\\">
                <span className={\`text-lg font-bold \${salesPct >= 100 ? 'text-emerald-500' : 'text-neutral-900 dark:text-white'}\`}>
                  {salesPct.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className=\\"w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2\\">
              <div 
                className={\`h-2 rounded-full \${salesPct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}\`} 
                style={{ width: \`\${Math.min(salesPct, 100)}%\` }} 
              />
            </div>
            
            <div className=\\"pt-2 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400\\">
              <Bike className=\\"w-4 h-4 text-indigo-500\\" />
              Motos Vendidas: <span className=\\"font-bold text-neutral-900 dark:text-white\\">{data.motoUnits} uds</span> <span className=\\"text-xs text-neutral-500 font-normal\\">(Combustión: {data.motoCombustion} | Eléctricas: {data.motoElectric})</span>
            </div>
          </div>
        )}

        {canCollect && (
          <div className=\\"space-y-2\\">
            <div className=\\"flex justify-between items-end\\">
              <div>
                <p className=\\"text-xs font-semibold text-neutral-500 uppercase tracking-wider\\">Cobranzas</p>
                <div className=\\"flex items-baseline gap-2\\">
                  <p className=\\"text-2xl font-bold text-emerald-600 dark:text-emerald-400\\">
                    \$\\{data.totalCollections.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className=\\"text-sm text-neutral-500\\">/ \$\\{data.collectionsBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div className=\\"text-right\\">
                <span className={\`text-lg font-bold \${collPct >= 100 ? 'text-emerald-500' : 'text-neutral-900 dark:text-white'}\`}>
                  {collPct.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className=\\"w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2\\">
              <div 
                className={\`h-2 rounded-full \${collPct >= 100 ? 'bg-emerald-500' : 'bg-emerald-400'}\`} 
                style={{ width: \`\${Math.min(collPct, 100)}%\` }} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}\`;

const idx = code.lastIndexOf('</div>\\n  );\\n}');
if (idx !== -1) {
    code = code.substring(0, idx) + commerceUI;
    fs.writeFileSync('src/pages/Dashboard.tsx', code);
    console.log('Patched');
} else {
    console.log('Not found');
    console.log(code.slice(-50));
}
"
chmod +x patch_ui_final.sh
./patch_ui_final.sh
