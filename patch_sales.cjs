const fs = require('fs');
let code = fs.readFileSync('src/pages/Sales.tsx', 'utf8');

// 1. Add clientName to Sale interface
code = code.replace(
  `  motoType: 'combustion' | 'electrico' | null;`,
  `  motoType: 'combustion' | 'electrico' | null;\n  clientName?: string;`
);

// 2. Add clientName to formData
code = code.replace(
  `    totalValue: ''\n  });`,
  `    totalValue: '',\n    clientName: ''\n  });`
);

// 3. Add clientName to handleOpenModal (if editing)
code = code.replace(
  `        totalValue: sale.totalValue.toString()\n      });`,
  `        totalValue: sale.totalValue.toString(),\n        clientName: sale.clientName || ''\n      });`
);

// 4. Add clientName to handleOpenModal (if new)
code = code.replace(
  `        totalValue: ''\n      });`,
  `        totalValue: '',\n        clientName: ''\n      });`
);

// 5. Add clientName to handleSubmit (saleData)
code = code.replace(
  `        totalValue: parseFloat(formData.totalValue) || 0,\n      };`,
  `        totalValue: parseFloat(formData.totalValue) || 0,\n        clientName: formData.clientName,\n      };`
);

// 6. Add Filter States inside component
code = code.replace(
  `  const [editingSale, setEditingSale] = useState<Sale | null>(null);`,
  `  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  // Filters
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterDateType, setFilterDateType] = useState<'exacta' | 'rango'>('exacta');
  const [filterDateExact, setFilterDateExact] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
`
);

// 7. Add derived unique clients for datalist
code = code.replace(
  `  useEffect(() => {`,
  `  const uniqueClients = Array.from(new Set(sales.map(s => s.clientName).filter(Boolean))) as string[];

  const filteredSales = sales.filter(sale => {
    let match = true;
    const emp = employees.find(e => e.id === sale.employeeId);
    const empName = emp ? \`\${emp.name} \${emp.lastName}\`.toLowerCase() : '';
    
    if (filterEmployee && !empName.includes(filterEmployee.toLowerCase())) match = false;
    if (filterClient && !(sale.clientName || '').toLowerCase().includes(filterClient.toLowerCase())) match = false;
    
    if (filterDateType === 'exacta' && filterDateExact) {
      if (sale.date !== filterDateExact) match = false;
    } else if (filterDateType === 'rango') {
      if (filterDateStart && sale.date < filterDateStart) match = false;
      if (filterDateEnd && sale.date > filterDateEnd) match = false;
    }
    
    return match;
  });

  useEffect(() => {`
);

// 8. Replace `sales.length === 0` and `sales.map` with `filteredSales`
code = code.replace(/sales\.length === 0/g, `filteredSales.length === 0`);
code = code.replace(/sales\.map\(\(sale\)/g, `filteredSales.map((sale)`);

// 9. UI for filters and search
const filterUI = `
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-4 mb-6">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-4">Filtros de Búsqueda</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Vendedor</label>
            <input 
              type="text" 
              placeholder="Buscar vendedor..."
              value={filterEmployee}
              onChange={e => setFilterEmployee(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Cliente</label>
            <input 
              type="text" 
              placeholder="Buscar cliente..."
              value={filterClient}
              onChange={e => setFilterClient(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="col-span-1 md:col-span-2">
            <div className="flex gap-2 mb-1">
              <label className="text-xs font-medium text-neutral-500 flex-1">Fecha</label>
              <select 
                value={filterDateType} 
                onChange={e => setFilterDateType(e.target.value as any)}
                className="text-xs bg-transparent text-indigo-600 font-medium outline-none cursor-pointer"
              >
                <option value="exacta">Exacta</option>
                <option value="rango">Rango</option>
              </select>
            </div>
            {filterDateType === 'exacta' ? (
              <input 
                type="date"
                value={filterDateExact}
                onChange={e => setFilterDateExact(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            ) : (
              <div className="flex items-center gap-2">
                <input 
                  type="date"
                  value={filterDateStart}
                  onChange={e => setFilterDateStart(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span className="text-neutral-400">a</span>
                <input 
                  type="date"
                  value={filterDateEnd}
                  onChange={e => setFilterDateEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
`;

code = code.replace(
  `      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">`,
  filterUI
);

// 10. Add clientName to Table display
code = code.replace(
  `                  <th className="px-6 py-4">Empleado</th>`,
  `                  <th className="px-6 py-4">Empleado</th>\n                  <th className="px-6 py-4">Cliente</th>`
);

code = code.replace(
  `                    <td className="px-6 py-4">
                      {sale.isMoto && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-full w-fit">`,
  `                    <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 font-medium">
                      {sale.clientName || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {sale.isMoto && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-full w-fit">`
);

// 11. Add clientName to Modal Form
const formClientName = `
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-neutral-400" /> Nombre del Cliente
                </label>
                <input
                  type="text"
                  required
                  list="clients-list"
                  value={formData.clientName}
                  onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                  className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-neutral-900 dark:text-white"
                  placeholder="Ej. Juan Pérez"
                />
                <datalist id="clients-list">
                  {uniqueClients.map(client => (
                    <option key={client} value={client} />
                  ))}
                </datalist>
              </div>
`;

code = code.replace(
  `              <div className="grid grid-cols-2 gap-4">`,
  formClientName + `\n              <div className="grid grid-cols-2 gap-4">`
);


fs.writeFileSync('src/pages/Sales.tsx', code);
console.log('Patched Sales.tsx');
