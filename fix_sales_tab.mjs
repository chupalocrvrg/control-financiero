import fs from 'fs';

let content = fs.readFileSync('src/components/inventory/SalesTab.tsx', 'utf8');

// Replace the two selects and quantity input with ArticleSelector

const targetStr = `                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-black text-neutral-400 uppercase tracking-wider">Artículo</label>
                          <select
                            value={item.articleId}
                            onChange={(e) => handleItemChange(index, 'articleId', e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs outline-none focus:border-indigo-500 text-neutral-900 dark:text-neutral-50"
                          >
                            <option value="">-- Seleccionar --</option>
                            {articles.map(art => (
                              <option key={art.id} value={art.id}>{art.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] font-black text-neutral-400 uppercase tracking-wider">Desde Bodega</label>
                          <select
                            value={item.warehouseId}
                            onChange={(e) => handleItemChange(index, 'warehouseId', e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs outline-none focus:border-indigo-500 text-neutral-900 dark:text-neutral-50"
                          >
                            {warehouses.map(wh => (
                              <option key={wh.id} value={wh.id}>{wh.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-1">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleItemChange(index, 'isGift', !item.isGift)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all",
                              item.isGift 
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 ring-1 ring-purple-300 dark:ring-purple-900/50" 
                                : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                            )}
                          >
                            <Gift className="w-3.5 h-3.5" />
                            {item.isGift ? 'Regalo' : 'Venta Estándar'}
                          </button>

                          {item.articleId && (
                            <span className="text-[9px] font-bold uppercase text-neutral-400">
                              Disponibles: <strong className="text-neutral-600 dark:text-neutral-300">{available} uds</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-16">
                            <input
                              type="number"
                              min={1}
                              max={available || 1}
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', Math.max(1, parseInt(e.target.value) || 0))}
                              className="w-full px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-center outline-none focus:border-indigo-500 text-neutral-900 dark:text-neutral-50"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(index)}
                            disabled={saleItems.length === 1}
                            className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all disabled:opacity-30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>`;

const newStr = `                      <div className="space-y-3">
                        <div>
                          <label className="text-[9px] font-black text-neutral-400 uppercase tracking-wider block mb-1">Desde Bodega</label>
                          <select
                            value={item.warehouseId}
                            onChange={(e) => handleItemChange(index, 'warehouseId', e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs outline-none focus:border-indigo-500 text-neutral-900 dark:text-neutral-50 uppercase"
                          >
                            {warehouses.map(wh => (
                              <option key={wh.id} value={wh.id}>{wh.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                           <label className="text-[9px] font-black text-neutral-400 uppercase tracking-wider block mb-1">Artículo a vender</label>
                           {item.warehouseId ? (
                             <ArticleSelector
                                articles={articles}
                                inventories={inventories}
                                warehouseId={item.warehouseId}
                                articleId={item.articleId}
                                quantity={item.quantity}
                                selectedSeries={item.selectedSeries || []}
                                onChangeArticle={(id) => handleItemChange(index, 'articleId', id)}
                                onChangeQuantity={(q) => handleItemChange(index, 'quantity', q)}
                                onChangeSeries={(s) => handleItemChange(index, 'selectedSeries', s)}
                             />
                           ) : (
                             <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 text-center text-xs text-neutral-500 uppercase tracking-wider font-bold">
                               Seleccione una bodega primero
                             </div>
                           )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleItemChange(index, 'isGift', !item.isGift)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all",
                              item.isGift 
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 ring-1 ring-purple-300 dark:ring-purple-900/50" 
                                : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                            )}
                          >
                            <Gift className="w-3.5 h-3.5" />
                            {item.isGift ? 'Regalo' : 'Venta Estándar'}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(index)}
                            disabled={saleItems.length === 1}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Quitar
                          </button>
                        </div>
                      </div>`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, newStr);
    fs.writeFileSync('src/components/inventory/SalesTab.tsx', content);
    console.log('SalesTab updated successfully!');
} else {
    console.log('Target string not found in SalesTab.tsx');
}
