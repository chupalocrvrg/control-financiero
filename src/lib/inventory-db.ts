import { db } from '../firebase';
import { 
  collection, 
  doc, 
  runTransaction, 
  Timestamp 
} from 'firebase/firestore';

type StockAdjustment = {
  warehouseId: string; // If empty, only adjusts global stock
  articleId: string;
  quantityChange: number;
  seriesListChange?: string[];
};

/**
 * Helper to process all stock adjustments safely within a transaction.
 * Enforces Firestore's rule: all reads must happen before any writes.
 */
async function processStockAdjustments(
  transaction: any,
  userId: string,
  adjustments: StockAdjustment[]
) {
  const invRefs = new Map();
  const artRefs = new Map();

  // 1. Collect all document references needed
  for (const adj of adjustments) {
    if (adj.warehouseId) {
      const invId = `${adj.warehouseId}_${adj.articleId}`;
      if (!invRefs.has(invId)) {
        invRefs.set(invId, doc(db, 'warehouse_inventory', invId));
      }
    }
    if (!artRefs.has(adj.articleId)) {
      artRefs.set(adj.articleId, doc(db, 'articles', adj.articleId));
    }
  }

  // 2. Read all data first (Firestore Requirement)
  const invSnaps = new Map();
  const artSnaps = new Map();

  for (const [id, ref] of invRefs.entries()) {
    invSnaps.set(id, await transaction.get(ref));
  }
  for (const [id, ref] of artRefs.entries()) {
    artSnaps.set(id, await transaction.get(ref));
  }

  // 3. Process changes logically in memory
  const invUpdates = new Map();
  const artUpdates = new Map();

  for (const adj of adjustments) {
    // Inventory changes
    if (adj.warehouseId) {
      const invId = `${adj.warehouseId}_${adj.articleId}`;
      const snap = invSnaps.get(invId);
      
      let currentInv = invUpdates.get(invId);
      if (!currentInv) {
        currentInv = {
          quantity: snap?.exists() ? snap.data().quantity || 0 : 0,
          seriesList: snap?.exists() ? [...(snap.data().seriesList || [])] : []
        };
      }
      
      currentInv.quantity = Math.max(0, currentInv.quantity + adj.quantityChange);
      
      if (adj.seriesListChange && adj.seriesListChange.length > 0) {
        if (adj.quantityChange > 0) {
          currentInv.seriesList = [...currentInv.seriesList, ...adj.seriesListChange];
        } else {
          currentInv.seriesList = currentInv.seriesList.filter((s: string) => !adj.seriesListChange!.includes(s));
        }
      }
      
      invUpdates.set(invId, currentInv);
    }

    // Global Article changes
    const artSnap = artSnaps.get(adj.articleId);
    if (artSnap?.exists()) {
      let currentArt = artUpdates.get(adj.articleId);
      if (!currentArt) {
        currentArt = {
          quantity: artSnap.data().quantity || 0,
          seriesList: [...(artSnap.data().seriesList || [])]
        };
      }
      
      currentArt.quantity = Math.max(0, currentArt.quantity + adj.quantityChange);
      
      if (adj.seriesListChange && adj.seriesListChange.length > 0) {
        if (adj.quantityChange > 0) {
          currentArt.seriesList = [...currentArt.seriesList, ...adj.seriesListChange];
        } else {
          currentArt.seriesList = currentArt.seriesList.filter((s: string) => !adj.seriesListChange!.includes(s));
        }
      }
      
      artUpdates.set(adj.articleId, currentArt);
    }
  }

  // 4. Perform all writes
  for (const [invId, update] of invUpdates.entries()) {
    const ref = invRefs.get(invId);
    const [warehouseId, articleId] = invId.split('_');
    transaction.set(ref, {
      id: invId,
      warehouseId,
      articleId,
      quantity: update.quantity,
      seriesList: update.seriesList,
      userId
    }, { merge: true });
  }

  for (const [articleId, update] of artUpdates.entries()) {
    const ref = artRefs.get(articleId);
    transaction.update(ref, {
      quantity: update.quantity,
      seriesList: update.seriesList
    });
  }
}

