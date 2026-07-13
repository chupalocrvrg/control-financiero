import fs from 'fs';

// 1. TransfersTab
let content = fs.readFileSync('src/components/inventory/TransfersTab.tsx', 'utf8');
if (!content.includes('import { ArticleSelector }')) {
  content = content.replace(
    "import { Warehouse, Article, WarehouseInventory, Transfer } from '../../types/inventory';",
    "import { Warehouse, Article, WarehouseInventory, Transfer } from '../../types/inventory';\nimport { ArticleSelector } from './ArticleSelector';"
  );
}
content = content.replace(
  "interface TransferItemRow {\n  articleId: string;\n  name?: string;\n  quantity: number;\n}",
  "interface TransferItemRow {\n  articleId: string;\n  name?: string;\n  quantity: number;\n  seriesList?: string[];\n}"
);
fs.writeFileSync('src/components/inventory/TransfersTab.tsx', content);


// 2. LoansReturnsTab
content = fs.readFileSync('src/components/inventory/LoansReturnsTab.tsx', 'utf8');
if (!content.includes('import { ArticleSelector }')) {
  content = content.replace(
    "import { Warehouse, Article, WarehouseInventory, LoanReturn } from '../../types/inventory';",
    "import { Warehouse, Article, WarehouseInventory, LoanReturn } from '../../types/inventory';\nimport { ArticleSelector } from './ArticleSelector';"
  );
}
content = content.replace(
  "interface LoanReturnItemRow {\n  articleId: string;\n  name?: string;\n  quantity: number;\n}",
  "interface LoanReturnItemRow {\n  articleId: string;\n  name?: string;\n  quantity: number;\n  seriesList?: string[];\n}"
);
fs.writeFileSync('src/components/inventory/LoansReturnsTab.tsx', content);


// 3. SalesTab
content = fs.readFileSync('src/components/inventory/SalesTab.tsx', 'utf8');
if (!content.includes('import { ArticleSelector }')) {
  content = content.replace(
    "import { Warehouse, Article, WarehouseInventory, InventorySale } from '../../types/inventory';",
    "import { Warehouse, Article, WarehouseInventory, InventorySale } from '../../types/inventory';\nimport { ArticleSelector } from './ArticleSelector';"
  );
}
content = content.replace(
  "interface SaleItemRow {\n  articleId: string;\n  name?: string;\n  warehouseId: string;\n  warehouseName?: string;\n  quantity: number;\n  isGift: boolean;\n}",
  "interface SaleItemRow {\n  articleId: string;\n  name?: string;\n  warehouseId: string;\n  warehouseName?: string;\n  quantity: number;\n  isGift: boolean;\n  seriesList?: string[];\n}"
);
fs.writeFileSync('src/components/inventory/SalesTab.tsx', content);

console.log("fixed imports and types");
