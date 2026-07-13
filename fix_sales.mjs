import fs from 'fs';

let content = fs.readFileSync('src/components/inventory/SalesTab.tsx', 'utf8');

content = content.replace(
  "import { Article, Warehouse, WarehouseInventory, InventorySale } from '../../types/inventory';",
  "import { Article, Warehouse, WarehouseInventory, InventorySale } from '../../types/inventory';\nimport { ArticleSelector } from './ArticleSelector';"
);

content = content.replace(
  "const handleItemChange = (index: number, field: string, value: any) => {",
  `const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...saleItems];
    (newItems[index] as any)[field] = value;
    
    if (field === 'articleId') {
      const art = articles.find(a => a.id === value);
      if (art) newItems[index].name = art.name;
    }
    if (field === 'warehouseId') {
      const wh = warehouses.find(w => w.id === value);
      if (wh) newItems[index].warehouseName = wh.name;
      // Reset article when warehouse changes to ensure stock exists
      newItems[index].articleId = '';
    }
    
    setSaleItems(newItems);
  };

  const oldHandleItemChange = (index: number, field: string, value: any) => {`
);

const searchBlock = `<div className="grid grid-cols-2 gap-2">
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
                              className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-center outline-none focus:border-indigo-500 text-neutral-900 dark:text-neutral-50"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(index)}
                            className="p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-xl transition-all"
                            title="Quitar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>`;

const newBlock = `<div className="space-y-3">
                        <div className="flex gap-2 items-center">
                          <div className="w-1/3">
                            <label className="text-[9px] font-black text-neutral-400 uppercase tracking-wider block mb-1">Desde Bodega</label>
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
                          <div className="flex-1 mt-4">
                            <button
                              type="button"
                              onClick={() => handleItemChange(index, 'isGift', !item.isGift)}
                              className={cn(
                                "px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all w-full",
                                item.isGift 
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 ring-1 ring-purple-300 dark:ring-purple-900/50" 
                                  : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                              )}
                            >
                              <Gift className="w-3.5 h-3.5" />
                              {item.isGift ? 'Regalo' : 'Venta Estándar'}
                            </button>
                          </div>
                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(index)}
                              className="p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-xl transition-all"
                              title="Quitar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <ArticleSelector 
                            articles={articles}
                            inventories={inventories}
                            warehouseId={item.warehouseId}
                            articleId={item.articleId}
                            quantity={item.quantity}
                            selectedSeries={item.seriesList || []}
                            onChangeArticle={(id) => handleItemChange(index, 'articleId', id)}
                            onChangeQuantity={(qty) => handleItemChange(index, 'quantity', qty)}
                            onChangeSeries={(series) => handleItemChange(index, 'seriesList', series)}
                          />
                        </div>
                      </div>`;

content = content.replace(searchBlock, newBlock);

fs.writeFileSync('src/components/inventory/SalesTab.tsx', content);
console.log("updated sales");