/**
 * Executes a warehouse-to-warehouse stock transfer.
 */
export async function executeTransfer(
  userId: string,
  fromWarehouseId: string,
  toWarehouseId: string,
  articlesList: Array<{ articleId: string; quantity: number; seriesList?: string[] }>,
  reason: string,
  comment: string
) {
  await runTransaction(db, async (transaction) => {
    // Fetch names for warehouses to store in the transfer record
    const fromSnap = await transaction.get(doc(db, 'warehouses', fromWarehouseId));
    const toSnap = await transaction.get(doc(db, 'warehouses', toWarehouseId));
    const fromName = fromSnap.exists() ? fromSnap.data().name : 'Desconocida';
    const toName = toSnap.exists() ? toSnap.data().name : 'Desconocida';

    const detailedArticles = [];
    const adjustments: StockAdjustment[] = [];

    for (const item of articlesList) {
      const artSnap = await transaction.get(doc(db, 'articles', item.articleId));
      const artName = artSnap.exists() ? artSnap.data().name : 'Articulo';
      const artSeries = artSnap.exists() ? artSnap.data().series || '' : '';

      // Subtract from source warehouse
      adjustments.push({ warehouseId: fromWarehouseId, articleId: item.articleId, quantityChange: -item.quantity, seriesListChange: item.seriesList });
      // Add to target warehouse
      adjustments.push({ warehouseId: toWarehouseId, articleId: item.articleId, quantityChange: item.quantity, seriesListChange: item.seriesList });

      detailedArticles.push({
        articleId: item.articleId,
        name: artName,
        quantity: item.quantity,
        series: artSeries
      });
    }

    await processStockAdjustments(transaction, userId, adjustments);

    const transferRef = doc(collection(db, 'transfers'));
    transaction.set(transferRef, {
      fromWarehouseId,
      fromWarehouseName: fromName,
      toWarehouseId,
      toWarehouseName: toName,
      articles: detailedArticles,
      reason,
      comment,
      timestamp: Timestamp.now(),
      userId
    });
  });
}

/**
 * Executes a Loan or Return from a commercial house.
 */
export async function executeLoanReturn(
  userId: string,
  type: 'LOAN' | 'RETURN',
  commercialHouse: string,
  warehouseId: string, // optional/empty if direct sale & type === 'LOAN'
  isDirectSale: boolean,
  articlesList: Array<{ articleId: string; quantity: number; seriesList?: string[] }>,
  personName: string,
  comment: string
) {
  await runTransaction(db, async (transaction) => {
    let warehouseName = 'Venta Directa';
    if (warehouseId) {
      const whSnap = await transaction.get(doc(db, 'warehouses', warehouseId));
      warehouseName = whSnap.exists() ? whSnap.data().name : 'Desconocida';
    }

    const detailedArticles = [];
    const adjustments: StockAdjustment[] = [];

    for (const item of articlesList) {
      const artSnap = await transaction.get(doc(db, 'articles', item.articleId));
      const artName = artSnap.exists() ? artSnap.data().name : 'Artículo';
      const artSeries = artSnap.exists() ? artSnap.data().series || '' : '';

      if (type === 'LOAN') {
        // Loan: We receive items
        if (!isDirectSale && warehouseId) {
          adjustments.push({ warehouseId, articleId: item.articleId, quantityChange: item.quantity, seriesListChange: item.seriesList });
        } else {
          // Direct sale: doesn't enter warehouse but still updates the global count/logs
          adjustments.push({ warehouseId: '', articleId: item.articleId, quantityChange: item.quantity, seriesListChange: item.seriesList });
        }
      } else {
        // Return: We deliver items back
        if (warehouseId) {
          adjustments.push({ warehouseId, articleId: item.articleId, quantityChange: -item.quantity, seriesListChange: item.seriesList });
        }
      }

      detailedArticles.push({
        articleId: item.articleId,
        name: artName,
        quantity: item.quantity,
        series: artSeries
      });
    }

    await processStockAdjustments(transaction, userId, adjustments);

    const docRef = doc(collection(db, 'loans_returns'));
    transaction.set(docRef, {
      type,
      commercialHouse,
      warehouseId: isDirectSale ? '' : warehouseId,
      warehouseName: isDirectSale ? 'Venta Directa' : warehouseName,
      isDirectSale: type === 'LOAN' ? isDirectSale : false,
      articles: detailedArticles,
      personName,
      comment,
      timestamp: Timestamp.now(),
      userId
    });
  });
}

