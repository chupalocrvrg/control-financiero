const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(
  /<section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">[\s\S]*?<\/section>/,
  `      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <div className="p-1.5 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">Prioridad</span>
          </div>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total Vencido</p>
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50 mt-0.5">{formatCurrency(overdueTotal, settings.currency)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <div className="p-1.5 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <Bell className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded">Hoy</span>
          </div>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Para Cobro Hoy</p>
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50 mt-0.5">{formatCurrency(todayTotal, settings.currency)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">Mañana</span>
          </div>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Próximos Cobros</p>
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50 mt-0.5">{formatCurrency(tomorrowTotal, settings.currency)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <DollarSign className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded text-right">General</span>
          </div>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Checks Pen.</p>
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50 mt-0.5">{checks.filter(c => c.status === 'PENDING').length} Unidades</p>
        </div>
      </section>`
);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log('Patched KPI sizes');
