import fs from 'fs';

let content = fs.readFileSync('src/lib/inventory-db.ts', 'utf8');

content = content.replace(
  "export async function adjustStockAndGlobalQuantity(",
  "export async function adjustStockAndGlobalQuantity(\n  batch: any,\n  warehouseId: string,\n  articleId: string,\n  quantityChange: number,\n  userId: string,\n  seriesListChange?: string[]\n) {\n  const invId = `${warehouseId}_${articleId}`;\n  const invRef = doc(db, 'warehouse_inventory', invId);\n  const invSnap = await getDoc(invRef);\n  \n  let currentInvQty = 0;\n  let currentInvSeries: string[] = [];\n  if (invSnap.exists()) {\n    currentInvQty = invSnap.data().quantity || 0;\n    currentInvSeries = invSnap.data().seriesList || [];\n  }\n  \n  const newInvQty = Math.max(0, currentInvQty + quantityChange);\n  let newInvSeries = [...currentInvSeries];\n  if (seriesListChange && seriesListChange.length > 0) {\n    if (quantityChange > 0) {\n      newInvSeries = [...newInvSeries, ...seriesListChange];\n    } else {\n      newInvSeries = newInvSeries.filter(s => !seriesListChange.includes(s));\n    }\n  }\n\n  batch.set(invRef, {\n    id: invId,\n    warehouseId,\n    articleId,\n    quantity: newInvQty,\n    seriesList: newInvSeries,\n    userId\n  }, { merge: true });\n\n  // Update global article stock\n  const articleRef = doc(db, 'articles', articleId);\n  const articleSnap = await getDoc(articleRef);\n  if (articleSnap.exists()) {\n    const currentGlobalQty = articleSnap.data().quantity || 0;\n    const newGlobalQty = Math.max(0, currentGlobalQty + quantityChange);\n    \n    let currentGlobalSeries = articleSnap.data().seriesList || [];\n    let newGlobalSeries = [...currentGlobalSeries];\n    if (seriesListChange && seriesListChange.length > 0) {\n      if (quantityChange > 0) {\n        newGlobalSeries = [...newGlobalSeries, ...seriesListChange];\n      } else {\n        newGlobalSeries = newGlobalSeries.filter(s => !seriesListChange.includes(s));\n      }\n    }\n\n    batch.update(articleRef, { quantity: newGlobalQty, seriesList: newGlobalSeries });\n  }\n}\n\n/*"
);

// We commented out the original adjustStockAndGlobalQuantity with /*
content = content.replace("/**\n * Executes a warehouse-to-warehouse stock transfer.", "*/\n/**\n * Executes a warehouse-to-warehouse stock transfer.");

// Update executeTransfer
content = content.replace(
  "articlesList: Array<{ articleId: string; quantity: number }>,",
  "articlesList: Array<{ articleId: string; quantity: number; seriesList?: string[] }>,"
);

content = content.replace(
  "const artSeries = artSnap.exists() ? artSnap.data().series || '' : '';\n    \n    // Subtract from source warehouse\n    await adjustStockAndGlobalQuantity(batch, fromWarehouseId, item.articleId, -item.quantity, userId);\n    // Add to target warehouse\n    await adjustStockAndGlobalQuantity(batch, toWarehouseId, item.articleId, item.quantity, userId);\n    \n    detailedArticles.push({\n      articleId: item.articleId,\n      name: artName,\n      quantity: item.quantity,\n      series: artSeries\n    });",
  `// Subtract from source warehouse
    await adjustStockAndGlobalQuantity(batch, fromWarehouseId, item.articleId, -item.quantity, userId, item.seriesList);
    // Add to target warehouse (global change net 0, series moved correctly)
    await adjustStockAndGlobalQuantity(batch, toWarehouseId, item.articleId, item.quantity, userId, item.seriesList);
    
    detailedArticles.push({
      articleId: item.articleId,
      name: artName,
      quantity: item.quantity,
      seriesList: item.seriesList || []
    });`
);

// Update executeLoanReturn
content = content.replace(
  "articlesList: Array<{ articleId: string; quantity: number }>,",
  "articlesList: Array<{ articleId: string; quantity: number; seriesList?: string[] }>,"
);

content = content.replace(
  `const artSeries = artSnap.exists() ? artSnap.data().series || '' : '';

    if (type === 'LOAN') {
      if (!isDirectSale) {
        // We receive items, so add to warehouse
        await adjustStockAndGlobalQuantity(batch, warehouseId, item.articleId, item.quantity, userId);
      } else {
        // Direct sale: no inventory changes, but we still record the transaction.
      }
    } else {
      // RETURN: we return items from warehouse back to commercial house
      await adjustStockAndGlobalQuantity(batch, warehouseId, item.articleId, -item.quantity, userId);
    }

    detailedArticles.push({
      articleId: item.articleId,
      name: artName,
      quantity: item.quantity,
      series: artSeries
    });`,
  `if (type === 'LOAN') {
      if (!isDirectSale) {
        await adjustStockAndGlobalQuantity(batch, warehouseId, item.articleId, item.quantity, userId, item.seriesList);
      }
    } else {
      await adjustStockAndGlobalQuantity(batch, warehouseId, item.articleId, -item.quantity, userId, item.seriesList);
    }

    detailedArticles.push({
      articleId: item.articleId,
      name: artName,
      quantity: item.quantity,
      seriesList: item.seriesList || []
    });`
);

// Update executeSale
content = content.replace(
  "articlesList: Array<{ articleId: string; warehouseId: string; quantity: number; isGift: boolean }>,",
  "articlesList: Array<{ articleId: string; warehouseId: string; quantity: number; isGift: boolean; seriesList?: string[] }>,"
);

content = content.replace(
  `// Subtract stock
    await adjustStockAndGlobalQuantity(batch, item.warehouseId, item.articleId, -item.quantity, userId);

    detailedArticles.push({
      articleId: item.articleId,
      name: artName,
      quantity: item.quantity,
      warehouseId: item.warehouseId,
      warehouseName,
      isGift: item.isGift
    });`,
  `// Subtract stock
    await adjustStockAndGlobalQuantity(batch, item.warehouseId, item.articleId, -item.quantity, userId, item.seriesList);

    detailedArticles.push({
      articleId: item.articleId,
      name: artName,
      quantity: item.quantity,
      warehouseId: item.warehouseId,
      warehouseName,
      isGift: item.isGift,
      seriesList: item.seriesList || []
    });`
);

fs.writeFileSync('src/lib/inventory-db.ts', content);
console.log("updated db");