/**
 * Executes a sales operation with multiple items and potential gift items.
 */
export async function executeInventorySale(
  userId: string,
  clientName: string,
  sellerId: string,
  sellerName: string,
  soldItemsList: Array<{ articleId: string; quantity: number; warehouseId: string; isGift: boolean; seriesList?: string[] }>
) {
  await runTransaction(db, async (transaction) => {
    const detailedSoldArticles = [];
    const adjustments: StockAdjustment[] = [];

    for (const item of soldItemsList) {
      const whSnap = await transaction.get(doc(db, 'warehouses', item.warehouseId));
      const whName = whSnap.exists() ? whSnap.data().name : 'Desconocida';
      
      const artSnap = await transaction.get(doc(db, 'articles', item.articleId));
      const artName = artSnap.exists() ? artSnap.data().name : 'Artículo';

      // Deduct stock (both sold and gift items deduct from warehouse)
      adjustments.push({ warehouseId: item.warehouseId, articleId: item.articleId, quantityChange: -item.quantity, seriesListChange: item.seriesList });

      detailedSoldArticles.push({
        articleId: item.articleId,
        name: artName,
        quantity: item.quantity,
        warehouseId: item.warehouseId,
        warehouseName: whName,
        isGift: item.isGift
      });
    }

    await processStockAdjustments(transaction, userId, adjustments);

    const saleRef = doc(collection(db, 'inventory_sales'));
    transaction.set(saleRef, {
      clientName,
      sellerId,
      sellerName,
      soldArticles: detailedSoldArticles,
      timestamp: Timestamp.now(),
      userId
    });
  });
}

/**
 * Reverts a warehouse stock transfer and marks it as deleted.
 */
export async function revertTransfer(transferId: string, userId: string, revertReason: string) {
  await runTransaction(db, async (transaction) => {
    const transferRef = doc(db, 'transfers', transferId);
    const transferSnap = await transaction.get(transferRef);
    
    if (!transferSnap.exists()) {
      throw new Error('La transferencia no existe.');
    }
    const data = transferSnap.data();
    if (data.status === 'ELIMINADO') {
      throw new Error('Esta transferencia ya fue eliminada/revertida.');
    }
    
    const fromWarehouseId = data.fromWarehouseId;
    const toWarehouseId = data.toWarehouseId;
    const articles = data.articles || [];
    
    const revertedArticlesLog: Array<{ articleId: string; name: string; requested: number; actual: number }> = [];
    const adjustments: StockAdjustment[] = [];

    for (const item of articles) {
      // Find current available quantity in the target warehouse (toWarehouseId)
      const invId = `${toWarehouseId}_${item.articleId}`;
      const invSnap = await transaction.get(doc(db, 'warehouse_inventory', invId));
      const availableQty = invSnap.exists() ? invSnap.data().quantity || 0 : 0;
      
      // We can only subtract what is actually available in the target warehouse
      const qToRevert = Math.min(item.quantity, availableQty);
      revertedArticlesLog.push({
        articleId: item.articleId,
        name: item.name,
        requested: item.quantity,
        actual: qToRevert
      });

      // Add stock back to the original source warehouse (fromWarehouseId)
      adjustments.push({ warehouseId: fromWarehouseId, articleId: item.articleId, quantityChange: qToRevert, seriesListChange: item.seriesList });
      // Subtract stock from target warehouse (toWarehouseId)
      adjustments.push({ warehouseId: toWarehouseId, articleId: item.articleId, quantityChange: -qToRevert, seriesListChange: item.seriesList });
    }

    await processStockAdjustments(transaction, userId, adjustments);

    transaction.update(transferRef, {
      status: 'ELIMINADO',
      revertReason,
      revertedArticles: revertedArticlesLog,
      revertedAt: Timestamp.now()
    });
  });
}

