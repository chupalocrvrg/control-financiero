import fs from 'fs';

let content = fs.readFileSync('src/lib/inventory-db.ts', 'utf8');

// Replace executeTransfer's adjustStock calls
content = content.replace(
  /await adjustStockAndGlobalQuantity\(batch, fromWarehouseId, item\.articleId, -item\.quantity, userId\);/g,
  "await adjustStockAndGlobalQuantity(batch, fromWarehouseId, item.articleId, -item.quantity, userId, item.seriesList);"
);
content = content.replace(
  /await adjustStockAndGlobalQuantity\(batch, toWarehouseId, item\.articleId, item\.quantity, userId\);/g,
  "await adjustStockAndGlobalQuantity(batch, toWarehouseId, item.articleId, item.quantity, userId, item.seriesList);"
);

// Replace executeLoanReturn's adjustStock calls
content = content.replace(
  /await adjustStockAndGlobalQuantity\(batch, warehouseId, item\.articleId, item\.quantity, userId\);/g,
  "await adjustStockAndGlobalQuantity(batch, warehouseId, item.articleId, item.quantity, userId, item.seriesList);"
);
content = content.replace(
  /await adjustStockAndGlobalQuantity\(batch, warehouseId, item\.articleId, -item\.quantity, userId\);/g,
  "await adjustStockAndGlobalQuantity(batch, warehouseId, item.articleId, -item.quantity, userId, item.seriesList);"
);

// Replace executeSale's adjustStock call
content = content.replace(
  /await adjustStockAndGlobalQuantity\(batch, item\.warehouseId, item\.articleId, -item\.quantity, userId\);/g,
  "await adjustStockAndGlobalQuantity(batch, item.warehouseId, item.articleId, -item.quantity, userId, item.seriesList);"
);

// Replace Reverts
content = content.replace(
  /await adjustStockAndGlobalQuantity\(batch, fromWarehouseId, item\.articleId, qToRevert, userId\);/g,
  "await adjustStockAndGlobalQuantity(batch, fromWarehouseId, item.articleId, qToRevert, userId, item.seriesList);"
);
content = content.replace(
  /await adjustStockAndGlobalQuantity\(batch, toWarehouseId, item\.articleId, -qToRevert, userId\);/g,
  "await adjustStockAndGlobalQuantity(batch, toWarehouseId, item.articleId, -qToRevert, userId, item.seriesList);"
);
content = content.replace(
  /await adjustStockAndGlobalQuantity\(batch, warehouseId, item\.articleId, -qToRevert, userId\);/g,
  "await adjustStockAndGlobalQuantity(batch, warehouseId, item.articleId, -qToRevert, userId, item.seriesList);"
);
// note: for revertSale, the variable is item.quantity, and warehouseId is item.warehouseId
content = content.replace(
  /await adjustStockAndGlobalQuantity\(batch, item\.warehouseId, item\.articleId, item\.quantity, userId\);/g,
  "await adjustStockAndGlobalQuantity(batch, item.warehouseId, item.articleId, item.quantity, userId, item.seriesList);"
);

fs.writeFileSync('src/lib/inventory-db.ts', content);
console.log("fixed db calls");
