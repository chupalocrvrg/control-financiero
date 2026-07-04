const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Update CommerceData Interface
code = code.replace(
  `  motoElectric: number;\n}`,
  `  motoElectric: number;\n  salesContado: number;\n  salesCredito: number;\n  motosContado: number;\n  motosCredito: number;\n}`
);

// Update loadDashboardData commerce mapping
code = code.replace(
  `        const empSales = sales.filter(s => s.employeeId === emp.id);
        const totalSales = empSales.filter(s => !s.isMoto).reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
        const motoUnits = empSales.filter(s => s.isMoto).length;
        const motoCombustion = empSales.filter(s => s.isMoto && s.motoType === 'combustion').length;
        const motoElectric = empSales.filter(s => s.isMoto && s.motoType === 'electrico').length;`,
  `        const empSales = sales.filter(s => s.employeeId === emp.id);
        const totalSales = empSales.filter(s => !s.isMoto).reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
        const salesContado = empSales.filter(s => !s.isMoto && s.type === 'contado').reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
        const salesCredito = empSales.filter(s => !s.isMoto && s.type === 'credito').reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
        const motoUnits = empSales.filter(s => s.isMoto).length;
        const motoCombustion = empSales.filter(s => s.isMoto && s.motoType === 'combustion').length;
        const motoElectric = empSales.filter(s => s.isMoto && s.motoType === 'electrico').length;
        const motosContado = empSales.filter(s => s.isMoto && s.type === 'contado').length;
        const motosCredito = empSales.filter(s => s.isMoto && s.type === 'credito').length;`
);

code = code.replace(
  `          totalCollections,
          motoUnits,
          motoCombustion,
          motoElectric
        };`,
  `          totalCollections,
          motoUnits,
          motoCombustion,
          motoElectric,
          salesContado,
          salesCredito,
          motosContado,
          motosCredito
        };`
);

// Add selectedCommerceEmployee state
code = code.replace(
  `  const [allCommerceData, setAllCommerceData] = useState<CommerceData[]>([]);`,
  `  const [allCommerceData, setAllCommerceData] = useState<CommerceData[]>([]);\n  const [selectedCommerceEmployee, setSelectedCommerceEmployee] = useState<string>('global');`
);

// Replace Commerce Section Rendering
const commerceSectionReplacement = `
      {/* Commerce Section */}
      <section className="space-y-6 pt-8 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight flex items-center gap-2">
              <Store className="w-6 h-6 text-indigo-500" />
              Rendimiento Comercial (Mes Actual)
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Progreso de ventas y cobranzas vs presupuestos</p>
          </div>
          <div>
            <select
              value={selectedCommerceEmployee}
              onChange={(e) => setSelectedCommerceEmployee(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none text-neutral-900 dark:text-neutral-100"
            >
              <option value="global">Resumen Global</option>
              {allCommerceData.map(d => (
                <option key={d.employee.id} value={d.employee.id}>{d.employee.name} {d.employee.lastName}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedCommerceEmployee === 'global' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlobalCommerceCard allData={allCommerceData} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allCommerceData.filter(d => d.employee.id === selectedCommerceEmployee).map((data, idx) => (
              <CommerceCard key={idx} data={data} />
            ))}
          </div>
        )}
      </section>
`;

// Replace the previous rendering:
code = code.replace(
  /      \{\/\* Commerce Section \*\/\}[\s\S]*?      <\/section>/,
  commerceSectionReplacement.trim()
);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log('Patched Dashboard.tsx mappings and ui');