/**
 * Reverts a loan or return and marks it as deleted.
 */
export async function revertLoanReturn(loanReturnId: string, userId: string, revertReason: string) {
  await runTransaction(db, async (transaction) => {
    const ref = doc(db, 'loans_returns', loanReturnId);
    const snap = await transaction.get(ref);
    
    if (!snap.exists()) {
      throw new Error('El movimiento no existe.');
    }
    const data = snap.data();
    if (data.status === 'ELIMINADO') {
      throw new Error('Este movimiento ya fue eliminado/revertida.');
    }
    
    const type = data.type; // 'LOAN' or 'RETURN'
    const warehouseId = data.warehouseId;
    const isDirectSale = data.isDirectSale;
    const articles = data.articles || [];
    
    const revertedArticlesLog: Array<{ articleId: string; name: string; requested: number; actual: number }> = [];
    const adjustments: StockAdjustment[] = [];

    for (const item of articles) {
      const artSnap = await transaction.get(doc(db, 'articles', item.articleId));
      const currentGlobalQty = artSnap.exists() ? artSnap.data().quantity || 0 : 0;
      
      if (type === 'LOAN') {
        // LOAN originally added stock. To revert: we must subtract stock.
        if (!isDirectSale && warehouseId) {
          const invId = `${warehouseId}_${item.articleId}`;
          const invSnap = await transaction.get(doc(db, 'warehouse_inventory', invId));
          const availableQty = invSnap.exists() ? invSnap.data().quantity || 0 : 0;
          
          const qToRevert = Math.min(item.quantity, availableQty);
          revertedArticlesLog.push({
            articleId: item.articleId,
            name: item.name,
            requested: item.quantity,
            actual: qToRevert
          });
          
          adjustments.push({ warehouseId, articleId: item.articleId, quantityChange: -qToRevert, seriesListChange: item.seriesList });
        } else {
          // Direct sale: subtract from global only
          const qToRevert = Math.min(item.quantity, currentGlobalQty);
          revertedArticlesLog.push({
            articleId: item.articleId,
            name: item.name,
            requested: item.quantity,
            actual: qToRevert
          });
          
          adjustments.push({ warehouseId: '', articleId: item.articleId, quantityChange: -qToRevert, seriesListChange: item.seriesList });
        }
      } else {
        // RETURN originally subtracted stock. To revert: we must add stock back to warehouse.
        revertedArticlesLog.push({
          articleId: item.articleId,
          name: item.name,
          requested: item.quantity,
          actual: item.quantity
        });
        if (warehouseId) {
          adjustments.push({ warehouseId, articleId: item.articleId, quantityChange: item.quantity, seriesListChange: item.seriesList });
        }
      }
    }

    await processStockAdjustments(transaction, userId, adjustments);

    transaction.update(ref, {
      status: 'ELIMINADO',
      revertReason,
      revertedArticles: revertedArticlesLog,
      revertedAt: Timestamp.now()
    });
  });
}

/**
 * Reverts an inventory sale and marks it as deleted.
 */
export async function revertInventorySale(saleId: string, userId: string, revertReason: string) {
  await runTransaction(db, async (transaction) => {
    const ref = doc(db, 'inventory_sales', saleId);
    const snap = await transaction.get(ref);
    
    if (!snap.exists()) {
      throw new Error('La venta no existe.');
    }
    const data = snap.data();
    if (data.status === 'ELIMINADO') {
      throw new Error('Esta venta ya fue eliminada/revertida.');
    }
    
    const soldArticles = data.soldArticles || [];
    const adjustments: StockAdjustment[] = [];

    for (const item of soldArticles) {
      // Originally deducted stock from item.warehouseId. To revert: add it back!
      adjustments.push({ warehouseId: item.warehouseId, articleId: item.articleId, quantityChange: item.quantity, seriesListChange: item.seriesList });
    }

    await processStockAdjustments(transaction, userId, adjustments);

    transaction.update(ref, {
      status: 'ELIMINADO',
      revertReason,
      revertedAt: Timestamp.now()
    });
  });
}

