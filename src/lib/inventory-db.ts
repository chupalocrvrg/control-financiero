import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  writeBatch, 
  query, 
  where, 
  addDoc, 
  Timestamp 
} from 'firebase/firestore';

/**
 * Adjusts the stock of a specific article in a warehouse and updates its total global stock.
 * Uses a batch to ensure atomicity.
 */
export async function adjustStockAndGlobalQuantity(
  batch: any, 
  warehouseId: string, 
  articleId: string, 
  quantityChange: number, 
  userId: string
) {
  const invId = `${warehouseId}_${articleId}`;
  const invRef = doc(db, 'warehouse_inventory', invId);
  const invSnap = await getDoc(invRef);
  
  let currentInvQty = 0;
  if (invSnap.exists()) {
    currentInvQty = invSnap.data().quantity || 0;
  }
  
  const newInvQty = Math.max(0, currentInvQty + quantityChange);
  
  batch.set(invRef, {
    id: invId,
    warehouseId,
    articleId,
    quantity: newInvQty,
    userId
  }, { merge: true });

  // Update global article stock
  const articleRef = doc(db, 'articles', articleId);
  const articleSnap = await getDoc(articleRef);
  if (articleSnap.exists()) {
    const currentGlobalQty = articleSnap.data().quantity || 0;
    const newGlobalQty = Math.max(0, currentGlobalQty + quantityChange);
    batch.update(articleRef, { quantity: newGlobalQty });
  }
}

/**
 * Executes a warehouse-to-warehouse stock transfer.
 */
export async function executeTransfer(
  userId: string,
  fromWarehouseId: string,
  toWarehouseId: string,
  articlesList: Array<{ articleId: string; quantity: number }>,
  reason: string,
  comment: string
) {
  const batch = writeBatch(db);
  
  // 1. Fetch names for warehouses to store in the transfer record
  const fromSnap = await getDoc(doc(db, 'warehouses', fromWarehouseId));
  const toSnap = await getDoc(doc(db, 'warehouses', toWarehouseId));
  const fromName = fromSnap.exists() ? fromSnap.data().name : 'Desconocida';
  const toName = toSnap.exists() ? toSnap.data().name : 'Desconocida';

  // 2. Adjust stock for each article
  const detailedArticles = [];
  for (const item of articlesList) {
    const artSnap = await getDoc(doc(db, 'articles', item.articleId));
    const artName = artSnap.exists() ? artSnap.data().name : 'Articulo';
    const artSeries = artSnap.exists() ? artSnap.data().series || '' : '';

    // Subtract from source warehouse
    await adjustStockAndGlobalQuantity(batch, fromWarehouseId, item.articleId, -item.quantity, userId);
    // Add to target warehouse
    await adjustStockAndGlobalQuantity(batch, toWarehouseId, item.articleId, item.quantity, userId);

    detailedArticles.push({
      articleId: item.articleId,
      name: artName,
      quantity: item.quantity,
      series: artSeries
    });
  }

  // 3. Save transfer log
  const transferRef = doc(collection(db, 'transfers'));
  batch.set(transferRef, {
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

  await batch.commit();
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
  articlesList: Array<{ articleId: string; quantity: number }>,
  personName: string,
  comment: string
) {
  const batch = writeBatch(db);
  
  let warehouseName = 'Venta Directa';
  if (warehouseId) {
    const whSnap = await getDoc(doc(db, 'warehouses', warehouseId));
    warehouseName = whSnap.exists() ? whSnap.data().name : 'Desconocida';
  }

  const detailedArticles = [];
  for (const item of articlesList) {
    const artSnap = await getDoc(doc(db, 'articles', item.articleId));
    const artName = artSnap.exists() ? artSnap.data().name : 'Artículo';
    const artSeries = artSnap.exists() ? artSnap.data().series || '' : '';

    if (type === 'LOAN') {
      // Loan: We receive items
      if (!isDirectSale && warehouseId) {
        // Enters the warehouse
        await adjustStockAndGlobalQuantity(batch, warehouseId, item.articleId, item.quantity, userId);
      } else {
        // Direct sale: doesn't enter warehouse but still updates the global count/logs
        const articleRef = doc(db, 'articles', item.articleId);
        if (artSnap.exists()) {
          const currentGlobalQty = artSnap.data().quantity || 0;
          batch.update(articleRef, { quantity: currentGlobalQty + item.quantity });
        }
      }
    } else {
      // Return: We deliver items back
      if (warehouseId) {
        // Subtracted from warehouse
        await adjustStockAndGlobalQuantity(batch, warehouseId, item.articleId, -item.quantity, userId);
      }
    }

    detailedArticles.push({
      articleId: item.articleId,
      name: artName,
      quantity: item.quantity,
      series: artSeries
    });
  }

  // Save Loan/Return record
  const docRef = doc(collection(db, 'loans_returns'));
  batch.set(docRef, {
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

  await batch.commit();
}

/**
 * Executes a sales operation with multiple items and potential gift items.
 */
export async function executeInventorySale(
  userId: string,
  clientName: string,
  sellerId: string,
  sellerName: string,
  soldItemsList: Array<{ articleId: string; quantity: number; warehouseId: string; isGift: boolean }>
) {
  const batch = writeBatch(db);
  const detailedSoldArticles = [];

  for (const item of soldItemsList) {
    const whSnap = await getDoc(doc(db, 'warehouses', item.warehouseId));
    const whName = whSnap.exists() ? whSnap.data().name : 'Desconocida';
    
    const artSnap = await getDoc(doc(db, 'articles', item.articleId));
    const artName = artSnap.exists() ? artSnap.data().name : 'Artículo';

    // Deduct stock (both sold and gift items deduct from warehouse)
    await adjustStockAndGlobalQuantity(batch, item.warehouseId, item.articleId, -item.quantity, userId);

    detailedSoldArticles.push({
      articleId: item.articleId,
      name: artName,
      quantity: item.quantity,
      warehouseId: item.warehouseId,
      warehouseName: whName,
      isGift: item.isGift
    });
  }

  const saleRef = doc(collection(db, 'inventory_sales'));
  batch.set(saleRef, {
    clientName,
    sellerId,
    sellerName,
    soldArticles: detailedSoldArticles,
    timestamp: Timestamp.now(),
    userId
  });

  await batch.commit();
}
