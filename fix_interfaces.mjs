import fs from 'fs';

// 1. TransfersTab
let content = fs.readFileSync('src/components/inventory/TransfersTab.tsx', 'utf8');
content = content.replace(
  /interface TransferItemRow {\s*articleId: string;\s*quantity: number;\s*}/,
  "interface TransferItemRow {\n  articleId: string;\n  name?: string;\n  quantity: number;\n  seriesList?: string[];\n}"
);
fs.writeFileSync('src/components/inventory/TransfersTab.tsx', content);

// 2. LoansReturnsTab
content = fs.readFileSync('src/components/inventory/LoansReturnsTab.tsx', 'utf8');
content = content.replace(
  /interface LoanReturnItemRow {\s*articleId: string;\s*quantity: number;\s*}/,
  "interface LoanReturnItemRow {\n  articleId: string;\n  name?: string;\n  quantity: number;\n  seriesList?: string[];\n}"
);
fs.writeFileSync('src/components/inventory/LoansReturnsTab.tsx', content);

// 3. SalesTab
content = fs.readFileSync('src/components/inventory/SalesTab.tsx', 'utf8');
content = content.replace(
  /interface SaleItemRow {\s*articleId: string;\s*warehouseId: string;\s*quantity: number;\s*isGift: boolean;\s*}/,
  "interface SaleItemRow {\n  articleId: string;\n  name?: string;\n  warehouseId: string;\n  warehouseName?: string;\n  quantity: number;\n  isGift: boolean;\n  seriesList?: string[];\n}"
);
fs.writeFileSync('src/components/inventory/SalesTab.tsx', content);

// 4. inventory-db.ts (revertSale)
content = fs.readFileSync('src/lib/inventory-db.ts', 'utf8');
content = content.replace(
  "articlesList: Array<{ articleId: string; quantity: number; warehouseId: string; isGift: boolean }>",
  "articlesList: Array<{ articleId: string; quantity: number; warehouseId: string; isGift: boolean; seriesList?: string[] }>"
);
fs.writeFileSync('src/lib/inventory-db.ts', content);

console.log("fixed interfaces");
