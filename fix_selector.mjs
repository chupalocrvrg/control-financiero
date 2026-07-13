import fs from 'fs';

let content = fs.readFileSync('src/components/inventory/ArticleSelector.tsx', 'utf8');

content = content.replace(
  "export function ArticleSelector({ articles, inventories, warehouseId, articleId, quantity, selectedSeries, onChangeArticle, onChangeQuantity, onChangeSeries, maxQuantityStr, className }: Props) {",
  `interface ExtendedProps extends Props {
  isReceiving?: boolean;
}

export function ArticleSelector({ articles, inventories, warehouseId, articleId, quantity, selectedSeries, onChangeArticle, onChangeQuantity, onChangeSeries, maxQuantityStr, className, isReceiving = false }: ExtendedProps) {`
);

content = content.replace(
  `onClick={() => stock > 0 ? handleSelect(art) : null}
                        className={cn("p-2 text-xs border-b border-neutral-100 dark:border-neutral-700/50 last:border-0", stock > 0 ? "hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer" : "opacity-50 cursor-not-allowed")}`,
  `onClick={() => (stock > 0 || isReceiving) ? handleSelect(art) : null}
                        className={cn("p-2 text-xs border-b border-neutral-100 dark:border-neutral-700/50 last:border-0", (stock > 0 || isReceiving) ? "hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer" : "opacity-50 cursor-not-allowed")}`
);

content = content.replace(
  `disabled={!articleId}
              className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-center outline-none focus:border-indigo-500 text-neutral-900 dark:text-neutral-50 disabled:opacity-50"`,
  `disabled={!articleId}
              className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-center outline-none focus:border-indigo-500 text-neutral-900 dark:text-neutral-50 disabled:opacity-50"
              {...(isReceiving ? {} : { max: availableStock || 1 })}`
);

content = content.replace(
  /max=\{availableStock \|\| 1\}/,
  ""
); // removed old max to apply conditionally above

const seriesUI = `{selectedArticle?.requiresSeries && availableSeries.length > 0 && (
        <div className="mt-2 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">Seleccione Series ({selectedSeries.length} seleccionadas)</p>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {availableSeries.map(s => (
              <label key={s} className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-mono cursor-pointer transition-all", selectedSeries.includes(s) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-indigo-300")}>
                <input type="checkbox" checked={selectedSeries.includes(s)} onChange={() => toggleSeries(s)} className="sr-only" />
                {s}
              </label>
            ))}
          </div>
        </div>
      )}`;

const updatedSeriesUI = `{selectedArticle?.requiresSeries && (
        <div className="mt-2 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-3">
          {isReceiving ? (
            <>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">Ingrese Series ({selectedSeries.length} detectadas)</p>
              <textarea
                placeholder="Ingrese series separadas por coma o salto de línea"
                value={selectedSeries.join('\\n')}
                onChange={(e) => {
                  const arr = e.target.value.split(/[\\n,]+/).map(s => s.trim()).filter(Boolean);
                  onChangeSeries(arr);
                  onChangeQuantity(Math.max(1, arr.length));
                }}
                rows={3}
                className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs outline-none focus:border-indigo-500 text-neutral-900 dark:text-neutral-50 transition-all uppercase font-mono"
              />
            </>
          ) : (
            availableSeries.length > 0 ? (
              <>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">Seleccione Series ({selectedSeries.length} seleccionadas)</p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {availableSeries.map(s => (
                    <label key={s} className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-mono cursor-pointer transition-all", selectedSeries.includes(s) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-indigo-300")}>
                      <input type="checkbox" checked={selectedSeries.includes(s)} onChange={() => toggleSeries(s)} className="sr-only" />
                      {s}
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-[10px] font-black uppercase tracking-widest text-red-500">No hay series disponibles para seleccionar.</p>
            )
          )}
        </div>
      )}`;

content = content.replace(seriesUI, updatedSeriesUI);

fs.writeFileSync('src/components/inventory/ArticleSelector.tsx', content);
console.log("updated selector");
