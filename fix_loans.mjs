import fs from 'fs';

let content = fs.readFileSync('src/components/inventory/LoansReturnsTab.tsx', 'utf8');

content = content.replace(
  "import { Article, Warehouse, WarehouseInventory, LoanReturn } from '../../types/inventory';",
  "import { Article, Warehouse, WarehouseInventory, LoanReturn } from '../../types/inventory';\nimport { ArticleSelector } from './ArticleSelector';"
);

content = content.replace(
  "const handleItemChange = (index: number, field: string, value: any) => {",
  `const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    if (field === 'articleId') {
      const art = articles.find(a => a.id === value);
      if (art) newItems[index].name = art.name;
    }
    setItems(newItems);
  };

  const oldHandleItemChange = (index: number, field: string, value: any) => {`
);

const searchBlock = `<div className="flex-1 space-y-1">
                      <select
                        value={item.articleId}
                        onChange={(e) => handleItemChange(index, 'articleId', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs outline-none focus:border-indigo-500 text-neutral-900 dark:text-neutral-50"
                      >
                        <option value="">-- Seleccionar Artículo --</option>
                        {articles.map(art => {
                          const stock = getWarehouseStock(art.id, warehouseId);
                          return (
                            <option key={art.id} value={art.id} disabled={type === 'RETURN' && stock <= 0}>
                              {art.name} {art.series ? \`(S/N: \${art.series})\` : ''} {type === 'RETURN' ? \`- (Dis: \${stock})\` : ''}
                            </option>
                          );
                        })}
                      </select>
                      {type === 'RETURN' && item.articleId && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block px-1">
                          Disponible en bodega: <strong className="text-neutral-600 dark:text-neutral-300">{available} uds</strong>
                        </span>
                      )}
                    </div>

                    <div className="w-20">
                      <input
                        type="number"
                        min={1}
                        max={type === 'RETURN' ? available : undefined}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-center outline-none focus:border-indigo-500 text-neutral-900 dark:text-neutral-50"
                      />
                    </div>`;

const newBlock = `<div className="flex-1">
                      <ArticleSelector 
                        articles={articles}
                        inventories={inventories}
                        warehouseId={warehouseId}
                        articleId={item.articleId}
                        quantity={item.quantity}
                        selectedSeries={item.seriesList || []}
                        onChangeArticle={(id) => handleItemChange(index, 'articleId', id)}
                        onChangeQuantity={(qty) => handleItemChange(index, 'quantity', qty)}
                        onChangeSeries={(series) => handleItemChange(index, 'seriesList', series)}
                        isReceiving={type === 'LOAN'}
                      />
                    </div>`;

content = content.replace(searchBlock, newBlock);

fs.writeFileSync('src/components/inventory/LoansReturnsTab.tsx', content);
console.log("updated loans");
